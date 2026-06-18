import { useState } from 'react'
import { CUBE_MILESTONES, isMilestoneReached, nextCubeMilestone } from '@shared/cube'
import type { Snapshot } from '@shared/types'

function fmtNum(n: number | null): string {
  if (n === null || n === undefined) return '—'
  return new Intl.NumberFormat('pt-BR').format(n)
}

function fmtPlayTime(seconds: number | null): string {
  if (seconds === null) return '—'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return `${h}h ${m}m`
}

function Card({
  label,
  value,
  hint
}: {
  label: string
  value: string
  hint?: string
}): JSX.Element {
  return (
    <div className="card">
      <span className="card__label">{label}</span>
      <span className="card__value">{value}</span>
      {hint && <span className="card__hint">{hint}</span>}
    </div>
  )
}

export function Dashboard({ snapshot }: { snapshot: Snapshot }): JSX.Element {
  const [showRaw, setShowRaw] = useState(false)
  const s = snapshot
  const activeHeroes = s.heroes.filter((h) => h.active)
  const nextCube = nextCubeMilestone(s.cubeLevel)

  return (
    <div className="dashboard">
      <div className="grid">
        <Card label="Ouro" value={fmtNum(s.gold)} />
        <Card
          label="Estagio atual"
          value={s.stage ? s.stage.raw : '—'}
          hint={s.stage ? s.stage.label : undefined}
        />
        <Card
          label="Onda"
          value={s.currentWave !== null ? String(s.currentWave) : '—'}
          hint={s.currentWave === 0 ? 'clear' : undefined}
        />
        <Card
          label="Estagio maximo"
          value={s.maxCompletedStage ? s.maxCompletedStage.raw : '—'}
          hint={s.maxCompletedStage ? s.maxCompletedStage.label : undefined}
        />
        <Card
          label="Cubo"
          value={s.cubeLevel !== null ? `Nv ${s.cubeLevel}` : '—'}
          hint={
            s.cubeLevel === null
              ? undefined
              : nextCube
                ? `Próx: Nv ${nextCube.level} · ${nextCube.name}`
                : 'tudo desbloqueado'
          }
        />
        <Card label="Baus" value={fmtNum(s.boxQuantity)} />
        <Card
          label="Herois ativos"
          value={activeHeroes.length ? String(activeHeroes.length) : String(s.heroes.length || '—')}
        />
        <Card label="Tempo de jogo" value={fmtPlayTime(s.playTimeSeconds)} />
      </div>

      {s.cubeLevel !== null && (
        <section className="section">
          <h3 className="section__title">Marcos do Cubo</h3>
          {nextCube ? (
            <div className="alert alert--info">
              Cubo <strong>Nv {s.cubeLevel}</strong> — faltam{' '}
              <strong>{nextCube.level - s.cubeLevel}</strong> nível(is) para{' '}
              <strong>
                Nv {nextCube.level} · {nextCube.name}
              </strong>
            </div>
          ) : (
            <div className="alert alert--ok">Todos os marcos do Cubo desbloqueados.</div>
          )}
          <ul className="milestones">
            {CUBE_MILESTONES.map((m) => {
              const reached = isMilestoneReached(m, s.cubeLevel)
              const isNext = nextCube?.level === m.level
              const cls =
                'milestone' +
                (reached ? ' milestone--reached' : '') +
                (isNext ? ' milestone--next' : '')
              return (
                <li key={m.level} className={cls}>
                  <span className="milestone__mark">{reached ? '✓' : isNext ? '→' : '•'}</span>
                  <span className="milestone__lvl">Nv {m.level}</span>
                  <span className="milestone__name">{m.name}</span>
                  <span className="milestone__desc">{m.description}</span>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {s.heroes.length > 0 && (
        <section className="section">
          <h3 className="section__title">Herois</h3>
          <table className="table">
            <thead>
              <tr>
                <th>Herói</th>
                <th>Nível</th>
                <th>XP</th>
                <th>Desbloqueado</th>
                <th>Ativo</th>
              </tr>
            </thead>
            <tbody>
              {s.heroes.map((h, i) => (
                <tr key={`${h.key}-${i}`}>
                  <td>
                    {h.name} <span className="card__hint">({String(h.key)})</span>
                  </td>
                  <td>{h.level ?? '—'}</td>
                  <td>{fmtNum(h.exp)}</td>
                  <td>{h.unlocked ? 'sim' : '—'}</td>
                  <td>{h.active ? 'sim' : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      <section className="section">
        <button className="btn btn--ghost" onClick={() => setShowRaw((v) => !v)}>
          {showRaw ? 'Ocultar' : 'Ver'} JSON bruto (calibracao)
        </button>
        <p className="card__hint">
          Atualizado {new Date(s.capturedAt).toLocaleTimeString('pt-BR')}
        </p>
        {showRaw && (
          <pre className="raw">{JSON.stringify(s.raw, null, 2)?.slice(0, 20000)}</pre>
        )}
      </section>
    </div>
  )
}
