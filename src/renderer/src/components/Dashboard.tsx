import { useEffect, useState } from 'react'
import {
  boxAutoOpenSeconds,
  boxColor,
  classifyBoxBacklog,
  DEFAULT_BOX_THRESHOLDS,
  type BoxBacklogLevel,
  type BoxThresholds
} from '@shared/boxes'
import { CUBE_MILESTONES, isMilestoneReached, nextCubeMilestone } from '@shared/cube'
import type { BoxCount, GoldFlow, HeroSnapshot, Snapshot, StageEvents } from '@shared/types'

// A formação do TBH tem 3 slots de herói ativo (arrangedHeroKey).
const HERO_SLOTS = 3

function fmtNum(n: number | null): string {
  if (n === null || n === undefined) return '—'
  return new Intl.NumberFormat('pt-BR').format(n)
}

/** Número com sinal explícito (+/−) e separador pt-BR. */
function fmtSigned(n: number): string {
  const sign = n > 0 ? '+' : n < 0 ? '−' : ''
  return `${sign}${new Intl.NumberFormat('pt-BR').format(Math.abs(Math.round(n)))}`
}

/** Taxa de ouro/h com sinal, ou '—' quando indisponível. */
function fmtRate(perHour: number | null): string {
  if (perHour === null || perHour === undefined) return '—'
  return `${fmtSigned(perHour)}/h`
}

function fmtClock(at: number): string {
  return new Date(at).toLocaleTimeString('pt-BR')
}

function fmtPlayTime(seconds: number | null): string {
  if (seconds === null) return '—'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return `${h}h ${m}m`
}

function fmtAutoOpen(seconds: number | null): string {
  if (seconds === null) return 'sem auto-abrir'
  return `auto-abrir ${seconds}s`
}

function Card({
  label,
  value,
  hint,
  tone
}: {
  label: string
  value: string
  hint?: string
  tone?: 'warn' | 'alert'
}): JSX.Element {
  const cls = tone ? `card card--${tone}` : 'card'
  return (
    <div className={cls}>
      <span className="card__label">{label}</span>
      <span className="card__value">{value}</span>
      {hint && <span className="card__hint">{hint}</span>}
    </div>
  )
}

const BACKLOG_TONE: Record<BoxBacklogLevel, 'warn' | 'alert' | undefined> = {
  ok: undefined,
  warn: 'warn',
  high: 'alert'
}

function ThresholdEditor({
  thresholds,
  onSave
}: {
  thresholds: BoxThresholds
  onSave: (warn: number, high: number) => void
}): JSX.Element {
  const [open, setOpen] = useState(false)
  const [warn, setWarn] = useState(String(thresholds.warn))
  const [high, setHigh] = useState(String(thresholds.high))

  useEffect(() => {
    setWarn(String(thresholds.warn))
    setHigh(String(thresholds.high))
  }, [thresholds.warn, thresholds.high])

  const apply = (): void => {
    onSave(Number(warn), Number(high))
    setOpen(false)
  }

  if (!open) {
    return (
      <button className="btn btn--ghost btn--sm" onClick={() => setOpen(true)}>
        Ajustar limiares
      </button>
    )
  }

  return (
    <div className="threshold">
      <label className="threshold__field">
        Avisar a partir de
        <input
          className="input input--sm"
          type="number"
          min={1}
          value={warn}
          onChange={(e) => setWarn(e.target.value)}
        />
      </label>
      <label className="threshold__field">
        Alerta a partir de
        <input
          className="input input--sm"
          type="number"
          min={1}
          value={high}
          onChange={(e) => setHigh(e.target.value)}
        />
      </label>
      <button className="btn btn--primary btn--sm" onClick={apply}>
        Salvar
      </button>
      <button className="btn btn--ghost btn--sm" onClick={() => setOpen(false)}>
        Cancelar
      </button>
    </div>
  )
}

