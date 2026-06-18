import type { RunRecord, Snapshot } from '@shared/types'

/** Acima disto, assume-se um gap (app/jogo fechado) e não se registram corridas. */
const MAX_CLEARS_PER_WINDOW = 50

/**
 * Detecta corridas (clears) a partir do contador cumulativo de clears do save
 * (`Snapshot.clearCount`, aggregate Type 15 / SubKey 0).
 *
 * Por quê não usar `currentStageWave → 0`: o jogo autossalva de forma esparsa
 * (~a cada 28-30s) e o instante exato do clear (wave == 0) quase nunca coincide
 * com uma gravação, então aquele sinal era raríssimo e media intervalos enormes.
 *
 * Abordagem por contador (exata mesmo com save esparso):
 *  - Entre dois snapshots no MESMO estágio, ΔclearCount = nº de corridas e
 *    ΔplayTime = tempo total gasto nelas.
 *  - Tempo por corrida = ΔplayTime / ΔclearCount (ciclo de farm, incluindo gaps
 *    entre corridas — que é justamente o que importa pra ouro/h).
 *  - Quando ΔclearCount == 1 (caso típico nessa cadência), o tempo é o da própria
 *    corrida (~28s), em vez do antigo 2m46s.
 */
export class RunDetector {
  private prev: { clearCount: number; playTime: number; stageRaw: string } | null = null

  /** Processa um snapshot; retorna 0+ corridas detectadas desde o último snapshot. */
  process(snap: Snapshot): RunRecord[] {
    const stageRaw = snap.stage?.raw ?? null
    const clearCount = snap.clearCount
    const play = snap.playTimeSeconds

    if (stageRaw === null || clearCount === null || play === null) {
      return []
    }

    const prev = this.prev
    this.prev = { clearCount, playTime: play, stageRaw }

    // Primeiro snapshot ou troca de estágio: apenas (re)estabelece a baseline.
    if (!prev || prev.stageRaw !== stageRaw) {
      return []
    }

    const deltaClears = clearCount - prev.clearCount
    const deltaPlay = play - prev.playTime

    // Sem clears novos, tempo inválido, ou gap improvável: nada a registrar.
    if (deltaClears <= 0 || deltaPlay <= 0 || deltaClears > MAX_CLEARS_PER_WINDOW) {
      return []
    }

    const perRun = Math.max(1, Math.round(deltaPlay / deltaClears))
    const stageLabel = snap.stage?.label ?? stageRaw
    const now = Date.now()

    const runs: RunRecord[] = []
    for (let i = 0; i < deltaClears; i++) {
      runs.push({
        id: `${now}-${i}-${Math.random().toString(36).slice(2, 8)}`,
        stageRaw,
        stageLabel,
        durationSeconds: perRun,
        endedAt: now
      })
    }
    return runs
  }

  reset(): void {
    this.prev = null
  }
}
