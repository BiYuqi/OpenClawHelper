import { useState, useCallback } from 'react';
import { UIState } from '../lib/types';
import { mergeConfig, extractUIFromConfig } from '../lib/configMerge';
import { PROVIDER_PRESETS } from '../lib/providers';

function defaultUIState(): UIState {
  const providers: UIState['providers'] = {};
  for (const preset of PROVIDER_PRESETS) {
    providers[preset.id] = {
      enabled: false,
      apiKey: '',
      models: Object.fromEntries(preset.models.map((m) => [m.id, { enabled: false }])),
    };
  }
  return { providers, primaryModel: '', fallbackModels: [], customProviders: [] };
}

export function useConfig() {
  const [rawConfig, setRawConfig] = useState<unknown>(null);
  const [uiState, setUIState] = useState<UIState>(defaultUIState());
  const [loading, setLoading] = useState(false);
  const [dirty, setDirty] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const cfg = await window.electronAPI.config.read();
      setRawConfig(cfg);
      if (cfg) {
        const extracted = extractUIFromConfig(cfg);
        setUIState((prev) => ({ ...defaultUIState(), ...extracted, customProviders: prev.customProviders }));
      } else {
        setUIState(defaultUIState());
      }
      setDirty(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const save = useCallback(async (state: UIState) => {
    const merged = mergeConfig(rawConfig, state);
    await window.electronAPI.config.write(merged);
    setRawConfig(merged);
    setDirty(false);
    return merged;
  }, [rawConfig]);

  const update = useCallback((fn: (prev: UIState) => UIState) => {
    setUIState((prev) => {
      const next = fn(prev);
      setDirty(true);
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    if (rawConfig) {
      const extracted = extractUIFromConfig(rawConfig);
      setUIState({ ...defaultUIState(), ...extracted });
    } else {
      setUIState(defaultUIState());
    }
    setDirty(false);
  }, [rawConfig]);

  return { rawConfig, uiState, loading, dirty, load, save, update, reset };
}