function BoxesSection({
  boxes,
  total,
  level,
  thresholds,
  onSaveThresholds
}: {
  boxes: BoxCount[]
  total: number | null
  level: BoxBacklogLevel
  thresholds: BoxThresholds
  onSaveThresholds: (warn: number, high: number) => void
}): JSX.Element | null {
  if (boxes.length === 0) return null
  return (
    <section className="section">
      <div className="section__head">
        <h3 className="section__title">Baús por tipo</h3>
        <ThresholdEditor thresholds={thresholds} onSave={onSaveThresholds} />
      </div>
      {level !== 'ok' && (
        <div className={`alert ${level === 'high' ? 'alert--err' : 'alert--warn'}`}>
          {level === 'high'
            ? `Muitos baús não abertos (${fmtNum(total)}) — risco de perder drops se o inventário/stash encher. `
            : `Baús acumulando (${fmtNum(total)}). `}
          Abra-os ou garanta o auto-abrir (runas do Extremo Norte) e espaço de inventário/stash.
        </div>
      )}
      <div className="boxbar">
        {boxes.map((b) => (
          <div className="boxchip" key={b.kind}>
            <span className="boxchip__dot" style={{ background: boxColor(b.kind) }} />
            <div>
              <div className="boxchip__qty">{fmtNum(b.quantity)}</div>
              <div className="boxchip__meta">
                {b.label} · {fmtAutoOpen(boxAutoOpenSeconds(b.kind))}
              </div>
            </div>
          </div>
        ))}
      </div>
      <p className="card__hint">
        Avisa a partir de {thresholds.warn} e alerta a partir de {thresholds.high} baús (não há
        teto fixo no jogo).
      </p>
    </section>
  )
}

