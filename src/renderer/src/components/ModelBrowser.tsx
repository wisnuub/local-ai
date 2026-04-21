import { useState, useRef, useEffect } from 'react'
import { MODELS, CATEGORIES } from '../data/models'
import { ModelDef, LocalModel, DownloadEntry } from '../types'

interface Props {
  localModels:  LocalModel[]
  downloads:    Record<string, DownloadEntry>
  onDownload:   (m: ModelDef) => void
  onUseModel:   (m: ModelDef) => void
  loadingModel: boolean
  activeModel:  ModelDef | null
}

export default function ModelBrowser({ localModels, downloads, onDownload, onUseModel, loadingModel, activeModel }: Props) {
  const [category,   setCategory]   = useState('all')
  const [search,     setSearch]     = useState('')
  const [hfSearch,   setHfSearch]   = useState('')
  const [hfResults,  setHfResults]  = useState<any[]>([])
  const [hfLoading,  setHfLoading]  = useState(false)
  const [systemRam,  setSystemRam]  = useState<number | null>(null)
  const hfTimer = useRef<any>(null)

  useEffect(() => {
    window.api.getSystemRam().then(setSystemRam)
  }, [])

  const ramFit = (m: ModelDef) => {
    if (systemRam === null) return 'unknown'
    if (m.ramGb <= systemRam * 0.7) return 'green'
    if (m.ramGb <= systemRam) return 'yellow'
    return 'red'
  }

  const isDownloaded  = (m: ModelDef) => localModels.some(l => l.filename === m.filename)
  const dlEntry       = (m: ModelDef) => downloads[m.filename]
  const isDownloading = (m: ModelDef) => dlEntry(m)?.status === 'downloading'
  const isPaused      = (m: ModelDef) => dlEntry(m)?.status === 'paused'

  const filtered = MODELS.filter(m => {
    const matchCat = category === 'all' || m.categories.includes(category)
    const q = search.toLowerCase()
    const matchSearch = !q || m.name.toLowerCase().includes(q) ||
      m.description.toLowerCase().includes(q) || m.tags.some(t => t.includes(q))
    return matchCat && matchSearch
  })

  const searchHF = (q: string) => {
    setHfSearch(q)
    clearTimeout(hfTimer.current)
    if (!q.trim()) { setHfResults([]); return }
    hfTimer.current = setTimeout(async () => {
      setHfLoading(true)
      try {
        const res = await fetch(`https://huggingface.co/api/models?search=${encodeURIComponent(q)}&filter=gguf&sort=downloads&limit=12`)
        setHfResults(await res.json())
      } catch { setHfResults([]) }
      setHfLoading(false)
    }, 500)
  }

  return (
    <div className="browser">
      {/* Sidebar */}
      <aside className="browser-sidebar">
        <div className="sidebar-section">
          <p className="sidebar-label">CATEGORY</p>
          {CATEGORIES.map(c => (
            <button key={c.id} className={`sidebar-item ${category === c.id ? 'active' : ''}`} onClick={() => setCategory(c.id)}>
              <span className="sidebar-icon">{c.icon}</span>{c.label}
            </button>
          ))}
        </div>

        <div className="sidebar-section sidebar-bottom">
          <p className="sidebar-label">DOWNLOADED</p>
          {localModels.length === 0
            ? <p className="sidebar-empty">None yet</p>
            : localModels.map(l => (
              <div key={l.filename} className="sidebar-local">
                <span className="sidebar-local-dot" />
                <span className="sidebar-local-name">{l.filename.replace(/\.gguf$/, '').slice(0, 22)}</span>
              </div>
            ))
          }
        </div>
      </aside>

      {/* Main */}
      <div className="browser-main">
        <div className="browser-search-row">
          <div className="search-wrap">
            <span className="search-icon">🔍</span>
            <input className="search-input" placeholder="Filter models…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="hf-search-wrap">
            <span className="search-icon">🤗</span>
            <input className="search-input" placeholder="Browse HuggingFace…" value={hfSearch} onChange={e => searchHF(e.target.value)} />
          </div>
        </div>

        {/* HuggingFace live results */}
        {(hfSearch || hfLoading) && (
          <div className="hf-results">
            <p className="section-title">
              {hfLoading ? 'Searching HuggingFace…' : `Results for "${hfSearch}"`}
            </p>
            <div className="model-grid">
              {hfResults.map(r => (
                <div key={r.id} className="model-card hf-card">
                  <div className="card-header">
                    <span className="card-name">{r.id}</span>
                    <span className="card-stat">↓ {(r.downloads / 1000).toFixed(0)}K</span>
                  </div>
                  <div className="card-tags">{(r.tags || []).slice(0, 4).map((t: string) => <span key={t} className="tag">{t}</span>)}</div>
                  <a className="btn btn-outline" href={`https://huggingface.co/${r.id}`} target="_blank" rel="noopener">View on HuggingFace ↗</a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Curated grid */}
        {!hfSearch && (
          <>
            {systemRam !== null && (
              <div className="ram-banner">
                <span className="ram-banner-icon">💾</span>
                <span className="ram-banner-text">
                  {systemRam} GB RAM detected —{' '}
                  <strong>{systemRam >= 16 ? 'all models available' : systemRam >= 8 ? 'models up to ~3.5 GB recommended' : 'models up to 2 GB recommended'}</strong>
                </span>
              </div>
            )}
            <p className="section-title">
              {category === 'all' ? 'All Models' : CATEGORIES.find(c => c.id === category)?.label}
              <span className="section-count">{filtered.length}</span>
            </p>
            <div className="model-grid">
              {filtered.map(m => {
                const dl         = dlEntry(m)
                const downloaded = isDownloaded(m)
                const downloading = isDownloading(m)
                const paused     = isPaused(m)
                const isActive   = activeModel?.id === m.id
                const pct        = dl?.total ? (dl.received / dl.total) * 100 : 0
                const fit        = ramFit(m)

                return (
                  <div key={m.id} className={`model-card ${isActive ? 'model-card--active' : ''}`}>
                    <div className="card-header">
                      <span className="card-name">{m.name}</span>
                      <div className="card-badges">
                        {isActive && <span className="badge-active">Active</span>}
                        {fit === 'green'  && <span className="badge-ram badge-ram--green">✓ Fits {systemRam}GB</span>}
                        {fit === 'yellow' && <span className="badge-ram badge-ram--yellow">⚠ Tight fit</span>}
                        {fit === 'red'    && <span className="badge-ram badge-ram--red">✗ Needs {m.ramGb}GB+</span>}
                      </div>
                    </div>

                    <div className="card-meta">
                      <span className="meta-pill">{m.params}</span>
                      <span className="meta-pill">{m.sizeGb} GB</span>
                      {m.capabilities?.includes('thinking') && <span className="meta-pill meta-pill--think">🧠 Thinking</span>}
                      {m.categories.map(c => (
                        <span key={c} className={`meta-pill meta-pill--cat cat-${c}`}>{c}</span>
                      ))}
                    </div>

                    <p className="card-desc">{m.description}</p>
                    <div className="card-tags">{m.tags.map(t => <span key={t} className="tag">{t}</span>)}</div>

                    {(downloading || paused) && dl && (
                      <div className="progress-wrap">
                        <div className="progress-bar" style={{ width: `${pct}%`, opacity: paused ? 0.5 : 1 }} />
                        <span className="progress-label">{pct.toFixed(0)}%{paused ? ' · Paused' : ''}</span>
                      </div>
                    )}

                    {dl?.status === 'error' && <p className="card-error">Error: {dl.error}</p>}

                    <div className="card-actions">
                      {downloaded ? (
                        <button className="btn btn-primary" onClick={() => onUseModel(m)} disabled={loadingModel}>
                          {isActive ? '✓ Active' : 'Use Model →'}
                        </button>
                      ) : downloading ? (
                        <button className="btn btn-ghost" disabled>Downloading… {pct.toFixed(0)}%</button>
                      ) : paused ? (
                        <button className="btn btn-ghost" disabled>Paused — resume in download panel</button>
                      ) : (
                        <button className="btn btn-download" onClick={() => onDownload(m)}>
                          ↓ Download {m.sizeGb} GB
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
