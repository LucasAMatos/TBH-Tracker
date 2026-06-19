import { useEffect, useState } from 'react'
import {
  boxAutoOpenSeconds,
  boxColor,
  boxDrainSeconds,
  classifyBoxBacklog,
  DEFAULT_BOX_THRESHOLDS,
  type BoxBacklogLevel,
  type BoxThresholds
} from '@shared/boxes'
import { CUBE_MILESTONES, isMilestoneReached, nextCubeMilestone } from '@shared/cube'
import { planRuneTarget, RUNE_CATEGORY_META } from '@shared/runes'
import type {
  BoxCount,
  GoldFlow,
  HeroEvents,
  HeroSnapshot,
  RuneTargetPlan,
  Snapshot,
  StageEvents
} from '@shared/types'
import { heroPortrait } from '../data/heroPortraits'
import { runeIcon } from '../data/runeIcons'

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
  // Os tipos auto-abrem em paralelo, então o acúmulo todo zera no tipo mais lento (B3).
  const drains = boxes
    .map((b) => boxDrainSeconds(b.kind, b.quantity))
    .filter((s): s is number => s !== null)
  const fullClear = drains.length > 0 ? Math.max(...drains) : null
  const manualBoxes = boxes
    .filter((b) => boxAutoOpenSeconds(b.kind) === null)
    .reduce((sum, b) => sum + b.quantity, 0)
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
        {boxes.map((b) => {
          const drain = boxDrainSeconds(b.kind, b.quantity)
          return (
            <div className="boxchip" key={b.kind}>
              <span className="boxchip__dot" style={{ background: boxColor(b.kind) }} />
              <div>
                <div className="boxchip__qty">{fmtNum(b.quantity)}</div>
                <div className="boxchip__meta">
                  {b.label} · {fmtAutoOpen(boxAutoOpenSeconds(b.kind))}
                </div>
                <div className="boxchip__eta">
                  {drain !== null
                    ? `≈ esvazia em ${fmtDuration(drain)}`
                    : b.quantity > 0
                      ? 'abrir manualmente'
                      : 'vazio'}
                </div>
              </div>
            </div>
          )
        })}
      </div>
      {fullClear !== null && (
        <p className="card__hint">
          No auto-abrir base (sem runas do Extremo Norte), o acúmulo esvazia em ~
          {fmtDuration(fullClear)}.
          {manualBoxes > 0 &&
            ` Baús de Ato (${fmtNum(manualBoxes)}) não têm auto-abrir — abra manualmente.`}
        </p>
      )}
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

function LevelUpsSection({ heroEvents }: { heroEvents: HeroEvents }): JSX.Element {
  const events = heroEvents.levelUps
  return (
    <section className="section">
      <h3 className="section__title">Level-ups</h3>
      {events.length > 0 ? (
        <ul className="goldlog">
          {events.map((e) => (
            <li className="goldlog__item" key={`${e.at}-${e.heroKey}-${e.toLevel}`}>
              <span className="goldlog__time">{fmtClock(e.at)}</span>
              <span className="levelup__hero">{e.heroName}</span>
              <span className="levelup__delta">
                Nv {e.fromLevel} → {e.toLevel}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="card__hint">
          Coletando… os level-ups aparecem conforme os heróis sobem de nível (o jogo precisa
          estar rodando). Só registra a partir da 1ª leitura da sessão.
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

function RuneTargetSection({ plan }: { plan: RuneTargetPlan }): JSX.Element {
  const meta = RUNE_CATEGORY_META[plan.category]
  const icon = runeIcon(plan.targetIcon)
  const pct = Math.round(plan.progress * 100)
  const done = plan.alreadyComplete || (plan.goldHave !== null && plan.goldMissing <= 0)
  const readyCount = plan.steps.filter((step) => step.affordable).length
  return (
    <section className="section">
      <h3 className="section__title">Runa-alvo</h3>
      <div className={`runetarget ${done ? 'runetarget--done' : ''}`}>
        <div className="runetarget__head">
          {icon && <img className="runetarget__icon" src={icon} alt="" />}
          <div className="runetarget__id">
            <div className="runetarget__name">{plan.targetName}</div>
            <span className="rune-badge" style={{ borderColor: meta.color, color: meta.color }}>
              {meta.label}
            </span>
            <span className="runetarget__lvl">
              Nv {plan.currentLevel} / {plan.maxLevel}
            </span>
          </div>
        </div>

        {plan.alreadyComplete ? (
          <p className="runetarget__msg runetarget__msg--ok">Runa-alvo já está no nível máximo. ✓</p>
        ) : !plan.reachable ? (
          <p className="runetarget__msg">
            Não foi possível traçar o caminho de pré-requisitos desta runa.
          </p>
        ) : (
          <>
            <div className="runetarget__nums">
              <div>
                <span className="card__label">Custo total</span>
                <span className="runetarget__val">{fmtNum(plan.totalGoldCost)}</span>
              </div>
              <div>
                <span className="card__label">Ouro atual</span>
                <span className="runetarget__val">{fmtNum(plan.goldHave)}</span>
              </div>
              <div>
                <span className="card__label">{done ? 'Pode comprar' : 'Falta'}</span>
                <span className={`runetarget__val ${done ? 'runetarget__val--ok' : ''}`}>
                  {done ? '✓' : fmtNum(plan.goldMissing)}
                </span>
              </div>
            </div>
            <div className="runetarget__bar">
              <div
                className={`runetarget__fill ${done ? 'runetarget__fill--ok' : ''}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="card__hint">
              {pct}% do ouro necessário · {plan.steps.length} passo(s) no caminho
              {readyCount > 0 && ` · ${readyCount} já dá pra comprar em sequência`}
              {plan.hasNonGold && ' · alguns pré-requisitos custam soul stones (não contados no ouro)'}
            </p>
            {plan.steps.length > 0 && (
              <ul className="runetarget__steps">
                {plan.steps.map((step) => (
                  <li
                    className={`runetarget__step ${step.affordable ? 'runetarget__step--ready' : ''}`}
                    key={step.key}
                  >
                    {runeIcon(step.icon) && (
                      <img className="runetarget__stepicon" src={runeIcon(step.icon)} alt="" />
                    )}
                    <span className="runetarget__stepname">
                      {step.name}
                      {step.isTarget && <span className="runetarget__steptag">alvo</span>}
                      {step.affordable && (
                        <span className="runetarget__steptag runetarget__steptag--ready">
                          ✓ dá pra comprar
                        </span>
                      )}
                    </span>
                    <span className="runetarget__steplvl">
                      Nv {step.fromLevel} → {step.toLevel}
                    </span>
                    <span className="runetarget__stepcost">
                      {step.payableInGold ? `${fmtNum(step.goldCost)} ouro` : 'soul stones'}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
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
              {heroPortrait(h.key) && (
                <img className="heroavatar heroavatar--sm" src={heroPortrait(h.key)} alt="" />
              )}
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

export function Dashboard({
  snapshot,
  runeTarget
}: {
  snapshot: Snapshot
  runeTarget: number | null
}): JSX.Element {
  const [showRaw, setShowRaw] = useState(false)
  const [boxThresholds, setBoxThresholds] = useState<BoxThresholds>(DEFAULT_BOX_THRESHOLDS)
  const s = snapshot
  const runePlan =
    runeTarget !== null ? planRuneTarget(runeTarget, s.runes, s.gold) : null
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

      {runePlan && <RuneTargetSection plan={runePlan} />}

      {flow && <GoldFlowSection flow={flow} />}

      {s.heroEvents && <LevelUpsSection heroEvents={s.heroEvents} />}

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
