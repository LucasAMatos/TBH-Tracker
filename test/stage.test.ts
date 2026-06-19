import { describe, expect, it } from 'vitest'
import {
  decodeStage,
  difficultyName,
  levelAdvice,
  rankStages,
  stageDataForRaw,
  stageProgress,
  stagesByDifficulty
} from '@shared/stage'
import { STAGE_DATA } from '@shared/stageData'

describe('decodeStage', () => {
  it('decodifica uma fase normal', () => {
    const s = decodeStage('1101')
    expect(s).toMatchObject({ raw: '1101', difficulty: 1, act: 1, phase: 1, isBoss: false })
  })

  it('aceita número e faz pad de 3 dígitos', () => {
    expect(decodeStage(1101)?.raw).toBe('1101')
  })

  it('marca boss na fase 10', () => {
    const s = decodeStage(1110)
    expect(s?.phase).toBe(10)
    expect(s?.isBoss).toBe(true)
  })

  it('rejeita entradas inválidas', () => {
    expect(decodeStage(null)).toBeNull()
    expect(decodeStage(undefined)).toBeNull()
    expect(decodeStage('abc')).toBeNull()
    expect(decodeStage('5101')).toBeNull() // dificuldade 5 fora do intervalo
    expect(decodeStage('1199')).toBeNull() // fase 99 fora do intervalo
  })
})

describe('difficultyName', () => {
  it('mapeia as 4 dificuldades', () => {
    expect(difficultyName(1)).toBe('Normal')
    expect(difficultyName(4)).toBe('Torment')
  })
  it('retorna null fora do intervalo', () => {
    expect(difficultyName(9)).toBeNull()
  })
})

describe('stageDataForRaw', () => {
  it('encontra fase catalogada', () => {
    expect(stageDataForRaw('1101')?.label).toBe('1-1')
  })
  it('retorna null para boss de ato (não catalogado)', () => {
    expect(stageDataForRaw('1110')).toBeNull()
  })
  it('retorna null para chave inexistente', () => {
    expect(stageDataForRaw('9999')).toBeNull()
  })
})

describe('rankStages', () => {
  it('ordena por eficiência decrescente', () => {
    const ranked = rankStages('gold')
    expect(ranked.length).toBe(Object.keys(STAGE_DATA).length)
    for (let i = 1; i < ranked.length; i++) {
      expect(ranked[i - 1].goldPerHP).toBeGreaterThanOrEqual(ranked[i].goldPerHP)
    }
  })

  it('respeita o limite', () => {
    expect(rankStages('exp', { limit: 3 }).length).toBe(3)
  })

  it('filtra por dificuldade', () => {
    const ranked = rankStages('combo', { difficulty: 1 })
    expect(ranked.every((s) => s.difficulty === 1)).toBe(true)
  })
})

describe('stagesByDifficulty', () => {
  it('agrupa em 4 dificuldades ordenadas por chave', () => {
    const grouped = stagesByDifficulty()
    expect(Object.keys(grouped).sort()).toEqual(['1', '2', '3', '4'])
    for (const list of Object.values(grouped)) {
      for (let i = 1; i < list.length; i++) {
        expect(list[i - 1].key).toBeLessThan(list[i].key)
      }
    }
  })
})

describe('stageProgress', () => {
  it('sem progresso → tudo zerado', () => {
    const p = stageProgress(null)
    expect(p.length).toBe(4)
    expect(p.every((d) => d.completed === 0 && d.fraction === 0)).toBe(true)
  })

  it('1109 conclui o ato 1 de Normal apenas', () => {
    const p = stageProgress('1109')
    const normal = p.find((d) => d.difficulty === 1)!
    const act1 = normal.acts.find((a) => a.act === 1)!
    expect(act1.completed).toBe(act1.total)
    expect(normal.acts.find((a) => a.act === 2)!.completed).toBe(0)
    // demais dificuldades intactas
    expect(p.find((d) => d.difficulty === 2)!.completed).toBe(0)
  })

  it('boss de ato (1110) ainda marca as fases do ato como concluídas', () => {
    expect(stageProgress('1110').find((d) => d.difficulty === 1)!.completed).toBe(
      stageProgress('1109').find((d) => d.difficulty === 1)!.completed
    )
  })

  it('chave acima do catálogo → 100% em todas as dificuldades', () => {
    const p = stageProgress('4310')
    expect(p.every((d) => d.fraction === 1)).toBe(true)
  })
})

describe('levelAdvice', () => {
  // 1203 tem level recomendado 15 no catálogo.
  it('nível adequado → ok', () => {
    expect(levelAdvice('1203', [15, 15, 15]).status).toBe('ok')
  })
  it('muito abaixo → under', () => {
    const a = levelAdvice('1203', [10, 10, 10])
    expect(a.status).toBe('under')
    expect(a.delta).toBe(-5)
  })
  it('muito acima → over', () => {
    expect(levelAdvice('1203', [25, 25]).status).toBe('over')
  })
  it('sem herói ativo → unknown', () => {
    expect(levelAdvice('1203', []).status).toBe('unknown')
  })
  it('estágio fora do catálogo → unknown', () => {
    expect(levelAdvice('1110', [10]).status).toBe('unknown')
  })
})
