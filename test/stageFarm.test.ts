import { beforeEach, describe, expect, it } from 'vitest'
import { StageFarmTracker } from '../src/main/stageFarm'

const T0 = 1_700_000_000_000
const STEP = 30_000 // 30s, dentro do MAX_GAP

describe('StageFarmTracker', () => {
  let tracker: StageFarmTracker

  beforeEach(() => {
    tracker = new StageFarmTracker()
  })

  it('a primeira leitura não atribui nada (sem linha de base)', () => {
    const farm = tracker.record(T0, '1101', 100, 50, 0)
    expect(farm).toBeNull()
  })

  it('atribui delta de ouro/XP/kills ao estágio entre leituras', () => {
    tracker.record(T0, '1101', 100, 50, 0)
    const farm = tracker.record(T0 + STEP, '1101', 200, 80, 10)
    const e = farm!.entries.find((x) => x.stageRaw === '1101')!
    expect(e.goldGained).toBe(100)
    expect(e.expGained).toBe(30)
    expect(e.killsGained).toBe(10)
    expect(e.seconds).toBeCloseTo(30)
  })

  it('estima clears via kills ÷ inimigos por clear (1101 = 10)', () => {
    tracker.record(T0, '1101', 0, 0, 0)
    const farm = tracker.record(T0 + STEP, '1101', 0, 0, 20)
    const e = farm!.entries.find((x) => x.stageRaw === '1101')!
    expect(e.clears).toBe(2) // 20 kills / 10 por clear
    expect(e.secondsPerClear).toBeCloseTo(15)
  })

  it('descarta o intervalo quando o estágio muda entre leituras', () => {
    tracker.record(T0, '1101', 100, 50, 0)
    const farm = tracker.record(T0 + STEP, '1102', 999, 999, 999)
    // 1102 acabou de virar baseline; nada atribuído → nenhum bucket criado
    expect(farm).toBeNull()
  })

  it('ignora deltas negativos (gasto de ouro / reset de XP em level-up)', () => {
    tracker.record(T0, '1101', 500, 500, 10)
    const farm = tracker.record(T0 + STEP, '1101', 300, 100, 12)
    const e = farm!.entries.find((x) => x.stageRaw === '1101')!
    expect(e.goldGained).toBe(0)
    expect(e.expGained).toBe(0)
    expect(e.killsGained).toBe(2)
  })

  it('descarta intervalos longos (jogo fechado/parado)', () => {
    tracker.record(T0, '1101', 100, 50, 0)
    // intervalo > MAX_GAP (180s) → nada atribuído, nenhum bucket criado
    const farm = tracker.record(T0 + 10 * 60_000, '1101', 9999, 9999, 9999)
    expect(farm).toBeNull()
  })

  it('serialize/restore preserva o acumulado', () => {
    tracker.record(T0, '1101', 100, 50, 0)
    tracker.record(T0 + STEP, '1101', 200, 80, 10)
    const state = tracker.serialize()

    const revived = new StageFarmTracker()
    revived.restore(state)
    // continua do baseline: novo delta soma ao bucket existente
    const farm = revived.record(T0 + 2 * STEP, '1101', 250, 90, 13)
    const e = farm!.entries.find((x) => x.stageRaw === '1101')!
    expect(e.goldGained).toBe(150) // 100 + 50
    expect(e.killsGained).toBe(13) // 10 + 3
  })
})
