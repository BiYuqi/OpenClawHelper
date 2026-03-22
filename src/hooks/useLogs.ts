import { useState, useEffect, useRef, useCallback } from 'react';
import { LogEntry } from '../lib/types';

const MAX_LOGS = 10_000;

export function useLogs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [logFilePath, setLogFilePath] = useState('');
  const isPausedRef = useRef(false);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  useEffect(() => {
    window.electronAPI.logs.onLine((entry: LogEntry) => {
      if (isPausedRef.current) {
        setPendingCount((n) => n + 1);
        return;
      }
      setLogs((prev) => {
        const next = [...prev, entry];
        return next.length > MAX_LOGS ? next.slice(-MAX_LOGS) : next;
      });
    });

    window.electronAPI.logs.getLogFilePath().then(setLogFilePath);

    return () => {
      window.electronAPI.logs.offLine();
    };
  }, []);

  const start = useCallback(async () => {
    await window.electronAPI.logs.start();
    setIsRunning(true);
  }, []);

  const stop = useCallback(async () => {
    await window.electronAPI.logs.stop();
    setIsRunning(false);
  }, []);

  const pause = useCallback(() => {
    setIsPaused(true);
    setPendingCount(0);
  }, []);

  const resume = useCallback(() => {
    setIsPaused(false);
    setPendingCount(0);
  }, []);

  const clear = useCallback(() => {
    setLogs([]);
    setPendingCount(0);
  }, []);

  return {
    logs,
    isRunning,
    isPaused,
    pendingCount,
    logFilePath,
    start,
    stop,
    pause,
    resume,
    clear,
  };
}
