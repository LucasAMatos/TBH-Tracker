// Lógica/derivações sobre o catálogo de runas (runeTree.ts é dado puro gerado).
import { RUNE_EDGES, RUNE_NODES, type RuneCategory, type RuneNode } from './runeTree'
import type { RuneLevel, RuneTargetPlan, RuneTargetStep } from './types'

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

// ── Runa-alvo (R3): caminho de menor custo + ouro faltante ───────────────────

// Pré-requisitos de cada nó: os nós de origem (`from`) das arestas que chegam nele.
const parentsByKey = new Map<number, number[]>()
for (const e of RUNE_EDGES) {
  const arr = parentsByKey.get(e.to)
  if (arr) arr.push(e.from)
  else parentsByKey.set(e.to, [e.from])
}

// Custo em ouro de um intervalo de níveis [from, to) de um nó (0 quando não é ouro).
// nonGold = algum nível do intervalo tem custo que não é ouro (soul stones).
function levelGold(node: RuneNode, from: number, to: number): { gold: number; nonGold: boolean } {
  let gold = 0
  let nonGold = false
  for (let i = from; i < to; i++) {
    const c = node.goldCost[i] ?? 0
    if (c > 0) gold += c
    else nonGold = true
  }
  return { gold, nonGold }
}

interface ChainResult {
  cost: number // ouro para desbloquear (nível 1) este nó e seus pré-requisitos pendentes
  chain: number[] // nós pendentes em ordem raiz→nó (já desbloqueados não entram)
  nonGold: boolean // algum passo do caminho custa não-ouro
  reachable: boolean
}

const UNREACHABLE: ChainResult = { cost: Infinity, chain: [], nonGold: false, reachable: false }

// Caminho mais barato para desbloquear `key` (nível ≥ 1) a partir de um nó já possuído
// ou da raiz, considerando seus pré-requisitos. Memoizado; guarda contra ciclos.
function cheapestUnlock(
  key: number,
  levelByKey: Map<number, number>,
  memo: Map<number, ChainResult>,
  stack: Set<number>
): ChainResult {
  if ((levelByKey.get(key) ?? 0) > 0) return { cost: 0, chain: [], nonGold: false, reachable: true }
  const cached = memo.get(key)
  if (cached) return cached
  if (stack.has(key)) return UNREACHABLE // ciclo: ignora este ramo

  const node = byKey.get(key)
  if (!node) return UNREACHABLE

  stack.add(key)
  const parents = parentsByKey.get(key) ?? []
  let bestParent: ChainResult = { cost: 0, chain: [], nonGold: false, reachable: true }
  if (parents.length > 0) {
    bestParent = UNREACHABLE
    for (const p of parents) {
      const r = cheapestUnlock(p, levelByKey, memo, stack)
      if (r.reachable && r.cost < bestParent.cost) bestParent = r
    }
  }
  stack.delete(key)

  let result: ChainResult
  if (!bestParent.reachable) {
    result = UNREACHABLE
  } else {
    const own = levelGold(node, 0, 1) // custo de desbloquear (nível 0→1)
    result = {
      cost: bestParent.cost + own.gold,
      chain: [...bestParent.chain, key],
      nonGold: bestParent.nonGold || own.nonGold,
      reachable: true
    }
  }
  memo.set(key, result)
  return result
}

/**
 * Plano de ouro até a runa-alvo (R3): soma o custo dos pré-requisitos pendentes
 * (caminho de menor custo até a raiz) + os níveis restantes do próprio alvo (até o
 * máximo), subtrai o ouro atual e devolve o progresso. Retorna null se a chave não
 * existir no catálogo.
 */
export function planRuneTarget(
  targetKey: number,
  levels: RuneLevel[],
  gold: number | null
): RuneTargetPlan | null {
  const node = byKey.get(targetKey)
  if (!node) return null

  const levelByKey = new Map(levels.map((l) => [l.key, l.level]))
  const currentLevel = levelByKey.get(targetKey) ?? 0

  // Pré-requisitos: caminho mais barato que desbloqueia todos os pais do alvo.
  const memo = new Map<number, ChainResult>()
  const parents = parentsByKey.get(targetKey) ?? []
  let prereq: ChainResult = { cost: 0, chain: [], nonGold: false, reachable: true }
  if (parents.length > 0) {
    prereq = UNREACHABLE
    for (const p of parents) {
      const r = cheapestUnlock(p, levelByKey, memo, new Set())
      if (r.reachable && r.cost < prereq.cost) prereq = r
    }
  }

  const steps: RuneTargetStep[] = []
  for (const k of prereq.chain) {
    const n = byKey.get(k)
    if (!n) continue
    const g = n.goldCost[0] ?? 0
    steps.push({
      key: k,
      name: n.name,
      icon: n.icon,
      category: n.category,
      fromLevel: 0,
      toLevel: 1,
      goldCost: g,
      payableInGold: g > 0,
      isTarget: false,
      affordable: false
    })
  }

  const alreadyComplete = currentLevel >= node.maxLevel
  const targetLeveling = levelGold(node, currentLevel, node.maxLevel)
  if (!alreadyComplete) {
    steps.push({
      key: targetKey,
      name: node.name,
      icon: node.icon,
      category: node.category,
      fromLevel: currentLevel,
      toLevel: node.maxLevel,
      goldCost: targetLeveling.gold,
      payableInGold: targetLeveling.gold > 0,
      isTarget: true,
      affordable: false
    })
  }

  const totalGoldCost = steps.reduce((sum, s) => sum + s.goldCost, 0)
  const goldHave = gold

  // Marca, respeitando a sequência, até onde o ouro atual cobre o custo acumulado.
  let running = 0
  for (const step of steps) {
    running += step.goldCost
    step.affordable = goldHave !== null && running <= goldHave
  }

  const goldMissing = goldHave === null ? totalGoldCost : Math.max(0, totalGoldCost - goldHave)
  const progress =
    totalGoldCost <= 0
      ? 1
      : goldHave === null
        ? 0
        : Math.max(0, Math.min(1, goldHave / totalGoldCost))

  return {
    targetKey,
    targetName: node.name,
    targetIcon: node.icon,
    category: node.category,
    currentLevel,
    maxLevel: node.maxLevel,
    reachable: prereq.reachable,
    alreadyComplete,
    steps,
    totalGoldCost,
    goldHave,
    goldMissing,
    progress,
    hasNonGold: prereq.nonGold || targetLeveling.nonGold
  }
}
