import { useState, useCallback } from 'react';
import { GatewayStatus } from '../lib/types';

export function useGateway() {
  const [status, setStatus] = useState<GatewayStatus | null>(null);
  const [loading, setLoading] = useState(false);

  const check = useCallback(async () => {
    setLoading(true);
    try {
      const s = await window.electronAPI.gateway.checkStatus();
      setStatus(s);
      return s;
    } finally {
      setLoading(false);
    }
  }, []);

  const restart = useCallback(async () => {
    await window.electronAPI.gateway.restart();
    return check();
  }, [check]);

  const start = useCallback(async () => {
    await window.electronAPI.gateway.start();
    return check();
  }, [check]);

  const stop = useCallback(async () => {
    await window.electronAPI.gateway.stop();
    return check();
  }, [check]);

  return { status, loading, check, restart, start, stop };
}
