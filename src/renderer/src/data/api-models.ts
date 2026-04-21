export interface ApiModelDef {
  id:          string
  name:        string
  provider:    string
  modelId:     string
  baseUrl:     string
  keyUrl:      string
  free:        boolean
  description: string
  badge:       string
  role?:       'both' | 'reasoner' | 'executor'  // omit = 'both'
}

export interface ProviderDef {
  id:          string
  name:        string
  icon:        string
  description: string
  keyLabel:    string
  keyUrl:      string
  placeholder: string
  baseUrl:     string
  models:      { id: string; name: string; description: string }[]
}

// Truly free models — just need a free API key (no credit card)
export const FREE_MODELS: ApiModelDef[] = [
  {
    id: 'groq-llama-70b', name: 'Llama 3.3 70B', provider: 'groq',
    modelId: 'llama-3.3-70b-versatile', baseUrl: 'https://api.groq.com/openai/v1',
    keyUrl: 'https://console.groq.com', free: true, badge: 'Free · 280 t/s',
    description: 'Best for coding and agents. Follows tool instructions reliably.',
  },
  {
    id: 'groq-llama4-scout', name: 'Llama 4 Scout 17B', provider: 'groq',
    modelId: 'meta-llama/llama-4-scout-17b-16e-instruct', baseUrl: 'https://api.groq.com/openai/v1',
    keyUrl: 'https://console.groq.com', free: true, badge: 'Free · 750 t/s',
    description: "Meta's newest model. Very fast with strong coding ability.",
  },
  {
    id: 'groq-qwen3-32b', name: 'Qwen3 32B', provider: 'groq',
    modelId: 'qwen/qwen3-32b', baseUrl: 'https://api.groq.com/openai/v1',
    keyUrl: 'https://console.groq.com', free: true, badge: 'Free · 400 t/s',
    description: "Alibaba's Qwen3 32B. Excellent reasoning and code generation.",
  },
  {
    id: 'groq-gpt-oss-120b', name: 'GPT OSS 120B', provider: 'groq',
    modelId: 'openai/gpt-oss-120b', baseUrl: 'https://api.groq.com/openai/v1',
    keyUrl: 'https://console.groq.com', free: true, badge: 'Free · 500 t/s',
    description: "OpenAI's open-weight 120B. Built-in search and code execution.",
  },
  {
    id: 'groq-gpt-oss-20b', name: 'GPT OSS 20B', provider: 'groq',
    modelId: 'openai/gpt-oss-20b', baseUrl: 'https://api.groq.com/openai/v1',
    keyUrl: 'https://console.groq.com', free: true, badge: 'Free · 1000 t/s',
    description: 'Fastest model on Groq. 1000 t/s — near-instant for quick edits.',
  },
  {
    id: 'groq-llama-8b', name: 'Llama 3.1 8B', provider: 'groq',
    modelId: 'llama-3.1-8b-instant', baseUrl: 'https://api.groq.com/openai/v1',
    keyUrl: 'https://console.groq.com', free: true, badge: 'Free · 560 t/s',
    description: 'Lightweight and very fast. Good for simple questions and edits.',
  },
  {
    id: 'openrouter-llama', name: 'Llama 3.3 70B', provider: 'openrouter',
    modelId: 'meta-llama/llama-3.3-70b-instruct:free', baseUrl: 'https://openrouter.ai/api/v1',
    keyUrl: 'https://openrouter.ai', free: true, badge: 'Free',
    description: 'Llama 70B via OpenRouter free tier. No credit card needed.',
  },
  {
    id: 'openrouter-deepseek', name: 'DeepSeek R1', provider: 'openrouter',
    modelId: 'deepseek/deepseek-r1:free', baseUrl: 'https://openrouter.ai/api/v1',
    keyUrl: 'https://openrouter.ai', free: true, badge: 'Free', role: 'reasoner',
    description: 'DeepSeek R1 full reasoning model. Best as a thinker in Duo Mode.',
  },
  {
    id: 'openrouter-gemma', name: 'Gemma 3 27B', provider: 'openrouter',
    modelId: 'google/gemma-3-27b-it:free', baseUrl: 'https://openrouter.ai/api/v1',
    keyUrl: 'https://openrouter.ai', free: true, badge: 'Free',
    description: "Google's Gemma 3 27B via OpenRouter free tier.",
  },
  {
    id: 'openrouter-nemotron', name: 'Nemotron Super 49B', provider: 'openrouter',
    modelId: 'nvidia/llama-3.3-nemotron-super-49b-v1:free', baseUrl: 'https://openrouter.ai/api/v1',
    keyUrl: 'https://openrouter.ai', free: true, badge: 'Free', role: 'reasoner',
    description: "NVIDIA's Nemotron. Exceptional planner — use as Reasoner in Duo Mode with a Groq executor.",
  },
  {
    id: 'nvidia-nemotron-nano', name: 'Nemotron Nano 8B', provider: 'nvidia',
    modelId: 'nvidia/llama-3.1-nemotron-nano-8b-v1', baseUrl: 'https://integrate.api.nvidia.com/v1',
    keyUrl: 'https://build.nvidia.com', free: true, badge: 'Free credits', role: 'reasoner',
    description: "NVIDIA's Nemotron Nano 8B. Best as Reasoner in Duo Mode. Free credits on NVIDIA NIM.",
  },
  {
    id: 'nvidia-nemotron-super', name: 'Nemotron Super 49B', provider: 'nvidia',
    modelId: 'nvidia/llama-3.3-nemotron-super-49b-v1', baseUrl: 'https://integrate.api.nvidia.com/v1',
    keyUrl: 'https://build.nvidia.com', free: true, badge: 'Free credits', role: 'reasoner',
    description: "NVIDIA's flagship Nemotron. Outstanding planner — pair with a fast Groq model as executor.",
  },
]

