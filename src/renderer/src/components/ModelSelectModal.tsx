import { useState, useEffect } from 'react'
import { ModelDef, LocalModel, DownloadEntry } from '../types'
import { FREE_MODELS, PROVIDERS, ApiModelDef, ProviderDef } from '../data/api-models'
import { MODELS } from '../data/models'

type Tab  = 'online' | 'offline' | 'downloaded'
type Mode = 'chat' | 'agent'

interface Props {
  localModels:      LocalModel[]
  apiKeys:          Record<string, string>
  activeModel:      { name: string; type: string; apiDef?: ApiModelDef; localDef?: ModelDef } | null
  downloads:        Record<string, DownloadEntry>
  chatMode:         Mode
  onChatModeChange: (m: Mode) => void
  onSelectLocal:    (m: ModelDef) => void
  onSelectApi:      (m: ApiModelDef, key: string) => void
  onSelectDuo:      (reasoner: ApiModelDef, reasonerKey: string, executor: ApiModelDef, executorKey: string) => void
  onSaveKey:        (provider: string, key: string) => void
  onDownload:       (m: ModelDef) => void
  onDelete:         (filename: string) => void
  onClose:          () => void
}

const REASONER_IDS = new Set(['openrouter-deepseek', 'openrouter-nemotron', 'nvidia-nemotron-nano', 'nvidia-nemotron-super'])

function fmtBytes(b: number) {
  if (b >= 1_073_741_824) return `${(b / 1_073_741_824).toFixed(1)} GB`
  if (b >= 1_048_576)     return `${(b / 1_048_576).toFixed(0)} MB`
  return `${(b / 1024).toFixed(0)} KB`
}

