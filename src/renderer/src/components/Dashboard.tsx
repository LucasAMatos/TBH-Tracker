import { useEffect, useState, type ReactNode } from 'react'
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
import { GRADES } from '@shared/items'
import { petById, petEffectLines, petUnlockLabel } from '@shared/pets'
import { PET_LIST } from '@shared/petData'
import { planRuneTarget, RUNE_CATEGORY_META } from '@shared/runes'
import {
  DEFAULT_DASHBOARD_LAYOUT,
  type BoxCount,
  type DashboardLayout,
  type GoldFlow,
  type HeroEvents,
  type HeroSnapshot,
  type InventorySummary,
  type PetSnapshot,
  type RuneTargetPlan,
  type Snapshot,
  type StageEvents,
  type WidgetId
} from '@shared/types'
import { DASHBOARD_WIDGETS, WIDGET_TITLES } from '../data/dashboardWidgets'
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

function BoxesBody({
  boxes,
  total,
  level,
  thresholds
}: {
  boxes: BoxCount[]
  total: number | null
  level: BoxBacklogLevel
  thresholds: BoxThresholds
}): JSX.Element {
  // Os tipos auto-abrem em paralelo, então o acúmulo todo zera no tipo mais lento (B3).
  const drains = boxes
    .map((b) => boxDrainSeconds(b.kind, b.quantity))
    .filter((s): s is number => s !== null)
  const fullClear = drains.length > 0 ? Math.max(...drains) : null
  const manualBoxes = boxes
    .filter((b) => boxAutoOpenSeconds(b.kind) === null)
    .reduce((sum, b) => sum + b.quantity, 0)
  return (
    <>
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
    </>
  )
}

function GoldFlowBody({ flow }: { flow: GoldFlow }): JSX.Element {
  const hasEvents = flow.events.length > 0
  return (
    <>
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
    </>
  )
}

function LevelUpsBody({ heroEvents }: { heroEvents: HeroEvents }): JSX.Element {
  const events = heroEvents.levelUps
  return events.length > 0 ? (
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
      Coletando… os level-ups aparecem conforme os heróis sobem de nível (o jogo precisa estar
      rodando). Só registra a partir da 1ª leitura da sessão.
    </p>
  )
}

function StageEventsBody({ stageEvents }: { stageEvents: StageEvents }): JSX.Element {
  const events = stageEvents.events
  return events.length > 0 ? (
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
      Coletando… os eventos aparecem ao trocar de estágio ou bater um novo estágio máximo (o jogo
      precisa estar rodando). Só registra a partir da 1ª leitura da sessão.
    </p>
  )
}

function RuneTargetBody({ plan }: { plan: RuneTargetPlan }): JSX.Element {
  const meta = RUNE_CATEGORY_META[plan.category]
  const icon = runeIcon(plan.targetIcon)
  const pct = Math.round(plan.progress * 100)
  const done = plan.alreadyComplete || (plan.goldHave !== null && plan.goldMissing <= 0)
  const readyCount = plan.steps.filter((step) => step.affordable).length
  return (
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
  )
}

