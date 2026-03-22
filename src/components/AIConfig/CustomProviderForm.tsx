import React, { useState } from 'react';
import { CustomProviderDef } from '../../lib/types';

interface Props {
  value: CustomProviderDef | null;
  onChange: (cp: CustomProviderDef) => void;
  onRemove: () => void;
}

const emptyProvider = (): CustomProviderDef => ({
  id: '',
  name: '',
  api: 'openai-completions',
  baseUrl: '',
  envKeyName: '',
  apiKey: '',
  models: [],
});

export default function CustomProviderForm({ value, onChange, onRemove }: Props) {
  const [form, setForm] = useState<CustomProviderDef>(value || emptyProvider());

  const update = (patch: Partial<CustomProviderDef>) => {
    setForm((prev) => ({ ...prev, ...patch }));
  };

  const handleSave = () => {
    if (!form.id || !form.name || !form.baseUrl) return;
    onChange(form);
  };

  const isNew = !value;

  return (
    <div
      className="rounded-xl p-5"
      style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
    >
      <div className="flex items-center justify-between mb-4">
        <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
          {isNew ? '添加自定义 Provider' : form.name || '自定义 Provider'}
        </span>
        <button onClick={onRemove} style={{ color: 'var(--text-secondary)' }} className="text-sm">
          {isNew ? '取消' : '删除'}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Provider ID (唯一标识)" required>
          <input
            type="text"
            value={form.id}
            onChange={(e) => update({ id: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
            placeholder="my-provider"
            className="field-input"
          />
        </Field>
        <Field label="显示名称" required>
          <input
            type="text"
            value={form.name}
            onChange={(e) => update({ name: e.target.value })}
            placeholder="My Provider"
            className="field-input"
          />
        </Field>
        <Field label="Base URL" required>
          <input
            type="text"
            value={form.baseUrl}
            onChange={(e) => update({ baseUrl: e.target.value })}
            placeholder="https://api.example.com/v1"
            className="field-input"
          />
        </Field>
        <Field label="API 类型">
          <select
            value={form.api}
            onChange={(e) => update({ api: e.target.value as CustomProviderDef['api'] })}
            className="field-input"
          >
            <option value="openai-completions">OpenAI Completions</option>
            <option value="anthropic-messages">Anthropic Messages</option>
            <option value="google-generative-ai">Google Generative AI</option>
          </select>
        </Field>
        <Field label="API Key">
          <input
            type="password"
            value={form.apiKey}
            onChange={(e) => update({ apiKey: e.target.value })}
            placeholder="sk-..."
            className="field-input"
          />
        </Field>
        <Field label="环境变量名">
          <input
            type="text"
            value={form.envKeyName}
            onChange={(e) => update({ envKeyName: e.target.value.toUpperCase() })}
            placeholder="MY_PROVIDER_API_KEY"
            className="field-input"
          />
        </Field>
      </div>

      <div className="mt-4 flex justify-end">
        <button
          onClick={handleSave}
          disabled={!form.id || !form.name || !form.baseUrl}
          className="px-5 py-2 rounded-lg text-sm font-medium"
          style={{
            background: 'var(--accent)',
            color: '#fff',
            opacity: !form.id || !form.name || !form.baseUrl ? 0.5 : 1,
            cursor: !form.id || !form.name || !form.baseUrl ? 'not-allowed' : 'pointer',
          }}
        >
          {isNew ? '添加' : '保存'}
        </button>
      </div>

      <style>{`
        .field-input {
          width: 100%;
          padding: 8px 12px;
          border-radius: 8px;
          font-size: 13px;
          background: var(--bg-tertiary);
          color: var(--text-primary);
          border: 1px solid var(--border);
          outline: none;
        }
        .field-input:focus {
          border-color: var(--accent);
        }
      `}</style>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs mb-1.5" style={{ color: 'var(--text-secondary)' }}>
        {label} {required && <span style={{ color: 'var(--danger)' }}>*</span>}
      </label>
      {children}
    </div>
  );
}
