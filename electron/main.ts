import { app, BrowserWindow, ipcMain, shell, nativeTheme } from 'electron';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { exec } from 'child_process';
import JSON5 from 'json5';
import { startLogStream, stopLogStream } from './services/logs';
import { executeUninstall } from './services/uninstall';

const CONFIG_PATH = path.join(os.homedir(), '.openclaw', 'openclaw.json');
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

let mainWindow: BrowserWindow | null = null;

// ─── Shell PATH (fix "command not found" when launched from Finder) ─────────

// ── Extra paths covering npm/nvm/fnm/volta/homebrew installs ──────────────
const HOME = os.homedir();
const EXTRA_PATHS = [
  '/usr/local/bin',
  '/usr/bin',
  '/bin',
  '/usr/sbin',
  '/sbin',
  '/opt/homebrew/bin',
  '/opt/homebrew/sbin',
  `${HOME}/.npm-global/bin`,
  `${HOME}/.yarn/bin`,
  `${HOME}/.local/bin`,
  `${HOME}/.volta/bin`,                          // volta
  `${HOME}/.bun/bin`,                            // bun
];

// Add active nvm version's bin if NVM_DIR is set
const nvmDir = process.env.NVM_DIR || `${HOME}/.nvm`;
const nvmCurrentBin = `${nvmDir}/alias/default`;  // symlink → resolved later

let resolvedPath = [...EXTRA_PATHS, process.env.PATH || ''].join(':');

// Use interactive shell (-i) so ~/.zshrc / ~/.bashrc are sourced
// This is where nvm, fnm, volta inject themselves
function shellExec(cmd: string, timeout = 8000): Promise<string> {
  const shell = process.env.SHELL || '/bin/zsh';
  return new Promise((resolve, reject) => {
    exec(`${shell} -ic '${cmd}' 2>/dev/null`, {
      env: { ...process.env, PATH: resolvedPath, TERM: 'dumb' },
      timeout,
    }, (err, stdout, stderr) => {
      if (err) reject(new Error(stderr?.trim() || err.message));
      else resolve(stdout.trim());
    });
  });
}

// Fetch real PATH from interactive shell (includes nvm shims etc.)
async function fetchShellPath(): Promise<void> {
  try {
    const p = await shellExec('echo $PATH', 5000);
    if (p) resolvedPath = [...EXTRA_PATHS, p].join(':');
  } catch {}
}

// Locate openclaw binary across nvm versions as last resort
function findNvmBin(): string | null {
  try {
    const versionsDir = path.join(nvmDir, 'versions', 'node');
    if (!fs.existsSync(versionsDir)) return null;
    const versions = fs.readdirSync(versionsDir).sort().reverse(); // newest first
    for (const v of versions) {
      const bin = path.join(versionsDir, v, 'bin', 'openclaw');
      if (fs.existsSync(bin)) return bin;
    }
  } catch {}
  return null;
}

async function findOpenclawPath(): Promise<string | null> {
  // Try interactive shell's which
  try {
    const p = await shellExec('which openclaw', 6000);
    if (p && p.includes('/')) return p;
  } catch {}

  // Fallback: scan nvm versions manually
  return findNvmBin();
}

let openclawBin = 'openclaw'; // overridden after startup


function runCmd(cmd: string): Promise<string> {
  const resolved = cmd.replace(/^openclaw\b/, openclawBin);
  return shellExec(resolved, 30000).catch((err) => {
    const detail = err instanceof Error ? err.message : String(err);
    throw new Error(`[bin: ${openclawBin}] ${detail}`);
  });
}

// ─── Window ──────────────────────────────────────────────────────────────────

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    titleBarStyle: 'hiddenInset',
    // Traffic lights position: give a bit of vertical breathing room
    trafficLightPosition: { x: 16, y: 18 },
    // Background matches theme; updated later via IPC
    backgroundColor: nativeTheme.shouldUseDarkColors ? '#0f1117' : '#f5f5f7',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    stopLogStream();
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  // Resolve openclaw binary path before window opens
  await fetchShellPath();
  const found = await findOpenclawPath();
  if (found) openclawBin = found;

  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// ─── Config IPC ──────────────────────────────────────────────────────────────

ipcMain.handle('config:read', async () => {
  if (!fs.existsSync(CONFIG_PATH)) return null;
  try {
    const content = fs.readFileSync(CONFIG_PATH, 'utf-8');
    return JSON5.parse(content);
  } catch {
    return null;
  }
});

