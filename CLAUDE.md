# CLAUDE.md — OpenClaw Configurator 开发指南

> **需求来源**：`PRD.md`（产品需求文档），开发前务必通读。本文件只覆盖技术实现，不重复产品需求。

---

## 技术栈

| 层 | 选择 | 说明 |
|----|------|------|
| 桌面框架 | Electron 35+ | contextIsolation: true, nodeIntegration: false |
| 前端 | React 19 + TypeScript | — |
| 构建 | Vite | 作为 Electron renderer 的构建工具 |
| 样式 | Tailwind CSS 4 | 不使用 UI 组件库，全部手写 |
| 状态管理 | React Context + useReducer | 不引入 Redux/Zustand |
| 配置解析 | json5 (npm) | openclaw.json 是 JSON5 格式 |
| 打包 | electron-builder | macOS DMG 优先 |

---

## 项目结构

```
openclaw-configurator/
├── package.json
├── PRD.md                           # 产品需求（只读参考）
├── CLAUDE.md                        # 本文件
├── electron/
│   ├── main.ts                      # Electron 主进程入口
│   ├── preload.ts                   # contextBridge 暴露 API
│   └── services/
│       ├── config.ts                # 读写 ~/.openclaw/openclaw.json
│       ├── process.ts               # 调用 openclaw CLI
│       ├── logs.ts                  # spawn 日志子进程
│       └── uninstall.ts             # 卸载步骤执行
├── src/
│   ├── App.tsx
│   ├── main.tsx
│   ├── components/
│   │   ├── Layout/
│   │   │   ├── Sidebar.tsx
│   │   │   └── Shell.tsx
│   │   ├── Landing/
│   │   │   └── LandingPage.tsx
│   │   ├── Dashboard/
│   │   │   └── DashboardPage.tsx
│   │   ├── AIConfig/
│   │   │   ├── AIConfigPage.tsx
│   │   │   ├── GlobalModelSettings.tsx
│   │   │   ├── ProviderCard.tsx
│   │   │   ├── ModelRow.tsx
│   │   │   └── CustomProviderForm.tsx
│   │   ├── Logs/
│   │   │   ├── LogsPage.tsx
│   │   │   ├── LogLine.tsx
│   │   │   └── LogToolbar.tsx
│   │   └── Settings/
│   │       └── SettingsPage.tsx
│   ├── hooks/
│   │   ├── useConfig.ts
│   │   ├── useGateway.ts
│   │   ├── useLogs.ts
│   │   └── useLocale.ts
│   ├── lib/
│   │   ├── providers.ts             # Provider 预置数据（见下方）
│   │   ├── configMerge.ts           # 配置智能合并
│   │   ├── types.ts                 # TypeScript 类型
│   │   └── i18n.ts                  # 中英文案
│   └── styles/
│       └── globals.css
└── README.md
```

---

## Electron IPC 设计

### preload.ts — 暴露给渲染进程的 API

```typescript
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  config: {
    read: () => ipcRenderer.invoke('config:read'),
    write: (data: any) => ipcRenderer.invoke('config:write', data),
    exists: () => ipcRenderer.invoke('config:exists'),
    getPath: () => ipcRenderer.invoke('config:getPath'),
  },
  gateway: {
    checkStatus: () => ipcRenderer.invoke('gateway:checkStatus'),
    restart: () => ipcRenderer.invoke('gateway:restart'),
    start: () => ipcRenderer.invoke('gateway:start'),
    stop: () => ipcRenderer.invoke('gateway:stop'),
  },
  system: {
    openInBrowser: (url: string) => ipcRenderer.invoke('system:openInBrowser', url),
    openInEditor: (path: string) => ipcRenderer.invoke('system:openInEditor', path),
    getDirectorySize: (path: string) => ipcRenderer.invoke('system:getDirectorySize', path),
  },
  logs: {
    start: () => ipcRenderer.invoke('logs:start'),
    stop: () => ipcRenderer.invoke('logs:stop'),
    onLine: (cb: (line: any) => void) => {
      ipcRenderer.on('logs:line', (_e, line) => cb(line));
    },
    offLine: () => ipcRenderer.removeAllListeners('logs:line'),
    getLogFilePath: () => ipcRenderer.invoke('logs:getLogFilePath'),
  },
  uninstall: {
    execute: (keepConfig: boolean) => ipcRenderer.invoke('uninstall:execute', keepConfig),
  },
});
```

