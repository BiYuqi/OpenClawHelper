import React, { useEffect, useState, useCallback } from 'react';
import { FaTelegram, FaDiscord, FaSlack, FaWhatsapp, FaApple, FaMicrosoft } from 'react-icons/fa';
import { SiGooglechat, SiSignal, SiLine } from 'react-icons/si';

// ─── Feishu/Lark inline SVG (not in any icon library) ─────────────────────

function FeishuIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.5 14.5l-5-3-2 3-2-5 3 1 1-4 5 8z" />
    </svg>
  );
}

// ─── Channel definitions ───────────────────────────────────────────────────

interface ChannelDef {
  key: string;
  name: string;
  color: string;
  icon: React.ReactNode;
  deepLink: string;
  webUrl: string;
}

const CHANNELS: ChannelDef[] = [
  {
    key: 'telegram',
    name: 'Telegram',
    color: '#2AABEE',
    icon: <FaTelegram size={28} />,
    deepLink: 'tg://',
    webUrl: 'https://web.telegram.org',
  },
  {
    key: 'discord',
    name: 'Discord',
    color: '#5865F2',
    icon: <FaDiscord size={28} />,
    deepLink: 'discord://',
    webUrl: 'https://discord.com/app',
  },
  {
    key: 'slack',
    name: 'Slack',
    color: '#4A154B',
    icon: <FaSlack size={28} />,
    deepLink: 'slack://',
    webUrl: 'https://slack.com',
  },
  {
    key: 'whatsapp',
    name: 'WhatsApp',
    color: '#25D366',
    icon: <FaWhatsapp size={28} />,
    deepLink: 'whatsapp://',
    webUrl: 'https://web.whatsapp.com',
  },
  {
    key: 'feishu',
    name: '飞书',
    color: '#00D6B9',
    icon: <FeishuIcon size={28} />,
    deepLink: 'feishu://',
    webUrl: 'https://www.feishu.cn',
  },
  {
    key: 'msteams',
    name: 'Teams',
    color: '#6264A7',
    icon: <FaMicrosoft size={24} />,
    deepLink: 'msteams://',
    webUrl: 'https://teams.microsoft.com',
  },
  {
    key: 'googlechat',
    name: 'Google Chat',
    color: '#1EA362',
    icon: <SiGooglechat size={26} />,
    deepLink: 'https://chat.google.com', // web-only, no desktop deep link
    webUrl: 'https://chat.google.com',
  },
  {
    key: 'signal',
    name: 'Signal',
    color: '#3A76F0',
    icon: <SiSignal size={26} />,
    deepLink: 'sgnl://',
    webUrl: 'https://signal.org',
  },
  {
    key: 'bluebubbles',
    name: 'iMessage',
    color: '#147EFB',
    icon: <FaApple size={28} />,
    deepLink: 'bluebubbles://',
    webUrl: 'https://bluebubbles.app',
  },
  {
    key: 'line',
    name: 'LINE',
    color: '#00B900',
    icon: <SiLine size={26} />,
    deepLink: 'line://',
    webUrl: 'https://line.me',
  },
];

// ─── Component ─────────────────────────────────────────────────────────────

interface Props {
  config: Record<string, unknown> | null;
}

export default function SocialChannelsCard({ config }: Props) {
  const [installed, setInstalled] = useState<Record<string, boolean>>({});
  const [checking, setChecking] = useState(true);

  const checkInstalled = useCallback(async () => {
    setChecking(true);
    try {
      const result = await window.electronAPI.system.checkAppsInstalled();
      setInstalled(result);
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => { checkInstalled(); }, [checkInstalled]);

  // Resolve feishu → lark if domain says so
  const cfgChannels = (config?.channels as Record<string, unknown>) || {};
  const feishuCfg = cfgChannels.feishu as Record<string, unknown> | undefined;
  const isLark = feishuCfg?.domain === 'lark';

  const channels = CHANNELS.map((ch) => {
    if (ch.key === 'feishu' && isLark) {
      return { ...ch, name: 'Lark', deepLink: 'lark://', webUrl: 'https://www.larksuite.com' };
    }
    return ch;
  });

  function isConfigured(key: string): boolean {
    const entry = cfgChannels[key] as Record<string, unknown> | undefined;
    if (!entry) return false;
    if ('enabled' in entry) return entry.enabled !== false;
    return true;
  }

  const open = (ch: ChannelDef) => {
    // Google Chat is web-only; for others prefer app if installed
    const url = (ch.deepLink === ch.webUrl || !installed[ch.key])
      ? ch.webUrl
      : ch.deepLink;
    window.electronAPI.system.openInBrowser(url);
  };

  return (
    <div
      className="rounded-xl p-5"
      style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
          💬 社交频道
        </div>
        <button
          onClick={checkInstalled}
          disabled={checking}
          title="重新检测已安装的应用"
          className="flex items-center gap-1 text-xs px-2 py-1 rounded-md"
          style={{
            color: 'var(--text-secondary)',
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border)',
            opacity: checking ? 0.5 : 1,
            cursor: checking ? 'not-allowed' : 'pointer',
          }}
        >
          <span style={{ display: 'inline-block', animation: checking ? 'spin 1s linear infinite' : 'none' }}>
            ↻
          </span>
          刷新
        </button>
      </div>

      {/* Channel grid — fixed item width, auto-wrap */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
        {channels.map((ch) => {
          const configured = isConfigured(ch.key);
          const appInstalled = configured && !!installed[ch.key];
          const webOnly = configured && !installed[ch.key];
          const isWebOnlyService = ch.deepLink === ch.webUrl;

          return (
            <button
              key={ch.key}
              onClick={configured ? () => open(ch) : undefined}
              disabled={!configured}
              title={
                !configured
                  ? `${ch.name} 未配置`
                  : appInstalled
                  ? `打开 ${ch.name} 桌面端`
                  : `在浏览器中打开 ${ch.name}`
              }
              className="flex flex-col items-center gap-1.5 rounded-xl transition-all"
              style={{
                width: 160,
                flexShrink: 0,
                padding: '12px 8px 10px',
                background: configured ? `${ch.color}12` : 'var(--bg-tertiary)',
                border: `1px solid ${configured ? `${ch.color}35` : 'var(--border)'}`,
                color: configured ? ch.color : 'var(--text-secondary)',
                opacity: configured ? 1 : 0.4,
                cursor: configured ? 'pointer' : 'not-allowed',
                filter: configured ? 'none' : 'grayscale(1)',
              }}
            >
              {/* Icon */}
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {ch.icon}
              </span>

              {/* Name */}
              <span
                className="font-medium leading-tight text-center"
                style={{
                  fontSize: 10,
                  color: configured ? ch.color : 'var(--text-secondary)',
                  maxWidth: 64,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {ch.name}
              </span>

              {/* Status badge */}
              <span
                className="rounded-full"
                style={{
                  fontSize: 9,
                  padding: '2px 6px',
                  background: !configured
                    ? 'rgba(156,163,175,0.15)'
                    : appInstalled
                    ? 'rgba(52,211,153,0.15)'
                    : 'rgba(156,163,175,0.15)',
                  color: !configured
                    ? 'var(--text-secondary)'
                    : appInstalled
                    ? 'var(--success)'
                    : 'var(--text-secondary)',
                }}
              >
                {checking && configured
                  ? '···'
                  : !configured
                  ? '未配置'
                  : isWebOnlyService
                  ? 'Web'
                  : appInstalled
                  ? 'App'
                  : 'Web'}
              </span>
            </button>
          );
        })}
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
