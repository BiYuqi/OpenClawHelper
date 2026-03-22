import React, { useState, useEffect } from 'react';
import { useLocaleCtx, useToast, usePageCtx } from '../../App';
import ConfigEditorModal from '../ConfigEditor/ConfigEditorModal';
import { UninstallStep } from '../../lib/types';

function ConfirmModal({
  message, onConfirm, onCancel,
}: { message: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }}>
      <div className="rounded-xl p-6 w-80 shadow-2xl" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
        <p className="text-sm mb-6" style={{ color: 'var(--text-primary)' }}>{message}</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="px-4 py-2 rounded-lg text-sm" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>取消</button>
          <button onClick={onConfirm} className="px-4 py-2 rounded-lg text-sm font-medium" style={{ background: 'var(--accent)', color: '#fff' }}>确认</button>
        </div>
      </div>
    </div>
  );
}

function StepIndicator({ step }: { step: UninstallStep }) {
  const icon = step.status === 'success' ? '✅' : step.status === 'error' ? '❌' : step.status === 'running' ? '⏳' : '⚪';
  return (
    <div className="flex items-center gap-3 py-2.5">
      <span className="text-lg w-6 text-center shrink-0">{icon}</span>
      <div className="flex-1">
        <div className="text-sm" style={{ color: step.status === 'error' ? 'var(--danger)' : 'var(--text-primary)' }}>
          {step.label}
        </div>
        {step.error && (
          <div className="text-xs mt-0.5" style={{ color: 'var(--danger)' }}>{step.error}</div>
        )}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { t } = useLocaleCtx();
  const { showToast } = useToast();
  const { setPage } = usePageCtx();

  const [showEditor, setShowEditor] = useState(false);
  const [port, setPort] = useState(18789);
  const [portInput, setPortInput] = useState('18789');
  const [showPortConfirm, setShowPortConfirm] = useState(false);

  const [dirSize, setDirSize] = useState<number | null>(null);
  const [keepConfig, setKeepConfig] = useState(false);
  const [uninstallInput, setUninstallInput] = useState('');
  const [uninstallSteps, setUninstallSteps] = useState<UninstallStep[] | null>(null);
  const [uninstalling, setUninstalling] = useState(false);
  const [uninstallDone, setUninstallDone] = useState(false);

  useEffect(() => {
    window.electronAPI.config.read().then((cfg) => {
      const c = cfg as Record<string, unknown>;
      const p = ((c?.gateway as Record<string, unknown>)?.port as number) || 18789;
      setPort(p);
      setPortInput(String(p));
    });
    window.electronAPI.system.getDirectorySize(`${process.env.HOME || '~'}/.openclaw`).then((size) => {
      setDirSize(size);
    });
  }, []);

  const handlePortSave = async () => {
    setShowPortConfirm(false);
    const newPort = parseInt(portInput);
    if (!newPort || newPort < 1024 || newPort > 65535) {
      showToast('端口号无效（1024-65535）', 'error');
      return;
    }
    const cfg = await window.electronAPI.config.read() as Record<string, unknown> | null;
    const merged = {
      ...(cfg || {}),
      gateway: { ...((cfg?.gateway as Record<string, unknown>) || {}), port: newPort },
    };
    await window.electronAPI.config.write(merged);
    setPort(newPort);
    showToast('端口已保存，请重启 Gateway 生效', 'success');
  };

  const handleUninstall = async () => {
    setUninstalling(true);
    setUninstallSteps([]);
    const results = await window.electronAPI.uninstall.execute(keepConfig);
    setUninstallSteps(results);
    setUninstalling(false);
    setUninstallDone(true);
    setTimeout(() => {
      setPage('landing');
    }, 2000);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  return (
    <div className="h-full overflow-y-auto p-8">
      <h1 className="text-xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
        {t('nav.settings')}
      </h1>

      {/* Config editor shortcut */}
      <section className="rounded-xl p-5 mb-5 flex items-center gap-4" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
        <div className="flex-1">
          <div className="font-semibold text-sm mb-0.5" style={{ color: 'var(--text-primary)' }}>配置文件</div>
          <div className="text-xs" style={{ color: 'var(--text-secondary)', fontFamily: 'monospace' }}>~/.openclaw/openclaw.json</div>
        </div>
        <button
          onClick={() => setShowEditor(true)}
          className="px-4 py-2 rounded-lg text-sm font-medium"
          style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
        >
          📄 打开编辑器
        </button>
      </section>

      {/* Port */}
      <section className="rounded-xl p-6 mb-5" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
        <h2 className="font-semibold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>
          {t('settings.port')}
        </h2>
        <div className="flex items-center gap-3">
          <input
            type="number"
            value={portInput}
            onChange={(e) => setPortInput(e.target.value)}
            min={1024}
            max={65535}
            className="px-3 py-2 rounded-lg text-sm w-36"
            style={{
              background: 'var(--bg-tertiary)',
              color: 'var(--text-primary)',
              border: `1px solid ${portInput !== String(port) ? 'rgba(245,158,11,0.5)' : 'var(--border)'}`,
            }}
          />
          <button
            onClick={() => setShowPortConfirm(true)}
            disabled={portInput === String(port)}
            className="px-4 py-2 rounded-lg text-sm font-medium"
            style={{
              background: portInput !== String(port) ? 'var(--accent)' : 'var(--bg-tertiary)',
              color: portInput !== String(port) ? '#fff' : 'var(--text-secondary)',
              opacity: portInput === String(port) ? 0.5 : 1,
            }}
          >
            {t('settings.portChange')}
          </button>
        </div>
      </section>

      {/* Uninstall */}
      <section className="rounded-xl p-6" style={{ background: 'var(--bg-secondary)', border: '1px solid rgba(239,68,68,0.3)' }}>
        <h2 className="font-semibold text-sm mb-1" style={{ color: 'var(--danger)' }}>
          ⚠️ {t('settings.uninstall')}
        </h2>
        <p className="text-xs mb-4" style={{ color: 'var(--text-secondary)' }}>
          {t('settings.uninstallDesc')}
        </p>

        {dirSize !== null && (
          <div className="text-xs mb-4" style={{ color: 'var(--text-secondary)' }}>
            {t('settings.dirSize')}: <code style={{ color: 'var(--text-primary)' }}>{formatSize(dirSize)}</code>
          </div>
        )}

        <label className="flex items-center gap-2 mb-4 text-sm cursor-pointer select-none">
          <input
            type="checkbox"
            checked={keepConfig}
            onChange={(e) => setKeepConfig(e.target.checked)}
            style={{ accentColor: 'var(--accent)' }}
          />
          <span style={{ color: 'var(--text-primary)' }}>{t('settings.keepConfig')}</span>
        </label>

        <div
          className="rounded-lg p-3 mb-4 text-xs"
          style={{ background: 'rgba(239,68,68,0.08)', color: 'var(--danger)', border: '1px solid rgba(239,68,68,0.2)' }}
        >
          {t('settings.uninstallWarning')}
        </div>

        <input
          type="text"
          value={uninstallInput}
          onChange={(e) => setUninstallInput(e.target.value)}
          placeholder={t('settings.uninstallConfirmInput')}
          className="w-full px-3 py-2 rounded-lg text-sm mb-4"
          style={{
            background: 'var(--bg-tertiary)',
            color: 'var(--text-primary)',
            border: `1px solid ${uninstallInput === 'UNINSTALL' ? 'var(--danger)' : 'var(--border)'}`,
          }}
        />

        {/* Uninstall progress */}
        {uninstallSteps && (
          <div className="mb-4 rounded-lg p-3" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)' }}>
            {uninstallSteps.map((step, i) => (
              <StepIndicator key={i} step={step} />
            ))}
            {uninstallDone && (
              <div className="text-xs mt-2 text-center" style={{ color: 'var(--success)' }}>卸载完成，即将跳转...</div>
            )}
          </div>
        )}

        <button
          onClick={handleUninstall}
          disabled={uninstallInput !== 'UNINSTALL' || uninstalling || uninstallDone}
          className="px-5 py-2.5 rounded-lg text-sm font-medium"
          style={{
            background: uninstallInput === 'UNINSTALL' && !uninstalling && !uninstallDone ? 'var(--danger)' : 'var(--bg-tertiary)',
            color: uninstallInput === 'UNINSTALL' && !uninstalling && !uninstallDone ? '#fff' : 'var(--text-secondary)',
            opacity: uninstallInput !== 'UNINSTALL' || uninstalling ? 0.5 : 1,
            cursor: uninstallInput !== 'UNINSTALL' || uninstalling ? 'not-allowed' : 'pointer',
          }}
        >
          {uninstalling ? '卸载中...' : t('settings.uninstallBtn')}
        </button>
      </section>

      {showEditor && <ConfigEditorModal onClose={() => setShowEditor(false)} />}

      {showPortConfirm && (
        <ConfirmModal
          message={t('settings.portConfirm')}
          onConfirm={handlePortSave}
          onCancel={() => setShowPortConfirm(false)}
        />
      )}
    </div>
  );
}