function CubeMilestonesBody({
  cubeLevel,
  nextCube
}: {
  cubeLevel: number
  nextCube: { level: number; name: string } | null
}): JSX.Element {
  return (
    <>
      {nextCube ? (
        <div className="alert alert--info">
          Cubo <strong>Nv {cubeLevel}</strong> — faltam{' '}
          <strong>{nextCube.level - cubeLevel}</strong> nível(is) para{' '}
          <strong>
            Nv {nextCube.level} · {nextCube.name}
          </strong>
        </div>
      ) : (
        <div className="alert alert--ok">Todos os marcos do Cubo desbloqueados.</div>
      )}
      <ul className="milestones">
        {CUBE_MILESTONES.map((m) => {
          const reached = isMilestoneReached(m, cubeLevel)
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
    </>
  )
}

function ActiveHeroesBody({ slots }: { slots: (HeroSnapshot | null)[] }): JSX.Element {
  return (
    <>
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
    </>
  )
}

// D2: resumo de raridade do inventário no Dashboard (fora da aba Inventário), com destaque
// para os equipamentos Legendary+ (vendáveis no Market). Usa o catálogo de raridade (items.ts).
function InventoryRarityBody({ inventory }: { inventory: InventorySummary }): JSX.Element {
  // Soma por raridade (escopo "tudo") a partir das linhas da matriz tipo × raridade.
  const byGrade = new Array(inventory.gradeCount).fill(0) as number[]
  for (const row of inventory.rows) {
    row.counts.forEach((c, tier) => (byGrade[tier] += c))
  }
  const gearTotal = byGrade.reduce((a, b) => a + b, 0)
  // Só raridades presentes, da mais alta para a mais baixa (destaque às raras).
  const present = GRADES.filter((g) => (byGrade[g.tier] ?? 0) > 0).sort((a, b) => b.tier - a.tier)

  return (
    <>
      <div className={`rarityhi${inventory.legendaryPlus > 0 ? ' rarityhi--on' : ''}`}>
        <span className="rarityhi__count">{fmtNum(inventory.legendaryPlus)}</span>
        <span className="rarityhi__label">
          Legendary+ <span className="rarityhi__sub">vendável no Market</span>
        </span>
        <span className="rarityhi__total">{fmtNum(gearTotal)} equipamentos</span>
      </div>
      {gearTotal > 0 ? (
        <div className="raritystrip">
          {present.map((g) => {
            const count = byGrade[g.tier] ?? 0
            const pct = Math.round((count / gearTotal) * 100)
            return (
              <div
                className={`raritychip${g.marketable ? ' raritychip--mkt' : ''}`}
                key={g.id}
                title={`${g.namePt}: ${fmtNum(count)} (${pct}%)`}
              >
                <span className="raritychip__dot" style={{ background: g.color }} />
                <span className="raritychip__name" style={{ color: g.color }}>
                  {g.namePt}
                </span>
                <span className="raritychip__count">{fmtNum(count)}</span>
              </div>
            )
          })}
        </div>
      ) : (
        <p className="card__hint">Sem equipamentos no save lido.</p>
      )}
      <p className="card__hint">
        Detalhe completo (tipo × raridade, por local) na aba Inventário. Apenas Legendary+ é
        vendável no Steam Market.
      </p>
    </>
  )
}

// PE1: progresso de pets (desbloqueado/bloqueado) + bônus do pet ATIVO. O bônus não é
// cumulativo: apenas o pet equipado concede seu efeito. Catálogo (nome/efeitos) em petData.ts.
function PetsBody({ pets }: { pets: PetSnapshot[] }): JSX.Element {
  const unlockedSet = new Set(pets.filter((p) => p.unlocked).map((p) => p.key))
  const total = PET_LIST.length
  const activeKey = pets.find((p) => p.active && p.unlocked)?.key ?? null
  const activePet = activeKey !== null ? petById(activeKey) : undefined
  // Lista os 8 pets do catálogo (ordem fixa), marcando o estado do save.
  const rows = PET_LIST.map((def) => ({
    def,
    unlocked: unlockedSet.has(def.key),
    active: def.key === activeKey
  }))

  return (
    <>
      <div className={`petshi${unlockedSet.size > 0 ? ' petshi--on' : ''}`}>
        <span className="petshi__count">
          {unlockedSet.size}/{total}
        </span>
        <span className="petshi__label">pets desbloqueados</span>
      </div>

      {activePet ? (
        <div className="petsbonus">
          <h4 className="petsbonus__title">Bônus ativo · {activePet.name}</h4>
          <ul className="petsbonus__list">
            {petEffectLines(activePet).map((line, i) => (
              <li className="petsbonus__item" key={i}>
                {line}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="card__hint">
          O bônus não é cumulativo: apenas o pet ativo (equipado) concede seu efeito
          {unlockedSet.size > 0 ? ' — equipe um pet no jogo.' : '. Nenhum pet desbloqueado ainda.'}
        </p>
      )}

      <ul className="petslist">
        {rows.map(({ def, unlocked, active }) => (
          <li
            className={`petrow${unlocked ? ' petrow--on' : ''}${active ? ' petrow--active' : ''}`}
            key={def.key}
          >
            <span
              className="petrow__state"
              title={active ? 'Ativo (equipado)' : unlocked ? 'Desbloqueado' : 'Bloqueado'}
            >
              {active ? '★' : unlocked ? '✓' : '🔒'}
            </span>
            <div className="petrow__main">
              <span className="petrow__name">{def.name}</span>
              <span className="petrow__effects">{petEffectLines(def).join(' · ')}</span>
            </div>
            <span className="petrow__unlock">{petUnlockLabel(def.unlock)}</span>
          </li>
        ))}
      </ul>
    </>
  )
}

// I7: o JSON bruto é lido sob demanda (IPC `getRawSave`) só quando este widget abre,
// em vez de viajar no snapshot a cada atualização do save.
function RawJsonBody(): JSX.Element {
  const [raw, setRaw] = useState<unknown | null>(null)
  const [loading, setLoading] = useState(false)
  const [fetchedAt, setFetchedAt] = useState<number | null>(null)

  const load = (): void => {
    setLoading(true)
    window.tbh.getRawSave().then((r) => {
      setRaw(r ?? null)
      setFetchedAt(Date.now())
      setLoading(false)
    })
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <>
      <div className="raw__toolbar">
        <button className="btn btn--ghost btn--sm" onClick={load} disabled={loading}>
          {loading ? 'Carregando…' : 'Atualizar'}
        </button>
        <span className="card__hint">
          Lido sob demanda do save (não trafega a cada atualização).
          {fetchedAt && ` Lido ${new Date(fetchedAt).toLocaleTimeString('pt-BR')}.`}
        </span>
      </div>
      {raw !== null ? (
        <pre className="raw">{JSON.stringify(raw, null, 2)?.slice(0, 20000)}</pre>
      ) : (
        !loading && <p className="card__hint">Sem JSON disponível (sem save ou sem chave?).</p>
      )}
    </>
  )
}

/** Wrapper de seção do Dashboard: visibilidade (on/off) + cabeçalho colapsável (U10). */
function Widget({
  id,
  layout,
  onToggleCollapse,
  headerExtra,
  children
}: {
  id: WidgetId
  layout: DashboardLayout
  onToggleCollapse: (id: WidgetId) => void
  headerExtra?: ReactNode
  children: ReactNode
}): JSX.Element | null {
  if (layout.hidden.includes(id)) return null
  const collapsed = layout.collapsed.includes(id)
  return (
    <section className="section widget">
      <div className="widget__head">
        <button
          className="widget__toggle"
          onClick={() => onToggleCollapse(id)}
          aria-expanded={!collapsed}
        >
          <span className={`widget__chevron ${collapsed ? 'widget__chevron--collapsed' : ''}`}>
            ▾
          </span>
          <h3 className="section__title">{WIDGET_TITLES[id]}</h3>
        </button>
        {headerExtra && <div className="widget__actions">{headerExtra}</div>}
      </div>
      {!collapsed && <div className="widget__body">{children}</div>}
    </section>
  )
}

function CustomizePanel({
  layout,
  onToggleHidden,
  onRestore
}: {
  layout: DashboardLayout
  onToggleHidden: (id: WidgetId) => void
  onRestore: () => void
}): JSX.Element {
  return (
    <section className="section customize">
      <div className="customize__head">
        <h3 className="section__title">Personalizar Dashboard</h3>
        <button className="btn btn--ghost btn--sm" onClick={onRestore}>
          Restaurar padrão
        </button>
      </div>
      <div className="customize__list">
        {DASHBOARD_WIDGETS.map((w) => {
          const on = !layout.hidden.includes(w.id)
          return (
            <label className={`switch ${on ? 'switch--on' : ''}`} key={w.id}>
              <input
                className="switch__input"
                type="checkbox"
                checked={on}
                onChange={() => onToggleHidden(w.id)}
              />
              <span className="switch__track">
                <span className="switch__thumb" />
              </span>
              <span className="switch__label">{w.title}</span>
            </label>
          )
        })}
      </div>
      <p className="card__hint">
        Desligar um widget só o esconde do Dashboard. Widgets que dependem de dados (ex.: Runa-alvo,
        Cubo) só aparecem quando há o que mostrar.
      </p>
    </section>
  )
}

/** Adiciona/remove um id de uma lista (toggle imutável). */
function toggleIn(list: WidgetId[], id: WidgetId): WidgetId[] {
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id]
}

export function Dashboard({
  snapshot,
  runeTarget
}: {
  snapshot: Snapshot
  runeTarget: number | null
}): JSX.Element {
  const [boxThresholds, setBoxThresholds] = useState<BoxThresholds>(DEFAULT_BOX_THRESHOLDS)
  const [layout, setLayout] = useState<DashboardLayout>(DEFAULT_DASHBOARD_LAYOUT)
  const [customizing, setCustomizing] = useState(false)
  const s = snapshot
  const runePlan = runeTarget !== null ? planRuneTarget(runeTarget, s.runes, s.gold) : null
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
    window.tbh.getDashboardLayout().then((l) => {
      if (mounted && l) setLayout(l)
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

  // Persiste o layout no config do main e reflete a versão normalizada de volta.
  const persistLayout = (next: DashboardLayout): void => {
    setLayout(next)
    window.tbh.setDashboardLayout(next).then((saved) => {
      if (saved) setLayout(saved)
    })
  }

  const toggleHidden = (id: WidgetId): void =>
    persistLayout({ ...layout, hidden: toggleIn(layout.hidden, id) })
  const toggleCollapse = (id: WidgetId): void =>
    persistLayout({ ...layout, collapsed: toggleIn(layout.collapsed, id) })
  const restoreDefault = (): void => persistLayout(DEFAULT_DASHBOARD_LAYOUT)

  return (
    <div className="dashboard">
      <div className="dashboard__toolbar">
        <button
          className={`btn btn--ghost btn--sm ${customizing ? 'btn--active' : ''}`}
          onClick={() => setCustomizing((v) => !v)}
        >
          {customizing ? 'Fechar' : 'Personalizar'}
        </button>
      </div>

      {customizing && (
        <CustomizePanel layout={layout} onToggleHidden={toggleHidden} onRestore={restoreDefault} />
      )}

      <Widget id="cards" layout={layout} onToggleCollapse={toggleCollapse}>
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
      </Widget>

      {runePlan && (
        <Widget id="runeTarget" layout={layout} onToggleCollapse={toggleCollapse}>
          <RuneTargetBody plan={runePlan} />
        </Widget>
      )}

      {flow && (
        <Widget id="goldFlow" layout={layout} onToggleCollapse={toggleCollapse}>
          <GoldFlowBody flow={flow} />
        </Widget>
      )}

      {s.heroEvents && (
        <Widget id="levelUps" layout={layout} onToggleCollapse={toggleCollapse}>
          <LevelUpsBody heroEvents={s.heroEvents} />
        </Widget>
      )}

      {s.stageEvents && (
        <Widget id="stageProgress" layout={layout} onToggleCollapse={toggleCollapse}>
          <StageEventsBody stageEvents={s.stageEvents} />
        </Widget>
      )}

      {s.boxes.length > 0 && (
        <Widget
          id="boxes"
          layout={layout}
          onToggleCollapse={toggleCollapse}
          headerExtra={<ThresholdEditor thresholds={boxThresholds} onSave={saveBoxThresholds} />}
        >
          <BoxesBody boxes={s.boxes} total={s.boxQuantity} level={boxLevel} thresholds={boxThresholds} />
        </Widget>
      )}

      {s.inventory && s.inventory.gearCount > 0 && (
        <Widget id="inventoryRarity" layout={layout} onToggleCollapse={toggleCollapse}>
          <InventoryRarityBody inventory={s.inventory} />
        </Widget>
      )}

      {s.pets && s.pets.length > 0 && (
        <Widget id="pets" layout={layout} onToggleCollapse={toggleCollapse}>
          <PetsBody pets={s.pets} />
        </Widget>
      )}

      {s.cubeLevel !== null && (
        <Widget id="cubeMilestones" layout={layout} onToggleCollapse={toggleCollapse}>
          <CubeMilestonesBody cubeLevel={s.cubeLevel} nextCube={nextCube} />
        </Widget>
      )}

      {s.heroes.length > 0 && (
        <Widget id="activeHeroes" layout={layout} onToggleCollapse={toggleCollapse}>
          <ActiveHeroesBody slots={heroSlots} />
        </Widget>
      )}

      <Widget id="rawJson" layout={layout} onToggleCollapse={toggleCollapse}>
        <RawJsonBody />
      </Widget>
    </div>
  )
}
