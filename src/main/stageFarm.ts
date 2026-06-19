import { stageDataForRaw } from '@shared/stage'
import type { StageFarm, StageFarmEntry } from '@shared/types'

// Acumulado por estágio (estado serializável para persistência entre sessões, F3).
interface StageBucket {
  goldGained: number
  expGained: number
  killsGained: number
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
  lastKills: number | null
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
 * Eficiência de farm (F1): além de ouro/XP, atribui o **delta de kills** (aggregate Type 0)
 * ao estágio; dividindo pelo nº de inimigos por clear do catálogo (F0) estima **clears**,
 * **clears/h** e **tempo médio por clear**. O tempo por corrida individual continua fora de
 * escopo (o save não persiste fronteira/tempo por corrida).
 */
export class StageFarmTracker {
  private stages: Record<string, StageBucket> = {}
  private lastAt: number | null = null
  private lastStageRaw: string | null = null
  private lastGold: number | null = null
  private lastExp: number | null = null
  private lastKills: number | null = null

  reset(): void {
    this.stages = {}
    this.lastAt = null
    this.lastStageRaw = null
    this.lastGold = null
    this.lastExp = null
    this.lastKills = null
  }

  /** Estado serializável (para persistir entre sessões, F3). */
  serialize(): StageFarmState {
    return {
      stages: this.stages,
      lastAt: this.lastAt,
      lastStageRaw: this.lastStageRaw,
      lastGold: this.lastGold,
      lastExp: this.lastExp,
      lastKills: this.lastKills
    }
  }

  /** Recarrega o estado persistido (ou começa vazio se não houver). */
  restore(state: StageFarmState | null): void {
    this.stages = state?.stages ?? {}
    this.lastAt = state?.lastAt ?? null
    this.lastStageRaw = state?.lastStageRaw ?? null
    this.lastGold = state?.lastGold ?? null
    this.lastExp = state?.lastExp ?? null
    this.lastKills = state?.lastKills ?? null
    // Retrocompat: histórico F3 antigo não tinha killsGained por estágio.
    for (const bucket of Object.values(this.stages)) {
      if (typeof bucket.killsGained !== 'number') bucket.killsGained = 0
    }
  }

  /**
   * Registra uma leitura. `stageRaw` é o código DAPP do estágio corrente; `gold` é o ouro
   * total; `totalExp` é a soma de `HeroExp` de todos os heróis (proxy de XP da conta).
   */
  record(
    at: number,
    stageRaw: string | null,
    gold: number | null,
    totalExp: number | null,
    totalKills: number | null
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
        if (totalKills !== null && this.lastKills !== null) {
          bucket.killsGained += Math.max(0, totalKills - this.lastKills)
        }
      }
    }

    // Avança a linha de base para o próximo intervalo.
    this.lastAt = at
    this.lastStageRaw = stageRaw
    if (gold !== null) this.lastGold = gold
    if (totalExp !== null) this.lastExp = totalExp
    if (totalKills !== null) this.lastKills = totalKills

    return this.current(stageRaw)
  }

  private bucket(stageRaw: string): StageBucket {
    return (
      this.stages[stageRaw] ??
      (this.stages[stageRaw] = {
        goldGained: 0,
        expGained: 0,
        killsGained: 0,
        seconds: 0,
        reads: 0,
        lastAt: 0
      })
    )
  }

  private current(currentStageRaw: string | null): StageFarm | null {
    const keys = Object.keys(this.stages)
    if (keys.length === 0) return null

    const entries: StageFarmEntry[] = keys.map((stageRaw) => {
      const b = this.stages[stageRaw]
      const rateOk = b.seconds >= MIN_SECONDS_FOR_RATE
      // Clears estimados (F1): kills atribuídos / inimigos-por-clear do catálogo (F0).
      // Sem catálogo (boss de ato etc.) ou sem kills → clears indisponível.
      const perClear = stageDataForRaw(stageRaw)?.count ?? null
      const clears = perClear && perClear > 0 ? b.killsGained / perClear : null
      const hasClears = clears !== null && clears > 0
      return {
        stageRaw,
        goldGained: Math.round(b.goldGained),
        expGained: Math.round(b.expGained),
        killsGained: Math.round(b.killsGained),
        seconds: b.seconds,
        reads: b.reads,
        goldPerHour: rateOk ? (b.goldGained / b.seconds) * 3600 : null,
        expPerHour: rateOk ? (b.expGained / b.seconds) * 3600 : null,
        clears,
        clearsPerHour: rateOk && clears !== null ? (clears / b.seconds) * 3600 : null,
        secondsPerClear: hasClears ? b.seconds / (clears as number) : null,
        goldPerClear: hasClears ? b.goldGained / (clears as number) : null,
        expPerClear: hasClears ? b.expGained / (clears as number) : null,
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
