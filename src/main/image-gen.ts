/**
 * Image generation via stable-diffusion.cpp with Metal (Mac M1) acceleration.
 * Manages binary download, model/LoRA storage, and subprocess execution.
 */
import { app } from 'electron'
import { existsSync, mkdirSync, createWriteStream, chmodSync, readdirSync } from 'fs'
import { join, basename } from 'path'
import { spawn } from 'child_process'
import https from 'https'
import http from 'http'

// ─── Paths ────────────────────────────────────────────────────────────────────

const userData      = app.getPath('userData')
export const SD_BIN_DIR   = join(userData, 'sd-bin')
export const IMG_MODEL_DIR = join(userData, 'image-models')
export const LORA_DIR     = join(userData, 'loras')
export const IMG_OUT_DIR  = join(userData, 'image-output')

for (const d of [SD_BIN_DIR, IMG_MODEL_DIR, LORA_DIR, IMG_OUT_DIR]) {
  if (!existsSync(d)) mkdirSync(d, { recursive: true })
}

const SD_BIN = join(SD_BIN_DIR, process.platform === 'win32' ? 'sd.exe' : 'sd')

// ─── Binary management ────────────────────────────────────────────────────────

function fetchJson<T = any>(url: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http
    mod.get(url, { headers: { 'User-Agent': 'local-ai/1.0', 'Accept': 'application/json' } }, res => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        fetchJson<T>(res.headers.location).then(resolve).catch(reject); return
      }
      let data = ''; res.setEncoding('utf-8')
      res.on('data', (c: string) => { data += c })
      res.on('end', () => { try { resolve(JSON.parse(data)) } catch (e) { reject(e) } })
      res.on('error', reject)
    }).on('error', reject)
  })
}

function downloadFile(url: string, dest: string, onProgress?: (p: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http
    mod.get(url, { headers: { 'User-Agent': 'local-ai/1.0' } }, res => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        downloadFile(res.headers.location, dest, onProgress).then(resolve).catch(reject); return
      }
      const total = Number(res.headers['content-length'] || 0)
      let received = 0
      const file = createWriteStream(dest)
      res.on('data', (chunk: Buffer) => {
        received += chunk.length
        file.write(chunk)
        if (onProgress && total > 0) onProgress(received / total)
      })
      res.on('end', () => file.end(resolve))
      res.on('error', (e: Error) => { file.destroy(); reject(e) })
    }).on('error', reject)
  })
}

export function isBinReady(): boolean {
  return existsSync(SD_BIN)
}

/** Fetch the latest sd.cpp release and return the correct asset URL for this platform/arch */
export async function getLatestBinUrl(): Promise<{ url: string; name: string }> {
  const release = await fetchJson('https://api.github.com/repos/leejet/stable-diffusion.cpp/releases/latest')
  const assets: any[] = release.assets || []

  const platform = process.platform  // darwin | win32
  const arch     = process.arch      // arm64 | x64

  const pattern =
    platform === 'darwin' && arch === 'arm64' ? 'osx-arm64' :
    platform === 'darwin'                      ? 'osx-x64'  :
    platform === 'win32'                       ? 'win32-x64' :
                                                 'linux-x64'

  const asset = assets.find((a: any) => a.name.includes(pattern) && a.name.endsWith('.zip'))
  if (!asset) throw new Error(`No prebuilt binary found for ${platform}-${arch}`)
  return { url: asset.browser_download_url, name: asset.name }
}

export async function downloadBinary(
  onProgress: (p: number) => void
): Promise<void> {
  const { url, name } = await getLatestBinUrl()
  const zipPath = join(SD_BIN_DIR, name)

  onProgress(0)
  await downloadFile(url, zipPath, onProgress)

  // Extract zip — use system unzip (available on macOS & most Linux; tar on Windows)
  await new Promise<void>((resolve, reject) => {
    const args = process.platform === 'win32'
      ? ['Expand-Archive', '-Path', zipPath, '-DestinationPath', SD_BIN_DIR, '-Force']
      : ['-o', zipPath, '-d', SD_BIN_DIR]
    const cmd  = process.platform === 'win32' ? 'powershell' : 'unzip'
    const proc = spawn(cmd, args, { stdio: 'ignore' })
    proc.on('close', code => code === 0 ? resolve() : reject(new Error(`unzip exited ${code}`)))
    proc.on('error', reject)
  })

  // Find the actual sd binary (it may be nested inside build/bin/)
  const candidates = [
    join(SD_BIN_DIR, 'sd'),
    join(SD_BIN_DIR, 'build', 'bin', 'sd'),
    join(SD_BIN_DIR, 'bin', 'sd'),
  ]
  for (const c of candidates) {
    if (existsSync(c)) {
      const { renameSync } = require('fs')
      if (c !== SD_BIN) renameSync(c, SD_BIN)
      chmodSync(SD_BIN, 0o755)
      break
    }
  }
}

