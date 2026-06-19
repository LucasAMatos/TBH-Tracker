import { describe, expect, it } from 'vitest'
import {
  formatStatLine,
  gradeSlotTotal,
  modsForStat,
  statLine,
  statName,
  statRange,
  STAT_LIST
} from '@shared/stats'
import { STAT_IDS, STAT_MODS } from '@shared/statData'

describe('catálogo de status (D4)', () => {
  it('STAT_LIST cobre todos os STAT_IDS e está ordenada por nome', () => {
    expect(STAT_LIST.length).toBe(STAT_IDS.length)
    for (let i = 1; i < STAT_LIST.length; i++) {
      expect(STAT_LIST[i - 1].name.localeCompare(STAT_LIST[i].name, 'pt-BR')).toBeLessThanOrEqual(0)
    }
  })

  it('todo modificador referencia um status do catálogo', () => {
    for (const key of Object.keys(STAT_MODS)) {
      const statIdx = STAT_MODS[key][0]
      expect(STAT_IDS[statIdx]).toBeTypeOf('string')
    }
  })
})

describe('statName / statLine', () => {
  it('resolve rótulos conhecidos', () => {
    expect(statName('Armor')).toBeTypeOf('string')
    expect(statLine('Armor')).toContain('{0}')
  })
  it('cai para o id quando desconhecido', () => {
    expect(statName('NaoExiste')).toBe('NaoExiste')
    expect(statLine('NaoExiste')).toBe('NaoExiste +{0}')
  })
})

describe('formatStatLine', () => {
  it('substitui o template {0} pelo valor', () => {
    expect(formatStatLine('Armor', 35)).toBe(statLine('Armor').replace('{0}', '35'))
  })
  it('anexa +valor quando não há template', () => {
    expect(formatStatLine('SemTemplate', 10)).toBe('SemTemplate +{0}'.replace('{0}', '10'))
  })
})

describe('modsForStat / statRange', () => {
  it('AttackDamage tem modificadores rolaveis ordenados por min', () => {
    const mods = modsForStat('AttackDamage')
    expect(mods.length).toBeGreaterThan(0)
    for (let i = 1; i < mods.length; i++) {
      expect(mods[i - 1].min).toBeLessThanOrEqual(mods[i].min)
    }
  })
  it('statRange devolve min/max coerentes', () => {
    const r = statRange('AttackDamage')!
    expect(r).not.toBeNull()
    expect(r.min).toBeLessThanOrEqual(r.max)
  })
  it('status sem modificador → range null', () => {
    expect(statRange('NaoExiste')).toBeNull()
  })
})

describe('gradeSlotTotal', () => {
  it('Common tem 0 e raridades altas têm mais slots', () => {
    expect(gradeSlotTotal('COMMON')).toBe(0)
    expect(gradeSlotTotal('LEGENDARY')).toBeGreaterThan(gradeSlotTotal('COMMON'))
  })
  it('raridade desconhecida → 0', () => {
    expect(gradeSlotTotal('XYZ')).toBe(0)
  })
})
