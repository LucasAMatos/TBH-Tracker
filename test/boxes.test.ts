import { describe, expect, it } from 'vitest'
import {
  boxDrainSeconds,
  classifyBoxBacklog,
  kindFromTypeValue,
  normalizeBoxThresholds
} from '@shared/boxes'

describe('normalizeBoxThresholds', () => {
  it('usa os padrões quando ausente', () => {
    expect(normalizeBoxThresholds({})).toEqual({ warn: 25, high: 75 })
  })
  it('garante high >= warn', () => {
    expect(normalizeBoxThresholds({ warn: 5, high: 3 })).toEqual({ warn: 5, high: 5 })
  })
  it('garante warn >= 1 e arredonda', () => {
    expect(normalizeBoxThresholds({ warn: 0, high: 9.6 })).toEqual({ warn: 1, high: 10 })
  })
})

describe('classifyBoxBacklog', () => {
  it('null → ok', () => {
    expect(classifyBoxBacklog(null)).toBe('ok')
  })
  it('classifica pelos limiares padrão', () => {
    expect(classifyBoxBacklog(10)).toBe('ok')
    expect(classifyBoxBacklog(30)).toBe('warn')
    expect(classifyBoxBacklog(80)).toBe('high')
  })
  it('respeita limiares customizados', () => {
    expect(classifyBoxBacklog(6, { warn: 5, high: 10 })).toBe('warn')
  })
})

describe('boxDrainSeconds', () => {
  it('multiplica cooldown × quantidade', () => {
    expect(boxDrainSeconds('common', 2)).toBe(600) // 300s cada
  })
  it('null quando a categoria não tem auto-abrir (Ato)', () => {
    expect(boxDrainSeconds('actBoss', 5)).toBeNull()
  })
  it('null quando não há baús', () => {
    expect(boxDrainSeconds('common', 0)).toBeNull()
  })
})

describe('kindFromTypeValue', () => {
  it('mapeia os valores conhecidos', () => {
    expect(kindFromTypeValue(0)).toBe('common')
    expect(kindFromTypeValue(1)).toBe('stageBoss')
    expect(kindFromTypeValue(2)).toBe('actBoss')
  })
  it('null para valor fora do mapa', () => {
    expect(kindFromTypeValue(9)).toBeNull()
  })
})
