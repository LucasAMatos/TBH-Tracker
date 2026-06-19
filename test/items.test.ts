import { describe, expect, it } from 'vitest'
import { classifyItem } from '@shared/items'
import { ITEM_DATA, ITEM_TYPE_IDS } from '@shared/itemData'

describe('classifyItem', () => {
  it('retorna null para chave desconhecida', () => {
    expect(classifyItem('chave-inexistente')).toBeNull()
    expect(classifyItem(-1)).toBeNull()
  })

  it('classifica uma chave real do catálogo', () => {
    const knownKey = Object.keys(ITEM_DATA)[0]
    const info = classifyItem(knownKey)
    expect(info).not.toBeNull()
    expect(info!.key).toBe(Number(knownKey))
    expect(ITEM_TYPE_IDS).toContain(info!.type)
  })

  it('itens vendáveis têm tier >= ao primeiro tier marketável', () => {
    for (const key of Object.keys(ITEM_DATA)) {
      const info = classifyItem(key)
      if (info?.marketable) {
        expect(info.gradeTier).toBeGreaterThanOrEqual(0)
      }
    }
  })
})
