import { HERO_CATALOG, type HeroCatalogEntry } from '@shared/heroes'
import type { HeroSnapshot } from '@shared/types'

function fmtNum(n: number | null | undefined): string {
  if (n === null || n === undefined) return '—'
  return new Intl.NumberFormat('pt-BR').format(n)
}

interface HeroRow {
  catalog: HeroCatalogEntry
  level: number | null
  exp: number | null
  unlocked: boolean
  active: boolean
  /** Posição (1..3) na formação; null se não estiver ativo. */
  slot: number | null
}

function buildRows(heroes: HeroSnapshot[], arrangedKeys: (number | string)[]): HeroRow[] {
  const bySaveKey = new Map(heroes.map((h) => [String(h.key), h]))
  const slotOf = new Map(arrangedKeys.map((k, i) => [String(k), i + 1]))

  return HERO_CATALOG.map((catalog) => {
    const save = bySaveKey.get(String(catalog.key))
    const slot = slotOf.get(String(catalog.key)) ?? null
    return {
      catalog,
      level: save?.level ?? null,
      exp: save?.exp ?? null,
      unlocked: save?.unlocked ?? false,
      active: save?.active ?? false,
      slot
    }
  })
}

function StatCell({ label, value }: { label: string; value: string | number }): JSX.Element {
  return (
    <div className="herostat">
      <span className="herostat__label">{label}</span>
      <span className="herostat__value">{value}</span>
    </div>
  )
}

function HeroCard({ row }: { row: HeroRow }): JSX.Element {
  const { catalog: c } = row
  const cls =
    'herocard' +
    (row.active ? ' herocard--active' : '') +
    (!row.unlocked ? ' herocard--locked' : '')

  return (
    <article className={cls}>
      <header className="herocard__head">
        <div className="herocard__title">
          <span className="herocard__name">{c.name}</span>
          <span className={`tierbadge tierbadge--${c.tier.toLowerCase()}`}>Tier {c.tier}</span>
        </div>
        <div className="herocard__tags">
          {row.active ? (
            <span className="herotag herotag--active">Ativo · Slot {row.slot}</span>
          ) : row.unlocked ? (
            <span className="herotag herotag--unlocked">Desbloqueado</span>
          ) : (
            <span className="herotag herotag--locked">Bloqueado</span>
          )}
        </div>
      </header>

      <p className="herocard__meta">
        {c.role} · {c.weapon} · {c.availability}
      </p>

      <div className="herocard__progress">
        <div>
          <span className="herostat__label">Nível</span>
          <span className="herocard__level">{row.level ?? '—'}</span>
        </div>
        <div>
          <span className="herostat__label">XP</span>
          <span className="herocard__exp">{fmtNum(row.exp)}</span>
        </div>
      </div>

      <div className="herostats">
        <StatCell label="HP" value={c.baseStats.hp} />
        <StatCell label="ATK" value={c.baseStats.atk} />
        <StatCell label="Crít." value={c.baseStats.crit} />
        <StatCell label="Armadura" value={c.baseStats.armor} />
        <StatCell label="Vel. atq." value={c.baseStats.atkSpd} />
      </div>
    </article>
  )
}

export function Heroes({
  heroes,
  arrangedKeys
}: {
  heroes: HeroSnapshot[]
  arrangedKeys: (number | string)[]
}): JSX.Element {
  const rows = buildRows(heroes, arrangedKeys)
  const activeCount = rows.filter((r) => r.active).length
  const unlockedCount = rows.filter((r) => r.unlocked).length
  const hasSave = heroes.length > 0

  return (
    <div className="heroes">
      <section className="section">
        <div className="section__head">
          <h3 className="section__title">Roster de heróis</h3>
          <span className="card__hint">
            {activeCount} ativo(s) · {unlockedCount}/{HERO_CATALOG.length} desbloqueado(s)
          </span>
        </div>
        {!hasSave && (
          <div className="alert alert--info">
            Sem dados do save — mostrando o catálogo dos 6 heróis. Nível, XP e estado
            (desbloqueado/ativo) aparecem quando o save é lido.
          </div>
        )}
        <div className="herogrid">
          {rows.map((row) => (
            <HeroCard key={row.catalog.key} row={row} />
          ))}
        </div>
        <p className="card__hint">
          Stats são os valores base (nível 1) do datamine; escalam com o nível no jogo.
        </p>
      </section>
    </div>
  )
}