// ─── LoRA scanner ─────────────────────────────────────────────────────────────

export function scanLoras(): string[] {
  if (!existsSync(LORA_DIR)) return []
  return readdirSync(LORA_DIR).filter(f => f.endsWith('.safetensors') || f.endsWith('.pt') || f.endsWith('.ckpt'))
}

export function scanImageModels(): string[] {
  if (!existsSync(IMG_MODEL_DIR)) return []
  return readdirSync(IMG_MODEL_DIR).filter(f => f.endsWith('.safetensors') || f.endsWith('.ckpt') || f.endsWith('.gguf'))
}

// ─── Generation ───────────────────────────────────────────────────────────────

export interface GenParams {
  modelFile:    string                        // filename inside IMG_MODEL_DIR
  prompt:       string
  negPrompt:    string
  width:        number
  height:       number
  steps:        number
  cfgScale:     number
  seed:         number                        // -1 = random
  loras:        { file: string; weight: number }[]
  outputFile:   string                        // full path
}

export interface GenProgress {
  step:    number
  total:   number
  percent: number
  eta?:    string
}

let activeProc: ReturnType<typeof spawn> | null = null

export function cancelGeneration() {
  if (activeProc) { activeProc.kill(); activeProc = null }
}

export function generate(
  params: GenParams,
  onProgress: (p: GenProgress) => void,
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!existsSync(SD_BIN)) { reject(new Error('sd binary not found — download it first')); return }

    const modelPath = join(IMG_MODEL_DIR, params.modelFile)
    if (!existsSync(modelPath)) { reject(new Error(`Model not found: ${params.modelFile}`)); return }

    const args = [
      '-m', modelPath,
      '--prompt', params.prompt,
      '--negative-prompt', params.negPrompt,
      '-W', String(params.width),
      '-H', String(params.height),
      '--steps', String(params.steps),
      '--cfg-scale', String(params.cfgScale),
      '--seed', String(params.seed),
      '-o', params.outputFile,
      '--verbose',
    ]

    // Metal acceleration on macOS
    if (process.platform === 'darwin') args.push('-ngl', '1')

    // LoRAs
    if (params.loras.length > 0) {
      args.push('--lora-model-dir', LORA_DIR)
      for (const l of params.loras) {
        // sd.cpp accepts: <name>:<weight>  (name without extension)
        const loraName = l.file.replace(/\.(safetensors|pt|ckpt)$/, '')
        args.push('--lora', `${loraName}:${l.weight}`)
      }
    }

    const proc = spawn(SD_BIN, args)
    activeProc = proc

    // Parse progress from stderr: "  |================    | 14/20 - 1.23s/it"
    const stepRe = /(\d+)\/(\d+)/
    proc.stderr.on('data', (data: Buffer) => {
      const line = data.toString()
      const m = stepRe.exec(line)
      if (m) {
        const step = parseInt(m[1]), total = parseInt(m[2])
        onProgress({ step, total, percent: Math.round((step / total) * 100) })
      }
    })
    proc.stdout.on('data', (d: Buffer) => {
      const line = d.toString()
      const m = stepRe.exec(line)
      if (m) {
        const step = parseInt(m[1]), total = parseInt(m[2])
        onProgress({ step, total, percent: Math.round((step / total) * 100) })
      }
    })

    proc.on('close', code => {
      activeProc = null
      if (code === 0 && existsSync(params.outputFile)) resolve(params.outputFile)
      else reject(new Error(`Generation failed (exit ${code})`))
    })
    proc.on('error', e => { activeProc = null; reject(e) })
  })
}
