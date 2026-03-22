import { useEffect, useRef } from 'react';
import { EditorView, basicSetup } from 'codemirror';
import { EditorState } from '@codemirror/state';
import { json } from '@codemirror/lang-json';
import { oneDark } from '@codemirror/theme-one-dark';
import { useTheme } from '../../App';

// ─── Light theme (matches our design tokens) ─────────────────────────────────

const lightTheme = EditorView.theme({
  '&': {
    height: '100%',
    fontSize: '13px',
    fontFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace",
    background: '#ffffff',
  },
  '.cm-scroller': { overflow: 'auto' },
  '.cm-content': { padding: '12px 0' },
  '.cm-line': { padding: '0 16px' },
  '.cm-gutters': {
    background: '#f2f2f7',
    border: 'none',
    borderRight: '1px solid #e5e5ea',
    color: '#6c6c70',
  },
  '.cm-activeLineGutter': { background: '#e9e9ef' },
  '.cm-activeLine': { background: '#f0f0f5' },
  '.cm-selectionBackground': { background: 'rgba(255,107,74,0.2) !important' },
  '.cm-cursor': { borderLeftColor: '#ff6b4a' },
  '.cm-matchingBracket': { background: 'rgba(255,107,74,0.15)', color: 'inherit !important' },
}, { dark: false });

// ─── Dark theme overrides ─────────────────────────────────────────────────────

const darkTheme = EditorView.theme({
  '&': {
    height: '100%',
    fontSize: '13px',
    fontFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace",
  },
  '.cm-scroller': { overflow: 'auto' },
  '.cm-content': { padding: '12px 0' },
  '.cm-line': { padding: '0 16px' },
  '.cm-selectionBackground': { background: 'rgba(255,107,74,0.25) !important' },
  '.cm-cursor': { borderLeftColor: '#ff6b4a' },
  '.cm-matchingBracket': { background: 'rgba(255,107,74,0.2)', color: 'inherit !important' },
});

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  value: string;
  onChange?: (v: string) => void;
  readOnly?: boolean;
}

export default function CodeEditor({ value, onChange, readOnly = false }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const { resolvedTheme } = useTheme();

  // Rebuild editor when theme changes
  useEffect(() => {
    if (!containerRef.current) return;

    const extensions = [
      basicSetup,
      json(),
      resolvedTheme === 'dark' ? [oneDark, darkTheme] : lightTheme,
      EditorView.updateListener.of((update) => {
        if (update.docChanged && onChangeRef.current) {
          onChangeRef.current(update.state.doc.toString());
        }
      }),
    ];

    if (readOnly) {
      extensions.push(EditorState.readOnly.of(true));
    }

    const state = EditorState.create({ doc: value, extensions });
    const view = new EditorView({ state, parent: containerRef.current });
    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedTheme, readOnly]);

  // Sync external value changes without rebuilding the editor
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const current = view.state.doc.toString();
    if (current !== value) {
      view.dispatch({
        changes: { from: 0, to: current.length, insert: value },
      });
    }
  }, [value]);

  return (
    <div
      ref={containerRef}
      style={{
        height: '100%',
        overflow: 'hidden',
        background: resolvedTheme === 'dark' ? '#282c34' : '#ffffff',
      }}
    />
  );
}