### main.ts — Handler 实现要点

**配置读写**：
```typescript
import JSON5 from 'json5';
const CONFIG_PATH = path.join(os.homedir(), '.openclaw', 'openclaw.json');

ipcMain.handle('config:read', async () => {
  if (!fs.existsSync(CONFIG_PATH)) return null;
  return JSON5.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
});

ipcMain.handle('config:write', async (_e, config) => {
  // 写出标准 JSON（是 JSON5 的子集，OpenClaw 可正常读取）
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
});
```

**Gateway 状态检测**：
```typescript
ipcMain.handle('gateway:checkStatus', async () => {
  try {
    const config = JSON5.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
    const port = config?.gateway?.port || 18789;
    await fetch(`http://127.0.0.1:${port}`, { signal: AbortSignal.timeout(2000) });
    return { running: true, port };
  } catch {
    return { running: false, port: 18789 };
  }
});
```

**CLI 命令执行**（restart / start / stop）：

> ⚠️ 从 Finder/Applications 启动时，Electron 进程没有用户 shell 的完整 PATH，直接 `exec('openclaw ...')` 会 command not found。
> 必须用 interactive shell（`-ic`）让 `.zshrc`/`.bashrc` 被 source，nvm/fnm/volta 等版本管理器的 PATH 才能生效。

```typescript
// 启动时预先定位 openclaw 二进制
async function findOpenclawPath(): Promise<string | null> {
  const shell = process.env.SHELL || '/bin/zsh';
  return new Promise((resolve) => {
    exec(`${shell} -ic 'which openclaw 2>/dev/null'`, { timeout: 6000 }, (err, stdout) => {
      resolve(stdout.trim() || null);
    });
  });
}

// 用 interactive shell 执行命令，确保 PATH 正确
function shellExec(cmd: string, timeout = 30000): Promise<string> {
  const shell = process.env.SHELL || '/bin/zsh';
  return new Promise((resolve, reject) => {
    exec(`${shell} -ic '${cmd}' 2>/dev/null`, { timeout }, (err, stdout, stderr) => {
      if (err) reject(new Error(stderr?.trim() || err.message));
      else resolve(stdout.trim());
    });
  });
}

ipcMain.handle('gateway:restart', () => shellExec(`${openclawBin} daemon restart`));
```

---

## 实时日志模块

### 主进程（electron/services/logs.ts）

通过 `spawn` 启动 `openclaw logs --follow --json`，逐行解析推送到渲染进程：

```typescript
import { spawn, ChildProcess } from 'child_process';
import { BrowserWindow } from 'electron';

let logProcess: ChildProcess | null = null;

export function startLogStream() {
  if (logProcess) return;
  logProcess = spawn('openclaw', ['logs', '--follow', '--json'], {
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let buffer = '';
  logProcess.stdout?.on('data', (chunk: Buffer) => {
    buffer += chunk.toString();
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const parsed = JSON.parse(line);
        BrowserWindow.getAllWindows()[0]?.webContents.send('logs:line', parsed);
      } catch {
        BrowserWindow.getAllWindows()[0]?.webContents.send('logs:line', {
          time: new Date().toISOString(),
          level: 'info',
          subsystem: 'system',
          msg: line.trim(),
        });
      }
    }
  });
  logProcess.on('close', () => { logProcess = null; });
}

