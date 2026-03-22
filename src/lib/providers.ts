export interface ModelPreset {
  id: string;
  name: string;
  reasoning: boolean;
  contextWindow: number;
  maxTokens: number;
  input: string[];
  cost: { input: number; output: number };
}

export interface ProviderPreset {
  id: string;
  name: string;
  icon: string;
  api: 'openai-completions' | 'anthropic-messages' | 'google-generative-ai';
  baseUrl?: string;
  envKeyName: string;
  keyPlaceholder: string;
  keyPrefix?: string;
  models: ModelPreset[];
  docsUrl: string;
  builtin?: boolean; // Anthropic / OpenAI / Google are built-in to OpenClaw
}

export const PROVIDER_PRESETS: ProviderPreset[] = [

  // ─── Built-in providers (no baseUrl needed) ───────────────────────────────

  {
    id: 'anthropic',
    name: 'Anthropic',
    icon: '🤖',
    api: 'anthropic-messages',
    envKeyName: 'ANTHROPIC_API_KEY',
    keyPlaceholder: 'sk-ant-...',
    keyPrefix: 'sk-ant-',
    docsUrl: 'https://console.anthropic.com/settings/keys',
    builtin: true,
    models: [
      { id: 'claude-opus-4-6',   name: 'Claude Opus 4.6',   reasoning: true,  contextWindow: 200000, maxTokens: 32000, input: ['text', 'image'], cost: { input: 15,  output: 75  } },
      { id: 'claude-sonnet-4-6', name: 'Claude Sonnet 4.6', reasoning: true,  contextWindow: 200000, maxTokens: 16000, input: ['text', 'image'], cost: { input: 3,   output: 15  } },
      { id: 'claude-haiku-4-5',  name: 'Claude Haiku 4.5',  reasoning: false, contextWindow: 200000, maxTokens: 8192,  input: ['text', 'image'], cost: { input: 0.8, output: 4   } },
    ],
  },

  {
    id: 'openai',
    name: 'OpenAI',
    icon: '🧠',
    api: 'openai-completions',
    envKeyName: 'OPENAI_API_KEY',
    keyPlaceholder: 'sk-...',
    keyPrefix: 'sk-',
    docsUrl: 'https://platform.openai.com/api-keys',
    builtin: true,
    models: [
      { id: 'gpt-4o',   name: 'GPT-4o',   reasoning: false, contextWindow: 128000, maxTokens: 16384,  input: ['text', 'image'], cost: { input: 2.5, output: 10  } },
      { id: 'gpt-5.2',  name: 'GPT-5.2',  reasoning: true,  contextWindow: 128000, maxTokens: 32000,  input: ['text', 'image'], cost: { input: 10,  output: 30  } },
      { id: 'o3-mini',  name: 'o3-mini',  reasoning: true,  contextWindow: 200000, maxTokens: 100000, input: ['text'],           cost: { input: 1.1, output: 4.4 } },
    ],
  },

  {
    id: 'google',
    name: 'Google Gemini',
    icon: '💎',
    api: 'google-generative-ai',
    envKeyName: 'GOOGLE_API_KEY',
    keyPlaceholder: 'AIza...',
    keyPrefix: 'AIza',
    docsUrl: 'https://aistudio.google.com/apikey',
    builtin: true,
    models: [
      { id: 'gemini-2.5-pro',   name: 'Gemini 2.5 Pro',   reasoning: true,  contextWindow: 1048576, maxTokens: 65536, input: ['text', 'image'], cost: { input: 1.25, output: 10  } },
      { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', reasoning: false, contextWindow: 1048576, maxTokens: 8192,  input: ['text', 'image'], cost: { input: 0.1,  output: 0.4 } },
    ],
  },

  // ─── International providers ──────────────────────────────────────────────

  {
    id: 'deepseek',
    name: 'DeepSeek',
    icon: '🐋',
    api: 'openai-completions',
    baseUrl: 'https://api.deepseek.com/v1',
    envKeyName: 'DEEPSEEK_API_KEY',
    keyPlaceholder: 'sk-...',
    docsUrl: 'https://platform.deepseek.com/api_keys',
    models: [
      { id: 'deepseek-chat',     name: 'DeepSeek Chat',     reasoning: false, contextWindow: 64000, maxTokens: 8192, input: ['text'], cost: { input: 0.14, output: 0.28 } },
      { id: 'deepseek-reasoner', name: 'DeepSeek Reasoner', reasoning: true,  contextWindow: 64000, maxTokens: 8192, input: ['text'], cost: { input: 0.55, output: 2.19 } },
    ],
  },

  {
    id: 'xai',
    name: 'xAI Grok',
    icon: '✴️',
    api: 'openai-completions',
    baseUrl: 'https://api.x.ai/v1',
    envKeyName: 'XAI_API_KEY',
    keyPlaceholder: 'xai-...',
    keyPrefix: 'xai-',
    docsUrl: 'https://console.x.ai/',
    models: [
      { id: 'grok-4',      name: 'Grok 4',      reasoning: true,  contextWindow: 256000, maxTokens: 16384, input: ['text', 'image'], cost: { input: 3,   output: 15  } },
      { id: 'grok-3',      name: 'Grok 3',      reasoning: false, contextWindow: 131072, maxTokens: 8192,  input: ['text', 'image'], cost: { input: 3,   output: 15  } },
      { id: 'grok-3-mini', name: 'Grok 3 Mini', reasoning: true,  contextWindow: 131072, maxTokens: 8192,  input: ['text'],          cost: { input: 0.3, output: 0.5 } },
    ],
  },

  {
    id: 'mistral',
    name: 'Mistral AI',
    icon: '💨',
    api: 'openai-completions',
    baseUrl: 'https://api.mistral.ai/v1',
    envKeyName: 'MISTRAL_API_KEY',
    keyPlaceholder: '...',
    docsUrl: 'https://console.mistral.ai/api-keys',
    models: [
      { id: 'mistral-large-latest', name: 'Mistral Large 3',   reasoning: false, contextWindow: 131072, maxTokens: 16384, input: ['text', 'image'], cost: { input: 0.5, output: 1.5 } },
      { id: 'mistral-medium-3',     name: 'Mistral Medium 3',  reasoning: false, contextWindow: 131072, maxTokens: 16384, input: ['text', 'image'], cost: { input: 0.4, output: 2.0 } },
      { id: 'mistral-small-latest', name: 'Mistral Small 3.2', reasoning: false, contextWindow: 32768,  maxTokens: 8192,  input: ['text', 'image'], cost: { input: 0.1, output: 0.3 } },
    ],
  },

  {
    id: 'groq',
    name: 'Groq',
    icon: '🏎️',
    api: 'openai-completions',
    baseUrl: 'https://api.groq.com/openai/v1',
    envKeyName: 'GROQ_API_KEY',
    keyPlaceholder: 'gsk_...',
    keyPrefix: 'gsk_',
    docsUrl: 'https://console.groq.com/keys',
    models: [
      { id: 'llama-3.3-70b-versatile',       name: 'Llama 3.3 70B',        reasoning: false, contextWindow: 128000, maxTokens: 32768, input: ['text'], cost: { input: 0.59, output: 0.79 } },
      { id: 'deepseek-r1-distill-llama-70b', name: 'DeepSeek R1 Distill',  reasoning: true,  contextWindow: 128000, maxTokens: 16384, input: ['text'], cost: { input: 0.75, output: 0.99 } },
      { id: 'moonshotai/kimi-k2-instruct',   name: 'Kimi K2 (Groq)',       reasoning: false, contextWindow: 131072, maxTokens: 16384, input: ['text'], cost: { input: 0.75, output: 1.5  } },
    ],
  },

  {
    id: 'together',
    name: 'Together AI',
    icon: '🤝',
    api: 'openai-completions',
    baseUrl: 'https://api.together.xyz/v1',
    envKeyName: 'TOGETHER_API_KEY',
    keyPlaceholder: '...',
    docsUrl: 'https://api.together.ai/settings/api-keys',
    models: [
      { id: 'meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8', name: 'Llama 4 Maverick', reasoning: false, contextWindow: 1048576, maxTokens: 16384, input: ['text', 'image'], cost: { input: 0.15, output: 0.6  } },
      { id: 'deepseek-ai/DeepSeek-V3',                           name: 'DeepSeek-V3',      reasoning: false, contextWindow: 64000,   maxTokens: 8192,  input: ['text'],          cost: { input: 0.27, output: 1.1  } },
      { id: 'deepseek-ai/DeepSeek-R1',                           name: 'DeepSeek-R1',      reasoning: true,  contextWindow: 64000,   maxTokens: 8192,  input: ['text'],          cost: { input: 0.55, output: 2.19 } },
    ],
  },

  {
    id: 'perplexity',
    name: 'Perplexity AI',
    icon: '🔍',
    api: 'openai-completions',
    baseUrl: 'https://api.perplexity.ai',
    envKeyName: 'PERPLEXITY_API_KEY',
    keyPlaceholder: 'pplx-...',
    keyPrefix: 'pplx-',
    docsUrl: 'https://www.perplexity.ai/settings/api',
    models: [
      { id: 'sonar-pro',           name: 'Sonar Pro',           reasoning: false, contextWindow: 200000, maxTokens: 8192, input: ['text'], cost: { input: 3,   output: 15 } },
      { id: 'sonar',               name: 'Sonar',               reasoning: false, contextWindow: 127000, maxTokens: 8192, input: ['text'], cost: { input: 1,   output: 1  } },
      { id: 'sonar-reasoning-pro', name: 'Sonar Reasoning Pro', reasoning: true,  contextWindow: 128000, maxTokens: 8192, input: ['text'], cost: { input: 2,   output: 8  } },
    ],
  },

  {
    id: 'cohere',
    name: 'Cohere',
    icon: '🌀',
    api: 'openai-completions',
    baseUrl: 'https://api.cohere.ai/compatibility/v1',
    envKeyName: 'COHERE_API_KEY',
    keyPlaceholder: '...',
    docsUrl: 'https://dashboard.cohere.com/api-keys',
    models: [
      { id: 'command-a-03-2025',     name: 'Command A',   reasoning: false, contextWindow: 256000, maxTokens: 8192, input: ['text'], cost: { input: 2.5,  output: 10  } },
      { id: 'command-r-plus-08-2024', name: 'Command R+', reasoning: false, contextWindow: 128000, maxTokens: 4096, input: ['text'], cost: { input: 2.5,  output: 10  } },
      { id: 'command-r-08-2024',      name: 'Command R',  reasoning: false, contextWindow: 128000, maxTokens: 4096, input: ['text'], cost: { input: 0.15, output: 0.6 } },
    ],
  },

  {
    id: 'fireworks',
    name: 'Fireworks AI',
    icon: '🎆',
    api: 'openai-completions',
    baseUrl: 'https://api.fireworks.ai/inference/v1',
    envKeyName: 'FIREWORKS_API_KEY',
    keyPlaceholder: 'fw_...',
    keyPrefix: 'fw_',
    docsUrl: 'https://fireworks.ai/account/api-keys',
    models: [
      { id: 'accounts/fireworks/models/llama4-maverick-instruct-basic', name: 'Llama 4 Maverick', reasoning: false, contextWindow: 1048576, maxTokens: 16384, input: ['text', 'image'], cost: { input: 0.22, output: 0.88 } },
      { id: 'accounts/fireworks/models/deepseek-v3',                    name: 'DeepSeek-V3',      reasoning: false, contextWindow: 64000,   maxTokens: 8192,  input: ['text'],          cost: { input: 0.22, output: 0.88 } },
      { id: 'accounts/fireworks/models/deepseek-r1',                    name: 'DeepSeek-R1',      reasoning: true,  contextWindow: 64000,   maxTokens: 8192,  input: ['text'],          cost: { input: 3,    output: 8    } },
    ],
  },

  {
    id: 'openrouter',
    name: 'OpenRouter',
    icon: '🔀',
    api: 'openai-completions',
    baseUrl: 'https://openrouter.ai/api/v1',
    envKeyName: 'OPENROUTER_API_KEY',
    keyPlaceholder: 'sk-or-...',
    keyPrefix: 'sk-or-',
    docsUrl: 'https://openrouter.ai/keys',
    models: [
      { id: 'openrouter/auto', name: 'Auto (智能路由)', reasoning: false, contextWindow: 128000, maxTokens: 32000, input: ['text'], cost: { input: 0, output: 0 } },
    ],
  },

  // ─── Chinese providers ────────────────────────────────────────────────────

  {
    id: 'qwen',
    name: '通义千问 (Qwen)',
    icon: '☁️',
    api: 'openai-completions',
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    envKeyName: 'DASHSCOPE_API_KEY',
    keyPlaceholder: 'sk-...',
    docsUrl: 'https://dashscope.console.aliyun.com/apiKey',
    models: [
      { id: 'qwen-max',   name: 'Qwen Max',   reasoning: false, contextWindow: 32768,  maxTokens: 8192, input: ['text', 'image'], cost: { input: 2.4,  output: 9.6 } },
      { id: 'qwen-plus',  name: 'Qwen Plus',  reasoning: false, contextWindow: 131072, maxTokens: 8192, input: ['text', 'image'], cost: { input: 0.4,  output: 1.2 } },
      { id: 'qwen-turbo', name: 'Qwen Turbo', reasoning: false, contextWindow: 1000000, maxTokens: 8192, input: ['text'],          cost: { input: 0.05, output: 0.2 } },
    ],
  },

  {
    id: 'zhipu',
    name: '智谱 GLM',
    icon: '🧬',
    api: 'openai-completions',
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    envKeyName: 'ZHIPU_API_KEY',
    keyPlaceholder: '...',
    docsUrl: 'https://open.bigmodel.cn/usercenter/apikeys',
    models: [
      { id: 'glm-4.7',      name: 'GLM-4.7',       reasoning: false, contextWindow: 200000, maxTokens: 128000, input: ['text', 'image'], cost: { input: 0.6, output: 2.2 } },
      { id: 'glm-4-plus',   name: 'GLM-4 Plus',    reasoning: false, contextWindow: 128000, maxTokens: 4096,   input: ['text', 'image'], cost: { input: 0.7, output: 0.7 } },
      { id: 'glm-4-flash',  name: 'GLM-4 Flash',   reasoning: false, contextWindow: 128000, maxTokens: 4096,   input: ['text'],          cost: { input: 0,   output: 0   } },
    ],
  },

  {
    id: 'doubao',
    name: '豆包 (ByteDance)',
    icon: '🫘',
    api: 'openai-completions',
    baseUrl: 'https://ark.cn-beijing.volces.com/api/v3',
    envKeyName: 'ARK_API_KEY',
    keyPlaceholder: '...',
    docsUrl: 'https://console.volcengine.com/ark/region:ark+cn-beijing/apiKey',
    models: [
      { id: 'doubao-seed-1-6-250615', name: 'Doubao Seed 1.6', reasoning: true,  contextWindow: 131072, maxTokens: 16384, input: ['text', 'image'], cost: { input: 0.11,  output: 0.275 } },
      { id: 'doubao-pro-32k-241215',  name: 'Doubao Pro 32K',  reasoning: false, contextWindow: 32768,  maxTokens: 4096,  input: ['text'],          cost: { input: 0.11,  output: 0.275 } },
      { id: 'doubao-lite-32k-241215', name: 'Doubao Lite 32K', reasoning: false, contextWindow: 32768,  maxTokens: 4096,  input: ['text'],          cost: { input: 0.042, output: 0.042 } },
    ],
  },

  {
    id: 'ernie',
    name: '文心一言 (ERNIE)',
    icon: '🌊',
    api: 'openai-completions',
    baseUrl: 'https://qianfan.baidubce.com/v2',
    envKeyName: 'QIANFAN_API_KEY',
    keyPlaceholder: '...',
    docsUrl: 'https://console.bce.baidu.com/qianfan/ais/console/applicationConsole/application',
    models: [
      { id: 'ernie-4.5-turbo-128k', name: 'ERNIE 4.5 Turbo 128K', reasoning: false, contextWindow: 128000, maxTokens: 4096, input: ['text', 'image'], cost: { input: 0.11, output: 0.44 } },
      { id: 'ernie-x1-turbo-32k',   name: 'ERNIE X1 Turbo 32K',   reasoning: true,  contextWindow: 32768,  maxTokens: 4096, input: ['text'],          cost: { input: 0.28, output: 1.1  } },
      { id: 'ernie-4.5-8k',         name: 'ERNIE 4.5 8K',          reasoning: false, contextWindow: 8192,   maxTokens: 2048, input: ['text', 'image'], cost: { input: 0.55, output: 2.2  } },
    ],
  },

  {
    id: 'moonshot',
    name: 'Kimi (Moonshot)',
    icon: '🌙',
    api: 'openai-completions',
    baseUrl: 'https://api.moonshot.cn/v1',
    envKeyName: 'MOONSHOT_API_KEY',
    keyPlaceholder: 'sk-...',
    docsUrl: 'https://platform.moonshot.cn/console/api-keys',
    models: [
      { id: 'kimi-k2.5',      name: 'Kimi K2.5',      reasoning: false, contextWindow: 131072, maxTokens: 8192, input: ['text'], cost: { input: 1, output: 2 } },
      { id: 'kimi-k2-thinking', name: 'Kimi K2 Thinking', reasoning: true, contextWindow: 131072, maxTokens: 8192, input: ['text'], cost: { input: 1, output: 2 } },
    ],
  },

  {
    id: 'stepfun',
    name: '阶跃星辰 (StepFun)',
    icon: '🪜',
    api: 'openai-completions',
    baseUrl: 'https://api.stepfun.com/v1',
    envKeyName: 'STEPFUN_API_KEY',
    keyPlaceholder: '...',
    docsUrl: 'https://platform.stepfun.com/interface-key',
    models: [
      { id: 'step-3.5-flash', name: 'Step-3.5 Flash', reasoning: true,  contextWindow: 256000, maxTokens: 16384, input: ['text'], cost: { input: 0.1, output: 0.3  } },
      { id: 'step-2-16k',     name: 'Step-2 16K',     reasoning: false, contextWindow: 16384,  maxTokens: 4096,  input: ['text'], cost: { input: 4.8, output: 19.2 } },
      { id: 'step-1-8k',      name: 'Step-1 8K',      reasoning: false, contextWindow: 8192,   maxTokens: 2048,  input: ['text'], cost: { input: 0.48, output: 1.92 } },
    ],
  },

  {
    id: 'siliconflow',
    name: '硅基流动 (SiliconFlow)',
    icon: '🔬',
    api: 'openai-completions',
    baseUrl: 'https://api.siliconflow.cn/v1',
    envKeyName: 'SILICONFLOW_API_KEY',
    keyPlaceholder: 'sk-...',
    docsUrl: 'https://cloud.siliconflow.cn/account/ak',
    models: [
      { id: 'deepseek-ai/DeepSeek-V3',    name: 'DeepSeek-V3 (SF)',        reasoning: false, contextWindow: 64000, maxTokens: 8192, input: ['text'], cost: { input: 0.27, output: 1.1  } },
      { id: 'deepseek-ai/DeepSeek-R1',    name: 'DeepSeek-R1 (SF)',        reasoning: true,  contextWindow: 64000, maxTokens: 8192, input: ['text'], cost: { input: 0.5,  output: 2.18 } },
      { id: 'Qwen/Qwen3-235B-A22B',       name: 'Qwen3 235B-A22B (SF)',    reasoning: true,  contextWindow: 32768, maxTokens: 8192, input: ['text'], cost: { input: 1.26, output: 5.05 } },
    ],
  },

  {
    id: 'yi',
    name: '零一万物 (01.AI)',
    icon: '1️⃣',
    api: 'openai-completions',
    baseUrl: 'https://api.lingyiwanwu.com/v1',
    envKeyName: 'YI_API_KEY',
    keyPlaceholder: '...',
    docsUrl: 'https://platform.lingyiwanwu.com/apikeys',
    models: [
      { id: 'yi-lightning', name: 'Yi-Lightning', reasoning: false, contextWindow: 16384, maxTokens: 4096, input: ['text'], cost: { input: 0.14, output: 0.14 } },
      { id: 'yi-large',     name: 'Yi-Large',     reasoning: false, contextWindow: 32768, maxTokens: 4096, input: ['text'], cost: { input: 3,    output: 3    } },
    ],
  },

  {
    id: 'xiaomi',
    name: '小米 MiMo',
    icon: '🦞',
    api: 'openai-completions',
    baseUrl: 'https://api.xiaomimimo.com/v1',
    envKeyName: 'XIAOMI_API_KEY',
    keyPlaceholder: 'sk-...',
    docsUrl: 'https://platform.xiaomimimo.com/#/console/api-keys',
    models: [
      { id: 'mimo-v2-pro',   name: 'MiMo V2 Pro',   reasoning: true,  contextWindow: 1048576, maxTokens: 32000, input: ['text'],                   cost: { input: 1,   output: 3   } },
      { id: 'mimo-v2-flash', name: 'MiMo V2 Flash', reasoning: false, contextWindow: 262144,  maxTokens: 8192,  input: ['text'],                   cost: { input: 0.1, output: 0.3 } },
      { id: 'mimo-v2-omni',  name: 'MiMo V2 Omni',  reasoning: true,  contextWindow: 262144,  maxTokens: 8192,  input: ['text', 'image', 'audio'], cost: { input: 0.4, output: 2   } },
    ],
  },

  {
    id: 'minimax',
    name: 'MiniMax',
    icon: '⚡',
    api: 'anthropic-messages',
    baseUrl: 'https://api.minimax.io/anthropic',
    envKeyName: 'MINIMAX_API_KEY',
    keyPlaceholder: '...',
    docsUrl: 'https://platform.minimaxi.com/',
    models: [
      { id: 'MiniMax-M2.1', name: 'MiniMax M2.1', reasoning: false, contextWindow: 200000, maxTokens: 8192, input: ['text'], cost: { input: 0.5, output: 1.5 } },
    ],
  },
];
