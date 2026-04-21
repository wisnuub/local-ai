export interface ModelDef {
  id: string
  name: string
  description: string
  params: string
  sizeGb: number
  ramGb: number            // minimum RAM needed to run this model
  categories: string[]
  repo: string
  filename: string
  url: string
  tags: string[]
  capabilities?: string[]  // 'thinking' | 'coding' | 'tools' | 'vision'
}

export interface LocalModel {
  filename: string
  path: string
  size: number
}

export interface DownloadEntry {
  filename: string
  modelName: string
  status: 'downloading' | 'paused' | 'done' | 'error'
  received: number
  total: number
  speed: number        // bytes/sec
  error?: string
}

export type ToolName = 'read_file' | 'write_file' | 'run_shell' | 'list_dir' | 'patch_file'

export interface ToolCall {
  id: string
  tool: ToolName
  args: Record<string, string>
  status: 'pending-permission' | 'running' | 'done' | 'denied'
  result?: string
  error?: string
}

export interface TodoItem {
  id: string
  text: string
  done: boolean
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system' | 'planner' | 'executor'
  content: string
  toolCalls?: ToolCall[]
  todos?: TodoItem[]
  streaming?: boolean
  thinkContent?: string    // legacy: duo mode think content stored on assistant msg
  usage?: { prompt: number; completion: number; reasoning?: number }
  error?: string
}

export interface DiffFile {
  path: string
  added: number
  removed: number
  hunks: string   // raw unified diff for this file
}
