/**
 * OpenAI-compatible streaming inference for cloud API models.
 * Supports single-model API mode and duo mode (reasoner + executor).
 */
import https from 'https'
import http from 'http'

export interface ApiModelConfig {
  provider: string
  baseUrl: string
  modelId: string
  apiKey: string
}

export interface ApiMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface DuoModelConfig {
  reasoner: { baseUrl: string; modelId: string; apiKey: string }
  executor: { baseUrl: string; modelId: string; apiKey: string }
}

export interface UsageStats {
  prompt:     number
  completion: number
  reasoning?: number
  cacheRead?: number
}

let apiConfig: ApiModelConfig | null = null
let duoConfig: DuoModelConfig | null = null
let apiHistory: ApiMessage[] = []
let systemPrompt = ''

export function setApiConfig(config: ApiModelConfig) {
  apiConfig = config
  duoConfig = null
  apiHistory = []
}

export function setDuoConfig(config: DuoModelConfig) {
  duoConfig = config
  apiConfig = null
  apiHistory = []
}

export function setApiSystemPrompt(prompt: string) {
  systemPrompt = prompt
  apiHistory = []
}

export function resetApiHistory() {
  apiHistory = []
}

export function isApiMode(): boolean {
  return apiConfig !== null
}

export function isDuoMode(): boolean {
  return duoConfig !== null
}

export function clearApiMode() {
  apiConfig = null
  duoConfig = null
  apiHistory = []
}

// ─── Low-level streaming ──────────────────────────────────────────────────────

function streamWithConfig(
  cfg: { baseUrl: string; modelId: string; apiKey: string },
  messages: ApiMessage[],
  onToken: (t: string) => void,
  onDone: (fullText: string, usage: UsageStats | null) => void,
  onError: (e: string) => void,
) {
  const body = JSON.stringify({
    model: cfg.modelId,
    messages,
    stream: true,
    stream_options: { include_usage: true },
    max_tokens: 4096,
    temperature: 0.6,
  })

  const url = new URL(`${cfg.baseUrl}/chat/completions`)
  const options = {
    hostname: url.hostname,
    port: url.port || (url.protocol === 'https:' ? 443 : 80),
    path: url.pathname + url.search,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${cfg.apiKey}`,
      'Accept': 'text/event-stream',
      'Content-Length': Buffer.byteLength(body),
    },
  }

  const mod = url.protocol === 'https:' ? https : http
  let fullText = ''
  let usage: UsageStats | null = null

  const req = mod.request(options, (res) => {
    if (res.statusCode && res.statusCode >= 400) {
      let err = ''
      res.on('data', (d: Buffer) => { err += d.toString() })
      res.on('end', () => onError(`${res.statusCode}: ${err.slice(0, 300)}`))
      return
    }

    let buf = ''
    res.on('data', (chunk: Buffer) => {
      buf += chunk.toString()
      const lines = buf.split('\n')
      buf = lines.pop() ?? ''
      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed.startsWith('data:')) continue
        const data = trimmed.slice(5).trim()
        if (data === '[DONE]') continue
        try {
          const parsed = JSON.parse(data)
          const token = parsed.choices?.[0]?.delta?.content
          if (token) { fullText += token; onToken(token) }
          if (parsed.usage) {
            usage = {
              prompt:     parsed.usage.prompt_tokens     ?? 0,
              completion: parsed.usage.completion_tokens  ?? 0,
              reasoning:  parsed.usage.completion_tokens_details?.reasoning_tokens ?? 0,
              cacheRead:  parsed.usage.prompt_tokens_details?.cached_tokens ?? 0,
            }
          }
        } catch { /* partial JSON */ }
      }
    })

    res.on('end', () => onDone(fullText, usage))
    res.on('error', (e: Error) => onError(e.message))
  })

  req.on('error', (e: Error) => onError(e.message))
  req.write(body)
  req.end()
}

// ─── Single-model streaming ───────────────────────────────────────────────────

export function streamApiChat(
  userMessage: string,
  onToken: (t: string) => void,
  onDone: (usage: UsageStats | null) => void,
  onError: (e: string) => void,
) {
  if (!apiConfig) { onError('No API config'); return }

  apiHistory.push({ role: 'user', content: userMessage })
  const messages: ApiMessage[] = [
    ...(systemPrompt ? [{ role: 'system' as const, content: systemPrompt }] : []),
    ...apiHistory,
  ]

  streamWithConfig(apiConfig, messages, onToken, (text, usage) => {
    apiHistory.push({ role: 'assistant', content: text })
    onDone(usage)
  }, onError)
}

// ─── Duo mode: reasoner → executor ────────────────────────────────────────────

const REASONER_SYSTEM = `You are a reasoning engine working in a two-model pipeline.
Your job: analyze the user request and produce a clear, concise plan.
Think through what files need to be read, what changes to make, and in what order.
Be direct. No fluff. Your output goes directly to a coding model that will execute it.`

export function streamDuoChat(
  userMessage: string,
  onThinkToken: (t: string) => void,
  onThinkDone: () => void,
  onToken: (t: string) => void,
  onDone: (usage: UsageStats | null) => void,
  onError: (e: string) => void,
) {
  if (!duoConfig) { onError('No duo config'); return }
  const duo = duoConfig

  let reasoning = ''

  // Step 1: Reasoner streams its analysis
  streamWithConfig(
    duo.reasoner,
    [
      { role: 'system', content: REASONER_SYSTEM },
      { role: 'user', content: userMessage },
    ],
    (t) => { reasoning += t; onThinkToken(t) },
    (_text, _usage) => {
      onThinkDone()

      // Step 2: Executor gets the reasoning as context + original request
      const enrichedMessage = reasoning.trim()
        ? `[Reasoning]\n${reasoning.trim()}\n\n---\n\n${userMessage}`
        : userMessage

      apiHistory.push({ role: 'user', content: enrichedMessage })
      const messages: ApiMessage[] = [
        ...(systemPrompt ? [{ role: 'system' as const, content: systemPrompt }] : []),
        ...apiHistory,
      ]

      streamWithConfig(duo.executor, messages, onToken, (text, usage) => {
        apiHistory.push({ role: 'assistant', content: text })
        onDone(usage)
      }, onError)
    },
    onError,
  )
}

export async function quickApiCall(prompt: string): Promise<string> {
  const cfg = apiConfig ?? (duoConfig ? duoConfig.executor : null)
  if (!cfg) throw new Error('No API config')
  return new Promise((resolve, reject) => {
    streamWithConfig(
      cfg,
      [{ role: 'user', content: prompt }],
      () => {},
      (text) => resolve(text),
      (e) => reject(new Error(e)),
    )
  })
}