export function stopLogStream() {
  logProcess?.kill();
  logProcess = null;
}
```

**备用方案**（CLI 不可用时）：用 `fs.watch` + `fs.createReadStream` 直接 tail `/tmp/openclaw/openclaw-YYYY-MM-DD.log`。

### 渲染进程（useLogs hook）

```typescript
interface LogEntry {
  time: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  subsystem: string;
  msg: string;
  [key: string]: any;
}

function useLogs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const MAX_LOGS = 10_000;

  useEffect(() => {
    window.electronAPI.logs.onLine((entry: LogEntry) => {
      if (!isPaused) {
        setLogs(prev => {
          const next = [...prev, entry];
          return next.length > MAX_LOGS ? next.slice(-MAX_LOGS) : next;
        });
      }
    });
    return () => window.electronAPI.logs.offLine();
  }, [isPaused]);

  return {
    logs, isRunning, isPaused,
    start: async () => { await window.electronAPI.logs.start(); setIsRunning(true); },
    stop: async () => { await window.electronAPI.logs.stop(); setIsRunning(false); },
    setIsPaused,
    clear: () => setLogs([]),
  };
}
```

### 虚拟滚动
- 首选：手写简单虚拟列表（固定行高 28px，只渲染可见区域 ± 缓冲区）
- 备选：使用 `react-window` 库
- 关键：默认自动滚到底部，用户上滚时暂停 + 显示"↓ N 条新日志"浮动按钮

---

## Provider 预置数据（src/lib/providers.ts）

这是整个应用的数据核心，必须准确无误。

```typescript
export interface ProviderPreset {
  id: string;
  name: string;
  icon: string;
  api: 'openai-completions' | 'anthropic-messages' | 'google-generative-ai';
  baseUrl?: string;          // undefined = OpenClaw 内置 provider，无需设置
  envKeyName: string;        // API Key 对应的环境变量名
  keyPlaceholder: string;
  keyPrefix?: string;        // Key 前缀校验
  models: ModelPreset[];
  docsUrl: string;           // 获取 Key 的链接
}

export interface ModelPreset {
  id: string;
  name: string;
  reasoning: boolean;
  contextWindow: number;
  maxTokens: number;
  input: string[];
  cost: { input: number; output: number };  // $/百万 tokens
}

