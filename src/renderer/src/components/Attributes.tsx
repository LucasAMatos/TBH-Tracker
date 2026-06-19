import { useMemo, useState } from 'react'
import { heroByKey } from '@shared/heroes'
import { attrHeroes, attrTitle, heroAttributeTree } from '@shared/attributes'
import type { AttrNodeView } from '@shared/attributes'
import type { HeroAttributeLevel } from '@shared/types'
import { heroPortrait } from '../data/heroPortraits'
import { attributeIcon } from '../data/attributeIcons'

function NodeCard({ view }: { view: AttrNodeView }): JSX.Element {
  const { node, level } = view
  const icon = attributeIcon(node.icon)
  const allocated = level > 0
  return (
    <div className={`attrnode${allocated ? ' attrnode--on' : ''}`}>
      <div className="attrnode__head">
        {icon ? (
          <img className="attrnode__icon" src={icon} alt="" />
        ) : (
          <span className="attrnode__icon attrnode__icon--ph">{node.kind === 'active' ? '✦' : '◆'}</span>
        )}
        <div className="attrnode__titles">
          <span className="attrnode__name">{attrTitle(node)}</span>
          <span className={`attrnode__kind attrnode__kind--${node.kind}`}>
            {node.kind === 'active' ? 'Ativa' : 'Passiva'}
          </span>
        </div>
        <span className="attrnode__lvl">
          {level}/{node.max}
        </span>
      </div>
      <p className="attrnode__effect">{view.effect}</p>
      {allocated && <p className="attrnode__perlevel">{view.perLevel}</p>}
    </div>
  )
}

export function Attributes({
  heroAttributes
}: {
  heroAttributes: HeroAttributeLevel[]
}): JSX.Element {
  const heroes = useMemo(() => attrHeroes(), [])

  // Herói inicial: o primeiro com pontos alocados; senão o primeiro do catálogo.
  const firstWithPoints = useMemo(() => {
    for (const h of heroes) {
      const tree = heroAttributeTree(h, heroAttributes)
      if (tree.allocatedNodes > 0) return h
    }
    return heroes[0]
  }, [heroes, heroAttributes])

  const [hero, setHero] = useState<number>(firstWithPoints)
  const active = heroes.includes(hero) ? hero : firstWithPoints
  const tree = useMemo(() => heroAttributeTree(active, heroAttributes), [active, heroAttributes])

  return (
    <div className="attrs">
      <aside className="attrs__heroes">
        {heroes.map((h) => {
          const meta = heroByKey(h)
          const portrait = heroPortrait(h)
          const t = heroAttributeTree(h, heroAttributes)
          return (
            <button
              key={h}
              className={`attrs__hero${h === active ? ' attrs__hero--active' : ''}`}
              onClick={() => setHero(h)}
            >
              {portrait ? (
                <img className="attrs__heroimg" src={portrait} alt="" />
              ) : (
                <span className="attrs__heroimg attrs__heroimg--ph">{meta?.namePt?.[0] ?? '?'}</span>
              )}
              <span className="attrs__heroname">{meta?.namePt ?? `Herói ${h}`}</span>
              <span className="attrs__heropts">{t.totalAllocated} pts</span>
            </button>
          )
        })}
      </aside>

      <section className="attrs__content">
        <div className="attrs__summary">
          <h2 className="attrs__title">{heroByKey(active)?.namePt ?? `Herói ${active}`}</h2>
          <span className="attrs__meta">
            {tree.allocatedNodes}/{tree.totalNodes} nós · {tree.totalAllocated} pontos alocados
          </span>
        </div>

        {tree.totalAllocated === 0 && (
          <p className="attrs__hint">
            Nenhum ponto de atributo alocado para este herói no save lido (ou o save não traz a
            árvore). Os nós abaixo mostram o efeito por ponto.
          </p>
        )}

        <div className="attrs__grid">
          {tree.columns.map((col) => (
            <div className="attrs__col" key={col.grp}>
              <div className="attrs__colhead">Grupo {col.grp % 100 || col.grp}</div>
              {col.nodes.map((v) => (
                <NodeCard key={v.node.id} view={v} />
              ))}
            </div>
          ))}
        </div>

        <p className="attrs__note">
          Valores vêm do datamine (por ponto). O cálculo do stat final do herói (base + nível +
          árvore + equipamento + runas + pets) é o modelo de stats (H10), ainda no backlog.
        </p>
      </section>
    </div>
  )
}
