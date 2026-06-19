import { describe, expect, it } from 'vitest'
import { planRuneTarget, summarizeRunes, TOTAL_RUNE_NODES } from '@shared/runes'
import { RUNE_NODES } from '@shared/runeTree'

describe('summarizeRunes', () => {
  it('sem níveis → nada possuído', () => {
    const s = summarizeRunes([])
    expect(s.ownedNodes).toBe(0)
    expect(s.maxedNodes).toBe(0)
    expect(s.totalNodes).toBe(TOTAL_RUNE_NODES)
  })

  it('conta nós possuídos e maxados', () => {
    const node = RUNE_NODES[0]
    const s = summarizeRunes([{ key: node.key, level: node.maxLevel }])
    expect(s.ownedNodes).toBe(1)
    expect(s.maxedNodes).toBe(1)
  })
})

describe('planRuneTarget', () => {
  it('retorna null para chave inexistente', () => {
    expect(planRuneTarget(-999, [], 0)).toBeNull()
  })

  it('sem ouro informado → falta = custo total', () => {
    const node = RUNE_NODES[0]
    const plan = planRuneTarget(node.key, [], null)
    expect(plan).not.toBeNull()
    expect(plan!.targetKey).toBe(node.key)
    expect(plan!.goldMissing).toBe(plan!.totalGoldCost)
  })

  it('ouro de sobra → não falta nada e progresso completo', () => {
    const node = RUNE_NODES[0]
    const plan = planRuneTarget(node.key, [], Number.MAX_SAFE_INTEGER)
    expect(plan!.goldMissing).toBe(0)
    expect(plan!.progress).toBe(1)
  })

  it('alvo já no nível máximo → marcado como completo', () => {
    const node = RUNE_NODES[0]
    const plan = planRuneTarget(node.key, [{ key: node.key, level: node.maxLevel }], 0)
    expect(plan!.alreadyComplete).toBe(true)
  })
})