export const PROVIDERS: ProviderDef[] = [
  {
    id: 'groq', name: 'Groq', icon: '⚡', description: 'Ultra-fast inference — free tier available',
    keyLabel: 'Groq API Key', keyUrl: 'https://console.groq.com', placeholder: 'gsk_...',
    baseUrl: 'https://api.groq.com/openai/v1',
    models: [
      { id: 'llama-3.3-70b-versatile',                     name: 'Llama 3.3 70B',        description: '280 t/s · best for agents' },
      { id: 'meta-llama/llama-4-scout-17b-16e-instruct',   name: 'Llama 4 Scout 17B',    description: '750 t/s · newest Meta model' },
      { id: 'qwen/qwen3-32b',                              name: 'Qwen3 32B',            description: '400 t/s · strong reasoning' },
      { id: 'openai/gpt-oss-120b',                         name: 'GPT OSS 120B',         description: '500 t/s · OpenAI open-weight' },
      { id: 'openai/gpt-oss-20b',                          name: 'GPT OSS 20B',          description: '1000 t/s · fastest' },
      { id: 'llama-3.1-8b-instant',                        name: 'Llama 3.1 8B',         description: '560 t/s · lightweight' },
    ],
  },
  {
    id: 'openrouter', name: 'OpenRouter', icon: '🔀', description: 'Access hundreds of models, many free',
    keyLabel: 'OpenRouter API Key', keyUrl: 'https://openrouter.ai', placeholder: 'sk-or-...',
    baseUrl: 'https://openrouter.ai/api/v1',
    models: [
      { id: 'meta-llama/llama-3.3-70b-instruct:free',        name: 'Llama 3.3 70B',      description: 'Free tier' },
      { id: 'nvidia/llama-3.3-nemotron-super-49b-v1:free',   name: 'Nemotron Super 49B', description: 'Free tier · NVIDIA' },
      { id: 'deepseek/deepseek-r1:free',                     name: 'DeepSeek R1',        description: 'Free tier · reasoning' },
      { id: 'google/gemma-3-27b-it:free',                    name: 'Gemma 3 27B',        description: 'Free tier' },
      { id: 'anthropic/claude-3.5-sonnet',                   name: 'Claude 3.5 Sonnet',  description: 'Paid' },
    ],
  },
  {
    id: 'nvidia', name: 'NVIDIA NIM', icon: '⬡', description: 'Nemotron & NVIDIA models — free credits',
    keyLabel: 'NVIDIA API Key', keyUrl: 'https://build.nvidia.com', placeholder: 'nvapi-...',
    baseUrl: 'https://integrate.api.nvidia.com/v1',
    models: [
      { id: 'nvidia/llama-3.3-nemotron-super-49b-v1',  name: 'Nemotron Super 49B', description: 'Best reasoning + instruction' },
      { id: 'nvidia/llama-3.1-nemotron-nano-8b-v1',    name: 'Nemotron Nano 8B',   description: 'Fast, compact' },
      { id: 'meta/llama-3.1-70b-instruct',             name: 'Llama 3.1 70B',      description: 'Strong general model' },
      { id: 'mistralai/mistral-nemo-12b-instruct',     name: 'Mistral NeMo 12B',   description: 'Efficient 12B model' },
    ],
  },
  {
    id: 'anthropic', name: 'Anthropic', icon: 'A',  description: 'Direct access to Claude models',
    keyLabel: 'Anthropic API Key', keyUrl: 'https://console.anthropic.com', placeholder: 'sk-ant-...',
    baseUrl: 'https://api.anthropic.com/v1',
    models: [
      { id: 'claude-sonnet-4-5',   name: 'Claude Sonnet 4.5', description: 'Best balance' },
      { id: 'claude-opus-4-5',     name: 'Claude Opus 4.5',   description: 'Most capable' },
      { id: 'claude-haiku-4-5-20251001', name: 'Claude Haiku 4.5', description: 'Fastest' },
    ],
  },
  {
    id: 'openai', name: 'OpenAI', icon: '◯', description: 'GPT-4o, o1, and more',
    keyLabel: 'OpenAI API Key', keyUrl: 'https://platform.openai.com', placeholder: 'sk-...',
    baseUrl: 'https://api.openai.com/v1',
    models: [
      { id: 'gpt-4o',       name: 'GPT-4o',       description: 'Best overall' },
      { id: 'gpt-4o-mini',  name: 'GPT-4o Mini',  description: 'Fast + cheap' },
      { id: 'o1-mini',      name: 'o1-mini',       description: 'Reasoning' },
    ],
  },
  {
    id: 'google', name: 'Google', icon: 'G', description: 'Gemini Pro and Flash',
    keyLabel: 'Google AI API Key', keyUrl: 'https://aistudio.google.com', placeholder: 'AIza...',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
    models: [
      { id: 'gemini-2.0-flash',  name: 'Gemini 2.0 Flash', description: 'Fast + capable' },
      { id: 'gemini-1.5-pro',    name: 'Gemini 1.5 Pro',   description: 'Long context' },
    ],
  },
  {
    id: 'qwen', name: 'Qwen (Alibaba)', icon: '🟧', description: 'qwen-max, qwen-plus, 1M context models',
    keyLabel: 'DashScope API Key', keyUrl: 'https://qwen.ai/apiplatform', placeholder: 'sk-...',
    baseUrl: 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1',
    models: [
      { id: 'qwen-max',                  name: 'Qwen Max',             description: '32K ctx · most capable' },
      { id: 'qwen-plus',                 name: 'Qwen Plus',            description: '131K ctx · balanced' },
      { id: 'qwen-turbo',                name: 'Qwen Turbo',           description: '1M ctx · fast + cheap' },
      { id: 'qwen2.5-72b-instruct',      name: 'Qwen 2.5 72B',        description: '128K ctx · open weight' },
      { id: 'qwen2.5-coder-32b-instruct',name: 'Qwen 2.5 Coder 32B', description: '128K ctx · coding specialist' },
      { id: 'qwen3-235b-a22b',           name: 'Qwen3 235B MoE',      description: '131K ctx · flagship MoE' },
    ],
  },
  {
    id: 'mistral', name: 'Mistral AI', icon: '🌬', description: 'Mistral Large, Codestral, and more',
    keyLabel: 'Mistral API Key', keyUrl: 'https://console.mistral.ai', placeholder: '...',
    baseUrl: 'https://api.mistral.ai/v1',
    models: [
      { id: 'mistral-large-latest',  name: 'Mistral Large',   description: '128K ctx · most capable' },
      { id: 'mistral-small-latest',  name: 'Mistral Small',   description: '32K ctx · fast + cheap' },
      { id: 'codestral-latest',      name: 'Codestral',       description: '256K ctx · coding specialist' },
      { id: 'mistral-nemo',          name: 'Mistral NeMo 12B',description: '128K ctx · open weight' },
      { id: 'open-mixtral-8x22b',    name: 'Mixtral 8×22B',   description: '65K ctx · MoE powerhouse' },
    ],
  },
  {
    id: 'minimax', name: 'MiniMax', icon: '⬡', description: 'MiniMax M2 — 200K context window',
    keyLabel: 'MiniMax API Key', keyUrl: 'https://platform.minimax.io', placeholder: 'eyJ...',
    baseUrl: 'https://api.minimax.io/v1',
    models: [
      { id: 'MiniMax-M2.7',            name: 'MiniMax M2.7',            description: '200K ctx · flagship' },
      { id: 'MiniMax-M2.7-highspeed',  name: 'MiniMax M2.7 Highspeed',  description: '200K ctx · faster' },
      { id: 'MiniMax-M2.5',            name: 'MiniMax M2.5',            description: '200K ctx · balanced' },
      { id: 'MiniMax-M2.5-highspeed',  name: 'MiniMax M2.5 Highspeed',  description: '200K ctx · fast' },
    ],
  },
]
