import React, { useState } from 'react';
import { LogEntry } from '../../lib/types';

// Colors use CSS variables so they adapt to light/dark theme
const LEVEL_STYLES: Record<string, { bgVar: string; textVar: string; label: string }> = {
  trace:   { bgVar: 'transparent',              textVar: 'var(--text-secondary)',  label: 'TRC' },
  debug:   { bgVar: 'transparent',              textVar: 'var(--text-secondary)',  label: 'DBG' },
  info:    { bgVar: 'transparent',              textVar: 'var(--log-info)',        label: 'INF' },
  warn:    { bgVar: 'var(--log-warn-bg)',       textVar: 'var(--log-warn)',        label: 'WRN' },
  warning: { bgVar: 'var(--log-warn-bg)',       textVar: 'var(--log-warn)',        label: 'WRN' },
  error:   { bgVar: 'var(--log-error-bg)',      textVar: 'var(--log-error)',       label: 'ERR' },
  fatal:   { bgVar: 'var(--log-error-bg)',      textVar: 'var(--log-error)',       label: 'FTL' },
};

function getStyle(level: string) {
  return LEVEL_STYLES[level] ?? LEVEL_STYLES.info;
}

interface Props {
  entry: LogEntry;
  onClickSubsystem?: (subsystem: string) => void;
}

export default function LogLine({ entry, onClickSubsystem }: Props) {
  const [expanded, setExpanded] = useState(false);
  const style = getStyle(entry.level);
  const time = entry.time ? new Date(entry.time).toLocaleTimeString('zh', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '';

  return (
    <div
      className="group"
      style={{ background: style.bgVar, borderBottom: '1px solid var(--border)' }}
    >
      <div
        className="flex items-baseline gap-2 px-4 py-0.5 cursor-pointer text-xs"
        style={{ height: 28, minHeight: 28 }}
        onClick={() => setExpanded((v) => !v)}
      >
        {/* Time */}
        <span
          className="shrink-0 tabular-nums"
          style={{ color: 'var(--text-secondary)', width: '7ch', fontFamily: 'monospace' }}
        >
          {time}
        </span>

        {/* Level badge */}
        <span
          className="shrink-0 font-bold"
          style={{ color: style.textVar, width: '3ch', fontFamily: 'monospace' }}
        >
          {style.label}
        </span>

        {/* Subsystem */}
        <button
          onClick={(e) => { e.stopPropagation(); onClickSubsystem?.(entry.subsystem); }}
          className="shrink-0 px-1.5 py-0.5 rounded text-xs transition-colors"
          style={{
            background: 'var(--bg-tertiary)',
            color: 'var(--text-secondary)',
            fontFamily: 'monospace',
            maxWidth: '10ch',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          title={entry.subsystem}
        >
          {entry.subsystem}
        </button>

        {/* Message */}
        <span
          className="flex-1 truncate"
          style={{ color: 'var(--text-primary)' }}
        >
          {entry.msg}
        </span>
      </div>

      {/* Expanded JSON */}
      {expanded && (
        <pre
          className="px-4 py-3 text-xs overflow-x-auto"
          style={{
            background: 'var(--bg-tertiary)',
            color: 'var(--text-secondary)',
            fontFamily: 'monospace',
            fontSize: '11px',
            borderTop: '1px solid var(--border)',
            margin: 0,
          }}
        >
          {JSON.stringify(entry, null, 2)}
        </pre>
      )}
    </div>
  );
}
