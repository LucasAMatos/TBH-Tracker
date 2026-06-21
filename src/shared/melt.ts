// Núcleo (puro) da calculadora de derretimento/Alchemy (D5). O parser monta a lista de
// candidatos a partir do save (classifyItem + locais) e esta função aplica as regras de
// exclusão (equipado, Legendary+) e soma ouro de venda + XP de Cubo do catálogo meltData.ts.
import { meltOf } from './meltData'
import type { MeltRarityRow, MeltSummary } from './types'

// Um item de gear candidato ao derretimento, já com os dados que importam para a regra.
export interface MeltCandidate {
  key: number // ItemKey (para consultar valor no catálogo)
  gradeTier: number // tier da raridade (índice em GRADES)
  marketable: boolean // Legendary+ (vendável no Market → não derrete)
  equipped: boolean // equipado em algum herói → não derrete
}

/**
 * Soma o ouro de venda + XP de Cubo do gear derretível, excluindo equipados e Legendary+.
 * `byRarity` traz só as raridades com itens, em ordem crescente de tier.
 */
export function summarizeMelt(items: MeltCandidate[]): MeltSummary {
  const byTier = new Map<number, MeltRarityRow>()
  let totalGold = 0
  let totalCubeXp = 0
  let itemCount = 0
  let excludedMarketable = 0
  let excludedEquipped = 0
  let noData = 0

  for (const item of items) {
    if (item.equipped) {
      excludedEquipped++
      continue
    }
    if (item.marketable) {
      excludedMarketable++
      continue
    }
    const melt = meltOf(item.key)
    if (!melt) {
      noData++
      continue
    }
    const [gold, cubeXp] = melt
    totalGold += gold
    totalCubeXp += cubeXp
    itemCount++
    let row = byTier.get(item.gradeTier)
    if (!row) {
      row = { tier: item.gradeTier, count: 0, gold: 0, cubeXp: 0 }
      byTier.set(item.gradeTier, row)
    }
    row.count++
    row.gold += gold
    row.cubeXp += cubeXp
  }

  return {
    totalGold,
    totalCubeXp,
    itemCount,
    excludedMarketable,
    excludedEquipped,
    noData,
    byRarity: [...byTier.values()].sort((a, b) => a.tier - b.tier)
  }
}
