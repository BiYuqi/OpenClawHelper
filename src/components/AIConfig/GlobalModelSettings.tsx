import React, { useState } from 'react';
import { useLocaleCtx } from '../../App';
import { UIState } from '../../lib/types';
import { PROVIDER_PRESETS } from '../../lib/providers';

interface Props {
  uiState: UIState;
  update: (fn: (prev: UIState) => UIState) => void;
}

function getEnabledModels(uiState: UIState): Array<{ id: string; label: string }> {
  const result: Array<{ id: string; label: string }> = [];
  for (const preset of PROVIDER_PRESETS) {
    const state = uiState.providers[preset.id];
    if (!state?.enabled) continue;
    for (const model of preset.models) {
      if (state.models[model.id]?.enabled) {
        result.push({
          id: `${preset.id}/${model.id}`,
          label: `${preset.name} / ${model.name}`,
        });
      }
    }
  }
  return result;
}

export default function GlobalModelSettings({ uiState, update }: Props) {
  const { t } = useLocaleCtx();
  const enabledModels = getEnabledModels(uiState);
  const [showFallbackPicker, setShowFallbackPicker] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);

  const addFallback = (modelId: string) => {
    if (uiState.fallbackModels.includes(modelId)) return;
    update((prev) => ({ ...prev, fallbackModels: [...prev.fallbackModels, modelId] }));
    setShowFallbackPicker(false);
  };

  const removeFallback = (modelId: string) => {
    update((prev) => ({ ...prev, fallbackModels: prev.fallbackModels.filter((m) => m !== modelId) }));
  };

  const handleDragStart = (i: number) => setDragIdx(i);
  const handleDragOver = (e: React.DragEvent, i: number) => {
    e.preventDefault();
    setOverIdx(i);
  };
  const handleDrop = (targetIdx: number) => {
    if (dragIdx === null || dragIdx === targetIdx) return;
    update((prev) => {
      const arr = [...prev.fallbackModels];
      const [item] = arr.splice(dragIdx, 1);
      arr.splice(targetIdx, 0, item);
      return { ...prev, fallbackModels: arr };
    });
    setDragIdx(null);
    setOverIdx(null);
  };

  return (
    <div
      className="rounded-xl p-5 mb-5"
      style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
    >
      <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>全局模型设置</h2>

      <div className="flex gap-6 flex-wrap">
        {/* Primary model */}
        <div className="flex-1 min-w-48">
          <label className="block text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>
            {t('providers.primaryModel')}
          </label>
          <select
            value={uiState.primaryModel}
            onChange={(e) => update((prev) => ({ ...prev, primaryModel: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg text-sm"
            style={{
              background: 'var(--bg-tertiary)',
              color: uiState.primaryModel ? 'var(--text-primary)' : 'var(--text-secondary)',
              border: '1px solid var(--border)',
            }}
          >
            <option value="">— 请选择 —</option>
            {enabledModels.map((m) => (
              <option key={m.id} value={m.id}>{m.label}</option>
            ))}
          </select>
          {enabledModels.length === 0 && (
            <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
              {t('providers.noEnabledModels')}
            </p>
          )}
        </div>

        {/* Fallback models */}
        <div className="flex-1 min-w-48">
          <label className="block text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>
            {t('providers.fallbacks')} <span className="ml-1" style={{ color: 'var(--text-secondary)', fontSize: '0.65rem' }}>（可拖拽排序）</span>
          </label>
          <div className="space-y-1.5 mb-2">
            {uiState.fallbackModels.map((fb, i) => (
              <div
                key={fb}
                draggable
                onDragStart={() => handleDragStart(i)}
                onDragOver={(e) => handleDragOver(e, i)}
                onDrop={() => handleDrop(i)}
                onDragEnd={() => { setDragIdx(null); setOverIdx(null); }}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs cursor-grab active:cursor-grabbing"
                style={{
                  background: overIdx === i && dragIdx !== i ? 'rgba(255,107,74,0.1)' : 'var(--bg-tertiary)',
                  border: `1px solid ${overIdx === i && dragIdx !== i ? 'var(--accent)' : 'var(--border)'}`,
                  color: 'var(--text-primary)',
                  opacity: dragIdx === i ? 0.5 : 1,
                }}
              >
                <span style={{ color: 'var(--text-secondary)' }}>⠿</span>
                <span className="flex-1 truncate">{fb}</span>
                <button
                  onClick={() => removeFallback(fb)}
                  className="text-xs"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <div className="relative">
            <button
              onClick={() => setShowFallbackPicker((v) => !v)}
              disabled={enabledModels.length === 0}
              className="text-xs px-3 py-1.5 rounded-lg transition-all"
              style={{
                background: 'transparent',
                color: 'var(--accent)',
                border: '1px dashed rgba(255,107,74,0.5)',
              }}
            >
              {t('providers.fallbackAdd')}
            </button>
            {showFallbackPicker && (
              <div
                className="absolute left-0 mt-1 w-64 rounded-lg shadow-xl z-20 overflow-hidden"
                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
              >
                {enabledModels
                  .filter((m) => m.id !== uiState.primaryModel && !uiState.fallbackModels.includes(m.id))
                  .map((m) => (
                    <button
                      key={m.id}
                      onClick={() => addFallback(m.id)}
                      className="w-full text-left px-3 py-2 text-xs transition-colors"
                      style={{ color: 'var(--text-primary)' }}
                      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = 'var(--bg-tertiary)')}
                      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
                    >
                      {m.label}
                    </button>
                  ))}
                {enabledModels.filter((m) => m.id !== uiState.primaryModel && !uiState.fallbackModels.includes(m.id)).length === 0 && (
                  <div className="px-3 py-2 text-xs" style={{ color: 'var(--text-secondary)' }}>无可用模型</div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
