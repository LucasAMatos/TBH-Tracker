import { useEffect, useState } from 'react'
import type { ConnectionStatus, TrackerState } from '@shared/types'

const STATUS_LABELS: Record<ConnectionStatus, { text: string; cls: string }> = {
  monitoring: { text: 'Monitorando', cls: 'ok' },
  'no-key': { text: 'Sem chave ES3', cls: 'warn' },
  'no-save': { text: 'Save não encontrado', cls: 'warn' },
  error: { text: 'Erro', cls: 'err' }
}

function fmtAgo(ms: number): string {
  const s = Math.floor(ms / 1000)
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}min`
  const h = Math.floor(m / 60)
  return `${h}h ${m % 60}min`
}

function fmtClock(at: number | null): string {
  if (at === null) return '—'
  return new Date(at).toLocaleString('pt-BR')
}

// Linha "tempo": relógio absoluto + "(há Xs)" relativo, ou "—" quando ausente.
function timeWithAgo(at: number | null, now: number): string {
  if (at === null) return '—'
  return `${fmtClock(at)} · há ${fmtAgo(now - at)}`
}

interface DiagWarning {
  level: 'warn' | 'info'
  text: string
}

/**
 * I9 — Painel de diagnóstico: estado da conexão, caminho/chave do save, heartbeat e a
 * última leitura num só lugar, mais avisos de catálogo desatualizado (chaves fora do
 * datamine). Tudo somente-leitura; ajuda a calibrar e a perceber patch novo.
 */
export function Diagnostics({
  state,
  version
}: {
  state: TrackerState
  version: string
}): JSX.Element {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const status = STATUS_LABELS[state.status]
  const snap = state.snapshot
  const inv = snap?.inventory ?? null
  const melt = snap?.melt ?? null

  const warnings: DiagWarning[] = []
  if (inv && inv.unknownCount > 0) {
    warnings.push({
      level: 'warn',
      text: `${inv.unknownCount} ItemKey(s) do save fora do catálogo — datamine pode estar desatualizado (patch novo?).`
    })
  }
  if (melt && melt.noData > 0) {
    warnings.push({
      level: 'info',
      text: `${melt.noData} item(ns) de gear sem valor de venda no catálogo de derretimento.`
    })
  }
  if (snap && snap.stage === null && snap.maxCompletedStage === null) {
    warnings.push({
      level: 'warn',
      text: 'Estágio atual não reconhecido — chave de estágio fora do catálogo.'
    })
  }

  return (
    <section className="diag">
      <header className="diag__head">
        <h2 className="diag__title">Diagnóstico</h2>
        <p className="diag__sub">
          Estado da leitura passiva do save e avisos de catálogo. Somente leitura.
        </p>
      </header>

      <div className="diag__grid">
        <div className="diag__row">
          <span className="diag__k">Estado</span>
          <span className="diag__v">
            <span className={`diag__dot diag__dot--${status.cls}`} />
            {status.text}
          </span>
        </div>
        <div className="diag__row">
          <span className="diag__k">Versão do app</span>
          <span className="diag__v">{version || '—'}</span>
        </div>
        <div className="diag__row">
          <span className="diag__k">Chave ES3</span>
          <span className="diag__v">{state.hasKey ? 'configurada' : 'ausente'}</span>
        </div>
        <div className="diag__row diag__row--wide">
          <span className="diag__k">Caminho do save</span>
          <span className="diag__v diag__v--mono">{state.savePath ?? '—'}</span>
        </div>
        <div className="diag__row">
          <span className="diag__k">Última mudança</span>
          <span className="diag__v">{timeWithAgo(state.lastChangeAt, now)}</span>
        </div>
        <div className="diag__row">
          <span className="diag__k">Heartbeat</span>
          <span className="diag__v">{timeWithAgo(state.heartbeatAt, now)}</span>
        </div>
        <div className="diag__row">
          <span className="diag__k">Última leitura</span>
          <span className="diag__v">{timeWithAgo(snap?.capturedAt ?? null, now)}</span>
        </div>
        {state.lastError && (
          <div className="diag__row diag__row--wide">
            <span className="diag__k">Último erro</span>
            <span className="diag__v diag__v--err">{state.lastError}</span>
          </div>
        )}
      </div>

      <div className="diag__warns">
        <h3 className="diag__warnstitle">Avisos de catálogo</h3>
        {warnings.length === 0 ? (
          <p className="card__hint">Nenhum aviso — catálogo coerente com o save lido.</p>
        ) : (
          <ul className="diag__warnlist">
            {warnings.map((w, i) => (
              <li className={`diag__warn diag__warn--${w.level}`} key={i}>
                {w.text}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