export const PROVIDER_PRESETS: ProviderPreset[] = [
  {
    id: "anthropic",
    name: "Anthropic",
    icon: "🤖",
    api: "anthropic-messages",
    envKeyName: "ANTHROPIC_API_KEY",
    keyPlaceholder: "sk-ant-...",
    keyPrefix: "sk-ant-",
    docsUrl: "https://console.anthropic.com/settings/keys",
    models: [
      { id: "claude-opus-4-6", name: "Claude Opus 4.6", reasoning: true, contextWindow: 200000, maxTokens: 32000, input: ["text", "image"], cost: { input: 15, output: 75 } },
      { id: "claude-sonnet-4-6", name: "Claude Sonnet 4.6", reasoning: true, contextWindow: 200000, maxTokens: 16000, input: ["text", "image"], cost: { input: 3, output: 15 } },
      { id: "claude-haiku-4-5", name: "Claude Haiku 4.5", reasoning: false, contextWindow: 200000, maxTokens: 8192, input: ["text", "image"], cost: { input: 0.8, output: 4 } },
    ],
  },
  {
    id: "openai",
    name: "OpenAI",
    icon: "🧠",
    api: "openai-completions",
    envKeyName: "OPENAI_API_KEY",
    keyPlaceholder: "sk-...",
    keyPrefix: "sk-",
    docsUrl: "https://platform.openai.com/api-keys",
    models: [
      { id: "gpt-4o", name: "GPT-4o", reasoning: false, contextWindow: 128000, maxTokens: 16384, input: ["text", "image"], cost: { input: 2.5, output: 10 } },
      { id: "gpt-5.2", name: "GPT-5.2", reasoning: true, contextWindow: 128000, maxTokens: 32000, input: ["text", "image"], cost: { input: 10, output: 30 } },
      { id: "o3-mini", name: "o3-mini", reasoning: true, contextWindow: 200000, maxTokens: 100000, input: ["text"], cost: { input: 1.1, output: 4.4 } },
    ],
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    icon: "🐋",
    api: "openai-completions",
    baseUrl: "https://api.deepseek.com/v1",
    envKeyName: "DEEPSEEK_API_KEY",
    keyPlaceholder: "sk-...",
    docsUrl: "https://platform.deepseek.com/api_keys",
    models: [
      { id: "deepseek-chat", name: "DeepSeek Chat", reasoning: false, contextWindow: 64000, maxTokens: 8192, input: ["text"], cost: { input: 0.14, output: 0.28 } },
      { id: "deepseek-reasoner", name: "DeepSeek Reasoner", reasoning: true, contextWindow: 64000, maxTokens: 8192, input: ["text"], cost: { input: 0.55, output: 2.19 } },
    ],
  },
  {
    id: "google",
    name: "Google Gemini",
    icon: "💎",
    api: "google-generative-ai",
    envKeyName: "GOOGLE_API_KEY",
    keyPlaceholder: "AIza...",
    keyPrefix: "AIza",
    docsUrl: "https://aistudio.google.com/apikey",
    models: [
      { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro", reasoning: true, contextWindow: 1048576, maxTokens: 65536, input: ["text", "image"], cost: { input: 1.25, output: 10 } },
      { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash", reasoning: false, contextWindow: 1048576, maxTokens: 8192, input: ["text", "image"], cost: { input: 0.1, output: 0.4 } },
    ],
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    icon: "🔀",
    api: "openai-completions",
    baseUrl: "https://openrouter.ai/api/v1",
    envKeyName: "OPENROUTER_API_KEY",
    keyPlaceholder: "sk-or-...",
    keyPrefix: "sk-or-",
    docsUrl: "https://openrouter.ai/keys",
    models: [
      { id: "openrouter/auto", name: "Auto (智能路由)", reasoning: false, contextWindow: 128000, maxTokens: 32000, input: ["text"], cost: { input: 0, output: 0 } },
    ],
  },
  {
    id: "moonshot",
    name: "Kimi (Moonshot)",
    icon: "🌙",
    api: "openai-completions",
    baseUrl: "https://api.moonshot.cn/v1",
    envKeyName: "MOONSHOT_API_KEY",
    keyPlaceholder: "sk-...",
    docsUrl: "https://platform.moonshot.cn/console/api-keys",
    models: [
      { id: "kimi-k2.5", name: "Kimi K2.5", reasoning: false, contextWindow: 131072, maxTokens: 8192, input: ["text"], cost: { input: 1, output: 2 } },
      { id: "kimi-k2-thinking", name: "Kimi K2 Thinking", reasoning: true, contextWindow: 131072, maxTokens: 8192, input: ["text"], cost: { input: 1, output: 2 } },
    ],
  },
  {
    id: "xiaomi",
    name: "小米 MiMo",
    icon: "🦞",
    api: "openai-completions",
    baseUrl: "https://api.xiaomimimo.com/v1",
    envKeyName: "XIAOMI_API_KEY",
    keyPlaceholder: "sk-...",
    docsUrl: "https://platform.xiaomimimo.com/#/console/api-keys",
    models: [
      { id: "mimo-v2-pro", name: "MiMo V2 Pro", reasoning: true, contextWindow: 1048576, maxTokens: 32000, input: ["text"], cost: { input: 1, output: 3 } },
      { id: "mimo-v2-flash", name: "MiMo V2 Flash", reasoning: false, contextWindow: 262144, maxTokens: 8192, input: ["text"], cost: { input: 0.1, output: 0.3 } },
      { id: "mimo-v2-omni", name: "MiMo V2 Omni", reasoning: true, contextWindow: 262144, maxTokens: 8192, input: ["text", "image", "audio"], cost: { input: 0.4, output: 2 } },
    ],
  },
  {
    id: "minimax",
    name: "MiniMax",
    icon: "⚡",
    api: "anthropic-messages",
    baseUrl: "https://api.minimax.io/anthropic",
    envKeyName: "MINIMAX_API_KEY",
    keyPlaceholder: "...",
    docsUrl: "https://platform.minimaxi.com/",
    models: [
      { id: "MiniMax-M2.1", name: "MiniMax M2.1", reasoning: false, contextWindow: 200000, maxTokens: 8192, input: ["text"], cost: { input: 0.5, output: 1.5 } },
    ],
  },
];
```

---

## 配置智能合并（src/lib/configMerge.ts）

**核心原则：只改 AI 相关字段，其余原封不动。**

允许修改的路径：
- `models.mode` → 固定为 `"merge"`
- `models.providers` → 根据 UI 生成
- `agents.defaults.model.primary` → 主模型
- `agents.defaults.model.fallbacks` → 备用模型数组
- `agents.defaults.models` → 别名和参数
- `env` → API Key 环境变量

```typescript
function mergeConfig(existing: any, uiState: UIState): any {
  const merged = structuredClone(existing || {});

  // models
  merged.models = {
    ...merged.models,
    mode: "merge",
    providers: buildProvidersFromUI(uiState),
  };

  // agents.defaults
  if (!merged.agents) merged.agents = {};
  if (!merged.agents.defaults) merged.agents.defaults = {};
  merged.agents.defaults.model = {
    ...merged.agents.defaults.model,
    primary: uiState.primaryModel,
    fallbacks: uiState.fallbackModels,
  };
  merged.agents.defaults.models = buildModelAliasesFromUI(uiState);

  // env (API Keys)
  merged.env = { ...merged.env, ...buildEnvFromUI(uiState) };

  return merged;
}
```

**API Key 存储策略**：API Key 直接写入 provider 的 `apiKey` 字段。`env` 字段也同步写入，但 OpenClaw **不会**将 `env` 中的变量替换到 `apiKey` 里（即不支持 `${ENV_NAME}` 插值），因此必须写真实 key 值。

**生成的 Provider 配置示例**：
```json5
{
  models: {
    mode: "merge",
    providers: {
      // Anthropic 是内置 provider，只需 apiKey，无需 baseUrl/api/models
      anthropic: {
        apiKey: "sk-ant-xxxxx"
      },
      // DeepSeek 是自定义 provider，需要完整配置
      deepseek: {
        baseUrl: "https://api.deepseek.com/v1",
        apiKey: "sk-xxxxx",
        api: "openai-completions",
        models: [
          { id: "deepseek-chat", name: "DeepSeek Chat", reasoning: false, input: ["text"], contextWindow: 64000, maxTokens: 8192 }
        ]
      }
    }
  },
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-sonnet-4-6",
        fallbacks: ["deepseek/deepseek-chat"]
      },
      models: {
        "anthropic/claude-sonnet-4-6": { alias: "sonnet" }
      }
    }
  },
  env: {
    ANTHROPIC_API_KEY: "sk-ant-xxxxx",
    DEEPSEEK_API_KEY: "sk-xxxxx"
  }
}
```

---

## 中英双语（src/lib/i18n.ts）

轻量实现，不使用 i18next。

```typescript
export type Locale = 'zh' | 'en';

