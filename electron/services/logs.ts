import { spawn, ChildProcess } from 'child_process';
import { BrowserWindow } from 'electron';
import fs from 'fs';
import path from 'path';
import os from 'os';

let logProcess: ChildProcess | null = null;
let fallbackWatcher: fs.FSWatcher | null = null;
let fallbackStream: fs.ReadStream | null = null;

function sendLine(win: BrowserWindow | null, line: unknown) {
  if (!win || win.isDestroyed()) return;
  win.webContents.send('logs:line', line);
}

function parseLine(raw: string, win: BrowserWindow | null) {
  const trimmed = raw.trim();
  if (!trimmed) return;
  try {
    const parsed = JSON.parse(trimmed);
    sendLine(win, parsed);
  } catch {
    sendLine(win, {
      time: new Date().toISOString(),
      level: 'info',
      subsystem: 'system',
      msg: trimmed,
    });
  }
}

function startFallback(win: BrowserWindow | null) {
  const today = new Date().toISOString().slice(0, 10);
  const logDir = '/tmp/openclaw';
  const logFile = path.join(logDir, `openclaw-${today}.log`);

  if (!fs.existsSync(logFile)) return;

  // tail existing content first
  const content = fs.readFileSync(logFile, 'utf-8');
  const lines = content.split('\n');
  const recent = lines.slice(Math.max(0, lines.length - 100));
  for (const line of recent) parseLine(line, win);

  // watch for new content
  let position = fs.statSync(logFile).size;
  fallbackWatcher = fs.watch(logFile, () => {
    const stat = fs.statSync(logFile);
    if (stat.size <= position) return;
    const stream = fs.createReadStream(logFile, { start: position, encoding: 'utf-8' });
    let buf = '';
    stream.on('data', (chunk) => {
      buf += chunk;
      const ls = buf.split('\n');
      buf = ls.pop() || '';
      for (const l of ls) parseLine(l, win);
    });
    stream.on('end', () => {
      position = stat.size;
    });
  });
}

export function startLogStream(win: BrowserWindow | null) {
  if (logProcess) return;

  logProcess = spawn('openclaw', ['logs', '--follow', '--json'], {
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, HOME: os.homedir() },
  });

  let buffer = '';
  logProcess.stdout?.on('data', (chunk: Buffer) => {
    buffer += chunk.toString();
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    for (const line of lines) parseLine(line, win);
  });

  logProcess.stderr?.on('data', (chunk: Buffer) => {
    parseLine(chunk.toString(), win);
  });

  logProcess.on('error', () => {
    logProcess = null;
    startFallback(win);
  });

  logProcess.on('close', (code) => {
    logProcess = null;
    if (code !== 0) startFallback(win);
  });
}

export function stopLogStream() {
  if (logProcess) {
    logProcess.kill();
    logProcess = null;
  }
  if (fallbackWatcher) {
    fallbackWatcher.close();
    fallbackWatcher = null;
  }
  if (fallbackStream) {
    fallbackStream.destroy();
    fallbackStream = null;
  }
}
