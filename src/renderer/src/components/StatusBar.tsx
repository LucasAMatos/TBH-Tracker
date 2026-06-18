import { useEffect, useState } from 'react'
import type { ConnectionStatus, TrackerState } from '@shared/types'

const LABELS: Record<ConnectionStatus, { text: string; cls: string }> = {
  monitoring: { text: 'Monitorando', cls: 'ok' },
  'no-key': { text: 'Sem chave', cls: 'warn' },
  'no-save': { text: 'Save nao encontrado', cls: 'warn' },
  error: { text: 'Erro', cls: 'err' }
}

// Acima deste tempo sem mudança no save, sinalizamos "parado" (jogo fechado/ocioso).
const IDLE_THRESHOLD_MS = 30_000
// Heartbeat considerado "vivo" se houve pulso há menos disto (2× o intervalo do main).
const HEARTBEAT_FRESH_MS = 12_000

function fmtAgo(ms: number): string {
  const s = Math.floor(ms / 1000)
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}min`
  const h = Math.floor(m / 60)
  return `${h}h ${m % 60}min`
}

export function StatusBar({ state }: { state: TrackerState }): JSX.Element {
  const info = LABELS[state.status]
  // Ticker local para atualizar "há Xs" de forma suave (o heartbeat do main re-emite
  // o estado a cada 5s; este timer só recalcula o texto entre os pulsos).
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const monitoring = state.status === 'monitoring'
  const alive =
    state.heartbeatAt !== null && now - state.heartbeatAt < HEARTBEAT_FRESH_MS
  const idleMs = state.lastChangeAt !== null ? now - state.lastChangeAt : null
  const idle = idleMs !== null && idleMs >= IDLE_THRESHOLD_MS

  let detail: string | null = null
  if (monitoring && idleMs !== null) {
    detail = idle ? `parado há ${fmtAgo(idleMs)}` : `ativo · atualizado há ${fmtAgo(idleMs)}`
  }

  return (
    <div className="status">
      <span
        className={`status__dot status__dot--${info.cls}${alive ? ' status__dot--beat' : ''}`}
      />
      <span className="status__text">{info.text}</span>
      {detail && <span className="status__detail">· {detail}</span>}
    </div>
  )
}
