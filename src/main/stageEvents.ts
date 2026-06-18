import type { StageEvent, StageEvents, StageInfo } from '@shared/types'

const MAX_EVENTS = 50

// Estado serializável para persistência entre sessões (I6).
export interface StageEventsState {
  lastStageRaw: string | null
  lastMaxRaw: string | null
  events: StageEvent[]
  sessionStartAt: number | null
}

/**
 * Detecta eventos de progresso comparando o estágio entre leituras do save (S3):
 *  - `stage-change`: o estágio atual (`CurrentStageKey`) mudou;
 *  - `new-max`: o estágio máximo concluído (`MaxCompletedStage`) avançou.
 *
 * O código do estágio (DAPP, 4 dígitos: dificuldade+ato+fase) é monotônico, então
 * "avançou" = código numérico maior. A 1ª leitura apenas fixa a linha de base.
 *
 * Em memória, sem persistência — zera quando a sessão/arquivo de save muda.
 */
export class StageEventsTracker {
  private lastStageRaw: string | null = null
  private lastMaxRaw: string | null = null
  private events: StageEvent[] = []
  private sessionStartAt: number | null = null

  reset(): void {
    this.lastStageRaw = null
    this.lastMaxRaw = null
    this.events = []
    this.sessionStartAt = null
  }

  /** Estado serializável (para persistir entre sessões, I6). */
  serialize(): StageEventsState {
    return {
      lastStageRaw: this.lastStageRaw,
      lastMaxRaw: this.lastMaxRaw,
      events: this.events,
      sessionStartAt: this.sessionStartAt
    }
  }

  /** Recarrega o estado persistido (ou começa vazio se não houver). */
  restore(state: StageEventsState | null): void {
    this.lastStageRaw = state?.lastStageRaw ?? null
    this.lastMaxRaw = state?.lastMaxRaw ?? null
    this.events = state?.events ?? []
    this.sessionStartAt = state?.sessionStartAt ?? null
  }

  record(at: number, stage: StageInfo | null, maxStage: StageInfo | null): StageEvents | null {
    if (!stage && !maxStage) return this.current()
    if (this.sessionStartAt === null) this.sessionStartAt = at

    if (stage) {
      const prev = this.lastStageRaw
      if (prev !== null && prev !== stage.raw) {
        this.push({ at, kind: 'stage-change', fromRaw: prev, toRaw: stage.raw, toLabel: stage.label })
      }
      this.lastStageRaw = stage.raw
    }

    if (maxStage) {
      const prev = this.lastMaxRaw
      if (prev !== null && Number(maxStage.raw) > Number(prev)) {
        this.push({ at, kind: 'new-max', fromRaw: prev, toRaw: maxStage.raw, toLabel: maxStage.label })
      }
      this.lastMaxRaw = maxStage.raw
    }

    return this.current()
  }

  private push(event: StageEvent): void {
    this.events.push(event)
    if (this.events.length > MAX_EVENTS) this.events.shift()
  }

  private current(): StageEvents | null {
    if (this.sessionStartAt === null) return null
    return {
      sessionStartAt: this.sessionStartAt,
      events: [...this.events].reverse()
    }
  }
}