const messages: Record<Locale, Record<string, string>> = {
  zh: {
    'nav.dashboard': '仪表盘',
    'nav.providers': 'AI 模型',
    'nav.logs': '运行日志',
    'nav.settings': '系统管理',
    'landing.notInstalled': '未检测到 OpenClaw',
    'landing.recheck': '重新检测',
    'dashboard.gatewayStatus': 'Gateway 状态',
    'dashboard.currentPort': '当前端口',
    'dashboard.primaryModel': '主模型',
    'dashboard.openChat': '打开聊天',
    'dashboard.restart': '重启 Gateway',
    'providers.save': '保存配置',
    'providers.reset': '重置',
    'providers.primaryModel': '主模型',
    'providers.fallbacks': '备用模型',
    'providers.apiKey': 'API 密钥',
    'providers.enabled': '已启用',
    'providers.disabled': '未配置',
    'providers.addCustom': '+ 自定义 Provider',
    'providers.savedSuccess': '配置已保存',
    'providers.restartConfirm': '是否重启 Gateway 使配置生效？',
    'logs.start': '开始',
    'logs.pause': '暂停',
    'logs.clear': '清屏',
    'logs.search': '搜索日志...',
    'logs.newLines': '{count} 条新日志',
    'settings.uninstall': '卸载 OpenClaw',
    'settings.uninstallConfirm': '输入 UNINSTALL 确认卸载',
    'settings.uninstallWarning': '此操作不可撤销，将删除 OpenClaw 及所有配置数据。',
    'settings.keepConfig': '保留配置文件备份',
    'common.confirm': '确认',
    'common.cancel': '取消',
    'common.running': '运行中',
    'common.stopped': '已停止',
  },
  en: {
    'nav.dashboard': 'Dashboard',
    'nav.providers': 'Providers',
    'nav.logs': 'Logs',
    'nav.settings': 'Settings',
    'landing.notInstalled': 'OpenClaw Not Detected',
    'landing.recheck': 'Re-check',
    'dashboard.gatewayStatus': 'Gateway Status',
    'dashboard.currentPort': 'Current Port',
    'dashboard.primaryModel': 'Primary Model',
    'dashboard.openChat': 'Open Chat',
    'dashboard.restart': 'Restart Gateway',
    'providers.save': 'Save Config',
    'providers.reset': 'Reset',
    'providers.primaryModel': 'Primary Model',
    'providers.fallbacks': 'Fallback Models',
    'providers.apiKey': 'API Key',
    'providers.enabled': 'Enabled',
    'providers.disabled': 'Not configured',
    'providers.addCustom': '+ Custom Provider',
    'providers.savedSuccess': 'Configuration saved',
    'providers.restartConfirm': 'Restart Gateway to apply changes?',
    'logs.start': 'Start',
    'logs.pause': 'Pause',
    'logs.clear': 'Clear',
    'logs.search': 'Search logs...',
    'logs.newLines': '{count} new logs',
    'settings.uninstall': 'Uninstall OpenClaw',
    'settings.uninstallConfirm': 'Type UNINSTALL to confirm',
    'settings.uninstallWarning': 'This will remove OpenClaw and all data. Cannot be undone.',
    'settings.keepConfig': 'Keep config backup',
    'common.confirm': 'Confirm',
    'common.cancel': 'Cancel',
    'common.running': 'Running',
    'common.stopped': 'Stopped',
  },
};

