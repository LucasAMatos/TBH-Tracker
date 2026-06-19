import { useMemo, useState } from 'react'
import {
  difficultyName,
  rankStages,
  stageDataForRaw,
  type StageMetric
} from '@shared/stage'
import type { StageDatum } from '@shared/stageData'
import type { Snapshot, StageFarmEntry } from '@shared/types'

const TOP_LIMIT = 12

function fmtNum(n: number | null | undefined): string {
  if (n === null || n === undefined) return '—'
  return new Intl.NumberFormat('pt-BR').format(Math.round(n))
}

/** Taxa por hora (ouro/h, xp/h) com separador pt-BR, ou '—'. */
function fmtRate(perHour: number | null): string {
  if (perHour === null || perHour === undefined) return '—'
  return `${fmtNum(perHour)}/h`
}

/** Duração humana aproximada (ex.: "45s", "12min", "2h 30min"). */
function fmtDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`
  const totalMin = Math.round(seconds / 60)
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  if (h === 0) return `${m}min`
  if (m === 0) return `${h}h`
  return `${h}h ${m}min`
}

const METRICS: { id: StageMetric; label: string; hint: string }[] = [
  { id: 'gold', label: 'Ouro', hint: 'ouro por HP abatido' },
  { id: 'exp', label: 'XP', hint: 'EXP por HP abatido' },
  { id: 'combo', label: 'Combo', hint: 'ouro + XP equilibrados' }
]

// 0 = todas as dificuldades; 1..4 = Normal/Nightmare/Hell/Torment.
const DIFFICULTIES = [0, 1, 2, 3, 4]

function pad4(key: number): string {
  return String(key).padStart(4, '0')
}

function BestStages({ currentRaw }: { currentRaw: string | null }): JSX.Element {
  const [metric, setMetric] = useState<StageMetric>('gold')
  const [difficulty, setDifficulty] = useState(0)

  const ranked = useMemo(
    () =>
      rankStages(metric, {
        difficulty: difficulty === 0 ? undefined : difficulty,
        limit: TOP_LIMIT
      }),
    [metric, difficulty]
  )

  return (
    <section className="section">
      <div className="section__head">
        <h3 className="section__title">Melhores estágios</h3>
        <span className="card__hint">
          Eficiência pelo catálogo (densidade por HP) — proxy de ganho por tempo. Medições reais
          refinam isto abaixo.
        </span>
      </div>

      <div className="farm-filters">
        <div className="invscopes">
          {METRICS.map((m) => (
            <button
              key={m.id}
              type="button"
              className={`chip${metric === m.id ? ' chip--active' : ''}`}
              title={m.hint}
              onClick={() => setMetric(m.id)}
            >
              {m.label}
            </button>
          ))}
        </div>
        <div className="invscopes">
          {DIFFICULTIES.map((d) => (
            <button
              key={d}
              type="button"
              className={`chip${difficulty === d ? ' chip--active' : ''}`}
              onClick={() => setDifficulty(d)}
            >
              {d === 0 ? 'Todas' : difficultyName(d)}
            </button>
          ))}
        </div>
      </div>

      <div className="farmtable__wrap">
        <table className="farmtable">
          <thead>
            <tr>
              <th className="farmtable__rank">#</th>
              <th>Estágio</th>
              <th className="farmtable__num">Nível</th>
              <th className="farmtable__num">Ouro/clear</th>
              <th className="farmtable__num">XP/clear</th>
              <th className="farmtable__num">Ouro/HP</th>
              <th className="farmtable__num">XP/HP</th>
            </tr>
          </thead>
          <tbody>
            {ranked.map((s: StageDatum, i) => {
              const isCurrent = currentRaw !== null && pad4(s.key) === currentRaw
              return (
                <tr key={s.key} className={isCurrent ? 'farmtable__row--current' : undefined}>
                  <td className="farmtable__rank">{i + 1}</td>
                  <td>
                    <span className="farmtable__stage">{s.label}</span>{' '}
                    <span className="farmtable__name">{s.name}</span>
                    {isCurrent && <span className="farmtable__here">você está aqui</span>}
                    <div className="farmtable__sub">
                      {difficultyName(s.difficulty)} · {fmtNum(s.count)} inimigos
                    </div>
                  </td>
                  <td className="farmtable__num">{s.level}</td>
                  <td className="farmtable__num">{fmtNum(s.expectedGold)}</td>
                  <td className="farmtable__num">{fmtNum(s.expectedEXP)}</td>
                  <td className="farmtable__num">{s.goldPerHP.toFixed(4)}</td>
                  <td className="farmtable__num">{s.expPerHP.toFixed(4)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <p className="card__hint">
        O catálogo cobre as fases 1–9 de cada ato (sem boss de ato). Ouro/clear e XP/clear são
        valores base; ganhos reais variam com runas, nível e composição.
      </p>
    </section>
  )
}

function farmStageName(entry: StageFarmEntry): { label: string; name: string | null } {
  const data = stageDataForRaw(entry.stageRaw)
  if (data) return { label: data.label, name: data.name }
  return { label: entry.stageRaw, name: null }
}

function Measurements({ snapshot }: { snapshot: Snapshot | null }): JSX.Element {
  const farm = snapshot?.stageFarm

  if (!farm || farm.entries.length === 0) {
    return (
      <section className="section">
        <div className="section__head">
          <h3 className="section__title">Medições da sessão</h3>
        </div>
        <div className="alert alert--info">
          Ainda sem medições. Ouro/h e XP/h por estágio aparecem conforme o jogo roda e grava o
          save (precisa de pelo menos dois saves no mesmo estágio). As medições são acumuladas e
          persistidas por save entre sessões.
        </div>
      </section>
    )
  }

  // Ordena pelas mais medidas (já vem por tempo desc do tracker, mas garantimos).
  const entries = [...farm.entries].sort((a, b) => b.seconds - a.seconds)

  return (
    <section className="section">
      <div className="section__head">
        <h3 className="section__title">Medições da sessão</h3>
        <span className="card__hint">
          {fmtDuration(farm.totalSeconds)} de farm observado · {entries.length} estágio(s)
        </span>
      </div>

      <div className="farmtable__wrap">
        <table className="farmtable">
          <thead>
            <tr>
              <th>Estágio</th>
              <th className="farmtable__num">Tempo</th>
              <th className="farmtable__num">Ouro/h</th>
              <th className="farmtable__num">XP/h</th>
              <th className="farmtable__num">Ouro total</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => {
              const { label, name } = farmStageName(e)
              const isCurrent = farm.currentStageRaw === e.stageRaw
              return (
                <tr
                  key={e.stageRaw}
                  className={isCurrent ? 'farmtable__row--current' : undefined}
                >
                  <td>
                    <span className="farmtable__stage">{label}</span>{' '}
                    {name && <span className="farmtable__name">{name}</span>}
                    {isCurrent && <span className="farmtable__here">atual</span>}
                  </td>
                  <td className="farmtable__num">{fmtDuration(e.seconds)}</td>
                  <td className="farmtable__num farmtable__num--gold">{fmtRate(e.goldPerHour)}</td>
                  <td className="farmtable__num farmtable__num--exp">{fmtRate(e.expPerHour)}</td>
                  <td className="farmtable__num">{fmtNum(e.goldGained)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <p className="card__hint">
        Taxas medidas pelo delta entre leituras enquanto o estágio fica estável (intervalos com
        troca de mapa, gasto de ouro ou jogo parado são descartados). É uma aproximação — o save
        não registra clears nem tempo por corrida.
      </p>
    </section>
  )
}

export function Farm({ snapshot }: { snapshot: Snapshot | null }): JSX.Element {
  const currentRaw = snapshot?.stage?.raw ?? null
  return (
    <div className="farm">
      <Measurements snapshot={snapshot} />
      <BestStages currentRaw={currentRaw} />
    </div>
  )
}
