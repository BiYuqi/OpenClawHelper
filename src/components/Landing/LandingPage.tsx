import React, { useState } from 'react';
import { useLocaleCtx } from '../../App';

interface LandingPageProps {
  installState: 'not-installed' | 'gateway-down';
  onRecheck: () => void;
  onEnterConfig: () => void;
}

const INSTALL_CMD = 'npm install -g openclaw@latest && openclaw onboard --install-daemon';
const START_CMD = 'openclaw daemon start';

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="px-2.5 py-1 text-xs rounded transition-colors"
      style={{
        background: copied ? 'rgba(52, 211, 153, 0.15)' : 'rgba(255,255,255,0.08)',
        color: copied ? 'var(--success)' : 'var(--text-secondary)',
        border: `1px solid ${copied ? 'rgba(52, 211, 153, 0.3)' : 'var(--border)'}`,
      }}
    >
      {copied ? '已复制' : '复制'}
    </button>
  );
}

export default function LandingPage({ installState, onRecheck, onEnterConfig }: LandingPageProps) {
  const { t } = useLocaleCtx();
  const isNotInstalled = installState === 'not-installed';

  const links = [
    { label: '官网', url: 'https://openclaw.ai', icon: '🌐' },
    { label: 'GitHub', url: 'https://github.com/openclaw/openclaw', icon: '⭐' },
    { label: 'Twitter', url: 'https://x.com/openclaw', icon: '🐦' },
  ];

  return (
    <div
      className="flex flex-col items-center justify-center h-screen relative"
      style={{ background: 'var(--bg-primary)' }}
    >
      {/* Traffic-light drag strip */}
      <div
        className="absolute top-0 left-0 right-0"
        style={{ height: 52, WebkitAppRegion: 'drag' } as React.CSSProperties}
      />
      {/* Icon */}
      <div className="text-7xl mb-6 select-none">🦞</div>

      {/* Title */}
      <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
        {isNotInstalled ? t('landing.title') : t('landing.gatewayDown')}
      </h1>
      <p className="text-sm mb-8" style={{ color: 'var(--text-secondary)' }}>
        {isNotInstalled ? t('landing.desc') : t('landing.gatewayDesc')}
      </p>

      {/* Command box */}
      <div
        className="w-full max-w-xl rounded-xl p-4 mb-6"
        style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
            {isNotInstalled ? t('landing.installCmd') : t('landing.startCmd')}
          </span>
          <CopyButton text={isNotInstalled ? INSTALL_CMD : START_CMD} />
        </div>
        <code
          className="block text-sm break-all"
          style={{ color: 'var(--accent)', fontFamily: 'monospace' }}
        >
          {isNotInstalled ? INSTALL_CMD : START_CMD}
        </code>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={onRecheck}
          className="px-5 py-2.5 rounded-lg text-sm font-medium transition-all"
          style={{
            background: 'var(--accent)',
            color: '#fff',
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = 'var(--accent-hover)')}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'var(--accent)')}
        >
          {t('landing.recheck')}
        </button>

        {!isNotInstalled && (
          <button
            onClick={onEnterConfig}
            className="px-5 py-2.5 rounded-lg text-sm font-medium transition-all"
            style={{
              background: 'transparent',
              color: 'var(--text-primary)',
              border: '1px solid var(--border)',
            }}
          >
            {t('landing.enterConfig')}
          </button>
        )}
      </div>

      {/* External links (only shown when not installed) */}
      {isNotInstalled && (
        <div className="flex items-center gap-3">
          {links.map((link) => (
            <button
              key={link.url}
              onClick={() => window.electronAPI.system.openInBrowser(link.url)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all"
              style={{
                background: 'var(--bg-tertiary)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border)',
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = 'var(--text-primary)')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)')}
            >
              <span>{link.icon}</span>
              <span>{link.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
