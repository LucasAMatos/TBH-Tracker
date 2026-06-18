import { useMemo, useState } from 'react'
import { TBHPEDIA, type PediaSection, type PediaTable } from '../data/tbhpedia'

function PediaTableView({ table }: { table: PediaTable }): JSX.Element {
  return (
    <div className="pedia__tablewrap">
      {table.caption && <h4 className="pedia__caption">{table.caption}</h4>}
      <table className="table">
        <thead>
          <tr>
            {table.headers.map((h) => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td key={j}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function SectionView({ section }: { section: PediaSection }): JSX.Element {
  return (
    <article className="pedia__article">
      <h2 className="pedia__title">
        <span className="pedia__icon">{section.icon}</span> {section.title}
      </h2>
      {section.intro?.map((p, i) => (
        <p key={i} className="pedia__p">
          {p}
        </p>
      ))}
      {section.tables?.map((t, i) => (
        <PediaTableView key={i} table={t} />
      ))}
      {section.notes && section.notes.length > 0 && (
        <ul className="pedia__notes">
          {section.notes.map((n, i) => (
            <li key={i}>{n}</li>
          ))}
        </ul>
      )}
    </article>
  )
}

export function TbhPedia(): JSX.Element {
  const [activeId, setActiveId] = useState(TBHPEDIA[0].id)
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return TBHPEDIA
    return TBHPEDIA.filter((s) => {
      const haystack = [
        s.title,
        ...(s.intro ?? []),
        ...(s.notes ?? []),
        ...(s.tables ?? []).flatMap((t) => [
          t.caption ?? '',
          ...t.headers,
          ...t.rows.flat()
        ])
      ]
        .join(' ')
        .toLowerCase()
      return haystack.includes(q)
    })
  }, [query])

  const active = filtered.find((s) => s.id === activeId) ?? filtered[0]

  return (
    <div className="pedia">
      <aside className="pedia__nav">
        <input
          className="input pedia__search"
          type="search"
          placeholder="Buscar..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <nav>
          {filtered.map((s) => (
            <button
              key={s.id}
              className={`pedia__navitem ${active?.id === s.id ? 'pedia__navitem--active' : ''}`}
              onClick={() => setActiveId(s.id)}
            >
              <span className="pedia__icon">{s.icon}</span>
              {s.title}
            </button>
          ))}
          {filtered.length === 0 && <p className="pedia__empty">Nada encontrado.</p>}
        </nav>
      </aside>
      <section className="pedia__content">
        {active ? <SectionView section={active} /> : <p className="pedia__empty">Nada encontrado.</p>}
      </section>
    </div>
  )
}
