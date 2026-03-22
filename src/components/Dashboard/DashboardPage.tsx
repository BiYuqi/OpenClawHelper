import React, { useEffect, useState } from 'react';
import { useLocaleCtx, useToast } from '../../App';
import { useGateway } from '../../hooks/useGateway';
import ConfigEditorModal from '../ConfigEditor/ConfigEditorModal';
import SocialChannelsCard from './SocialChannelsCard';

interface DashboardPageProps {
  onRecheck: () => void;
}

interface InfoCardProps {
  label: string;
  value: React.ReactNode;
  icon?: string;
}

function InfoCard({ label, value, icon }: InfoCardProps) {
  return (
    <div
      className="rounded-xl p-5"
      style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
    >
      <div className="text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
        {icon && <span className="mr-1">{icon}</span>}
        {label}
      </div>
      <div className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
        {value}
      </div>
    </div>
  );
}

function ConfirmModal({ message, onConfirm, onCancel }: { message: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }}>
      <div
        className="rounded-xl p-6 w-80 shadow-2xl"
        style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
      >
        <p className="text-sm mb-6" style={{ color: 'var(--text-primary)' }}>{message}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-sm"
            style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
          >
            取消
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg text-sm font-medium"
            style={{ background: 'var(--accent)', color: '#fff' }}
          >
            确认
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage({ onRecheck }: DashboardPageProps) {
  const { t } = useLocaleCtx();
  const { showToast } = useToast();
  const { status, loading, check, restart } = useGateway();
  const [config, setConfig] = useState<Record<string, unknown> | null>(null);
  const [showRestartConfirm, setShowRestartConfirm] = useState(false);
  const [restarting, setRestarting] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [diagInfo, setDiagInfo] = useState<string | null>(null);

  useEffect(() => {
    check();
    window.electronAPI.config.read().then((cfg) => {
      setConfig(cfg as Record<string, unknown>);
    });
  }, [check]);

  const primaryModel =
    (config?.agents as Record<string, unknown>)
      ?.defaults as Record<string, unknown> | undefined;
  const primary = (primaryModel?.model as Record<string, unknown>)?.primary as string | undefined;
  const fallbacks = (primaryModel?.model as Record<string, unknown>)?.fallbacks as string[] | undefined;

  const cfgProviders = ((config?.models as Record<string, unknown>)?.providers as Record<string, unknown>) || {};
  const providerCount = Object.keys(cfgProviders).length;

  const handleRestart = async () => {
    setShowRestartConfirm(false);
    setRestarting(true);
    try {
      await restart();
      showToast('Gateway 已重启', 'success');
      onRecheck();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      showToast('重启失败: ' + msg, 'error');
    } finally {
      setRestarting(false);
    }
  };

  const port = status?.port || 18789;

  return (
    <div className="h-full overflow-y-auto p-8">
      <h1 className="text-xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
        {t('nav.dashboard')}
      </h1>

      {/* Status cards */}
      <div className="grid grid-cols-2 gap-4 mb-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <InfoCard
          label={t('dashboard.gatewayStatus')}
          icon={status?.running ? '🟢' : '🔴'}
          value={
            <span style={{ color: status?.running ? 'var(--success)' : 'var(--danger)' }}>
              {loading ? '检测中...' : status?.running ? t('common.running') : t('common.stopped')}
            </span>
          }
        />
        <InfoCard
          label={t('dashboard.currentPort')}
          icon="🔌"
          value={<span style={{ color: 'var(--accent)', fontFamily: 'monospace' }}>{port}</span>}
        />
        <InfoCard
          label={t('dashboard.primaryModel')}
          icon="🤖"
          value={
            <span style={{ fontSize: '0.875rem' }}>
              {primary || <span style={{ color: 'var(--text-secondary)' }}>{t('dashboard.noModel')}</span>}
            </span>
          }
        />
        <InfoCard
          label={t('dashboard.providers')}
          icon="📦"
          value={<span>{providerCount} 个</span>}
        />
      </div>

      {/* Fallback chain */}
      {fallbacks && fallbacks.length > 0 && (
        <div
          className="rounded-xl p-4 mb-6"
          style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
        >
          <div className="text-xs font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>
            {t('dashboard.fallbacks')}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {primary && (
              <>
                <span
                  className="px-3 py-1 rounded-full text-xs font-medium"
                  style={{ background: 'rgba(255, 107, 74, 0.15)', color: 'var(--accent)', border: '1px solid rgba(255,107,74,0.3)' }}
                >
                  {primary}
                </span>
                {fallbacks.map((fb, i) => (
                  <React.Fragment key={i}>
                    <span style={{ color: 'var(--text-secondary)' }}>→</span>
                    <span
                      className="px-3 py-1 rounded-full text-xs"
                      style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
                    >
                      {fb}
                    </span>
                  </React.Fragment>
                ))}
              </>
            )}
          </div>
        </div>
      )}

      {/* Social channels */}
      <SocialChannelsCard config={config} />
      <div className="mb-6" />

      {/* Quick actions */}
      <div
        className="rounded-xl p-5"
        style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
      >
        <div className="text-xs font-medium mb-4" style={{ color: 'var(--text-secondary)' }}>快捷操作</div>
        <div className="flex gap-3 flex-wrap">
          <ActionButton
            icon="💬"
            label={t('dashboard.openChat')}
            onClick={() => window.electronAPI.system.openInBrowser(`http://127.0.0.1:${port}`)}
            disabled={!status?.running}
          />
          <ActionButton
            icon="📄"
            label={t('dashboard.openConfig')}
            onClick={() => setShowEditor(true)}
          />
          <ActionButton
            icon={restarting ? '⏳' : '🔄'}
            label={restarting ? '重启中...' : t('dashboard.restart')}
            onClick={() => setShowRestartConfirm(true)}
            disabled={restarting}
            variant="danger"
          />
          <ActionButton
            icon="🔍"
            label="环境诊断"
            onClick={async () => {
              const info = await (window.electronAPI.gateway as any).diagnose();
              setDiagInfo(JSON.stringify(info, null, 2));
            }}
          />
        </div>
      </div>

      {diagInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
              <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>🔍 环境诊断</span>
              <button onClick={() => setDiagInfo(null)} style={{ color: 'var(--text-secondary)' }}>✕</button>
            </div>
            <pre className="p-5 text-xs overflow-auto max-h-96" style={{ color: 'var(--text-primary)', fontFamily: 'monospace', background: 'var(--bg-tertiary)' }}>
              {diagInfo}
            </pre>
            <div className="px-5 py-3 text-xs" style={{ color: 'var(--text-secondary)', borderTop: '1px solid var(--border)' }}>
              把这段信息发给开发者以便诊断
            </div>
          </div>
        </div>
      )}

      {showEditor && <ConfigEditorModal onClose={() => setShowEditor(false)} />}

      {showRestartConfirm && (
        <ConfirmModal
          message={t('dashboard.restartConfirm')}
          onConfirm={handleRestart}
          onCancel={() => setShowRestartConfirm(false)}
        />
      )}
    </div>
  );
}

function ActionButton({
  icon,
  label,
  onClick,
  disabled,
  variant,
}: {
  icon: string;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'default' | 'danger';
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all"
      style={{
        background: 'var(--bg-tertiary)',
        color: disabled ? 'var(--text-secondary)' : variant === 'danger' ? 'var(--danger)' : 'var(--text-primary)',
        border: `1px solid ${variant === 'danger' ? 'rgba(239,68,68,0.3)' : 'var(--border)'}`,
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </button>
  );
}
