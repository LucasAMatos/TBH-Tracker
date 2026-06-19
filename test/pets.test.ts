import { describe, expect, it } from 'vitest'
import { PET_LIST } from '@shared/petData'
import {
  aggregatePetBonuses,
  petById,
  petEffectLines,
  petUnlockLabel
} from '@shared/pets'

describe('catálogo de pets (petData)', () => {
  it('tem 8 pets com campos essenciais', () => {
    expect(PET_LIST.length).toBe(8)
    for (const p of PET_LIST) {
      expect(typeof p.key).toBe('number')
      expect(p.name.length).toBeGreaterThan(0)
      expect(p.stats.length).toBeGreaterThan(0)
    }
  })

  it('petById encontra por key e devolve undefined para desconhecido', () => {
    expect(petById(1001)?.name).toBe('Morcego')
    expect(petById(999999)).toBeUndefined()
  })
})

describe('petUnlockLabel', () => {
  it('traduz unlocks conhecidos e mantém os demais', () => {
    expect(petUnlockLabel('KillMonster')).toMatch(/monstro/i)
    expect(petUnlockLabel('DLC')).toMatch(/DLC/)
    expect(petUnlockLabel('Outro')).toBe('Outro')
  })
})

describe('petEffectLines', () => {
  it('formata as linhas de efeito do pet com o valor', () => {
    const dragon = petById(6003)!
    const lines = petEffectLines(dragon)
    expect(lines.length).toBe(dragon.stats.length)
    expect(lines.join(' ')).toMatch(/200/)
  })
})

describe('aggregatePetBonuses', () => {
  it('soma o mesmo status entre pets desbloqueados', () => {
    // Morcego (Exp +150) + Espada (Exp +150) => Exp total 300.
    const agg = aggregatePetBonuses([1001, 6001])
    const exp = agg.find((b) => b.st === 'IncreaseExpAmount')
    expect(exp?.total).toBe(300)
    expect(exp?.line).toMatch(/300/)
  })

  it('ignora keys desconhecidas e retorna vazio sem desbloqueios', () => {
    expect(aggregatePetBonuses([]).length).toBe(0)
    expect(aggregatePetBonuses([424242]).length).toBe(0)
  })

  it('ordena os bônus pelo rótulo pt-BR', () => {
    const agg = aggregatePetBonuses(PET_LIST.map((p) => p.key))
    const names = agg.map((b) => b.name)
    const sorted = [...names].sort((a, b) => a.localeCompare(b, 'pt-BR'))
    expect(names).toEqual(sorted)
  })
})
