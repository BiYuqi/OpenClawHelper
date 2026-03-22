import React, { useEffect, useState } from 'react';
import { useLocaleCtx, useToast } from '../../App';
import { useConfig } from '../../hooks/useConfig';
import { PROVIDER_PRESETS } from '../../lib/providers';
import { UIState } from '../../lib/types';
import { mergeConfig, computeDiff } from '../../lib/configMerge';
import GlobalModelSettings from './GlobalModelSettings';
import ProviderCard from './ProviderCard';
import CustomProviderForm from './CustomProviderForm';

function DiffPreview({ diffs, onClose }: { diffs: Array<{ path: string; before: unknown; after: unknown }>; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div
        className="rounded-xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col shadow-2xl"
        style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
      >
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>配置变更预览</span>
          <button onClick={onClose} style={{ color: 'var(--text-secondary)' }}>✕</button>
        </div>
        <div className="overflow-y-auto p-5 flex-1">
          {diffs.length === 0 ? (
            <div style={{ color: 'var(--text-secondary)' }} className="text-sm">无变更</div>
          ) : (
            <div className="space-y-2">
              {diffs.map((d, i) => (
                <div key={i} className="rounded-lg p-3 text-xs" style={{ background: 'var(--bg-tertiary)', fontFamily: 'monospace' }}>
                  <div className="font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>{d.path}</div>
                  {d.before !== undefined && (
                    <div style={{ color: 'var(--danger)' }}>- {JSON.stringify(d.before)}</div>
                  )}
                  {d.after !== undefined && (
                    <div style={{ color: 'var(--success)' }}>+ {JSON.stringify(d.after)}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ConfirmModal({ message, onConfirm, onCancel }: { message: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }}>
      <div className="rounded-xl p-6 w-80 shadow-2xl" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
        <p className="text-sm mb-6" style={{ color: 'var(--text-primary)' }}>{message}</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="px-4 py-2 rounded-lg text-sm" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>取消</button>
          <button onClick={onConfirm} className="px-4 py-2 rounded-lg text-sm font-medium" style={{ background: 'var(--accent)', color: '#fff' }}>确认重启</button>
        </div>
      </div>
    </div>
  );
}

export default function AIConfigPage() {
  const { t } = useLocaleCtx();
  const { showToast } = useToast();
  const { rawConfig, uiState, loading, dirty, load, save, update, reset } = useConfig();
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [showDiff, setShowDiff] = useState(false);
  const [diffs, setDiffs] = useState<Array<{ path: string; before: unknown; after: unknown }>>([]);
  const [showRestartConfirm, setShowRestartConfirm] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const merged = mergeConfig(rawConfig, uiState);
      const ds = computeDiff(rawConfig, merged);
      setDiffs(ds);
      setShowDiff(true);
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmSave = async () => {
    setShowDiff(false);
    setSaving(true);
    try {
      await save(uiState);
      showToast(t('providers.savedSuccess'), 'success');
      setShowRestartConfirm(true);
    } catch {
      showToast('保存失败', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleRestart = async () => {
    setShowRestartConfirm(false);
    try {
      await window.electronAPI.gateway.restart();
      showToast('Gateway 已重启', 'success');
    } catch {
      showToast('重启失败', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full" style={{ color: 'var(--text-secondary)' }}>
        <div>加载中...</div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {t('nav.providers')}
          </h1>
          <div className="flex items-center gap-3">
            {dirty && (
              <span className="text-xs px-2 py-1 rounded" style={{ background: 'rgba(245,158,11,0.15)', color: 'var(--warning)', border: '1px solid rgba(245,158,11,0.3)' }}>
                未保存
              </span>
            )}
            <button
              onClick={reset}
              className="px-4 py-2 rounded-lg text-sm transition-all"
              style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
            >
              {t('providers.reset')}
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2 rounded-lg text-sm font-medium transition-all"
              style={{ background: 'var(--accent)', color: '#fff', opacity: saving ? 0.7 : 1 }}
            >
              {saving ? '保存中...' : t('providers.save')}
            </button>
          </div>
        </div>

        {/* Global model settings */}
        <GlobalModelSettings uiState={uiState} update={update} />

        {/* Provider cards */}
        <div className="space-y-3 mb-6">
          {PROVIDER_PRESETS.map((preset) => (
            <ProviderCard
              key={preset.id}
              preset={preset}
              state={uiState.providers[preset.id] || { enabled: false, apiKey: '', models: {} }}
              onUpdate={(fn) =>
                update((prev) => ({
                  ...prev,
                  providers: {
                    ...prev.providers,
                    [preset.id]: fn(prev.providers[preset.id] || { enabled: false, apiKey: '', models: {} }),
                  },
                }))
              }
            />
          ))}
        </div>

        {/* Custom providers */}
        {uiState.customProviders.map((cp, idx) => (
          <div key={cp.id} className="mb-3">
            <CustomProviderForm
              value={cp}
              onChange={(updated) =>
                update((prev) => ({
                  ...prev,
                  customProviders: prev.customProviders.map((p, i) => (i === idx ? updated : p)),
                }))
              }
              onRemove={() =>
                update((prev) => ({
                  ...prev,
                  customProviders: prev.customProviders.filter((_, i) => i !== idx),
                }))
              }
            />
          </div>
        ))}

        {/* Add custom provider */}
        <button
          onClick={() => setShowCustomForm(true)}
          className="w-full py-3 rounded-xl text-sm font-medium transition-all"
          style={{
            background: 'transparent',
            color: 'var(--text-secondary)',
            border: '2px dashed var(--border)',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)';
            (e.currentTarget as HTMLElement).style.color = 'var(--accent)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
            (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)';
          }}
        >
          {t('providers.addCustom')}
        </button>
      </div>

      {showCustomForm && (
        <div className="fixed inset-0 z-40 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="rounded-xl w-full max-w-lg p-6 shadow-2xl" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
            <CustomProviderForm
              value={null}
              onChange={(cp) => {
                update((prev) => ({ ...prev, customProviders: [...prev.customProviders, cp] }));
                setShowCustomForm(false);
              }}
              onRemove={() => setShowCustomForm(false)}
            />
          </div>
        </div>
      )}

      {showDiff && (
        <DiffPreview
          diffs={diffs}
          onClose={() => {
            setShowDiff(false);
            handleConfirmSave();
          }}
        />
      )}

      {showRestartConfirm && (
        <ConfirmModal
          message={t('providers.restartConfirm')}
          onConfirm={handleRestart}
          onCancel={() => setShowRestartConfirm(false)}
        />
      )}
    </div>
  );
}
