// ─── Electron API types ────────────────────────────────────────────────────

export interface GatewayStatus {
  running: boolean;
  port: number;
}

export interface LogEntry {
  time: string;
  level: 'trace' | 'debug' | 'info' | 'warn' | 'warning' | 'error' | 'fatal' | string;
  subsystem: string;
  msg: string;
  [key: string]: unknown;
}

export interface UninstallStep {
  label: string;
  status: 'pending' | 'running' | 'success' | 'error';
  error?: string;
}

// ─── UI State types ────────────────────────────────────────────────────────

export interface ModelConfig {
  enabled: boolean;
  alias?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface ProviderState {
  enabled: boolean;
  apiKey: string;
  models: Record<string, ModelConfig>; // modelId → config
  customModels?: CustomModel[];
}

export interface CustomModel {
  id: string;
  name: string;
  reasoning: boolean;
  contextWindow: number;
  maxTokens: number;
  input: string[];
  cost: { input: number; output: number };
}

export interface UIState {
  providers: Record<string, ProviderState>; // providerId → state
  primaryModel: string; // "{providerId}/{modelId}"
  fallbackModels: string[];
  customProviders: CustomProviderDef[];
}

export interface CustomProviderDef {
  id: string;
  name: string;
  api: 'openai-completions' | 'anthropic-messages' | 'google-generative-ai';
  baseUrl: string;
  envKeyName: string;
  apiKey: string;
  models: CustomModel[];
}

// ─── Page types ───────────────────────────────────────────────────────────

export type Page = 'landing' | 'dashboard' | 'providers' | 'logs' | 'settings';

// ─── Window type augmentation ──────────────────────────────────────────────

declare global {
  interface Window {
    electronAPI: {
      config: {
        read: () => Promise<unknown>;
        write: (data: unknown) => Promise<void>;
        exists: () => Promise<boolean>;
        getPath: () => Promise<string>;
        readRaw: () => Promise<string>;
        writeRaw: (text: string) => Promise<void>;
      };
      gateway: {
        checkStatus: () => Promise<GatewayStatus>;
        restart: () => Promise<string>;
        start: () => Promise<string>;
        stop: () => Promise<string>;
      };
      system: {
        openInBrowser: (url: string) => Promise<void>;
        openInEditor: (path: string) => Promise<void>;
        getDirectorySize: (path: string) => Promise<number>;
        checkAppsInstalled: () => Promise<Record<string, boolean>>;
      };
      logs: {
        start: () => Promise<void>;
        stop: () => Promise<void>;
        onLine: (cb: (line: LogEntry) => void) => void;
        offLine: () => void;
        getLogFilePath: () => Promise<string>;
      };
      uninstall: {
        execute: (keepConfig: boolean) => Promise<UninstallStep[]>;
      };
      theme: {
        getSystemTheme: () => Promise<'dark' | 'light'>;
        onSystemChanged: (cb: (theme: 'dark' | 'light') => void) => void;
        offSystemChanged: () => void;
      };
    };
  }
}
