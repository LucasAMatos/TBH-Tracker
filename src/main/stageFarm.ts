import type { StageFarm, StageFarmEntry } from '@shared/types'

// Acumulado por estágio (estado serializável para persistência entre sessões, F3).
interface StageBucket {
  goldGained: number
  expGained: number
  seconds: number
  reads: number
  lastAt: number
}

export interface StageFarmState {
  stages: Record<string, StageBucket>
  // Última leitura observada (para calcular o próximo delta/intervalo).
  lastAt: number | null
  lastStageRaw: string | null
  lastGold: number | null
  lastExp: number | null
}

// Intervalo máximo (s) entre duas leituras para atribuir o tempo a um estágio. O save é
// gravado a cada ~28-30s enquanto o jogo roda; um intervalo muito maior significa jogo
// fechado/parado — não contamos esse tempo como farm (evita inflar o denominador).
const MAX_GAP_SECONDS = 180
// Tempo mínimo acumulado (s) para publicar uma taxa — evita números absurdos no começo.
const MIN_SECONDS_FOR_RATE = 20

/**
 * Mede ouro/h e XP/h **por estágio** (F2) a partir do delta entre leituras consecutivas
 * do save, no mesmo espírito do `GoldFlowTracker` (G2/G3), mas *bucketed* por estágio.
 *
 * A cada leitura, se o estágio se manteve o mesmo desde a leitura anterior e o intervalo
 * é plausível (≤ MAX_GAP_SECONDS), atribui o **delta de ouro** e o **delta de XP**
 * (Σ `HeroExp`) — e o **tempo** do intervalo — ao estágio corrente.
 *
 * Anti-ruído (ver BACKLOG.md › F2):
 *  - troca de estágio entre leituras → o intervalo é descartado (não sabemos a divisão);
 *  - deltas negativos (gasto de ouro/venda; reset de XP em level-up) → contam como 0;
 *  - intervalos longos (jogo fechado/parado) → descartados.
 *
 * É uma aproximação por snapshot — sem contador de clears nem tempo por corrida (F1).
 */
export class StageFarmTracker {
  private stages: Record<string, StageBucket> = {}
  private lastAt: number | null = null
  private lastStageRaw: string | null = null
  private lastGold: number | null = null
  private lastExp: number | null = null

  reset(): void {
    this.stages = {}
    this.lastAt = null
    this.lastStageRaw = null
    this.lastGold = null
    this.lastExp = null
  }

  /** Estado serializável (para persistir entre sessões, F3). */
  serialize(): StageFarmState {
    return {
      stages: this.stages,
      lastAt: this.lastAt,
      lastStageRaw: this.lastStageRaw,
      lastGold: this.lastGold,
      lastExp: this.lastExp
    }
  }

  /** Recarrega o estado persistido (ou começa vazio se não houver). */
  restore(state: StageFarmState | null): void {
    this.stages = state?.stages ?? {}
    this.lastAt = state?.lastAt ?? null
    this.lastStageRaw = state?.lastStageRaw ?? null
    this.lastGold = state?.lastGold ?? null
    this.lastExp = state?.lastExp ?? null
  }

  /**
   * Registra uma leitura. `stageRaw` é o código DAPP do estágio corrente; `gold` é o ouro
   * total; `totalExp` é a soma de `HeroExp` de todos os heróis (proxy de XP da conta).
   */
  record(
    at: number,
    stageRaw: string | null,
    gold: number | null,
    totalExp: number | null
  ): StageFarm | null {
    const canAttribute =
      this.lastAt !== null &&
      this.lastStageRaw !== null &&
      stageRaw !== null &&
      stageRaw === this.lastStageRaw

    if (canAttribute) {
      const dt = (at - (this.lastAt as number)) / 1000
      if (dt > 0 && dt <= MAX_GAP_SECONDS) {
        const bucket = this.bucket(stageRaw as string)
        bucket.seconds += dt
        bucket.reads += 1
        bucket.lastAt = at
        if (gold !== null && this.lastGold !== null) {
          bucket.goldGained += Math.max(0, gold - this.lastGold)
        }
        if (totalExp !== null && this.lastExp !== null) {
          bucket.expGained += Math.max(0, totalExp - this.lastExp)
        }
      }
    }

    // Avança a linha de base para o próximo intervalo.
    this.lastAt = at
    this.lastStageRaw = stageRaw
    if (gold !== null) this.lastGold = gold
    if (totalExp !== null) this.lastExp = totalExp

    return this.current(stageRaw)
  }

  private bucket(stageRaw: string): StageBucket {
    return (
      this.stages[stageRaw] ??
      (this.stages[stageRaw] = { goldGained: 0, expGained: 0, seconds: 0, reads: 0, lastAt: 0 })
    )
  }

  private current(currentStageRaw: string | null): StageFarm | null {
    const keys = Object.keys(this.stages)
    if (keys.length === 0) return null

    const entries: StageFarmEntry[] = keys.map((stageRaw) => {
      const b = this.stages[stageRaw]
      const rateOk = b.seconds >= MIN_SECONDS_FOR_RATE
      return {
        stageRaw,
        goldGained: Math.round(b.goldGained),
        expGained: Math.round(b.expGained),
        seconds: b.seconds,
        reads: b.reads,
        goldPerHour: rateOk ? (b.goldGained / b.seconds) * 3600 : null,
        expPerHour: rateOk ? (b.expGained / b.seconds) * 3600 : null,
        lastAt: b.lastAt
      }
    })
    entries.sort((a, b) => b.seconds - a.seconds)

    return {
      entries,
      totalSeconds: entries.reduce((sum, e) => sum + e.seconds, 0),
      currentStageRaw
    }
  }
}
