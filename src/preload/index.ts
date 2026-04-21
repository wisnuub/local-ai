import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const api = {
  getSystemRam:    () => ipcRenderer.invoke('os:ram'),
  getModelsDir:    () => ipcRenderer.invoke('models:dir'),
  listLocalModels: () => ipcRenderer.invoke('models:list-local'),
  deleteModel:     (filename: string) => ipcRenderer.invoke('models:delete', filename),
  downloadModel:   (url: string, filename: string) => ipcRenderer.send('models:download', { url, filename }),
  pauseDownload:   (filename: string) => ipcRenderer.invoke('models:pause', filename),
  resumeDownload:  (filename: string) => ipcRenderer.invoke('models:resume', filename),
  cancelDownload:  (filename: string) => ipcRenderer.invoke('models:cancel', filename),
  loadModel:       (filename: string) => ipcRenderer.invoke('models:load', filename),
  chatInit:        (systemPrompt: string) => ipcRenderer.invoke('chat:init', systemPrompt),
  chatSetApi:      (cfg: { provider: string; baseUrl: string; modelId: string; apiKey: string }) => ipcRenderer.invoke('chat:set-api', cfg),
  chatClearApi:    ()                     => ipcRenderer.invoke('chat:clear-api'),
  chatResetHistory:()                     => ipcRenderer.invoke('chat:reset-history'),
  chatSetDuo:      (cfg: { reasoner: any; executor: any }) => ipcRenderer.invoke('chat:set-duo', cfg),
  chatClearDuo:    ()                     => ipcRenderer.invoke('chat:clear-duo'),

  onDownloadProgress: (cb: (d: any) => void) => { ipcRenderer.on('models:download-progress', (_e, d) => cb(d)); return () => ipcRenderer.removeAllListeners('models:download-progress') },
  onDownloadDone:     (cb: (d: any) => void) => { ipcRenderer.on('models:download-done',     (_e, d) => cb(d)); return () => ipcRenderer.removeAllListeners('models:download-done') },
  onDownloadError:    (cb: (d: any) => void) => { ipcRenderer.on('models:download-error',    (_e, d) => cb(d)); return () => ipcRenderer.removeAllListeners('models:download-error') },

  sendMessage: (message: string) => ipcRenderer.send('chat:send', { message }),
  onChatToken:      (cb: (t: string) => void) => { ipcRenderer.on('chat:token',       (_e, t) => cb(t)); return () => ipcRenderer.removeAllListeners('chat:token') },
  chatQuick:        (prompt: string)           => ipcRenderer.invoke('chat:quick', prompt),
  onChatDone:       (cb: (d: { usage?: any }) => void) => { ipcRenderer.on('chat:done', (_e, d) => cb(d ?? {})); return () => ipcRenderer.removeAllListeners('chat:done') },
  onChatError:      (cb: (e: string) => void) => { ipcRenderer.on('chat:error',       (_e, e) => cb(e)); return () => ipcRenderer.removeAllListeners('chat:error') },
  onChatThinkToken: (cb: (t: string) => void) => { ipcRenderer.on('chat:think-token', (_e, t) => cb(t)); return () => ipcRenderer.removeAllListeners('chat:think-token') },
  onChatThinkDone:  (cb: () => void)          => { ipcRenderer.on('chat:think-done',  cb);               return () => ipcRenderer.removeAllListeners('chat:think-done') },

  readFile:   (path: string)                        => ipcRenderer.invoke('tool:read-file', path),
  writeFile:  (path: string, content: string)       => ipcRenderer.invoke('tool:write-file', { path, content }),
  runShell:   (command: string, cwd: string)        => ipcRenderer.invoke('tool:run-shell', { command, cwd }),
  listDir:    (path: string)                        => ipcRenderer.invoke('tool:list-dir', path),
  openFolder:       ()                                          => ipcRenderer.invoke('dialog:open-folder'),
  connectorSearch:  (connectors: string[], query: string)       => ipcRenderer.invoke('connectors:search', { connectors, query }),

  imgCheckBin:      ()                                          => ipcRenderer.invoke('img:check-bin'),
  imgScanModels:    ()                                          => ipcRenderer.invoke('img:scan-models'),
  imgScanLoras:     ()                                          => ipcRenderer.invoke('img:scan-loras'),
  imgCancel:        ()                                          => ipcRenderer.invoke('img:cancel'),
  imgOpenLoraDir:   ()                                          => ipcRenderer.invoke('img:open-lora-dir'),
  imgDownloadBin:   ()                                          => ipcRenderer.send('img:download-bin'),
  imgDownloadModel: (url: string, filename: string)             => ipcRenderer.send('img:download-model', { url, filename }),
  imgGenerate:      (params: any)                               => ipcRenderer.send('img:generate', params),

  onImgProgress:      (cb: (p: any) => void) => { ipcRenderer.on('img:progress',      (_e, p) => cb(p)); return () => ipcRenderer.removeAllListeners('img:progress') },
  onImgDone:          (cb: (d: any) => void) => { ipcRenderer.on('img:done',          (_e, d) => cb(d)); return () => ipcRenderer.removeAllListeners('img:done') },
  onImgError:         (cb: (e: string) => void) => { ipcRenderer.on('img:error',      (_e, e) => cb(e)); return () => ipcRenderer.removeAllListeners('img:error') },
  onImgBinProgress:   (cb: (p: any) => void) => { ipcRenderer.on('img:bin-progress',  (_e, p) => cb(p)); return () => ipcRenderer.removeAllListeners('img:bin-progress') },
  onImgBinDone:       (cb: () => void)       => { ipcRenderer.on('img:bin-done',      cb);               return () => ipcRenderer.removeAllListeners('img:bin-done') },
  onImgBinError:      (cb: (e: string) => void) => { ipcRenderer.on('img:bin-error',  (_e, e) => cb(e)); return () => ipcRenderer.removeAllListeners('img:bin-error') },
  onImgModelProgress: (cb: (p: any) => void) => { ipcRenderer.on('img:model-progress',(_e, p) => cb(p)); return () => ipcRenderer.removeAllListeners('img:model-progress') },
  onImgModelDone:     (cb: (d: any) => void) => { ipcRenderer.on('img:model-done',    (_e, d) => cb(d)); return () => ipcRenderer.removeAllListeners('img:model-done') },
  onImgModelError:    (cb: (d: any) => void) => { ipcRenderer.on('img:model-error',   (_e, d) => cb(d)); return () => ipcRenderer.removeAllListeners('img:model-error') },
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (e) { console.error(e) }
} else {
  ;(window as any).electron = electronAPI
  ;(window as any).api = api
}
