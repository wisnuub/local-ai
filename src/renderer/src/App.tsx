import { useState, useEffect, useCallback } from 'react'
import ModelBrowser from './components/ModelBrowser'
import ChatView from './components/ChatView'
import DownloadManager from './components/DownloadManager'
import ImageGen from './components/ImageGen'
import { ModelDef, LocalModel, DownloadEntry } from './types'
import { MODELS } from './data/models'

type View = 'models' | 'chat' | 'images'

export default function App() {
  const [view,         setView]         = useState<View>('models')
  const [activeModel,  setActiveModel]  = useState<ModelDef | null>(null)
  const [localModels,  setLocalModels]  = useState<LocalModel[]>([])
  const [loadingModel, setLoadingModel] = useState(false)
  const [workspace,    setWorkspace]    = useState('~')
  const [downloads,    setDownloads]    = useState<Record<string, DownloadEntry>>({})

  const refreshLocal = useCallback(async () => {
    const list = await window.api.listLocalModels()
    setLocalModels(list)
  }, [])

  // ─── Download event listeners (owned here, passed down as props) ────────────
  useEffect(() => {
    refreshLocal()

    const off1 = window.api.onDownloadProgress(({ filename, received, total, speed, progress }) => {
      setDownloads(prev => ({
        ...prev,
        [filename]: {
          ...prev[filename],
          filename,
          modelName: prev[filename]?.modelName ?? modelNameFor(filename),
          status: prev[filename]?.status === 'paused' ? 'paused' : 'downloading',
          received, total, speed,
        }
      }))
    })

    const off2 = window.api.onDownloadDone(({ filename }) => {
      setDownloads(prev => ({
        ...prev,
        [filename]: { ...prev[filename], status: 'done', speed: 0 }
      }))
      refreshLocal()
    })

    const off3 = window.api.onDownloadError(({ filename, error }) => {
      setDownloads(prev => ({
        ...prev,
        [filename]: { ...prev[filename], status: 'error', speed: 0, error }
      }))
    })

    return () => { off1(); off2(); off3() }
  }, [refreshLocal])

  const startDownload = useCallback((model: ModelDef) => {
    setDownloads(prev => ({
      ...prev,
      [model.filename]: {
        filename:  model.filename,
        modelName: model.name,
        status:    'downloading',
        received:  0,
        total:     Math.round(model.sizeGb * 1024 ** 3),
        speed:     0,
      }
    }))
    window.api.downloadModel(model.url, model.filename)
  }, [])

  const handlePause = useCallback(async (filename: string) => {
    await window.api.pauseDownload(filename)
    setDownloads(prev => prev[filename]
      ? { ...prev, [filename]: { ...prev[filename], status: 'paused', speed: 0 } }
      : prev
    )
  }, [])

  const handleResume = useCallback(async (filename: string) => {
    await window.api.resumeDownload(filename)
    setDownloads(prev => prev[filename]
      ? { ...prev, [filename]: { ...prev[filename], status: 'downloading' } }
      : prev
    )
  }, [])

  const handleCancel = useCallback(async (filename: string) => {
    await window.api.cancelDownload(filename)
    setDownloads(prev => { const n = { ...prev }; delete n[filename]; return n })
  }, [])

  const handleDelete = useCallback(async (filename: string) => {
    await window.api.deleteModel(filename)
    setDownloads(prev => { const n = { ...prev }; delete n[filename]; return n })
    refreshLocal()
  }, [refreshLocal])

  const handleUseModel = async (model: ModelDef) => {
    setLoadingModel(true)
    const res = await window.api.loadModel(model.filename)
    setLoadingModel(false)
    if (res.ok) { setActiveModel(model); setView('chat') }
    else alert(`Failed to load model: ${res.error}`)
  }

  const handlePickWorkspace = async () => {
    const folder = await window.api.openFolder()
    if (folder) setWorkspace(folder)
  }

  return (
    <div className="app">
      {/* Titlebar */}
      <header className="titlebar">
        <div className="titlebar-drag" />
        <nav className="titlebar-nav">
          <button className={`nav-btn ${view === 'models' ? 'active' : ''}`} onClick={() => setView('models')}>
            ⚡ Models
          </button>
          <button className={`nav-btn ${view === 'chat' ? 'active' : ''}`} onClick={() => setView('chat')} disabled={!activeModel}>
            💬 Chat
          </button>
          <button className={`nav-btn ${view === 'images' ? 'active' : ''}`} onClick={() => setView('images')}>
            🎨 Images
          </button>
        </nav>
        <div className="titlebar-right">
          {activeModel && (
            <span className="active-model-badge" onClick={() => setView('chat')}>{activeModel.name}</span>
          )}
          <button className="workspace-btn" onClick={handlePickWorkspace} title="Set workspace folder">
            📁 {workspace === '~' ? 'Workspace' : workspace.split('/').pop()}
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="main-content">
        {view === 'models' && (
          <ModelBrowser
            localModels={localModels}
            downloads={downloads}
            onDownload={startDownload}
            onUseModel={handleUseModel}
            loadingModel={loadingModel}
            activeModel={activeModel}
          />
        )}
        {view === 'chat' && <ChatView model={activeModel!} workspace={workspace} />}
        {view === 'images' && <ImageGen />}
      </main>

      {/* Steam-style download manager — bottom left, always visible */}
      <DownloadManager
        downloads={downloads}
        onPause={handlePause}
        onResume={handleResume}
        onCancel={handleCancel}
        onDelete={handleDelete}
      />

      {loadingModel && (
        <div className="loading-overlay">
          <div className="loading-box">
            <div className="spinner" />
            <p>Loading {activeModel?.name}…</p>
            <p className="loading-sub">Building context, may take a moment</p>
          </div>
        </div>
      )}
    </div>
  )
}

function modelNameFor(filename: string): string {
  return MODELS.find(m => m.filename === filename)?.name ?? filename.replace(/\.gguf$/, '')
}
