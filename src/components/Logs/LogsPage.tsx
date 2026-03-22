import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocaleCtx } from '../../App';
import { useLogs } from '../../hooks/useLogs';
import { LogEntry } from '../../lib/types';
import LogLine from './LogLine';
import LogToolbar from './LogToolbar';

const LEVEL_ORDER = ['trace', 'debug', 'info', 'warn', 'warning', 'error', 'fatal'] as const;
const ROW_HEIGHT = 28;
const BUFFER = 10;

function VirtualList({ items }: { items: LogEntry[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(400);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setContainerHeight(el.clientHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const totalHeight = items.length * ROW_HEIGHT;
  const startIdx = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - BUFFER);
  const endIdx = Math.min(items.length, Math.ceil((scrollTop + containerHeight) / ROW_HEIGHT) + BUFFER);
  const visibleItems = items.slice(startIdx, endIdx);

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto"
      onScroll={(e) => setScrollTop((e.currentTarget as HTMLElement).scrollTop)}
      style={{ position: 'relative' }}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {visibleItems.map((item, i) => (
          <div
            key={startIdx + i}
            style={{
              position: 'absolute',
              top: (startIdx + i) * ROW_HEIGHT,
              left: 0,
              right: 0,
              height: ROW_HEIGHT,
            }}
          >
            <LogLine entry={item} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function LogsPage() {
  const { t } = useLocaleCtx();
  const { logs, isRunning, isPaused, pendingCount, logFilePath, start, stop, pause, resume, clear } = useLogs();
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [subsystemFilter, setSubsystemFilter] = useState<string | null>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastScrollTop = useRef(0);

  // Filter logs
  const filtered = logs.filter((entry) => {
    const entryLevelIdx = LEVEL_ORDER.indexOf(entry.level as typeof LEVEL_ORDER[number]);
    const filterLevelIdx = LEVEL_ORDER.indexOf(levelFilter as typeof LEVEL_ORDER[number]);
    const levelOk = levelFilter === 'all' || (entryLevelIdx === -1 ? true : filterLevelIdx === -1 ? true : entryLevelIdx >= filterLevelIdx);
    const searchOk = !search || entry.msg.toLowerCase().includes(search.toLowerCase()) || entry.subsystem.toLowerCase().includes(search.toLowerCase());
    const subsystemOk = !subsystemFilter || entry.subsystem === subsystemFilter;
    return levelOk && searchOk && subsystemOk;
  });

  // Auto scroll
  useEffect(() => {
    if (!autoScroll || !scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [filtered.length, autoScroll]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 50;
    const scrollingUp = el.scrollTop < lastScrollTop.current;
    lastScrollTop.current = el.scrollTop;

    if (scrollingUp && !isAtBottom) {
      setAutoScroll(false);
      if (!isPaused) pause();
    }
    if (isAtBottom) {
      setAutoScroll(true);
    }
  }, [isPaused, pause]);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
    setAutoScroll(true);
    resume();
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (isRunning) stop();
    };
  }, [isRunning, stop]);

  return (
    <div
      className="flex flex-col h-full"
      style={{ background: 'var(--bg-primary)' }}
    >
      <LogToolbar
        isRunning={isRunning}
        isPaused={isPaused}
        levelFilter={levelFilter}
        search={search}
        subsystemFilter={subsystemFilter}
        onStart={start}
        onStop={stop}
        onPause={pause}
        onResume={resume}
        onClear={clear}
        onLevelChange={setLevelFilter}
        onSearchChange={setSearch}
        onClearSubsystem={() => setSubsystemFilter(null)}
      />

      {/* Log area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto font-mono"
        onScroll={handleScroll}
        style={{ background: 'var(--bg-primary)' }}
      >
        {filtered.length === 0 ? (
          <div className="flex items-center justify-center h-full text-sm" style={{ color: 'var(--text-secondary)' }}>
            {isRunning ? '等待日志...' : '点击「开始」开始接收日志'}
          </div>
        ) : (
          <>
            {filtered.map((entry, i) => (
              <LogLine
                key={i}
                entry={entry}
                onClickSubsystem={(s) => setSubsystemFilter(s === subsystemFilter ? null : s)}
              />
            ))}
          </>
        )}
      </div>

      {/* Pending scroll button */}
      {pendingCount > 0 && !autoScroll && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2">
          <button
            onClick={scrollToBottom}
            className="px-4 py-2 rounded-full text-sm font-medium shadow-lg"
            style={{ background: 'var(--accent)', color: '#fff' }}
          >
            {t('logs.newLines', { count: pendingCount })}
          </button>
        </div>
      )}

      {/* Status bar */}
      <div
        className="flex items-center gap-4 px-4 py-2 text-xs shrink-0"
        style={{ background: 'var(--bg-secondary)', borderTop: '1px solid var(--border)', color: 'var(--text-secondary)' }}
      >
        <span>{t('logs.count', { count: filtered.length })}</span>
        {subsystemFilter && (
          <span>
            子系统: <code style={{ color: 'var(--accent)' }}>{subsystemFilter}</code>{' '}
            <button onClick={() => setSubsystemFilter(null)} style={{ color: 'var(--text-secondary)' }}>✕</button>
          </span>
        )}
        <span className="ml-auto truncate">{t('logs.filePath')}: <code>{logFilePath}</code></span>
      </div>
    </div>
  );
}
