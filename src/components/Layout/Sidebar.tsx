import React from 'react';
import { useLocaleCtx, usePageCtx, useTheme, ThemeMode } from '../../App';
import { Page } from '../../lib/types';
import { Locale } from '../../lib/i18n';

interface NavItem { page: Page; icon: string; key: string; }

const NAV_ITEMS: NavItem[] = [
  { page: 'dashboard', icon: '🏠', key: 'nav.dashboard' },
  { page: 'providers', icon: '🤖', key: 'nav.providers' },
  { page: 'logs',      icon: '📋', key: 'nav.logs' },
  { page: 'settings',  icon: '⚙️', key: 'nav.settings' },
];

const THEME_OPTIONS: { value: ThemeMode; label: string; icon: string }[] = [
  { value: 'system', label: '跟随系统', icon: '💻' },
  { value: 'light',  label: '浅色',     icon: '☀️' },
  { value: 'dark',   label: '深色',     icon: '🌙' },
];

export default function Sidebar() {
  const { locale, switchLocale, t } = useLocaleCtx();
  const { page, setPage } = usePageCtx();
  const { themeMode, setThemeMode } = useTheme();

  return (
    <aside
      className="flex flex-col w-52 h-full shrink-0"
      style={{
        background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border)',
      }}
    >
      {/* ── Traffic-light placeholder ─────────────────────────────────────
          hiddenInset 模式下 macOS 红绿灯固定在 (16, 18)，高度约 20px。
          这块区域设为拖拽区，左侧留空给红绿灯，右侧显示应用名。
      ───────────────────────────────────────────────────────────────────── */}
      <div
        className="flex items-center shrink-0"
        style={{
          height: 52,
          paddingLeft: 76,   // 红绿灯宽度约 70px
          paddingRight: 12,
          // @ts-expect-error electron drag region
          WebkitAppRegion: 'drag',
        }}
      >
        <span className="text-lg select-none" style={{ userSelect: 'none' }}>🦞</span>
        <span
          className="ml-2 text-sm font-semibold truncate select-none"
          style={{ color: 'var(--accent)', letterSpacing: '-0.01em' }}
        >
          OpenClawHelper
        </span>
      </div>

      {/* ── Navigation ──────────────────────────────────────────────────── */}
      <nav
        className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto"
        style={{ borderTop: '1px solid var(--border)' }}
      >
        {NAV_ITEMS.map((item) => {
          const active = page === item.page;
          return (
            <button
              key={item.page}
              onClick={() => setPage(item.page)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-left transition-colors"
              style={{
                background: active ? 'rgba(255,107,74,0.12)' : 'transparent',
                color: active ? 'var(--accent)' : 'var(--text-secondary)',
                border: `1px solid ${active ? 'rgba(255,107,74,0.25)' : 'transparent'}`,
                fontWeight: active ? 600 : 400,
              }}
            >
              <span className="text-base w-5 text-center shrink-0">{item.icon}</span>
              <span>{t(item.key)}</span>
            </button>
          );
        })}
      </nav>

      {/* ── Theme switcher ──────────────────────────────────────────────── */}
      <div
        className="px-3 py-3"
        style={{ borderTop: '1px solid var(--border)' }}
      >
        <div className="text-xs mb-2 px-1" style={{ color: 'var(--text-secondary)' }}>主题</div>
        <div
          className="flex rounded-lg overflow-hidden"
          style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)' }}
        >
          {THEME_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setThemeMode(opt.value)}
              title={opt.label}
              className="flex-1 flex items-center justify-center py-1.5 text-sm transition-colors"
              style={{
                background: themeMode === opt.value ? 'var(--accent)' : 'transparent',
                color: themeMode === opt.value ? '#fff' : 'var(--text-secondary)',
              }}
            >
              {opt.icon}
            </button>
          ))}
        </div>
      </div>

      {/* ── Language switcher ───────────────────────────────────────────── */}
      <div
        className="px-3 pb-4 flex items-center gap-2"
      >
        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>语言</span>
        <div
          className="ml-auto flex rounded-lg overflow-hidden"
          style={{ border: '1px solid var(--border)', background: 'var(--bg-tertiary)' }}
        >
          {(['zh', 'en'] as Locale[]).map((l) => (
            <button
              key={l}
              onClick={() => switchLocale(l)}
              className="px-3 py-1.5 text-xs font-medium transition-colors"
              style={{
                background: locale === l ? 'var(--accent)' : 'transparent',
                color: locale === l ? '#fff' : 'var(--text-secondary)',
              }}
            >
              {l === 'zh' ? '中' : 'EN'}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
