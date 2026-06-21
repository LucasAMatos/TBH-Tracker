import { describe, expect, it } from 'vitest'
import { MELT_DATA, meltOf } from '@shared/meltData'
import { summarizeMelt, type MeltCandidate } from '@shared/melt'

describe('catálogo de derretimento (meltData)', () => {
  it('tem entradas e valores numéricos não-negativos', () => {
    const keys = Object.keys(MELT_DATA)
    expect(keys.length).toBeGreaterThan(1000)
    for (const k of keys) {
      const [gold, cubeXp] = MELT_DATA[k]
      expect(typeof gold).toBe('number')
      expect(typeof cubeXp).toBe('number')
      expect(gold).toBeGreaterThanOrEqual(0)
      expect(cubeXp).toBeGreaterThanOrEqual(0)
    }
  })

  it('meltOf devolve null para chave fora do catálogo', () => {
    expect(meltOf('chave-inexistente')).toBeNull()
    expect(meltOf(-1)).toBeNull()
  })

  it('meltOf devolve a tupla de uma chave real', () => {
    const k = Object.keys(MELT_DATA)[0]
    const v = meltOf(k)
    expect(v).not.toBeNull()
    expect(v).toEqual(MELT_DATA[k])
  })
})

describe('summarizeMelt', () => {
  const realKey = Number(Object.keys(MELT_DATA)[0])
  const [gold, cubeXp] = MELT_DATA[String(realKey)]

  it('soma só o gear derretível (exclui equipados e Legendary+)', () => {
    const items: MeltCandidate[] = [
      { key: realKey, gradeTier: 0, marketable: false, equipped: false },
      { key: realKey, gradeTier: 0, marketable: false, equipped: true }, // equipado
      { key: realKey, gradeTier: 3, marketable: true, equipped: false }, // Legendary+
      { key: 99999999, gradeTier: 1, marketable: false, equipped: false } // sem catálogo
    ]
    const s = summarizeMelt(items)
    expect(s.itemCount).toBe(1)
    expect(s.totalGold).toBe(gold)
    expect(s.totalCubeXp).toBe(cubeXp)
    expect(s.excludedEquipped).toBe(1)
    expect(s.excludedMarketable).toBe(1)
    expect(s.noData).toBe(1)
  })

  it('agrupa por raridade em ordem crescente de tier', () => {
    const items: MeltCandidate[] = [
      { key: realKey, gradeTier: 2, marketable: false, equipped: false },
      { key: realKey, gradeTier: 0, marketable: false, equipped: false },
      { key: realKey, gradeTier: 0, marketable: false, equipped: false }
    ]
    const s = summarizeMelt(items)
    expect(s.byRarity.map((r) => r.tier)).toEqual([0, 2])
    expect(s.byRarity[0].count).toBe(2)
    expect(s.byRarity[0].gold).toBe(gold * 2)
  })

  it('resumo vazio quando não há candidatos', () => {
    const s = summarizeMelt([])
    expect(s.itemCount).toBe(0)
    expect(s.totalGold).toBe(0)
    expect(s.byRarity).toEqual([])
  })
})
