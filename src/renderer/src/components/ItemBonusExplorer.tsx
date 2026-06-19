import { useMemo, useState } from 'react'
import { GRADES } from '@shared/items'
import {
  affixRep,
  gradeSlotTotal,
  modsForStat,
  statLine,
  statRange,
  STAT_LIST,
  type ModType
} from '@shared/stats'

type ModFilter = 'all' | ModType

function fmt(n: number): string {
  return new Intl.NumberFormat('pt-BR', {
    maximumFractionDigits: Number.isInteger(n) ? 0 : 2
  }).format(n)
}

// Renderiza a linha do status com a faixa min–max no lugar do template {0}.
function lineWithRange(id: string): string {
  const line = statLine(id)
  const r = statRange(id)
  const token = r ? (r.min === r.max ? fmt(r.min) : `${fmt(r.min)}–${fmt(r.max)}`) : 'X'
  return line.includes('{0}') ? line.replace('{0}', token) : line
}

// Tipos de modificador de um status (FLAT/ADDITIVE) → rótulo PT.
function modLabel(id: string): string | null {
  const types = new Set(modsForStat(id).map((m) => m.modType))
  if (types.size === 0) return null
  const parts: string[] = []
  if (types.has('FLAT')) parts.push('fixo')
  if (types.has('ADDITIVE')) parts.push('percentual')
  return parts.join(' / ')
}

/**
 * Explorador interativo dos bônus de itens (U11): lista de seleção dos status (catálogo D4)
 * com busca e filtro por tipo de modificador, mostrando a faixa de valor de cada bônus.
 */
export function ItemBonusExplorer(): JSX.Element {
  const [query, setQuery] = useState('')
  const [modFilter, setModFilter] = useState<ModFilter>('all')

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return STAT_LIST.filter((s) => {
      if (q) {
        const hay = `${s.name} ${s.line} ${s.id}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      if (modFilter !== 'all') {
        const types = new Set(modsForStat(s.id).map((m) => m.modType))
        if (!types.has(modFilter)) return false
      }
      return true
    })
  }, [query, modFilter])

  const filters: { id: ModFilter; label: string }[] = [
    { id: 'all', label: 'Todos' },
    { id: 'FLAT', label: 'Fixo' },
    { id: 'ADDITIVE', label: 'Percentual' }
  ]

  return (
    <div className="bonusx">
      <div className="bonusx__toolbar">
        <input
          className="input bonusx__search"
          type="search"
          placeholder="Buscar bônus (ex.: armadura, crítico, ouro)…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="bonusx__chips">
          {filters.map((f) => (
            <button
              key={f.id}
              className={`chip${modFilter === f.id ? ' chip--active' : ''}`}
              onClick={() => setModFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>
        <span className="bonusx__count">{rows.length} bônus</span>
      </div>

      <ul className="bonusx__list">
        {rows.map((s) => {
          const rep = affixRep(s.id)
          const mod = modLabel(s.id)
          return (
            <li className="bonusx__row" key={s.id}>
              <div className="bonusx__main">
                <span className="bonusx__name">{s.name}</span>
                <span className="bonusx__line">{lineWithRange(s.id)}</span>
              </div>
              <div className="bonusx__tags">
                {mod && <span className="bonusx__tag">{mod}</span>}
                {rep && <span className="bonusx__tag bonusx__tag--tier">tier {rep.tier}</span>}
              </div>
            </li>
          )
        })}
        {rows.length === 0 && <li className="bonusx__empty">Nenhum bônus encontrado.</li>}
      </ul>

      <div className="bonusx__slots">
        <h4 className="bonusx__slotstitle">Slots de afixo por raridade</h4>
        <div className="bonusx__slotchips">
          {GRADES.map((g) => {
            const total = gradeSlotTotal(g.id)
            return (
              <span className="raritychip" key={g.id} title={`${g.namePt}: ${total} slot(s)`}>
                <span className="raritychip__dot" style={{ background: g.color }} />
                <span className="raritychip__name" style={{ color: g.color }}>
                  {g.namePt}
                </span>
                <span className="raritychip__count">{total}</span>
              </span>
            )
          })}
        </div>
      </div>
    </div>
  )
}
