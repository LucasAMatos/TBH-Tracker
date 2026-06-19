import { describe, expect, it } from 'vitest'
import { PET_LIST } from '@shared/petData'
import { petById, petEffectLines, petUnlockLabel } from '@shared/pets'

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

  it('cada pet tem ao menos uma linha de efeito (bônus por pet, não cumulativo)', () => {
    for (const p of PET_LIST) {
      expect(petEffectLines(p).length).toBe(p.stats.length)
      expect(petEffectLines(p).length).toBeGreaterThan(0)
    }
  })
})
