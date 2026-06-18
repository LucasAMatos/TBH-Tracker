import { useEffect, useMemo, useState } from 'react'
import type { RunRecord } from '@shared/types'

function fmtDuration(s: number): string {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return m > 0 ? `${m}m ${sec}s` : `${sec}s`
}

function fmtWhen(ts: number): string {
  return new Date(ts).toLocaleString('pt-BR')
}

interface StageAgg {
  stageRaw: string
  stageLabel: string
  count: number
  avgSeconds: number
}

export function RunsView(): JSX.Element {
  const [runs, setRuns] = useState<RunRecord[]>([])

  useEffect(() => {
    let mounted = true
    window.tbh.getRuns().then((r) => {
      if (mounted && r) setRuns(r)
    })
    const off = window.tbh.onRun((run) => setRuns((prev) => [...prev, run]))
    return () => {
      mounted = false
      off()
    }
  }, [])

  const ordered = useMemo(() => [...runs].sort((a, b) => b.endedAt - a.endedAt), [runs])

  const avgSeconds = useMemo(() => {
    if (!runs.length) return 0
    return Math.round(runs.reduce((acc, r) => acc + r.durationSeconds, 0) / runs.length)
  }, [runs])

  const byStage = useMemo<StageAgg[]>(() => {
    const map = new Map<string, { label: string; count: number; total: number }>()
    for (const r of runs) {
      const cur = map.get(r.stageRaw) ?? { label: r.stageLabel, count: 0, total: 0 }
      cur.count += 1
      cur.total += r.durationSeconds
      map.set(r.stageRaw, cur)
    }
    return [...map.entries()]
      .map(([stageRaw, v]) => ({
        stageRaw,
        stageLabel: v.label,
        count: v.count,
        avgSeconds: Math.round(v.total / v.count)
      }))
      .sort((a, b) => b.count - a.count)
  }, [runs])

  const onClear = async (): Promise<void> => {
    if (!confirm('Limpar todo o histórico de corridas?')) return
    const r = await window.tbh.clearRuns()
    setRuns(r ?? [])
  }

  if (!runs.length) {
    return (
      <div className="runs">
        <div className="panel">
          <h2 className="panel__title">Corridas</h2>
          <p className="panel__hint">
            Nenhuma corrida registrada ainda. Deixe o app monitorando enquanto farma — cada
            clear (onda → 0) é detectado e medido automaticamente.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="runs">
      <div className="grid">
        <div className="card">
          <span className="card__label">Corridas</span>
          <span className="card__value">{runs.length}</span>
        </div>
        <div className="card">
          <span className="card__label">Duração média</span>
          <span className="card__value">{fmtDuration(avgSeconds)}</span>
        </div>
        <div className="card">
          <span className="card__label">Estágios farmados</span>
          <span className="card__value">{byStage.length}</span>
        </div>
      </div>

      <section className="section">
        <h3 className="section__title">Por estágio</h3>
        <table className="table">
          <thead>
            <tr>
              <th>Estágio</th>
              <th>Corridas</th>
              <th>Duração média</th>
            </tr>
          </thead>
          <tbody>
            {byStage.map((s) => (
              <tr key={s.stageRaw}>
                <td>
                  {s.stageRaw} <span className="card__hint">{s.stageLabel}</span>
                </td>
                <td>{s.count}</td>
                <td>{fmtDuration(s.avgSeconds)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="section">
        <div className="runs__head">
          <h3 className="section__title">Histórico ({ordered.length})</h3>
          <button className="btn" onClick={onClear}>
            Limpar histórico
          </button>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>Estágio</th>
              <th>Duração</th>
              <th>Quando</th>
            </tr>
          </thead>
          <tbody>
            {ordered.map((r) => (
              <tr key={r.id}>
                <td>
                  {r.stageRaw} <span className="card__hint">{r.stageLabel}</span>
                </td>
                <td>{fmtDuration(r.durationSeconds)}</td>
                <td>{fmtWhen(r.endedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  )
}