ipcMain.handle('config:write', async (_e, config: unknown) => {
  const dir = path.dirname(CONFIG_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
});

ipcMain.handle('config:exists', async () => fs.existsSync(CONFIG_PATH));
ipcMain.handle('config:getPath', async () => CONFIG_PATH);

ipcMain.handle('config:readRaw', async () => {
  if (!fs.existsSync(CONFIG_PATH)) return '';
  return fs.readFileSync(CONFIG_PATH, 'utf-8');
});

ipcMain.handle('config:writeRaw', async (_e, text: string) => {
  const dir = path.dirname(CONFIG_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(CONFIG_PATH, text, 'utf-8');
});

// ─── Gateway IPC ─────────────────────────────────────────────────────────────

ipcMain.handle('gateway:checkStatus', async () => {
  try {
    let port = 18789;
    if (fs.existsSync(CONFIG_PATH)) {
      const cfg = JSON5.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
      port = cfg?.gateway?.port || 18789;
    }
    await fetch(`http://127.0.0.1:${port}/health`, {
      signal: AbortSignal.timeout(2000),
    });
    return { running: true, port };
  } catch {
    let port = 18789;
    if (fs.existsSync(CONFIG_PATH)) {
      try {
        const cfg = JSON5.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
        port = cfg?.gateway?.port || 18789;
      } catch {}
    }
    return { running: false, port };
  }
});

ipcMain.handle('gateway:diagnose', async () => {
  return {
    openclawBin,
    resolvedPath: resolvedPath.split(':').filter(Boolean),
    shell: process.env.SHELL || '/bin/zsh',
    home: os.homedir(),
  };
});

ipcMain.handle('gateway:restart', () => runCmd('openclaw daemon restart'));
ipcMain.handle('gateway:start', () => runCmd('openclaw daemon start'));
ipcMain.handle('gateway:stop', () => runCmd('openclaw daemon stop'));

// ─── System IPC ──────────────────────────────────────────────────────────────

ipcMain.handle('system:openInBrowser', async (_e, url: string) => {
  await shell.openExternal(url);
});

ipcMain.handle('system:openInEditor', async (_e, filePath: string) => {
  await shell.openPath(filePath);
});

ipcMain.handle('system:getDirectorySize', async (_e, dirPath: string) => {
  return new Promise<number>((resolve) => {
    exec(`du -sk "${dirPath}" 2>/dev/null | awk '{print $1}'`, (err, stdout) => {
      if (err) resolve(0);
      else resolve(parseInt(stdout.trim()) * 1024);
    });
  });
});

// App bundle IDs / paths for each platform
const APP_BUNDLE_IDS: Record<string, string> = {
  telegram:    'ph.telegra.Telegraph',
  discord:     'com.hnc.Discord',
  slack:       'com.tinyspeck.slackmacgap',
  feishu:      'com.feishu.FeishuApp',
  lark:        'com.larksuite.lark',
  whatsapp:    'net.whatsapp.WhatsApp',
  msteams:     'com.microsoft.teams2',
  googlechat:  '', // Google Chat has no native desktop app
  signal:      'org.whispersystems.signal-desktop',
  bluebubbles: 'com.bitplus.BlueBubbles',
  line:        'jp.naver.line',
};

const APPDATA      = process.env.APPDATA      || path.join(HOME, 'AppData', 'Roaming');
const LOCALAPPDATA = process.env.LOCALAPPDATA || path.join(HOME, 'AppData', 'Local');
const APP_WIN_PATHS: Record<string, string[]> = {
  telegram:    [path.join(APPDATA, 'Telegram Desktop', 'Telegram.exe')],
  discord:     [path.join(LOCALAPPDATA, 'Discord', 'Discord.exe')],
  slack:       [path.join(LOCALAPPDATA, 'slack', 'slack.exe')],
  feishu:      [path.join(LOCALAPPDATA, 'Feishu', 'Feishu.exe')],
  lark:        [path.join(LOCALAPPDATA, 'Lark', 'Lark.exe')],
  whatsapp:    [path.join(LOCALAPPDATA, 'WhatsApp', 'WhatsApp.exe')],
  msteams:     [path.join(LOCALAPPDATA, 'Microsoft', 'Teams', 'current', 'Teams.exe'),
                path.join(APPDATA, 'Microsoft', 'Teams', 'current', 'Teams.exe')],
  googlechat:  [], // web-only
  signal:      [path.join(LOCALAPPDATA, 'Programs', 'signal-desktop', 'Signal.exe')],
  bluebubbles: [], // macOS-only
  line:        [path.join(LOCALAPPDATA, 'LINE', 'bin', 'LINE.exe')],
};

async function checkMacAppInstalled(bundleId: string): Promise<boolean> {
  return new Promise((resolve) => {
    exec(`mdfind "kMDItemCFBundleIdentifier == '${bundleId}'"`, { timeout: 3000 }, (_err, stdout) => {
      resolve(stdout.trim().length > 0);
    });
  });
}

ipcMain.handle('system:checkAppsInstalled', async () => {
  const results: Record<string, boolean> = {};
  const keys = Object.keys(APP_BUNDLE_IDS);

  if (process.platform === 'darwin') {
    await Promise.all(
      keys.map(async (key) => {
        results[key] = await checkMacAppInstalled(APP_BUNDLE_IDS[key]);
      })
    );
  } else if (process.platform === 'win32') {
    for (const key of keys) {
      const candidates = APP_WIN_PATHS[key] || [];
      results[key] = candidates.some((p) => fs.existsSync(p));
    }
  } else {
    // Linux: default false (not commonly packaged in known paths)
    for (const key of keys) results[key] = false;
  }

  return results;
});

// ─── Theme IPC ───────────────────────────────────────────────────────────────

ipcMain.handle('theme:getSystemTheme', () => {
  return nativeTheme.shouldUseDarkColors ? 'dark' : 'light';
});

// Listen for system theme changes and notify renderer
nativeTheme.on('updated', () => {
  const theme = nativeTheme.shouldUseDarkColors ? 'dark' : 'light';
  mainWindow?.webContents.send('theme:systemChanged', theme);
  mainWindow?.setBackgroundColor(theme === 'dark' ? '#0f1117' : '#f5f5f7');
});

// ─── Logs IPC ────────────────────────────────────────────────────────────────

ipcMain.handle('logs:start', () => startLogStream(mainWindow));
ipcMain.handle('logs:stop', () => stopLogStream());
ipcMain.handle('logs:getLogFilePath', () => {
  const today = new Date().toISOString().slice(0, 10);
  return `/tmp/openclaw/openclaw-${today}.log`;
});

// ─── Uninstall IPC ───────────────────────────────────────────────────────────

ipcMain.handle('uninstall:execute', async (_e, keepConfig: boolean) => {
  return executeUninstall(keepConfig, mainWindow);
});
