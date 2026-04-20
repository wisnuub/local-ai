import { useState, useEffect, useRef, useCallback } from 'react'
import { DownloadEntry } from '../types'

interface Props {
  downloads: Record<string, DownloadEntry>
  onPause:  (filename: string) => void
  onResume: (filename: string) => void
  onCancel: (filename: string) => void
  onDelete: (filename: string) => void
}

function fmtBytes(b: number): string {
  if (b <= 0) return '0 B'
  if (b < 1024)      return `${b} B`
  if (b < 1024 ** 2) return `${(b / 1024).toFixed(1)} KB`
  if (b < 1024 ** 3) return `${(b / 1024 ** 2).toFixed(1)} MB`
  return `${(b / 1024 ** 3).toFixed(2)} GB`
}

function fmtSpeed(bps: number): string {
  if (bps <= 0)      return '0 B/s'
  if (bps < 1024)    return `${bps.toFixed(0)} B/s`
  if (bps < 1024**2) return `${(bps / 1024).toFixed(0)} KB/s`
  return `${(bps / 1024 ** 2).toFixed(1)} MB/s`
}

function fmtEta(received: number, total: number, speed: number): string {
  if (speed <= 0 || total <= 0) return ''
  const secs = (total - received) / speed
  if (secs < 60)   return `${Math.ceil(secs)}s`
  if (secs < 3600) return `${Math.ceil(secs / 60)}m`
  return `${(secs / 3600).toFixed(1)}h`
}

// Mini sparkline — last N speed samples as an SVG polyline
function Sparkline({ samples, color = '#7c3aed' }: { samples: number[]; color?: string }) {
  const W = 80, H = 28
  if (samples.length < 2) return <svg width={W} height={H} />
  const max = Math.max(...samples, 1)
  const pts = samples.map((v, i) => {
    const x = (i / (samples.length - 1)) * W
    const y = H - (v / max) * (H - 2) - 1
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')
  // fill area under line
  const first = `0,${H}`
  const last  = `${W},${H}`
  return (
    <svg width={W} height={H} className="dlm-spark">
      <defs>
        <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`${first} ${pts} ${last}`} fill="url(#sg)" />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  )
}

export default function DownloadManager({ downloads, onPause, onResume, onCancel, onDelete }: Props) {
  const [collapsed, setCollapsed] = useState(false)
  const [tick, setTick] = useState(0)                                 // forces graph refresh
  const speedHistory = useRef<Record<string, number[]>>({})

  // Refresh graph every 5 seconds
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 5000)
    return () => clearInterval(id)
  }, [])

  const entries = Object.values(downloads)
  if (entries.length === 0) return null

  const active    = entries.filter(e => e.status === 'downloading' || e.status === 'paused')
  const completed = entries.filter(e => e.status === 'done' || e.status === 'error')

  const totalReceived = active.reduce((s, e) => s + e.received, 0)
  const totalSize     = active.reduce((s, e) => s + e.total, 0)
  const totalSpeed    = active.filter(e => e.status === 'downloading').reduce((s, e) => s + e.speed, 0)

  // Update speed history on each render
  for (const e of active) {
    if (!speedHistory.current[e.filename]) speedHistory.current[e.filename] = []
    const hist = speedHistory.current[e.filename]
    if (e.status === 'downloading') {
      hist.push(e.speed)
      if (hist.length > 40) hist.shift()
    }
  }
  // Clean up finished
  for (const key of Object.keys(speedHistory.current)) {
    if (!downloads[key] || downloads[key].status === 'done' || downloads[key].status === 'error') {
      delete speedHistory.current[key]
    }
  }

  return (
    <div className={`dlm ${collapsed ? 'dlm--collapsed' : ''}`}>
      {/* Header */}
      <button className="dlm-header" onClick={() => setCollapsed(c => !c)}>
        <span className="dlm-header-left">
          {active.length > 0 && <span className="dlm-pulse" />}
          <span className="dlm-title">Downloads</span>
          {active.length > 0 && !collapsed && (
            <span className="dlm-summary">
              {fmtBytes(totalReceived)} / {fmtBytes(totalSize)}
              {totalSpeed > 0 && <> · {fmtSpeed(totalSpeed)}</>}
            </span>
          )}
        </span>
        <span className="dlm-chevron">{collapsed ? '▲' : '▼'}</span>
      </button>

      {!collapsed && (
        <div className="dlm-body">
          {/* Active downloads */}
          {active.map(entry => {
            const pct      = entry.total > 0 ? (entry.received / entry.total) * 100 : 0
            const eta      = fmtEta(entry.received, entry.total, entry.speed)
            const isPaused = entry.status === 'paused'
            const hist     = speedHistory.current[entry.filename] ?? []

            return (
              <div key={entry.filename} className="dlm-row">
                <div className="dlm-row-top">
                  <span className="dlm-name" title={entry.modelName}>{entry.modelName}</span>
                  <div className="dlm-controls">
                    <button
                      className="dlm-btn"
                      title={isPaused ? 'Resume' : 'Pause'}
                      onClick={() => isPaused ? onResume(entry.filename) : onPause(entry.filename)}
                    >
                      {isPaused ? '▶' : '⏸'}
                    </button>
                    <button className="dlm-btn dlm-btn--danger" title="Cancel" onClick={() => onCancel(entry.filename)}>✕</button>
                  </div>
                </div>

                {/* Speed graph */}
                <div className="dlm-graph-row">
                  <Sparkline samples={hist} color={isPaused ? '#6b7280' : '#7c3aed'} />
                  <span className="dlm-speed-label">
                    {isPaused ? 'Paused' : entry.speed > 0 ? fmtSpeed(entry.speed) : 'Connecting…'}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="dlm-progress-track">
                  <div className={`dlm-progress-fill ${isPaused ? 'dlm-progress-fill--paused' : ''}`} style={{ width: `${pct}%` }} />
                </div>

                <div className="dlm-row-meta">
                  <span>{fmtBytes(entry.received)} / {fmtBytes(entry.total)}</span>
                  <span>{eta ? `ETA ${eta}` : ''}</span>
                  <span>{pct.toFixed(1)}%</span>
                </div>
              </div>
            )
          })}

          {/* Completed */}
          {completed.length > 0 && (
            <div className="dlm-completed">
              {active.length > 0 && <div className="dlm-divider" />}
              {completed.map(entry => (
                <div key={entry.filename} className="dlm-done-row">
                  <span className={`dlm-done-icon ${entry.status === 'error' ? 'dlm-done-icon--err' : ''}`}>
                    {entry.status === 'error' ? '✕' : '✓'}
                  </span>
                  <span className="dlm-done-name" title={entry.modelName}>{entry.modelName}</span>
                  <span className="dlm-done-size">
                    {entry.status === 'error' ? entry.error?.slice(0, 22) : fmtBytes(entry.total)}
                  </span>
                  <button className="dlm-btn dlm-btn--danger" title="Delete model" onClick={() => onDelete(entry.filename)}>🗑</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
