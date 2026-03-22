import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from '../../App';
import CodeEditor from './CodeEditor';

interface Props {
  onClose: () => void;
}

export default function ConfigEditorModal({ onClose }: Props) {
  const { showToast } = useToast();
  const [content, setContent] = useState('');
  const [original, setOriginal] = useState('');
  const [filePath, setFilePath] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      window.electronAPI.config.readRaw(),
      window.electronAPI.config.getPath(),
    ]).then(([text, path]) => {
      const t = text || '';
      setContent(t);
      setOriginal(t);
      setFilePath(path);
      setLoading(false);
    });
  }, []);

  const dirty = content !== original;

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await window.electronAPI.config.writeRaw(content);
      setOriginal(content);
      showToast('已保存', 'success');
    } catch (err) {
      showToast('保存失败: ' + (err instanceof Error ? err.message : String(err)), 'error');
    } finally {
      setSaving(false);
    }
  }, [content, showToast]);

  // Cmd+S to save
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        if (dirty && !saving) handleSave();
      }
      if (e.key === 'Escape' && !dirty) onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [dirty, saving, handleSave, onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget && !dirty) onClose(); }}
    >
      <div
        className="flex flex-col rounded-xl overflow-hidden shadow-2xl"
        style={{
          width: 'min(860px, 92vw)',
          height: 'min(680px, 86vh)',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
        }}
      >
        {/* ── Header ── */}
        <div
          className="flex items-center gap-3 px-4 py-3 shrink-0"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <span className="text-base">📄</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                openclaw.json
              </span>
              {dirty && (
                <span
                  className="text-xs px-1.5 py-0.5 rounded font-medium"
                  style={{
                    background: 'rgba(245,158,11,0.12)',
                    color: 'var(--warning)',
                    border: '1px solid rgba(245,158,11,0.25)',
                  }}
                >
                  未保存
                </span>
              )}
            </div>
            <div
              className="text-xs mt-0.5 truncate"
              style={{ color: 'var(--text-secondary)', fontFamily: 'monospace' }}
            >
              {filePath}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              ⌘S 保存
            </span>
            <button
              onClick={handleSave}
              disabled={!dirty || saving}
              className="px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{
                background: dirty ? 'var(--accent)' : 'var(--bg-tertiary)',
                color: dirty ? '#fff' : 'var(--text-secondary)',
                opacity: saving ? 0.7 : 1,
                cursor: !dirty || saving ? 'not-allowed' : 'pointer',
              }}
            >
              {saving ? '保存中...' : '保存'}
            </button>
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-sm transition-colors"
              style={{ color: 'var(--text-secondary)', background: 'var(--bg-tertiary)' }}
              title={dirty ? '关闭（有未保存修改）' : '关闭'}
            >
              ✕
            </button>
          </div>
        </div>

        {/* ── Editor ── */}
        <div className="flex-1 overflow-hidden">
          {loading ? (
            <div
              className="flex items-center justify-center h-full text-sm"
              style={{ color: 'var(--text-secondary)' }}
            >
              加载中...
            </div>
          ) : (
            <CodeEditor value={content} onChange={setContent} />
          )}
        </div>

        {/* ── Footer ── */}
        <div
          className="flex items-center gap-4 px-4 py-2 shrink-0 text-xs"
          style={{
            borderTop: '1px solid var(--border)',
            color: 'var(--text-secondary)',
            background: 'var(--bg-tertiary)',
          }}
        >
          <span>JSON5</span>
          <span style={{ color: 'var(--border)' }}>|</span>
          <span>UTF-8</span>
          <span className="ml-auto">
            {dirty
              ? <span style={{ color: 'var(--warning)' }}>● 有修改未保存</span>
              : <span style={{ color: 'var(--success)' }}>✓ 已同步</span>}
          </span>
        </div>
      </div>
    </div>
  );
}