function GoldFlowSection({ flow }: { flow: GoldFlow }): JSX.Element {
  const hasEvents = flow.events.length > 0
  return (
    <section className="section">
      <h3 className="section__title">Fluxo de ouro</h3>
      <div className="goldflow__rates">
        <div className="goldflow__rate">
          <span className="card__label">Ouro/h (janela {flow.windowSeconds}s)</span>
          <span
            className={`goldflow__rate-val ${
              (flow.windowRatePerHour ?? 0) < 0 ? 'goldflow__neg' : ''
            }`}
          >
            {fmtRate(flow.windowRatePerHour)}
          </span>
        </div>
        <div className="goldflow__rate">
          <span className="card__label">Ouro/h (sessão)</span>
          <span
            className={`goldflow__rate-val ${
              (flow.sessionRatePerHour ?? 0) < 0 ? 'goldflow__neg' : ''
            }`}
          >
            {fmtRate(flow.sessionRatePerHour)}
          </span>
        </div>
        <div className="goldflow__rate">
          <span className="card__label">Líquido da sessão</span>
          <span className={`goldflow__rate-val ${flow.netDelta < 0 ? 'goldflow__neg' : ''}`}>
            {fmtSigned(flow.netDelta)}
          </span>
        </div>
      </div>
      {hasEvents ? (
        <ul className="goldlog">
          {flow.events.map((e) => (
            <li className="goldlog__item" key={`${e.at}-${e.gold}`}>
              <span className="goldlog__time">{fmtClock(e.at)}</span>
              <span className={`goldlog__delta ${e.delta < 0 ? 'goldflow__neg' : ''}`}>
                {fmtSigned(e.delta)}
              </span>
              <span className="goldlog__total">total {fmtNum(e.gold)}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="card__hint">
          Coletando… os eventos de ouro aparecem conforme o save é atualizado (o jogo precisa
          estar rodando). Gasto (ex.: runas) aparece como valor negativo.
        </p>
      )}
    </section>
  )
}

function StageEventsSection({ stageEvents }: { stageEvents: StageEvents }): JSX.Element {
  const events = stageEvents.events
  return (
    <section className="section">
      <h3 className="section__title">Progresso de estágio</h3>
      {events.length > 0 ? (
        <ul className="goldlog">
          {events.map((e) => (
            <li className="goldlog__item" key={`${e.at}-${e.kind}-${e.toRaw}`}>
              <span className="goldlog__time">{fmtClock(e.at)}</span>
              <span className="stageevt__label">
                <span
                  className={`stageevt__badge stageevt__badge--${
                    e.kind === 'new-max' ? 'max' : 'change'
                  }`}
                >
                  {e.kind === 'new-max' ? 'novo recorde' : 'troca'}
                </span>
                {e.toLabel}
              </span>
              <span className="goldlog__total">{e.toRaw}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="card__hint">
          Coletando… os eventos aparecem ao trocar de estágio ou bater um novo estágio máximo
          (o jogo precisa estar rodando). Só registra a partir da 1ª leitura da sessão.
        </p>
      )}
    </section>
  )
}

function ActiveHeroesSection({ slots }: { slots: (HeroSnapshot | null)[] }): JSX.Element {
  return (
    <section className="section">
      <h3 className="section__title">Heróis ativos</h3>
      <div className="heroslots">
        {slots.map((h, i) =>
          h ? (
            <div className="heroslot" key={`${h.key}-${i}`}>
              <span className="heroslot__slot">Slot {i + 1}</span>
              <span className="heroslot__name">{h.name}</span>
              <span className="heroslot__meta">Nível {h.level ?? '—'}</span>
            </div>
          ) : (
            <div className="heroslot heroslot--empty" key={`empty-${i}`}>
              <span className="heroslot__slot">Slot {i + 1}</span>
              <span className="heroslot__name">Vazio</span>
              <span className="heroslot__meta">slot livre</span>
            </div>
          )
        )}
      </div>
      <p className="card__hint">Roster completo (todos os 6 heróis) vai para a aba Heróis (H5).</p>
    </section>
  )
}

export function Dashboard({ snapshot }: { snapshot: Snapshot }): JSX.Element {
  const [showRaw, setShowRaw] = useState(false)
  const [boxThresholds, setBoxThresholds] = useState<BoxThresholds>(DEFAULT_BOX_THRESHOLDS)
  const s = snapshot
  const activeHeroes = s.heroes.filter((h) => h.active)
  // Slots da formação na ordem de arrangedHeroKey; preenche com null os slots vazios (-1).
  const heroSlots: (HeroSnapshot | null)[] = Array.from({ length: HERO_SLOTS }, (_, i) => {
    const key = s.arrangedHeroKeys[i]
    if (key === undefined) return null
    return s.heroes.find((h) => String(h.key) === String(key)) ?? null
  })
  const nextCube = nextCubeMilestone(s.cubeLevel)
  const boxLevel = classifyBoxBacklog(s.boxQuantity, boxThresholds)
  const flow = s.goldFlow
  const goldRate = flow ? flow.windowRatePerHour ?? flow.sessionRatePerHour : null

  useEffect(() => {
    let mounted = true
    window.tbh.getBoxThresholds().then((t) => {
      if (mounted && t) setBoxThresholds(t)
    })
    return () => {
      mounted = false
    }
  }, [])

  const saveBoxThresholds = (warn: number, high: number): void => {
    window.tbh.setBoxThresholds(warn, high).then((t) => {
      if (t) setBoxThresholds(t)
    })
  }

  return (
    <div className="dashboard">
      <div className="grid">
        <Card
          label="Ouro"
          value={fmtNum(s.gold)}
          hint={goldRate !== null ? fmtRate(goldRate) : undefined}
        />
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
        <Card
          label="Baús"
          value={fmtNum(s.boxQuantity)}
          hint={
            boxLevel === 'high' ? 'transbordando' : boxLevel === 'warn' ? 'acumulando' : undefined
          }
          tone={BACKLOG_TONE[boxLevel]}
        />
        <Card
          label="Herois ativos"
          value={`${activeHeroes.length} / ${HERO_SLOTS}`}
          hint={s.heroes.length ? `${s.heroes.length} no roster` : undefined}
        />
        <Card label="Tempo de jogo" value={fmtPlayTime(s.playTimeSeconds)} />
      </div>

      {flow && <GoldFlowSection flow={flow} />}

      {s.stageEvents && <StageEventsSection stageEvents={s.stageEvents} />}

      <BoxesSection
        boxes={s.boxes}
        total={s.boxQuantity}
        level={boxLevel}
        thresholds={boxThresholds}
        onSaveThresholds={saveBoxThresholds}
      />

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

      {s.heroes.length > 0 && <ActiveHeroesSection slots={heroSlots} />}

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
