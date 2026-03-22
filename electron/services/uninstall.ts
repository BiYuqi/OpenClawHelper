import { exec } from 'child_process';
import { BrowserWindow } from 'electron';
import os from 'os';

export interface UninstallStep {
  label: string;
  status: 'pending' | 'running' | 'success' | 'error';
  error?: string;
}

const STEPS_WITH_CONFIG = [
  { label: '停止 Gateway', cmd: 'openclaw daemon stop' },
  { label: '移除系统服务', cmd: 'openclaw daemon uninstall' },
  { label: '卸载 CLI', cmd: 'npm uninstall -g openclaw' },
  { label: '清理配置数据', cmd: `rm -rf ${os.homedir()}/.openclaw` },
];

const STEPS_WITHOUT_CONFIG = [
  { label: '停止 Gateway', cmd: 'openclaw daemon stop' },
  { label: '移除系统服务', cmd: 'openclaw daemon uninstall' },
  { label: '卸载 CLI', cmd: 'npm uninstall -g openclaw' },
];

function runCmd(cmd: string): Promise<void> {
  return new Promise((resolve) => {
    exec(cmd, (err) => {
      // resolve even on error — non-fatal steps
      resolve();
    });
  });
}

export async function executeUninstall(
  keepConfig: boolean,
  win: BrowserWindow | null
): Promise<UninstallStep[]> {
  const steps = keepConfig ? STEPS_WITHOUT_CONFIG : STEPS_WITH_CONFIG;
  const results: UninstallStep[] = steps.map((s) => ({ label: s.label, status: 'pending' }));

  function send() {
    if (win && !win.isDestroyed()) {
      win.webContents.send('uninstall:progress', results);
    }
  }

  for (let i = 0; i < steps.length; i++) {
    results[i].status = 'running';
    send();
    try {
      await runCmd(steps[i].cmd);
      results[i].status = 'success';
    } catch (err: unknown) {
      results[i].status = 'error';
      results[i].error = err instanceof Error ? err.message : String(err);
    }
    send();
  }

  return results;
}
