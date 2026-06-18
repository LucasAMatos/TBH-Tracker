import { Fragment, useMemo, useState } from 'react'
import { CATEGORY_LABELS, GRADES, type GearCategory } from '@shared/items'
import {
  ITEM_LOCATION_LABELS,
  type InventoryRow,
  type InventorySummary,
  type ItemLocation
} from '@shared/types'

function fmt(n: number): string {
  return new Intl.NumberFormat('pt-BR').format(n)
}

type Scope = 'all' | ItemLocation

// Contagens por raridade da linha, no escopo (localização) selecionado.
function scopedCounts(row: InventoryRow, scope: Scope): number[] {
  return scope === 'all' ? row.counts : row.byLocation[scope]
}

const CATEGORY_ORDER: GearCategory[] = ['weapon', 'offhand', 'armor', 'accessory']

interface Derived {
  rows: { row: InventoryRow; counts: number[]; total: number }[]
  byGrade: number[] // total de gear por raridade no escopo
  gearTotal: number
  legendaryPlus: number
  maxCell: number // maior valor de célula (para escalar a intensidade)
}

function derive(summary: InventorySummary, scope: Scope): Derived {
  const byGrade = new Array(summary.gradeCount).fill(0)
  let gearTotal = 0
  let legendaryPlus = 0
  let maxCell = 0
  const rows = summary.rows
    .map((row) => {
      const counts = scopedCounts(row, scope)
      const total = counts.reduce((a, b) => a + b, 0)
      counts.forEach((c, tier) => {
        byGrade[tier] += c
        if (c > maxCell) maxCell = c
        if (GRADES[tier]?.marketable) legendaryPlus += c
      })
      gearTotal += total
      return { row, counts, total }
    })
    .filter((r) => r.total > 0)
  return { rows, byGrade, gearTotal, legendaryPlus, maxCell }
}

function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }): JSX.Element {
  return (
    <div className="invstat">
      <span className="invstat__label">{label}</span>
      <span className="invstat__value">{value}</span>
      {hint && <span className="invstat__hint">{hint}</span>}
    </div>
  )
}

function RarityBars({ byGrade, total }: { byGrade: number[]; total: number }): JSX.Element {
  const max = Math.max(1, ...byGrade)
  return (
    <div className="raritybars">
      {GRADES.map((g) => {
        const count = byGrade[g.tier] ?? 0
        const pct = total > 0 ? Math.round((count / total) * 100) : 0
        return (
          <div className="raritybar" key={g.id} title={`${g.namePt}: ${fmt(count)} (${pct}%)`}>
            <div className="raritybar__track">
              <div
                className="raritybar__fill"
                style={{
                  height: `${count > 0 ? Math.max(6, (count / max) * 100) : 0}%`,
                  background: g.color
                }}
              />
            </div>
            <span className="raritybar__count">{count > 0 ? fmt(count) : '·'}</span>
            <span className="raritybar__name" style={{ color: g.color }}>
              {g.namePt}
            </span>
          </div>
        )
      })}
    </div>
  )
}

