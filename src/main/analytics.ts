import type { RunRecord, Snapshot } from '@shared/types'

/**
 * Detecta corridas (clears) a partir da sequência de snapshots.
 *
 * Sinal de clear: transição `currentStageWave > 0 → 0` (validado ao vivo: a onda
 * sobe durante a corrida e zera no clear, que dispara uma gravação do save).
 * Duração = delta de `playTime` entre clears consecutivos no mesmo estágio.
 *
 * Limitação conhecida: o jogo autossalva de forma esparsa/irregular, então a
 * medição é aproximada (pode agregar corridas muito curtas). Refinável depois.
 */
export class RunDetector {
  private lastClear: { stageRaw: string; playTime: number } | null = null
  private prevWave: number | null = null
  private prevStageRaw: string | null = null

  /** Processa um snapshot; retorna uma corrida se um clear medível foi detectado. */
  process(snap: Snapshot): RunRecord | null {
    const stageRaw = snap.stage?.raw ?? null
    const wave = snap.currentWave
    const play = snap.playTimeSeconds

    if (stageRaw === null || wave === null || play === null) {
      return null
    }

    // Troca de estágio: zera a baseline (não medir entre estágios diferentes).
    if (this.prevStageRaw !== null && this.prevStageRaw !== stageRaw) {
      this.lastClear = null
    }

    let run: RunRecord | null = null
    const isClear = this.prevWave !== null && this.prevWave > 0 && wave === 0

    if (isClear) {
      if (this.lastClear && this.lastClear.stageRaw === stageRaw) {
        const duration = Math.floor(play - this.lastClear.playTime)
        if (duration > 0) {
          run = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            stageRaw,
            stageLabel: snap.stage?.label ?? stageRaw,
            durationSeconds: duration,
            endedAt: Date.now()
          }
        }
      }
      this.lastClear = { stageRaw, playTime: play }
    }

    this.prevWave = wave
    this.prevStageRaw = stageRaw
    return run
  }

  reset(): void {
    this.lastClear = null
    this.prevWave = null
    this.prevStageRaw = null
  }
}
