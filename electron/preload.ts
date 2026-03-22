import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  config: {
    read: () => ipcRenderer.invoke('config:read'),
    write: (data: unknown) => ipcRenderer.invoke('config:write', data),
    exists: () => ipcRenderer.invoke('config:exists'),
    getPath: () => ipcRenderer.invoke('config:getPath'),
    readRaw: () => ipcRenderer.invoke('config:readRaw'),
    writeRaw: (text: string) => ipcRenderer.invoke('config:writeRaw', text),
  },
  gateway: {
    checkStatus: () => ipcRenderer.invoke('gateway:checkStatus'),
    restart: () => ipcRenderer.invoke('gateway:restart'),
    start: () => ipcRenderer.invoke('gateway:start'),
    stop: () => ipcRenderer.invoke('gateway:stop'),
    diagnose: () => ipcRenderer.invoke('gateway:diagnose'),
  },
  system: {
    openInBrowser: (url: string) => ipcRenderer.invoke('system:openInBrowser', url),
    openInEditor: (path: string) => ipcRenderer.invoke('system:openInEditor', path),
    getDirectorySize: (path: string) => ipcRenderer.invoke('system:getDirectorySize', path),
    checkAppsInstalled: () => ipcRenderer.invoke('system:checkAppsInstalled'),
  },
  logs: {
    start: () => ipcRenderer.invoke('logs:start'),
    stop: () => ipcRenderer.invoke('logs:stop'),
    onLine: (cb: (line: unknown) => void) => {
      ipcRenderer.on('logs:line', (_e, line) => cb(line));
    },
    offLine: () => ipcRenderer.removeAllListeners('logs:line'),
    getLogFilePath: () => ipcRenderer.invoke('logs:getLogFilePath'),
  },
  uninstall: {
    execute: (keepConfig: boolean) => ipcRenderer.invoke('uninstall:execute', keepConfig),
  },
  theme: {
    getSystemTheme: () => ipcRenderer.invoke('theme:getSystemTheme'),
    onSystemChanged: (cb: (theme: 'dark' | 'light') => void) => {
      ipcRenderer.on('theme:systemChanged', (_e, t) => cb(t));
    },
    offSystemChanged: () => ipcRenderer.removeAllListeners('theme:systemChanged'),
  },
});
