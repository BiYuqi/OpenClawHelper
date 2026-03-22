import React, { useState } from 'react';
import { useLocaleCtx } from '../../App';
import { ProviderPreset } from '../../lib/providers';
import { ProviderState } from '../../lib/types';
import ModelRow from './ModelRow';

interface Props {
  preset: ProviderPreset;
  state: ProviderState;
  onUpdate: (fn: (prev: ProviderState) => ProviderState) => void;
}

export default function ProviderCard({ preset, state, onUpdate }: Props) {
  const { t } = useLocaleCtx();
  const [expanded, setExpanded] = useState(false);
  const [showKey, setShowKey] = useState(false);

  const enabledCount = Object.values(state.models).filter((m) => m.enabled).length;
  const isConfigured = state.enabled && !!state.apiKey;

  const toggleEnabled = () => {
    onUpdate((prev) => ({ ...prev, enabled: !prev.enabled }));
  };

  const setApiKey = (key: string) => {
    onUpdate((prev) => ({ ...prev, apiKey: key }));
  };

  return (
    <div
      className="rounded-xl overflow-hidden transition-all"
      style={{
        background: 'var(--bg-secondary)',
        border: `1px solid ${isConfigured ? 'rgba(52, 211, 153, 0.3)' : 'var(--border)'}`,
      }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 px-5 py-4 cursor-pointer select-none"
        onClick={() => setExpanded((v) => !v)}
      >
        {/* Toggle */}
        <div
          onClick={(e) => { e.stopPropagation(); toggleEnabled(); }}
          className="relative w-9 h-5 rounded-full transition-colors shrink-0"
          style={{
            background: state.enabled ? 'var(--accent)' : 'var(--bg-tertiary)',
            border: `1px solid ${state.enabled ? 'var(--accent)' : 'var(--border)'}`,
          }}
        >
          <div
            className="absolute top-0.5 w-4 h-4 rounded-full transition-transform"
            style={{
              background: '#fff',
              transform: state.enabled ? 'translateX(17px)' : 'translateX(2px)',
            }}
          />
        </div>

        {/* Icon + Name */}
        <span className="text-xl">{preset.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{preset.name}</div>
          <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            {isConfigured
              ? `${enabledCount} 个模型已启用`
              : t('providers.disabled')}
          </div>
        </div>

        {/* Status badge */}
        <span
          className="text-xs px-2.5 py-1 rounded-full font-medium shrink-0"
          style={{
            background: isConfigured ? 'rgba(52, 211, 153, 0.12)' : 'rgba(255,255,255,0.05)',
            color: isConfigured ? 'var(--success)' : 'var(--text-secondary)',
          }}
        >
          {isConfigured ? '🟢 ' + t('providers.enabled') : '⚪ ' + t('providers.disabled')}
        </span>

        {/* Expand chevron */}
        <span
          className="text-xs transition-transform"
          style={{
            color: 'var(--text-secondary)',
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        >
          ▼
        </span>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div
          className="px-5 pb-5 space-y-4"
          style={{ borderTop: '1px solid var(--border)' }}
        >
          {/* API Key */}
          <div className="pt-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                {t('providers.apiKey')}
              </label>
              <button
                onClick={() => window.electronAPI.system.openInBrowser(preset.docsUrl)}
                className="text-xs"
                style={{ color: 'var(--accent)' }}
              >
                {t('providers.getKey')} ↗
              </button>
            </div>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={state.apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={preset.keyPlaceholder}
                className="w-full px-3 py-2.5 pr-10 rounded-lg text-sm"
                style={{
                  background: 'var(--bg-tertiary)',
                  color: 'var(--text-primary)',
                  border: `1px solid ${state.apiKey ? 'rgba(52,211,153,0.3)' : 'var(--border)'}`,
                  outline: 'none',
                  fontFamily: state.apiKey && !showKey ? 'monospace' : undefined,
                }}
              />
              <button
                onClick={() => setShowKey((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-sm"
                style={{ color: 'var(--text-secondary)' }}
              >
                {showKey ? '🙈' : '👁'}
              </button>
            </div>
          </div>

          {/* Base URL (read-only for builtins) */}
          {!preset.builtin && preset.baseUrl && (
            <div>
              <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                {t('providers.baseUrl')}
              </label>
              <input
                type="text"
                value={preset.baseUrl}
                readOnly
                className="w-full px-3 py-2 rounded-lg text-xs"
                style={{
                  background: 'var(--bg-primary)',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border)',
                  fontFamily: 'monospace',
                }}
              />
            </div>
          )}

          {/* Models */}
          <div>
            <label className="block text-xs font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>
              {t('providers.models')}
            </label>
            <div className="space-y-2">
              {preset.models.map((model) => (
                <ModelRow
                  key={model.id}
                  model={model}
                  config={state.models[model.id] || { enabled: false }}
                  onUpdate={(mc) =>
                    onUpdate((prev) => ({
                      ...prev,
                      models: { ...prev.models, [model.id]: mc },
                    }))
                  }
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
