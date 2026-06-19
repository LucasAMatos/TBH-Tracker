import { useMemo, useRef, useState } from 'react'
import {
  formatRuneEffect,
  investedGold,
  nextLevelGoldCost,
  runeColor,
  RUNE_CATEGORY_META,
  summarizeRunes
} from '@shared/runes'
import { RUNE_BOUNDS, RUNE_EDGES, RUNE_NODES, type RuneNode } from '@shared/runeTree'
import type { RuneLevel } from '@shared/types'
import { runeIcon } from '../data/runeIcons'

const PAD = 80
const NODE_R = 26

interface View {
  x: number
  y: number
  w: number
  h: number
}

const FULL_VIEW: View = {
  x: RUNE_BOUNDS.minX - PAD,
  y: RUNE_BOUNDS.minY - PAD,
  w: RUNE_BOUNDS.maxX - RUNE_BOUNDS.minX + PAD * 2,
  h: RUNE_BOUNDS.maxY - RUNE_BOUNDS.minY + PAD * 2
}

function fmtGold(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}M`
  if (n >= 1_000) return `${(n / 1_000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}k`
  return String(n)
}

function DetailPanel({
  node,
  level,
  isTarget,
  onSetTarget
}: {
  node: RuneNode | null
  level: number
  isTarget: boolean
  onSetTarget: (key: number | null) => void
}): JSX.Element {
  if (!node) {
    return <p className="card__hint">Clique em uma runa no mapa para ver detalhes.</p>
  }
  const meta = RUNE_CATEGORY_META[node.category]
  const next = nextLevelGoldCost(node, level)
  const invested = investedGold(node, level)
  const icon = runeIcon(node.icon)
  return (
    <div className="rune-detail">
      <div className="rune-detail__head">
        {icon && <img className="rune-detail__icon" src={icon} alt="" />}
        <div>
          <div className="rune-detail__name">{node.name}</div>
          <span className="rune-badge" style={{ borderColor: meta.color, color: meta.color }}>
            {meta.label}
          </span>
        </div>
      </div>
      <p className="rune-detail__effect">{formatRuneEffect(node, level || 1)}</p>
      <div className="rune-detail__rows">
        <div>
          <span className="card__label">Nível</span>
          <span className="rune-detail__val">
            {level} / {node.maxLevel}
          </span>
        </div>
        <div>
          <span className="card__label">{level >= node.maxLevel ? 'Investido' : 'Próximo nível'}</span>
          <span className="rune-detail__val">
            {level >= node.maxLevel
              ? invested > 0
                ? `${fmtGold(invested)} ouro`
                : '—'
              : next > 0
                ? `${fmtGold(next)} ouro`
                : '—'}
          </span>
        </div>
      </div>
      <button
        className={`btn btn--sm ${isTarget ? 'btn--ghost' : 'btn--primary'}`}
        onClick={() => onSetTarget(isTarget ? null : node.key)}
      >
        {isTarget ? 'Remover alvo' : 'Definir como alvo'}
      </button>
      {isTarget && (
        <p className="card__hint">
          Esta é a runa-alvo — veja quanto ouro falta no card do Dashboard.
        </p>
      )}
    </div>
  )
}

export function RuneTree({
  levels,
  target,
  onSetTarget
}: {
  levels: RuneLevel[]
  target: number | null
  onSetTarget: (key: number | null) => void
}): JSX.Element {
  const [view, setView] = useState<View>(FULL_VIEW)
  const [selected, setSelected] = useState<number | null>(null)
  const svgRef = useRef<SVGSVGElement | null>(null)
  const drag = useRef<{ x: number; y: number } | null>(null)

  const levelByKey = useMemo(() => new Map(levels.map((l) => [l.key, l.level])), [levels])
  const progress = useMemo(() => summarizeRunes(levels), [levels])
  const selectedNode = selected != null ? RUNE_NODES.find((n) => n.key === selected) ?? null : null

  const nodeByKey = useMemo(() => new Map(RUNE_NODES.map((n) => [n.key, n])), [])

  const pxToWorld = (dx: number, dy: number): { dx: number; dy: number } => {
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return { dx: 0, dy: 0 }
    return { dx: (dx / rect.width) * view.w, dy: (dy / rect.height) * view.h }
  }

  const onWheel = (e: React.WheelEvent): void => {
    e.preventDefault()
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return
    const factor = e.deltaY > 0 ? 1.12 : 1 / 1.12
    const newW = Math.min(FULL_VIEW.w * 1.5, Math.max(400, view.w * factor))
    const newH = newW * (view.h / view.w)
    // mantém o ponto sob o cursor fixo
    const cx = view.x + ((e.clientX - rect.left) / rect.width) * view.w
    const cy = view.y + ((e.clientY - rect.top) / rect.height) * view.h
    const rx = (cx - view.x) / view.w
    const ry = (cy - view.y) / view.h
    setView({ x: cx - rx * newW, y: cy - ry * newH, w: newW, h: newH })
  }

  const onMouseDown = (e: React.MouseEvent): void => {
    drag.current = { x: e.clientX, y: e.clientY }
  }
  const onMouseMove = (e: React.MouseEvent): void => {
    if (!drag.current) return
    const d = pxToWorld(drag.current.x - e.clientX, drag.current.y - e.clientY)
    drag.current = { x: e.clientX, y: e.clientY }
    setView((v) => ({ ...v, x: v.x + d.dx, y: v.y + d.dy }))
  }
  const endDrag = (): void => {
    drag.current = null
  }

  return (
    <div className="rune-view">
      <div className="rune-view__head">
        <div className="rune-summary">
          <div className="rune-summary__main">
            <strong>{progress.ownedNodes}</strong> / {progress.totalNodes} nós
            <span className="card__hint"> · {progress.maxedNodes} no máx.</span>
          </div>
          <div className="rune-summary__cats">
            {Object.entries(progress.byCategory)
              .filter(([, v]) => v.total > 0)
              .map(([cat, v]) => {
                const meta = RUNE_CATEGORY_META[cat as keyof typeof RUNE_CATEGORY_META]
                return (
                  <span className="rune-chip" key={cat} title={meta.label}>
                    <span className="rune-chip__dot" style={{ background: meta.color }} />
                    {meta.label} {v.owned}/{v.total}
                  </span>
                )
              })}
          </div>
        </div>
        <button className="btn btn--ghost btn--sm" onClick={() => setView(FULL_VIEW)}>
          Resetar zoom
        </button>
      </div>

      <div className="rune-view__body">
        <svg
          ref={svgRef}
          className="rune-canvas"
          viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`}
          onWheel={onWheel}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={endDrag}
          onMouseLeave={endDrag}
        >
          <g>
            {RUNE_EDGES.map((e, i) => {
              const a = nodeByKey.get(e.from)
              const b = nodeByKey.get(e.to)
              if (!a || !b) return null
              const owned = (levelByKey.get(e.from) ?? 0) > 0 && (levelByKey.get(e.to) ?? 0) > 0
              return (
                <line
                  key={i}
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke={owned ? '#3fb95080' : '#2d3748'}
                  strokeWidth={owned ? 4 : 3}
                />
              )
            })}
          </g>
          <g>
            {RUNE_NODES.map((n) => {
              const lv = levelByKey.get(n.key) ?? 0
              const owned = lv > 0
              const maxed = owned && lv >= n.maxLevel
              const isSel = n.key === selected
              const isTarget = n.key === target
              const color = runeColor(n)
              const icon = runeIcon(n.icon)
              return (
                <g
                  key={n.key}
                  transform={`translate(${n.x},${n.y})`}
                  className="rune-node"
                  onClick={() => setSelected(n.key)}
                >
                  {isTarget && (
                    <circle r={NODE_R + 10} fill="none" stroke="#ffb020" strokeWidth={3} strokeDasharray="6 5">
                      <animateTransform
                        attributeName="transform"
                        type="rotate"
                        from="0"
                        to="360"
                        dur="12s"
                        repeatCount="indefinite"
                      />
                    </circle>
                  )}
                  <circle
                    r={NODE_R + 3}
                    fill="#0d1117"
                    stroke={isSel ? '#ffb020' : maxed ? color : owned ? color : '#2d3748'}
                    strokeWidth={isSel ? 5 : owned ? 4 : 2}
                    opacity={owned ? 1 : 0.55}
                  />
                  {icon && (
                    <image
                      href={icon}
                      x={-NODE_R}
                      y={-NODE_R}
                      width={NODE_R * 2}
                      height={NODE_R * 2}
                      opacity={owned ? 1 : 0.35}
                      style={{ pointerEvents: 'none' }}
                    />
                  )}
                  {owned && n.maxLevel > 1 && (
                    <text className="rune-node__lv" y={NODE_R + 18} textAnchor="middle">
                      {lv}/{n.maxLevel}
                    </text>
                  )}
                </g>
              )
            })}
          </g>
        </svg>

        <aside className="rune-view__side">
          <DetailPanel
            node={selectedNode}
            level={selectedNode ? levelByKey.get(selectedNode.key) ?? 0 : 0}
            isTarget={selectedNode != null && selectedNode.key === target}
            onSetTarget={onSetTarget}
          />
          <p className="card__hint rune-view__hint">
            Arraste para mover · roda do mouse para zoom. Catálogo: taskbarhero.wiki.
          </p>
        </aside>
      </div>
    </div>
  )
}