export function t(locale: Locale, key: string, params?: Record<string, string | number>): string {
  let text = messages[locale]?.[key] || key;
  if (params) {
    Object.entries(params).forEach(([k, v]) => { text = text.replace(`{${k}}`, String(v)); });
  }
  return text;
}
```

通过 `LocaleContext` + `useLocale` hook 提供给组件。语言偏好存 `localStorage`，默认 `zh`。

---

## 设计 Token

```css
:root {
  --bg-primary: #0f1117;
  --bg-secondary: #1a1d27;
  --bg-tertiary: #242836;
  --text-primary: #e8eaed;
  --text-secondary: #9aa0a6;
  --accent: #ff6b4a;           /* OpenClaw 珊瑚红 */
  --accent-hover: #ff8566;
  --success: #34d399;
  --danger: #ef4444;
  --warning: #f59e0b;
  --border: #2d3140;
}
```

日志级别颜色：
```typescript
const LEVEL_COLORS = {
  debug: { bg: 'bg-gray-700', text: 'text-gray-400', label: 'DBG' },
  info:  { bg: 'bg-blue-900/50', text: 'text-blue-400', label: 'INF' },
  warn:  { bg: 'bg-yellow-900/50', text: 'text-yellow-400', label: 'WRN' },
  error: { bg: 'bg-red-900/50', text: 'text-red-400', label: 'ERR' },
};
```

---

## 卸载执行（electron/services/uninstall.ts）

```typescript
const STEPS = [
  { label: '停止 Gateway',   cmd: 'openclaw daemon stop' },
  { label: '移除系统服务',    cmd: 'openclaw daemon uninstall' },
  { label: '卸载 CLI',       cmd: 'npm uninstall -g openclaw' },
  { label: '清理配置数据',    cmd: 'rm -rf ~/.openclaw' },  // 可选
];
```

逐步执行，每步返回状态。最后一步根据用户"保留配置"选项决定是否执行。

---

## 必须遵守

1. **配置合并不覆盖** — 读取 → 改指定字段 → 写回。不属于 `models`/`agents.defaults`/`env` 的字段不动。
2. **用 `json5` 包解析** — 写回用 `JSON.stringify`（JSON 是 JSON5 子集）。
3. **API Key 直接写入** — Key 值直接写入 provider 的 `apiKey` 字段。`env` 字段也同步写（备用），但 OpenClaw 不支持 `${ENV_NAME}` 插值，不要在 `apiKey` 里用占位符。
4. **Electron 安全** — `contextIsolation: true`，`nodeIntegration: false`，文件操作全走 IPC。
5. **破坏性操作二次确认** — 卸载（输入 UNINSTALL）、重启 Gateway、修改端口。

---

## 常见陷阱

1. **内置 vs 自定义 Provider** — Anthropic / OpenAI / Google 是 OpenClaw 内置 provider，不需要设 `baseUrl` 和 `api`，只需 apiKey。DeepSeek / OpenRouter / Moonshot / 小米 / MiniMax 是自定义 provider，需要完整写 `baseUrl`、`api`、`models`。
2. **模型 ID 格式** — `agents.defaults.model.primary` 中用 `{providerId}/{modelId}`（如 `anthropic/claude-sonnet-4-6`）。但 `models.providers.xxx.models[].id` 中只写 modelId 不带前缀。
3. **小米 API 地址** — `https://api.xiaomimimo.com/v1`（api 子域名，不是 platform 子域名）。
4. **Moonshot API 地址** — `https://api.moonshot.cn/v1`（`.cn` 域名，不是 `.ai`）。
5. **`models.mode` 设为 `"merge"`** — 否则自定义 provider 会替换内置 catalog。
6. **日志子进程生命周期** — 页面切换离开日志页时必须 kill 子进程，否则进程泄漏。
7. **`${ENV_NAME}` 插值不生效** — OpenClaw 不会把 `env` 字段的值替换到 `apiKey` 里，必须直接写真实 key，否则鉴权 401。