function Matrix({ derived }: { derived: Derived }): JSX.Element {
  const { rows, byGrade, maxCell, gearTotal } = derived

  // Agrupa as linhas por categoria para um cabeçalho de seção dentro da tabela.
  const groups = CATEGORY_ORDER.map((cat) => ({
    cat,
    items: rows.filter((r) => r.row.category === cat)
  })).filter((g) => g.items.length > 0)

  return (
    <div className="invmatrix__wrap">
      <table className="invmatrix">
        <thead>
          <tr>
            <th className="invmatrix__corner">Tipo</th>
            {GRADES.map((g) => (
              <th
                key={g.id}
                className={`invmatrix__grade${g.marketable ? ' invmatrix__grade--mkt' : ''}`}
                title={g.marketable ? `${g.namePt} · vendável no Market` : g.namePt}
              >
                <span className="invmatrix__dot" style={{ background: g.color }} />
                {g.namePt}
              </th>
            ))}
            <th className="invmatrix__total">Total</th>
          </tr>
        </thead>
        <tbody>
          {groups.map((group) => (
            <Fragment key={`cat-${group.cat}`}>
              <tr className="invmatrix__cat">
                <td colSpan={GRADES.length + 2}>{CATEGORY_LABELS[group.cat]}</td>
              </tr>
              {group.items.map(({ row, counts, total }) => (
                <tr key={row.gearType}>
                  <th className="invmatrix__rowhead">{row.label}</th>
                  {GRADES.map((g) => {
                    const c = counts[g.tier] ?? 0
                    const intensity = maxCell > 0 && c > 0 ? 0.12 + (c / maxCell) * 0.6 : 0
                    return (
                      <td
                        key={g.id}
                        className={`invmatrix__cell${c === 0 ? ' invmatrix__cell--empty' : ''}${
                          g.marketable && c > 0 ? ' invmatrix__cell--mkt' : ''
                        }`}
                        style={c > 0 ? { background: hexA(g.color, intensity) } : undefined}
                      >
                        {c > 0 ? fmt(c) : '·'}
                      </td>
                    )
                  })}
                  <td className="invmatrix__total">{fmt(total)}</td>
                </tr>
              ))}
            </Fragment>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <th className="invmatrix__rowhead">Total</th>
            {GRADES.map((g) => (
              <td key={g.id} className="invmatrix__total">
                {byGrade[g.tier] > 0 ? fmt(byGrade[g.tier]) : '·'}
              </td>
            ))}
            <td className="invmatrix__total invmatrix__total--grand">{fmt(gearTotal)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}

// Converte uma cor hex (#rrggbb) em rgba com alfa, para tingir as células da matriz.
function hexA(hex: string, alpha: number): string {
  const m = hex.replace('#', '')
  const r = parseInt(m.slice(0, 2), 16)
  const g = parseInt(m.slice(2, 4), 16)
  const b = parseInt(m.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(3)})`
}

export function Inventory({ inventory }: { inventory: InventorySummary | null }): JSX.Element {
  const [scope, setScope] = useState<Scope>('all')

  const derived = useMemo(
    () => (inventory ? derive(inventory, scope) : null),
    [inventory, scope]
  )

  if (!inventory || inventory.totalItems === 0) {
    return (
      <div className="inventory">
        <section className="section">
          <div className="section__head">
            <h3 className="section__title">Inventário</h3>
          </div>
          <div className="alert alert--info">
            Sem itens no save lido. A distribuição por tipo e raridade aparece quando o
            save é lido e há itens em `itemSaveDatas`.
          </div>
        </section>
      </div>
    )
  }

  // Escopos de localização que têm pelo menos um item (além de "Tudo").
  const scopes: Scope[] = [
    'all',
    ...(['equipped', 'inventory', 'stash', 'trading', 'loose'] as ItemLocation[]).filter(
      (loc) => inventory.locationTotals[loc] > 0
    )
  ]

  const d = derived as Derived

  return (
    <div className="inventory">
      <section className="section">
        <div className="section__head">
          <h3 className="section__title">Inventário · tipo × raridade</h3>
          <span className="card__hint">
            {fmt(inventory.gearCount)} equipamentos · {fmt(inventory.totalItems)} itens no total
          </span>
        </div>

        <div className="invstats">
          <StatCard label="Equipamentos" value={fmt(inventory.gearCount)} />
          <StatCard
            label="Legendary+"
            value={fmt(inventory.legendaryPlus)}
            hint="vendável no Market"
          />
          <StatCard label="Materiais" value={fmt(inventory.materialCount)} />
          {inventory.boxCount > 0 && <StatCard label="Baús" value={fmt(inventory.boxCount)} />}
          {inventory.unknownCount > 0 && (
            <StatCard
              label="Desconhecidos"
              value={fmt(inventory.unknownCount)}
              hint="fora do catálogo"
            />
          )}
        </div>

        <div className="invscopes">
          {scopes.map((s) => {
            const label = s === 'all' ? 'Tudo' : ITEM_LOCATION_LABELS[s]
            const count =
              s === 'all' ? inventory.totalItems : inventory.locationTotals[s]
            return (
              <button
                key={s}
                type="button"
                className={`chip${scope === s ? ' chip--active' : ''}`}
                onClick={() => setScope(s)}
              >
                {label} <span className="chip__count">{fmt(count)}</span>
              </button>
            )
          })}
        </div>
      </section>

      <section className="section">
        <div className="section__head">
          <h3 className="section__title">Distribuição por raridade</h3>
          <span className="card__hint">
            {scope === 'all' ? 'Todos os locais' : ITEM_LOCATION_LABELS[scope as ItemLocation]} ·{' '}
            {fmt(d.gearTotal)} equipamentos
          </span>
        </div>
        {d.gearTotal > 0 ? (
          <RarityBars byGrade={d.byGrade} total={d.gearTotal} />
        ) : (
          <div className="alert alert--info">Nenhum equipamento neste local.</div>
        )}
      </section>

      <section className="section">
        <div className="section__head">
          <h3 className="section__title">Matriz tipo × raridade</h3>
          <span className="card__hint">
            Colunas Legendary+ destacadas (vendáveis). Células tingidas pela raridade.
          </span>
        </div>
        {d.rows.length > 0 ? (
          <Matrix derived={d} />
        ) : (
          <div className="alert alert--info">Nenhum equipamento neste local.</div>
        )}
        <p className="card__hint">
          Raridade não escala por área (só o nível do item). Apenas Legendary+ é vendável no
          Steam Market. Materiais e baús não entram na matriz de equipamentos.
        </p>
      </section>
    </div>
  )
}
