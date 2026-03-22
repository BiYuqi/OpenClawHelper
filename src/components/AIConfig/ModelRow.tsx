import React, { useState } from 'react';
import { ModelPreset } from '../../lib/providers';
import { ModelConfig } from '../../lib/types';

interface Props {
  model: ModelPreset;
  config: ModelConfig;
  onUpdate: (mc: ModelConfig) => void;
}

function formatNum(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(0) + 'K';
  return String(n);
}

export default function ModelRow({ model, config, onUpdate }: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{
        background: 'var(--bg-primary)',
        border: `1px solid ${config.enabled ? 'rgba(52,211,153,0.2)' : 'var(--border)'}`,
      }}
    >
      <div className="flex items-center gap-3 px-3 py-2.5">
        {/* Checkbox */}
        <input
          type="checkbox"
          checked={config.enabled}
          onChange={(e) => onUpdate({ ...config, enabled: e.target.checked })}
          className="w-4 h-4 rounded shrink-0"
          style={{ accentColor: 'var(--accent)' }}
        />

        {/* Model name */}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
            {model.name}
          </div>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <code className="text-xs" style={{ color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
              {model.id}
            </code>
          </div>
        </div>

        {/* Badges */}
        <div className="flex items-center gap-1.5 shrink-0">
          {model.reasoning && (
            <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(139,92,246,0.15)', color: '#a78bfa' }}>
              推理
            </span>
          )}
          <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
            {formatNum(model.contextWindow)}ctx
          </span>
          {model.cost.input > 0 && (
            <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
              ${model.cost.input}/{model.cost.output}
            </span>
          )}
        </div>

        {/* Expand */}
        {config.enabled && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="text-xs px-2 py-1 rounded"
            style={{
              background: 'var(--bg-tertiary)',
              color: 'var(--text-secondary)',
              transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.15s',
            }}
          >
            ▼
          </button>
        )}
      </div>

      {expanded && config.enabled && (
        <div
          className="px-3 pb-3 pt-2 grid grid-cols-3 gap-3"
          style={{ borderTop: '1px solid var(--border)' }}
        >
          <div>
            <label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>别名</label>
            <input
              type="text"
              value={config.alias || ''}
              onChange={(e) => onUpdate({ ...config, alias: e.target.value || undefined })}
              placeholder="sonnet"
              className="w-full px-2 py-1.5 rounded text-xs"
              style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
            />
          </div>
          <div>
            <label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Temperature</label>
            <input
              type="number"
              min="0"
              max="2"
              step="0.1"
              value={config.temperature ?? ''}
              onChange={(e) => onUpdate({ ...config, temperature: e.target.value ? parseFloat(e.target.value) : undefined })}
              placeholder="默认"
              className="w-full px-2 py-1.5 rounded text-xs"
              style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
            />
          </div>
          <div>
            <label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Max Tokens</label>
            <input
              type="number"
              min="1"
              value={config.maxTokens ?? ''}
              onChange={(e) => onUpdate({ ...config, maxTokens: e.target.value ? parseInt(e.target.value) : undefined })}
              placeholder={String(model.maxTokens)}
              className="w-full px-2 py-1.5 rounded text-xs"
              style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
