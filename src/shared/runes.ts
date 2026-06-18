// Lógica/derivações sobre o catálogo de runas (runeTree.ts é dado puro gerado).
import { RUNE_NODES, type RuneCategory, type RuneNode } from './runeTree'
import type { RuneLevel } from './types'

// Categorias oficiais do mapa público (taskbarherowiki.com), com rótulos pt-BR.
export const RUNE_CATEGORY_META: Record<RuneCategory, { label: string; color: string }> = {
  chests: { label: 'Baús', color: '#d2a24c' },
  hero: { label: 'Herói', color: '#f85149' },
  gold: { label: 'Ouro', color: '#ffb020' },
  exp: { label: 'EXP', color: '#3fb950' },
  slots: { label: 'Ranhuras', color: '#a371f7' },
  offline: { label: 'Offline', color: '#56d4dd' },
  cube: { label: 'Cubo', color: '#f778ba' },
  combat: { label: 'Combate', color: '#db6d28' }
}

export const TOTAL_RUNE_NODES = RUNE_NODES.length

const byKey = new Map<number, RuneNode>(RUNE_NODES.map((n) => [n.key, n]))

export function runeByKey(key: number): RuneNode | undefined {
  return byKey.get(key)
}

export function runeColor(node: RuneNode): string {
  return RUNE_CATEGORY_META[node.category].color
}

/** Texto do efeito no nível informado (usa o valor do nível; cai pro nível 1). */
export function formatRuneEffect(node: RuneNode, level: number): string {
  if (!node.values.length) return node.effect.replace('{0}', '?')
  const idx = Math.max(0, Math.min((level || 1) - 1, node.values.length - 1))
  return node.effect.replace('{0}', String(node.values[idx]))
}

/** Custo em ouro para subir do nível atual para o próximo (0 se não há ouro/maxado). */
export function nextLevelGoldCost(node: RuneNode, currentLevel: number): number {
  if (currentLevel >= node.maxLevel) return 0
  return node.goldCost[currentLevel] ?? 0
}

/** Soma de ouro já investido até o nível atual (custos acumulados em ouro). */
export function investedGold(node: RuneNode, currentLevel: number): number {
  let sum = 0
  for (let i = 0; i < Math.min(currentLevel, node.goldCost.length); i++) sum += node.goldCost[i] ?? 0
  return sum
}

export interface RuneProgress {
  ownedNodes: number
  totalNodes: number
  maxedNodes: number
  byCategory: Record<RuneCategory, { owned: number; total: number }>
}

/** Resume o progresso a partir dos níveis observados no save. */
export function summarizeRunes(levels: RuneLevel[]): RuneProgress {
  const levelByKey = new Map(levels.map((l) => [l.key, l.level]))
  const byCategory = Object.fromEntries(
    Object.keys(RUNE_CATEGORY_META).map((c) => [c, { owned: 0, total: 0 }])
  ) as RuneProgress['byCategory']

  let ownedNodes = 0
  let maxedNodes = 0
  for (const node of RUNE_NODES) {
    const lv = levelByKey.get(node.key) ?? 0
    byCategory[node.category].total++
    if (lv > 0) {
      ownedNodes++
      byCategory[node.category].owned++
      if (lv >= node.maxLevel) maxedNodes++
    }
  }
  return { ownedNodes, totalNodes: RUNE_NODES.length, maxedNodes, byCategory }
}
