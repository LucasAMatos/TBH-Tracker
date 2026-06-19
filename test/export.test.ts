import { describe, expect, it } from 'vitest'
import { buildFarmCsv, buildSessionJson, exportStamp } from '@shared/export'
import type { Snapshot } from '@shared/types'

function fakeSnapshot(): Snapshot {
  return {
    capturedAt: 1_700_000_000_000,
    gold: 12345,
    totalKills: 999,
    playTimeSeconds: 3600,
    stage: { raw: '1101' },
    maxCompletedStage: { raw: '1109' },
    heroes: [],
    inventory: { totalItems: 0 },
    stageFarm: {
      currentStageRaw: '1101',
      totalSeconds: 60,
      entries: [
        {
          stageRaw: '1101',
          goldGained: 600,
          expGained: 120,
          killsGained: 20,
          seconds: 60,
          reads: 2,
          goldPerHour: 36000,
          expPerHour: 7200,
          clears: 2,
          clearsPerHour: 120,
          secondsPerClear: 30,
          goldPerClear: 300,
          expPerClear: 60,
          lastAt: 1_700_000_000_000
        }
      ]
    }
  } as unknown as Snapshot
}

describe('exportStamp', () => {
  it('produz um carimbo no formato AAAA-MM-DD_HH-MM-SS', () => {
    expect(exportStamp(Date.now())).toMatch(/^\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}$/)
  })
})

describe('buildSessionJson', () => {
  it('serializa JSON válido com os campos principais', () => {
    const parsed = JSON.parse(buildSessionJson(fakeSnapshot()))
    expect(parsed.gold).toBe(12345)
    expect(parsed.totalKills).toBe(999)
    expect(parsed.stageFarm.entries.length).toBe(1)
    expect(parsed.exportedAt).toBeTypeOf('string')
  })
})

describe('buildFarmCsv', () => {
  it('tem cabeçalho + uma linha por estágio', () => {
    const lines = buildFarmCsv(fakeSnapshot()).split('\n')
    expect(lines[0]).toContain('estagio')
    expect(lines[0]).toContain('clears_por_hora')
    expect(lines.length).toBe(2)
    expect(lines[1]).toContain('1-1') // label do catálogo para 1101
    expect(lines[1]).toContain('1101')
  })

  it('só cabeçalho quando não há medições', () => {
    const empty = { stageFarm: { entries: [] } } as unknown as Snapshot
    expect(buildFarmCsv(empty).split('\n').length).toBe(1)
  })
})
