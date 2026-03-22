import React from 'react';
import { useLocaleCtx } from '../../App';

interface Props {
  isRunning: boolean;
  isPaused: boolean;
  levelFilter: string;
  search: string;
  subsystemFilter: string | null;
  onStart: () => void;
  onStop: () => void;
  onPause: () => void;
  onResume: () => void;
  onClear: () => void;
  onLevelChange: (l: string) => void;
  onSearchChange: (s: string) => void;
  onClearSubsystem: () => void;
}

const LEVELS = ['all', 'trace', 'debug', 'info', 'warn', 'error', 'fatal'];

export default function LogToolbar({
  isRunning, isPaused,
  levelFilter, search, subsystemFilter,
  onStart, onStop, onPause, onResume, onClear,
  onLevelChange, onSearchChange, onClearSubsystem,
}: Props) {
  const { t } = useLocaleCtx();

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 shrink-0 flex-wrap"
      style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}
    >
      {/* Start/Stop */}
      {!isRunning ? (
        <Btn onClick={onStart} accent>{t('logs.start')}</Btn>
      ) : (
        <Btn onClick={onStop} danger>■ {t('logs.stop')}</Btn>
      )}

      {/* Pause/Resume */}
      {isRunning && (
        isPaused
          ? <Btn onClick={onResume}>{t('logs.resume')}</Btn>
          : <Btn onClick={onPause}>{t('logs.pause')}</Btn>
      )}

      {/* Clear */}
      <Btn onClick={onClear}>{t('logs.clear')}</Btn>

      <div style={{ width: 1, height: 20, background: 'var(--border)' }} />

      {/* Level filter */}
      <select
        value={levelFilter}
        onChange={(e) => onLevelChange(e.target.value)}
        className="px-2 py-1.5 rounded-lg text-xs"
        style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
      >
        {LEVELS.map((l) => (
          <option key={l} value={l}>
            {l === 'all' ? t('logs.allLevels') : l.toUpperCase()}
          </option>
        ))}
      </select>

      {/* Search */}
      <div className="relative flex-1 min-w-40 max-w-xs">
        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs" style={{ color: 'var(--text-secondary)' }}>🔍</span>
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={t('logs.search')}
          className="w-full pl-7 pr-3 py-1.5 rounded-lg text-xs"
          style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
        />
      </div>

      {/* Subsystem filter indicator */}
      {subsystemFilter && (
        <button
          onClick={onClearSubsystem}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs"
          style={{ background: 'rgba(255,107,74,0.12)', color: 'var(--accent)', border: '1px solid rgba(255,107,74,0.3)' }}
        >
          {subsystemFilter} ✕
        </button>
      )}

      {/* Status */}
      <div className="ml-auto flex items-center gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
        {isRunning && (
          <span className="flex items-center gap-1">
            <span
              className="w-2 h-2 rounded-full"
              style={{ background: isPaused ? 'var(--warning)' : 'var(--success)', animation: isPaused ? 'none' : 'pulse 1.5s infinite' }}
            />
            {isPaused ? '已暂停' : '直播中'}
          </span>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}

function Btn({ children, onClick, accent, danger }: { children: React.ReactNode; onClick: () => void; accent?: boolean; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
      style={{
        background: accent ? 'var(--accent)' : danger ? 'rgba(239,68,68,0.12)' : 'var(--bg-tertiary)',
        color: accent ? '#fff' : danger ? 'var(--danger)' : 'var(--text-primary)',
        border: `1px solid ${accent ? 'var(--accent)' : danger ? 'rgba(239,68,68,0.3)' : 'var(--border)'}`,
      }}
    >
      {children}
    </button>
  );
}
