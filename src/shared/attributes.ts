// Helpers da árvore de atributos por herói (H12; dado puro em attributeData.ts).
// Monta o layout por herói (colunas = grupos), formata o efeito de cada nó e cruza com os
// níveis alocados lidos do save (attributeSaveDatas → snapshot.heroAttributes).
import { ATTR_GROUPS, ATTR_NODES, type AttrNode } from './attributeData'
import type { HeroAttributeLevel } from './types'

function fmt(n: number): string {
  return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(n)
}

// Rótulos pt-BR dos tipos de habilidade ativa (act do datamine); fallback no próprio act.
const ACT_LABELS: Record<string, string> = {
  BASEATTACK: 'Ataque básico',
  BASEATTACK_COUNT: 'Ataque básico',
  COOLDOWN: 'Habilidade ativa'
}

export function actLabel(act: string | null | undefined): string {
  if (!act) return 'Habilidade ativa'
  return ACT_LABELS[act] ?? 'Habilidade ativa'
}

/** Rótulo do nó (passivo: nome do status; ativo: nome curto da habilidade). */
export function attrTitle(node: AttrNode): string {
  if (node.kind === 'active') return actLabel(node.act)
  return node.name ?? node.st ?? `Nó ${node.id}`
}

/** Linha-template do efeito com um valor preenchido (passivos). */
function fillLine(line: string | null | undefined, value: number, fallbackName: string): string {
  const tmpl = line ?? `${fallbackName} +{0}`
  return tmpl.includes('{0}') ? tmpl.replace('{0}', fmt(value)) : `${tmpl} ${fmt(value)}`
}

/** Efeito por ponto (passivo) ou faixa de escala (ativo), legível em pt-BR. */
export function attrPerLevel(node: AttrNode): string {
  if (node.kind === 'active') {
    const dmg = node.dmg ?? []
    if (dmg.length === 0) return '—'
    const first = dmg[0]
    const last = dmg[dmg.length - 1]
    return first === last ? `valor ${fmt(first)}` : `valor ${fmt(first)} → ${fmt(last)} por nível`
  }
  return fillLine(node.line, node.v ?? 0, attrTitle(node)) + ' por ponto'
}

/** Efeito acumulado no nível alocado (passivo: v×nível; ativo: valor do nível). */
export function attrEffectAtLevel(node: AttrNode, level: number): string {
  if (level <= 0) return attrPerLevel(node)
  if (node.kind === 'active') {
    const dmg = node.dmg ?? []
    const idx = Math.min(level, dmg.length) - 1
    const meta = [node.delivery, node.dmgType].filter(Boolean).join(' · ')
    const cd = node.cd != null ? ` · recarga ${node.cd}s` : ''
    return idx >= 0 ? `valor ${fmt(dmg[idx])}${meta ? ` (${meta})` : ''}${cd}` : meta || '—'
  }
  return fillLine(node.line, (node.v ?? 0) * level, attrTitle(node))
}

// --- Layout por herói ---

export interface AttrNodeView {
  node: AttrNode
  level: number // nível alocado (0 = não alocado)
  effect: string // efeito no nível atual (ou por ponto se 0)
  perLevel: string // efeito por ponto / escala
}

export interface AttrColumn {
  grp: number
  x: number
  nodes: AttrNodeView[]
}

export interface HeroAttrTree {
  hero: number
  columns: AttrColumn[]
  totalAllocated: number // soma dos níveis alocados
  allocatedNodes: number // nós com nível > 0
  totalNodes: number
}

/** Heróis presentes no catálogo de atributos (ordenados). */
export function attrHeroes(): number[] {
  return [...new Set(ATTR_NODES.map((n) => n.hero))].sort((a, b) => a - b)
}

/** Nós de um herói (ordenados por grupo e id). */
export function nodesForHero(hero: number): AttrNode[] {
  return ATTR_NODES.filter((n) => n.hero === hero).sort(
    (a, b) => a.gx - b.gx || a.id - b.id
  )
}

/**
 * Monta a árvore de atributos de um herói em colunas (uma por grupo), cruzando com os níveis
 * alocados (do save). `allocated` mapeia id do nó → nível.
 */
export function heroAttributeTree(
  hero: number,
  allocated: HeroAttributeLevel[]
): HeroAttrTree {
  const levelByKey = new Map<number, number>()
  for (const a of allocated) levelByKey.set(a.key, a.level)

  const colMap = new Map<number, AttrColumn>()
  let totalAllocated = 0
  let allocatedNodes = 0

  for (const node of nodesForHero(hero)) {
    const level = levelByKey.get(node.id) ?? 0
    if (level > 0) {
      totalAllocated += level
      allocatedNodes++
    }
    let col = colMap.get(node.grp)
    if (!col) {
      col = { grp: node.grp, x: node.gx, nodes: [] }
      colMap.set(node.grp, col)
    }
    col.nodes.push({
      node,
      level,
      effect: attrEffectAtLevel(node, level),
      perLevel: attrPerLevel(node)
    })
  }

  const columns = [...colMap.values()].sort((a, b) => a.x - b.x)
  const totalNodes = columns.reduce((sum, c) => sum + c.nodes.length, 0)
  return { hero, columns, totalAllocated, allocatedNodes, totalNodes }
}

export { ATTR_GROUPS, ATTR_NODES }
export type { AttrNode }