export default function ModelSelectModal({
  localModels, apiKeys, activeModel, downloads, chatMode, onChatModeChange,
  onSelectLocal, onSelectApi, onSelectDuo, onSaveKey, onDownload, onDelete, onClose,
}: Props) {
  const [tab,          setTab]          = useState<Tab>('online')
  const [openProvider, setOpenProvider] = useState<ProviderDef | null>(null)
  const [keyInput,     setKeyInput]     = useState('')
  const [pendingModel, setPendingModel] = useState<ApiModelDef | null>(null)
  const [showDuo,      setShowDuo]      = useState(false)
  const [systemRam,    setSystemRam]    = useState(0)

  const reasonerModels = FREE_MODELS.filter(m => !m.role || m.role === 'reasoner' || m.role === 'both')
  const executorModels = FREE_MODELS.filter(m => !m.role || m.role === 'executor' || m.role === 'both')
  const [duoReasoner, setDuoReasoner]  = useState<ApiModelDef | null>(
    FREE_MODELS.find(m => m.role === 'reasoner') ?? null
  )
  const [duoExecutor, setDuoExecutor]  = useState<ApiModelDef | null>(
    FREE_MODELS.find(m => !m.role || m.role === 'both') ?? null
  )

  useEffect(() => { window.api.getSystemRam().then(setSystemRam) }, [])

  // Filtered free models based on mode
  const visibleFreeModels = chatMode === 'agent'
    ? FREE_MODELS.filter(m => !REASONER_IDS.has(m.id))
    : FREE_MODELS

  const groqFree   = visibleFreeModels.filter(m => m.provider === 'groq')
  const orFree     = visibleFreeModels.filter(m => m.provider === 'openrouter')
  const nvidiaFree = visibleFreeModels.filter(m => m.provider === 'nvidia')
  const hiddenCount = FREE_MODELS.length - visibleFreeModels.length

  const isActiveApi   = (m: ApiModelDef) => activeModel?.type === 'api'  && activeModel.apiDef?.id === m.id
  const isActiveLocal = (m: ModelDef)    => activeModel?.type === 'local' && activeModel.localDef?.id === m.id

  const handleFreeModel = (m: ApiModelDef) => {
    const key = apiKeys[m.provider]
    if (key) { onSelectApi(m, key); return }
    setPendingModel(m)
    setOpenProvider(PROVIDERS.find(p => p.id === m.provider) ?? null)
    setKeyInput('')
  }

  const handleProviderModel = (provider: ProviderDef, modelId: string) => {
    const key = apiKeys[provider.id]
    const apiModel: ApiModelDef = {
      id: `${provider.id}-${modelId}`, name: provider.models.find(m => m.id === modelId)?.name ?? modelId,
      provider: provider.id, modelId, baseUrl: provider.baseUrl,
      keyUrl: provider.keyUrl, free: false, badge: '', description: '',
    }
    if (key) { onSelectApi(apiModel, key); return }
    setPendingModel(apiModel)
    setOpenProvider(provider)
    setKeyInput('')
  }

  const handleKeySubmit = () => {
    if (!keyInput.trim() || !openProvider || !pendingModel) return
    onSaveKey(openProvider.id, keyInput.trim())
    onSelectApi(pendingModel, keyInput.trim())
    setOpenProvider(null); setPendingModel(null); setKeyInput('')
  }

  // RAM badge
  const ramFit = (ramGb: number) => {
    if (!systemRam) return ''
    if (ramGb <= systemRam * 0.7) return 'green'
    if (ramGb <= systemRam) return 'yellow'
    return 'red'
  }

  // Local models that support agent/tools
  const agentCapableLocal = localModels
    .map(lm => ({ lm, def: MODELS.find(m => m.filename === lm.filename) }))
    .filter(({ def }) => def?.capabilities?.includes('tools'))

  // Offline models: not yet downloaded
  const offlineModels = MODELS.filter(m => !localModels.some(l => l.filename === m.filename))
  const visibleOffline = chatMode === 'agent'
    ? offlineModels.filter(m => m.capabilities?.includes('tools'))
    : offlineModels

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="model-modal model-modal--wide" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="model-modal-header">
          <span className="model-modal-title">Select model</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {/* Mode pills */}
        <div className="modal-mode-bar">
          <div className="modal-mode-pills">
            <button
              className={`modal-mode-pill ${chatMode === 'chat' ? 'modal-mode-pill--active' : ''}`}
              onClick={() => onChatModeChange('chat')}
            >💬 Chat</button>
            <button
              className={`modal-mode-pill ${chatMode === 'agent' ? 'modal-mode-pill--active' : ''}`}
              onClick={() => onChatModeChange('agent')}
            >🤖 Agent</button>
          </div>
          <span className="modal-mode-hint">
            {chatMode === 'agent' ? 'Agent: tools, file edits, shell — reasoner-only models hidden' : 'Chat: conversation only — all models shown'}
          </span>
        </div>

        {/* Tabs */}
        <div className="modal-tabs">
          <button className={`modal-tab ${tab === 'online'     ? 'modal-tab--active' : ''}`} onClick={() => setTab('online')}>🌐 Online</button>
          <button className={`modal-tab ${tab === 'offline'    ? 'modal-tab--active' : ''}`} onClick={() => setTab('offline')}>
            📡 Offline
            {chatMode === 'agent' && <span className="modal-tab-badge">tools only</span>}
          </button>
          <button className={`modal-tab ${tab === 'downloaded' ? 'modal-tab--active' : ''}`} onClick={() => setTab('downloaded')}>
            💾 Downloaded
            {localModels.length > 0 && <span className="modal-tab-count">{localModels.length}</span>}
          </button>
        </div>

        <div className="model-modal-body">

          {/* ── Online tab ──────────────────────────────────────────────── */}
          {tab === 'online' && (
            <>
              {hiddenCount > 0 && (
                <p className="modal-filter-note">⚠ {hiddenCount} reasoning-only model{hiddenCount > 1 ? 's' : ''} hidden in Agent mode — switch to Chat to see them</p>
              )}

              <p className="model-section-label">Free models — just add a free API key</p>

              {/* Groq */}
              {groqFree.length > 0 && (
                <div className="free-model-group">
                  <div className="free-model-group-label">
                    <span>⚡ Groq</span>
                    <a className="get-key-link" href="#" onClick={e => { e.preventDefault(); setOpenProvider(PROVIDERS.find(p => p.id === 'groq')!); setPendingModel(groqFree[0]); setKeyInput('') }}>
                      {apiKeys['groq'] ? '✓ Key saved' : 'Get free key →'}
                    </a>
                  </div>
                  {groqFree.map(m => (
                    <button key={m.id} className={`free-model-row ${isActiveApi(m) ? 'free-model-row--active' : ''}`} onClick={() => handleFreeModel(m)}>
                      <div className="free-model-info">
                        <span className="free-model-name">{m.name}</span>
                        <span className="free-model-desc">{m.description}</span>
                      </div>
                      <span className="free-badge">{m.badge}</span>
                      {isActiveApi(m) && <span className="active-check">✓</span>}
                    </button>
                  ))}
                </div>
              )}

              {/* OpenRouter */}
              {orFree.length > 0 && (
                <div className="free-model-group">
                  <div className="free-model-group-label">
                    <span>🔀 OpenRouter</span>
                    <a className="get-key-link" href="#" onClick={e => { e.preventDefault(); setOpenProvider(PROVIDERS.find(p => p.id === 'openrouter')!); setPendingModel(orFree[0]); setKeyInput('') }}>
                      {apiKeys['openrouter'] ? '✓ Key saved' : 'Get free key →'}
                    </a>
                  </div>
                  {orFree.map(m => (
                    <button key={m.id} className={`free-model-row ${isActiveApi(m) ? 'free-model-row--active' : ''}`} onClick={() => handleFreeModel(m)}>
                      <div className="free-model-info">
                        <span className="free-model-name">{m.name}</span>
                        <span className="free-model-desc">{m.description}</span>
                      </div>
                      <span className="free-badge">{m.badge}</span>
                      {m.role === 'reasoner' && <span className="role-badge role-badge--reasoner">🧠 Plan</span>}
                      {isActiveApi(m) && <span className="active-check">✓</span>}
                    </button>
                  ))}
                </div>
              )}

              {/* NVIDIA */}
              {nvidiaFree.length > 0 && (
                <div className="free-model-group">
                  <div className="free-model-group-label">
                    <span>⬡ NVIDIA NIM</span>
                    <a className="get-key-link" href="#" onClick={e => { e.preventDefault(); setOpenProvider(PROVIDERS.find(p => p.id === 'nvidia')!); setPendingModel(nvidiaFree[0]); setKeyInput('') }}>
                      {apiKeys['nvidia'] ? '✓ Key saved' : 'Get free key →'}
                    </a>
                  </div>
                  {nvidiaFree.map(m => (
                    <button key={m.id} className={`free-model-row ${isActiveApi(m) ? 'free-model-row--active' : ''}`} onClick={() => handleFreeModel(m)}>
                      <div className="free-model-info">
                        <span className="free-model-name">{m.name}</span>
                        <span className="free-model-desc">{m.description}</span>
                      </div>
                      <span className="free-badge">{m.badge}</span>
                      {m.role === 'reasoner' && <span className="role-badge role-badge--reasoner">🧠 Plan</span>}
                      {isActiveApi(m) && <span className="active-check">✓</span>}
                    </button>
                  ))}
                </div>
              )}

              {/* Duo mode */}
              <div className="duo-section">
                <button className="duo-toggle" onClick={() => setShowDuo(v => !v)}>
                  <span className="duo-icon">🤝</span>
                  <div className="duo-toggle-text">
                    <span className="duo-toggle-title">Duo Mode — two models, one chat</span>
                    <span className="duo-toggle-sub">A reasoning model plans, a fast Groq model executes</span>
                  </div>
                  <span className="duo-toggle-chevron">{showDuo ? '▲' : '▼'}</span>
                </button>
                {showDuo && (
                  <div className="duo-picker">
                    <div className="duo-online-note">
                      🌐 <strong>Recommended: use online models for Duo Mode.</strong> Running two local models simultaneously needs ~2× RAM. If your offline model already supports tools, just use it directly in Agent mode instead.
                    </div>
                    {agentCapableLocal.map(({ lm, def }) => def && (
                      <div key={lm.filename} className="duo-agent-hint">
                        <span className="duo-agent-hint-text">
                          💡 <strong>{def.name}</strong> supports Agent mode.
                          Do you want to choose another model for Agent, or use this one instead of 2 AI models?
                        </span>
                        <button className="duo-use-local-btn" onClick={() => onSelectLocal(def)}>
                          Use {def.name} →
                        </button>
                      </div>
                    ))}
                    <div className="duo-role">
                      <p className="duo-role-label">🧠 Reasoner — plans the task</p>
                      <div className="duo-model-list">
                        {reasonerModels.map(m => (
                          <button key={m.id} className={`duo-model-row ${duoReasoner?.id === m.id ? 'duo-model-row--active' : ''}`} onClick={() => setDuoReasoner(m)}>
                            <span className="duo-model-name">{m.name}</span>
                            <span className="duo-model-badge">{m.badge}</span>
                            {duoReasoner?.id === m.id && <span className="active-check">✓</span>}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="duo-role">
                      <p className="duo-role-label">🧑‍💻 Executor — writes code + uses tools</p>
                      <p className="duo-role-hint">Needs a model that follows tool-call format (Groq models work best)</p>
                      <div className="duo-model-list">
                        {executorModels.map(m => (
                          <button key={m.id} className={`duo-model-row ${duoExecutor?.id === m.id ? 'duo-model-row--active' : ''}`} onClick={() => setDuoExecutor(m)}>
                            <span className="duo-model-name">{m.name}</span>
                            <span className="duo-model-badge">{m.badge}</span>
                            {duoExecutor?.id === m.id && <span className="active-check">✓</span>}
                          </button>
                        ))}
                      </div>
                    </div>
                    <button
                      className="btn btn-primary duo-start-btn"
                      disabled={!duoReasoner || !duoExecutor || !apiKeys[duoReasoner.provider] || !apiKeys[duoExecutor.provider]}
                      onClick={() => {
                        if (!duoReasoner || !duoExecutor) return
                        const rKey = apiKeys[duoReasoner.provider]
                        const eKey = apiKeys[duoExecutor.provider]
                        if (!rKey || !eKey) return
                        onSelectDuo(duoReasoner, rKey, duoExecutor, eKey)
                      }}
                    >
                      {(!duoReasoner || !apiKeys[duoReasoner?.provider ?? '']) ? 'Add API key first ↑' : 'Start Duo Mode →'}
                    </button>
                  </div>
                )}
              </div>

              {/* More providers */}
              <p className="model-section-label" style={{ marginTop: 16 }}>Add more models from popular providers</p>
              {PROVIDERS.map(p => (
                <button key={p.id} className="provider-row" onClick={() => { setOpenProvider(p); setPendingModel(null); setKeyInput(apiKeys[p.id] ?? '') }}>
                  <span className="provider-icon">{p.icon}</span>
                  <span className="provider-name">{p.name}</span>
                  <span className="provider-desc">{p.description}</span>
                  {apiKeys[p.id] ? <span className="provider-check">✓</span> : <span className="provider-add">+</span>}
                </button>
              ))}
            </>
          )}

          {/* ── Offline tab ─────────────────────────────────────────────── */}
          {tab === 'offline' && (
            <>
              {systemRam > 0 && (
                <div className="ram-banner">
                  <span className="ram-banner-icon">💾</span>
                  <span className="ram-banner-text">Your Mac has <strong>{systemRam} GB RAM</strong> — green models fit comfortably</span>
                </div>
              )}
              {chatMode === 'agent' && (
                <div className="modal-filter-note modal-filter-note--info">
                  🤖 Agent mode: showing only models with tool-use capability. Switch to Chat to see all.
                </div>
              )}
              {visibleOffline.length === 0 && (
                <div className="offline-empty">
                  <p>All available models are already downloaded.</p>
                  <p>Switch to <strong>Downloaded</strong> tab to manage them.</p>
                </div>
              )}
              {visibleOffline.map(m => {
                const dl = downloads[m.filename]
                const fit = ramFit(m.ramGb)
                const isDownloading = dl?.status === 'downloading' || dl?.status === 'paused'
                const progress = dl && dl.total > 0 ? Math.round(dl.received / dl.total * 100) : 0
                return (
                  <div key={m.id} className="offline-model-row">
                    <div className="offline-model-info">
                      <div className="offline-model-top">
                        <span className="offline-model-name">{m.name}</span>
                        {fit && <span className={`badge-ram badge-ram--${fit}`}>{m.ramGb} GB RAM</span>}
                        {m.capabilities?.includes('tools') && <span className="meta-pill meta-pill--agent">🤖 Agent</span>}
                        {m.capabilities?.includes('thinking') && <span className="meta-pill meta-pill--think">🧠 Think</span>}
                      </div>
                      <span className="offline-model-desc">{m.description}</span>
                      <span className="offline-model-meta">{m.params} · {m.sizeGb} GB download</span>
                      {isDownloading && (
                        <div className="offline-dl-progress">
                          <div className="progress-wrap" style={{ marginTop: 4 }}>
                            <div className="progress-bar" style={{ width: `${progress}%` }} />
                          </div>
                          <span className="offline-dl-pct">{progress}%{dl.speed > 0 ? ` · ${(dl.speed / 1048576).toFixed(1)} MB/s` : ''}</span>
                        </div>
                      )}
                    </div>
                    <button
                      className={`offline-dl-btn ${isDownloading ? 'offline-dl-btn--active' : ''}`}
                      onClick={() => !isDownloading && onDownload(m)}
                      disabled={isDownloading}
                    >
                      {isDownloading ? `${progress}%` : '↓ Download'}
                    </button>
                  </div>
                )
              })}
            </>
          )}

          {/* ── Downloaded tab ───────────────────────────────────────────── */}
          {tab === 'downloaded' && (
            <>
              {localModels.length === 0 ? (
                <div className="offline-empty">
                  <p>No models downloaded yet.</p>
                  <p>Switch to the <strong>Offline</strong> tab to download one.</p>
                </div>
              ) : (
                <>
                  {systemRam > 0 && (
                    <div className="ram-banner">
                      <span className="ram-banner-icon">💾</span>
                      <span className="ram-banner-text">Your Mac has <strong>{systemRam} GB RAM</strong></span>
                    </div>
                  )}
                  {localModels.map(lm => {
                    const def = MODELS.find(m => m.filename === lm.filename)
                    const fit = def ? ramFit(def.ramGb) : ''
                    const isActive = activeModel?.type === 'local' && activeModel.localDef?.filename === lm.filename
                    return (
                      <div key={lm.filename} className={`downloaded-row ${isActive ? 'downloaded-row--active' : ''}`}>
                        <div className="downloaded-info">
                          <div className="downloaded-top">
                            <span className="downloaded-name">{def?.name ?? lm.filename.replace('.gguf', '')}</span>
                            {fit && <span className={`badge-ram badge-ram--${fit}`}>{def?.ramGb} GB RAM</span>}
                            {def?.capabilities?.includes('tools') && <span className="meta-pill meta-pill--agent">🤖 Agent</span>}
                            {isActive && <span className="downloaded-active-badge">● Active</span>}
                          </div>
                          <span className="downloaded-size">{fmtBytes(lm.size)}</span>
                          <span className="downloaded-path" title={lm.path}>{lm.path}</span>
                        </div>
                        <div className="downloaded-actions">
                          {!isActive && (
                            <button className="downloaded-use-btn" onClick={() => def && onSelectLocal(def)}>
                              Use
                            </button>
                          )}
                          <button className="downloaded-del-btn" onClick={() => onDelete(lm.filename)} title="Delete model file">
                            🗑
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Provider sub-modal */}
      {openProvider && (
        <div className="model-modal model-modal--sm" onClick={e => e.stopPropagation()}>
          <div className="model-modal-header">
            <button className="modal-back" onClick={() => { setOpenProvider(null); setPendingModel(null) }}>← Back</button>
            <span className="model-modal-title">{openProvider.icon} {openProvider.name}</span>
            <button className="modal-close" onClick={onClose}>✕</button>
          </div>
          <div className="model-modal-body">
            <p className="model-section-label">{openProvider.keyLabel}</p>
            <div className="key-input-row">
              <input
                className="api-key-input"
                type="password"
                placeholder={openProvider.placeholder}
                value={keyInput}
                onChange={e => setKeyInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleKeySubmit()}
                autoFocus
              />
              <button className="btn btn-primary key-save-btn" onClick={handleKeySubmit} disabled={!keyInput.trim()}>Save</button>
            </div>
            <a className="get-key-link-full" href="#" onClick={e => e.preventDefault()}>
              Get a free key at {openProvider.keyUrl}
            </a>
            <p className="model-section-label" style={{ marginTop: 16 }}>Models</p>
            {openProvider.models.map(m => (
              <button key={m.id} className="free-model-row" onClick={() => handleProviderModel(openProvider, m.id)}>
                <div className="free-model-info">
                  <span className="free-model-name">{m.name}</span>
                  <span className="free-model-desc">{m.description}</span>
                </div>
                {activeModel?.type === 'api' && (activeModel.apiDef as any)?.modelId === m.id && <span className="active-check">✓</span>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