---

## 开发顺序

1. Electron + Vite + React 脚手架，IPC 跑通
2. `config.ts`（读写配置文件）
3. `providers.ts` 预置数据
4. AI 配置页 UI（核心，花最多时间）
5. Landing 页 + Dashboard
6. 实时日志页
7. 系统管理页（卸载）
8. 中英双语
9. 打磨：主题、动画、Toast、diff 预览

---

## 测试清单

- [ ] 无 `~/.openclaw/` 时 Landing 页正确显示未安装
- [ ] 有配置但 Gateway 未运行时，检测正确 + 允许进入配置页
- [ ] 保存配置后 `openclaw.json` 格式正确，OpenClaw 可正常读取
- [ ] 保存不破坏已有的 channels / identity 等字段
- [ ] Primary Model 下拉只显示已启用模型
- [ ] 修改端口写入 `gateway.port` 正确
- [ ] 卸载二次确认（输入 UNINSTALL）正常
- [ ] 卸载每步状态反馈正确
- [ ] 日志页开始后收到实时日志流
- [ ] 日志级别过滤正确
- [ ] 搜索实时过滤正确
- [ ] 向上滚动暂停自动滚动 + 浮动按钮出现
- [ ] 10,000 条日志不卡顿
- [ ] 离开日志页时子进程被 kill
- [ ] 中英切换后所有文案正确
