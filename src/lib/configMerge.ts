import { UIState } from './types';
import { PROVIDER_PRESETS } from './providers';

function buildProvidersFromUI(ui: UIState): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  // Built-in providers
  for (const preset of PROVIDER_PRESETS) {
    const state = ui.providers[preset.id];
    if (!state?.enabled || !state.apiKey) continue;

    const enabledModels = preset.models.filter((m) => state.models[m.id]?.enabled);
    if (enabledModels.length === 0 && !preset.builtin) continue;

    if (preset.builtin) {
      // Built-in providers: only need apiKey (written directly)
      result[preset.id] = {
        apiKey: state.apiKey,
      };
    } else {
      // Custom providers: need full config
      result[preset.id] = {
        baseUrl: preset.baseUrl,
        apiKey: state.apiKey,
        api: preset.api,
        models: enabledModels.map((m) => ({
          id: m.id,
          name: m.name,
          reasoning: m.reasoning,
          input: m.input,
          contextWindow: m.contextWindow,
          maxTokens: m.maxTokens,
        })),
      };
    }
  }

  // Custom providers
  for (const custom of ui.customProviders) {
    if (!custom.apiKey) continue;
    result[custom.id] = {
      baseUrl: custom.baseUrl,
      apiKey: custom.apiKey,
      api: custom.api,
      models: custom.models.map((m) => ({
        id: m.id,
        name: m.name,
        reasoning: m.reasoning,
        input: m.input,
        contextWindow: m.contextWindow,
        maxTokens: m.maxTokens,
      })),
    };
  }

  return result;
}

function buildModelAliasesFromUI(ui: UIState): Record<string, unknown> {
  const aliases: Record<string, unknown> = {};

  for (const preset of PROVIDER_PRESETS) {
    const state = ui.providers[preset.id];
    if (!state?.enabled) continue;
    for (const model of preset.models) {
      const mc = state.models[model.id];
      if (!mc?.enabled) continue;
      const key = `${preset.id}/${model.id}`;
      const entry: Record<string, unknown> = {};
      if (mc.alias) entry.alias = mc.alias;
      if (mc.temperature !== undefined) entry.temperature = mc.temperature;
      if (mc.maxTokens !== undefined) entry.maxTokens = mc.maxTokens;
      if (Object.keys(entry).length > 0) aliases[key] = entry;
    }
  }

  return aliases;
}

function buildEnvFromUI(ui: UIState): Record<string, string> {
  const env: Record<string, string> = {};

  for (const preset of PROVIDER_PRESETS) {
    const state = ui.providers[preset.id];
    if (state?.enabled && state.apiKey) {
      env[preset.envKeyName] = state.apiKey;
    }
  }

  for (const custom of ui.customProviders) {
    if (custom.apiKey) {
      env[custom.envKeyName] = custom.apiKey;
    }
  }

  return env;
}

export function mergeConfig(existing: unknown, ui: UIState): unknown {
  const merged = JSON.parse(JSON.stringify(existing || {})) as Record<string, unknown>;

  // models
  const existingModels = (merged.models as Record<string, unknown>) || {};
  merged.models = {
    ...existingModels,
    mode: 'merge',
    providers: buildProvidersFromUI(ui),
  };

  // agents.defaults
  if (!merged.agents) merged.agents = {};
  const agents = merged.agents as Record<string, unknown>;
  if (!agents.defaults) agents.defaults = {};
  const defaults = agents.defaults as Record<string, unknown>;

  const existingModel = (defaults.model as Record<string, unknown>) || {};
  defaults.model = {
    ...existingModel,
    primary: ui.primaryModel,
    fallbacks: ui.fallbackModels,
  };
  defaults.models = buildModelAliasesFromUI(ui);

  // env
  const existingEnv = (merged.env as Record<string, string>) || {};
  merged.env = { ...existingEnv, ...buildEnvFromUI(ui) };

  return merged;
}

export function extractUIFromConfig(config: unknown): Partial<UIState> {
  if (!config || typeof config !== 'object') return {};
  const cfg = config as Record<string, unknown>;

  const providers: UIState['providers'] = {};
  const cfgProviders = ((cfg.models as Record<string, unknown>)?.providers as Record<string, unknown>) || {};
  const cfgEnv = (cfg.env as Record<string, string>) || {};

  for (const preset of PROVIDER_PRESETS) {
    const pCfg = cfgProviders[preset.id] as Record<string, unknown> | undefined;
    const apiKey = cfgEnv[preset.envKeyName] || '';
    if (pCfg || apiKey) {
      const cfgModels = (pCfg?.models as Array<Record<string, unknown>>) || [];
      const models: Record<string, { enabled: boolean; alias?: string }> = {};
      for (const m of preset.models) {
        const inCfg = cfgModels.find((cm) => cm.id === m.id);
        models[m.id] = { enabled: !!inCfg || (!!apiKey && !!preset.builtin) };
      }
      providers[preset.id] = {
        enabled: true,
        apiKey,
        models,
      };
    } else {
      providers[preset.id] = {
        enabled: false,
        apiKey: '',
        models: {},
      };
    }
  }

  const defaults = ((cfg.agents as Record<string, unknown>)?.defaults as Record<string, unknown>) || {};
  const model = (defaults.model as Record<string, unknown>) || {};

  return {
    providers,
    primaryModel: (model.primary as string) || '',
    fallbackModels: (model.fallbacks as string[]) || [],
    customProviders: [],
  };
}

export function computeDiff(
  existing: unknown,
  next: unknown
): Array<{ path: string; before: unknown; after: unknown }> {
  const diffs: Array<{ path: string; before: unknown; after: unknown }> = [];
  comparePaths(existing, next, '', diffs);
  return diffs;
}

function comparePaths(
  a: unknown,
  b: unknown,
  prefix: string,
  diffs: Array<{ path: string; before: unknown; after: unknown }>
) {
  if (JSON.stringify(a) === JSON.stringify(b)) return;

  if (
    typeof a === 'object' && a !== null &&
    typeof b === 'object' && b !== null &&
    !Array.isArray(a) && !Array.isArray(b)
  ) {
    const aObj = a as Record<string, unknown>;
    const bObj = b as Record<string, unknown>;
    const keys = new Set([...Object.keys(aObj), ...Object.keys(bObj)]);
    for (const key of keys) {
      comparePaths(aObj[key], bObj[key], prefix ? `${prefix}.${key}` : key, diffs);
    }
  } else {
    diffs.push({ path: prefix, before: a, after: b });
  }
}
