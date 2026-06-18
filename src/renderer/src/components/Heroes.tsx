import { useState } from 'react'
import {
  HERO_CATALOG,
  HERO_STAT_DEFS,
  heroStatRank,
  type HeroCatalogEntry,
  type HeroTier
} from '@shared/heroes'
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

function HeroTag({ row }: { row: HeroRow }): JSX.Element {
  if (row.active) return <span className="herotag herotag--active">Ativo · Slot {row.slot}</span>
  if (row.unlocked) return <span className="herotag herotag--unlocked">Desbloqueado</span>
  return <span className="herotag herotag--locked">Bloqueado</span>
}

function HeroCard({ row, onOpen }: { row: HeroRow; onOpen: () => void }): JSX.Element {
  const { catalog: c } = row
  const cls =
    'herocard herocard--btn' +
    (row.active ? ' herocard--active' : '') +
    (!row.unlocked ? ' herocard--locked' : '')

  return (
    <button type="button" className={cls} onClick={onOpen}>
      <header className="herocard__head">
        <div className="herocard__title">
          <span className="herocard__name">{c.namePt}</span>
          <span className={`tierbadge tierbadge--${c.tier.toLowerCase()}`}>Tier {c.tier}</span>
        </div>
        <div className="herocard__tags">
          <HeroTag row={row} />
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
        <div className="herostat">
          <span className="herostat__label">HP</span>
          <span className="herostat__value">{c.baseStats.hp}</span>
        </div>
        <div className="herostat">
          <span className="herostat__label">ATK</span>
          <span className="herostat__value">{c.baseStats.atk}</span>
        </div>
        <div className="herostat">
          <span className="herostat__label">Crít.</span>
          <span className="herostat__value">{c.baseStats.crit}%</span>
        </div>
        <div className="herostat">
          <span className="herostat__label">DPS</span>
          <span className="herostat__value">{c.dps}</span>
        </div>
      </div>

      <span className="herocard__cta">Ver detalhes →</span>
    </button>
  )
}

function StatRow({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <div className="statrow">
      <span className="statrow__label">{label}</span>
      <span className="statrow__value">{value}</span>
    </div>
  )
}

function TierBlock({ tier, heroLevel }: { tier: HeroTier; heroLevel: number | null }): JSX.Element {
  const reachable = heroLevel !== null && !tier.locked && heroLevel >= tier.unlockCost
  const cls =
    'tier' + (tier.locked ? ' tier--locked' : '') + (reachable ? ' tier--reachable' : '')

  return (
    <div className={cls}>
      <div className="tier__head">
        <span className="tier__name">Tier {tier.tier}</span>
        <span className="tier__cost">
          {tier.unlockCost === 0 ? 'Início' : `${tier.unlockCost} pts`}
        </span>
        {tier.locked && <span className="tier__lock">🔒 Bloqueado</span>}
        {reachable && !tier.locked && <span className="tier__ok">Alcançável</span>}
      </div>
      <ul className="tier__skills">
        {tier.skills.map((s, i) => (
          <li key={i} className={`skill skill--${s.kind}`}>
            <span className={`skill__kind skill__kind--${s.kind}`}>
              {s.kind === 'active' ? 'Ativa' : 'Passiva'}
            </span>
            <span className="skill__name">{s.name}</span>
            <span className="skill__max">nív. máx. {s.maxLevel}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function HeroDetail({ row, onBack }: { row: HeroRow; onBack: () => void }): JSX.Element {
  const c = row.catalog
  const skillPoints = row.level // 1 ponto por nível

  return (
    <div className="herodetail">
      <button type="button" className="btn btn--ghost herodetail__back" onClick={onBack}>
        ← Voltar ao roster
      </button>

      <section className="section">
        <div className="herodetail__head">
          <div className="herodetail__title">
            <span className="herocard__name">{c.namePt}</span>
            <span className="herodetail__en">{c.name}</span>
            <span className={`tierbadge tierbadge--${c.tier.toLowerCase()}`}>Tier {c.tier}</span>
            <HeroTag row={row} />
          </div>
          <p className="herocard__meta">
            {c.role} · {c.weapon} + {c.offHand} · {c.availability} · {c.unlock}
          </p>
          <p className="herodetail__desc">{c.description}</p>
        </div>

        <div className="herodetail__live">
          <div className="kv">
            <span className="herostat__label">Nível</span>
            <span className="kv__val">{row.level ?? '—'}</span>
          </div>
          <div className="kv">
            <span className="herostat__label">XP</span>
            <span className="kv__val">{fmtNum(row.exp)}</span>
          </div>
          <div className="kv">
            <span className="herostat__label">Pontos de habilidade</span>
            <span className="kv__val">{skillPoints ?? '—'}</span>
          </div>
          <div className="kv">
            <span className="herostat__label">DPS base</span>
            <span className="kv__val">{c.dps}</span>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section__head">
          <h3 className="section__title">Atributos base</h3>
          <span className="card__hint">Ranking entre os 6 heróis · ★ = melhor</span>
        </div>
        <div className="statgrid">
          {HERO_STAT_DEFS.map((def) => {
            const value = c.baseStats[def.key]
            const rk = heroStatRank(def.key, value)
            return (
              <div key={def.key} className={`statcard${rk.best ? ' statcard--best' : ''}`}>
                <div className="statcard__top">
                  <StatRow label={def.label} value={def.format(value)} />
                </div>
                <span className={`rankbadge${rk.best ? ' rankbadge--best' : ''}`}>
                  {rk.best ? '★ ' : ''}#{rk.rank} de {rk.total}
                </span>
              </div>
            )
          })}
        </div>
        <p className="card__hint">
          Valores base (nível 1, sem equipamento). Equipamentos, runas e a árvore aumentam os
          atributos.
        </p>
      </section>

      <section className="section">
        <div className="section__head">
          <h3 className="section__title">Árvore de habilidades</h3>
          <span className="card__hint">Tiers 1–8 · 1 ponto por nível · tiers abrem ao gastar</span>
        </div>
        <div className="tiers">
          {c.skillTree.map((tier) => (
            <TierBlock key={tier.tier} tier={tier} heroLevel={row.level} />
          ))}
        </div>
      </section>
    </div>
  )
}

export function Heroes({
  heroes,
  arrangedKeys
}: {
  heroes: HeroSnapshot[]
  arrangedKeys: (number | string)[]
}): JSX.Element {
  const [selected, setSelected] = useState<number | null>(null)
  const rows = buildRows(heroes, arrangedKeys)
  const activeCount = rows.filter((r) => r.active).length
  const unlockedCount = rows.filter((r) => r.unlocked).length
  const hasSave = heroes.length > 0

  const selectedRow = selected !== null ? rows.find((r) => r.catalog.key === selected) : undefined

  if (selectedRow) {
    return (
      <div className="heroes">
        <HeroDetail row={selectedRow} onBack={() => setSelected(null)} />
      </div>
    )
  }

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
            <HeroCard key={row.catalog.key} row={row} onOpen={() => setSelected(row.catalog.key)} />
          ))}
        </div>
        <p className="card__hint">
          Clique em um herói para ver os atributos com ranking entre os 6 e a árvore de habilidades.
        </p>
      </section>
    </div>
  )
}
