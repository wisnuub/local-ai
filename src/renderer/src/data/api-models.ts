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
    keyUrl: 'https://openrouter.ai', free: true, badge: 'Free',
    description: 'DeepSeek R1 full reasoning model via OpenRouter free tier.',
  },
  {
    id: 'openrouter-gemma', name: 'Gemma 3 27B', provider: 'openrouter',
    modelId: 'google/gemma-3-27b-it:free', baseUrl: 'https://openrouter.ai/api/v1',
    keyUrl: 'https://openrouter.ai', free: true, badge: 'Free',
    description: "Google's Gemma 3 27B via OpenRouter free tier.",
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
      { id: 'meta-llama/llama-3.3-70b-instruct:free', name: 'Llama 3.3 70B',   description: 'Free tier' },
      { id: 'deepseek/deepseek-r1:free',               name: 'DeepSeek R1',     description: 'Free tier' },
      { id: 'google/gemma-3-27b-it:free',              name: 'Gemma 3 27B',     description: 'Free tier' },
      { id: 'anthropic/claude-3.5-sonnet',             name: 'Claude 3.5 Sonnet', description: 'Paid' },
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
]
