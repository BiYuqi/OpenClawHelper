import React, {
  createContext, useContext, useState, useEffect, useCallback, useRef,
} from 'react';
import { Page } from './lib/types';
import { Locale } from './lib/i18n';
import { useLocale } from './hooks/useLocale';
import Shell from './components/Layout/Shell';
import LandingPage from './components/Landing/LandingPage';

// ─── Theme Context ────────────────────────────────────────────────────────────

export type ThemeMode = 'system' | 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';

interface ThemeCtx {
  themeMode: ThemeMode;
  resolvedTheme: ResolvedTheme;
  setThemeMode: (m: ThemeMode) => void;
}

export const ThemeContext = createContext<ThemeCtx>({
  themeMode: 'system',
  resolvedTheme: 'dark',
  setThemeMode: () => {},
});
export function useTheme() { return useContext(ThemeContext); }

// ─── Locale Context ───────────────────────────────────────────────────────────

interface LocaleCtx {
  locale: Locale;
  switchLocale: (l: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}
export const LocaleContext = createContext<LocaleCtx>({ locale: 'zh', switchLocale: () => {}, t: (k) => k });
export function useLocaleCtx() { return useContext(LocaleContext); }

// ─── Page Context ─────────────────────────────────────────────────────────────

interface PageCtx { page: Page; setPage: (p: Page) => void; }
export const PageContext = createContext<PageCtx>({ page: 'landing', setPage: () => {} });
export function usePageCtx() { return useContext(PageContext); }

// ─── Toast ────────────────────────────────────────────────────────────────────

interface Toast { id: number; message: string; type: 'success' | 'error' | 'info'; }
interface ToastCtx { showToast: (msg: string, type?: Toast['type']) => void; }
export const ToastContext = createContext<ToastCtx>({ showToast: () => {} });
export function useToast() { return useContext(ToastContext); }

let toastId = 0;

function ToastContainer({ toasts }: { toasts: Toast[] }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl text-sm font-medium animate-slide-in pointer-events-auto"
          style={{
            background: toast.type === 'success'
              ? 'var(--bg-secondary)'
              : toast.type === 'error'
              ? 'var(--bg-secondary)'
              : 'var(--bg-secondary)',
            border: `1px solid ${
              toast.type === 'success' ? 'var(--success)'
              : toast.type === 'error' ? 'var(--danger)'
              : 'var(--border)'}`,
            color: toast.type === 'success' ? 'var(--success)'
              : toast.type === 'error' ? 'var(--danger)'
              : 'var(--text-primary)',
            boxShadow: '0 4px 24px var(--shadow)',
          }}
        >
          <span>{toast.type === 'success' ? '✓' : toast.type === 'error' ? '✗' : 'ℹ'}</span>
          <span>{toast.message}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Install check ────────────────────────────────────────────────────────────

type InstallState = 'checking' | 'not-installed' | 'gateway-down' | 'ok';

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const localeCtx = useLocale();

  // ── Theme ──
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    return (localStorage.getItem('themeMode') as ThemeMode) || 'system';
  });
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>('dark');
  const initialized = useRef(false);

  useEffect(() => {
    window.electronAPI.theme.getSystemTheme().then((t) => setSystemTheme(t));
    window.electronAPI.theme.onSystemChanged((t) => setSystemTheme(t));
    return () => window.electronAPI.theme.offSystemChanged();
  }, []);

  const resolvedTheme: ResolvedTheme =
    themeMode === 'system' ? systemTheme : themeMode;

  useEffect(() => {
    const html = document.documentElement;
    if (!initialized.current) {
      // First apply: no transition flash
      html.setAttribute('data-theme', resolvedTheme);
      initialized.current = true;
      return;
    }
    html.classList.add('theme-transition');
    html.setAttribute('data-theme', resolvedTheme);
    setTimeout(() => html.classList.remove('theme-transition'), 300);
  }, [resolvedTheme]);

  const setThemeMode = useCallback((m: ThemeMode) => {
    setThemeModeState(m);
    localStorage.setItem('themeMode', m);
  }, []);

  // ── Page ──
  const [page, setPage] = useState<Page>('landing');

  // ── Toast ──
  const [toasts, setToasts] = useState<Toast[]>([]);
  const showToast = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000);
  }, []);

  // ── Install check ──
  const [installState, setInstallState] = useState<InstallState>('checking');

  const checkInstall = useCallback(async () => {
    setInstallState('checking');
    const exists = await window.electronAPI.config.exists();
    if (!exists) { setInstallState('not-installed'); setPage('landing'); return; }
    const status = await window.electronAPI.gateway.checkStatus();
    if (!status.running) { setInstallState('gateway-down'); setPage('landing'); }
    else { setInstallState('ok'); setPage('dashboard'); }
  }, []);

  useEffect(() => { checkInstall(); }, [checkInstall]);

  return (
    <ThemeContext.Provider value={{ themeMode, resolvedTheme, setThemeMode }}>
      <LocaleContext.Provider value={localeCtx}>
        <PageContext.Provider value={{ page, setPage }}>
          <ToastContext.Provider value={{ showToast }}>
            <style>{`
              @keyframes slide-in {
                from { transform: translateX(16px); opacity: 0; }
                to   { transform: translateX(0);    opacity: 1; }
              }
              .animate-slide-in { animation: slide-in 0.18s ease; }
            `}</style>

            {installState === 'checking' ? (
              <div
                className="flex items-center justify-center h-screen"
                style={{ background: 'var(--bg-primary)' }}
              >
                <div className="text-center">
                  <div className="text-5xl mb-4 select-none">🦞</div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>正在检测 OpenClaw...</div>
                </div>
              </div>
            ) : page === 'landing' ? (
              <LandingPage
                installState={installState as 'not-installed' | 'gateway-down'}
                onRecheck={checkInstall}
                onEnterConfig={() => setPage('providers')}
              />
            ) : (
              <Shell installState={installState} onRecheck={checkInstall} />
            )}

            <ToastContainer toasts={toasts} />
          </ToastContext.Provider>
        </PageContext.Provider>
      </LocaleContext.Provider>
    </ThemeContext.Provider>
  );
}
