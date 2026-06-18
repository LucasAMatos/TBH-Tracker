import type { RunRecord, Snapshot } from '@shared/types'

/** Acima disto, assume-se um gap (app/jogo fechado) e não se registram corridas. */
const MAX_CLEARS_PER_WINDOW = 50

/**
 * Detecta corridas (clears) a partir do contador cumulativo de clears do save
 * (`Snapshot.clearCount`, aggregate Type 15 / SubKey 0).
 *
 * Por quê não medir entre saves consecutivos: o jogo autossalva de forma esparsa
 * (~28-30s por timer) E também fora de ciclo (ex.: um save logo após um clear).
 * Medir o tempo entre dois saves quaisquer fazia uma corrida cair numa "janelinha"
 * curta (ex.: 11-13s) enquanto a janela vizinha — com a maior parte do playTime —
 * ficava com 0 clears e era descartada.
 *
 * Abordagem (clear-a-clear, robusta a saves fora de ciclo):
 *  - A baseline só avança quando o contador de clears sobe. Enquanto não sobe, o
 *    playTime vai acumulando através dos saves intermediários.
 *  - Ao detectar Δclears ≥ 1: tempo por corrida = ΔplayTime ÷ Δclears (medido desde
 *    o último clear observado, não desde o último save).
 *  - A 1ª medição após (re)iniciar ou trocar de estágio é "warm-up" (a baseline pode
 *    ter caído no meio de uma corrida): só ancora, não registra.
 *
 * Limitação residual: o save que captura o clear pode chegar alguns segundos após o
 * clear de fato (onda já avançou), então o tempo pode ter um leve viés (poucos
 * segundos), mas sem os outliers grosseiros de antes. A média de muitas corridas
 * converge para o valor real (contadores são cumulativos e exatos).
 */
export class RunDetector {
  private base: { clearCount: number; playTime: number; stageRaw: string } | null = null
  private anchored = false

  /** Processa um snapshot; retorna 0+ corridas detectadas desde o último clear. */
  process(snap: Snapshot): RunRecord[] {
    const stageRaw = snap.stage?.raw ?? null
    const clearCount = snap.clearCount
    const play = snap.playTimeSeconds

    if (stageRaw === null || clearCount === null || play === null) {
      return []
    }

    // (Re)estabelece baseline em start ou troca de estágio: não mede entre estágios.
    if (!this.base || this.base.stageRaw !== stageRaw) {
      this.base = { clearCount, playTime: play, stageRaw }
      this.anchored = false
      return []
    }

    const deltaClears = clearCount - this.base.clearCount
    const deltaPlay = play - this.base.playTime

    // Sem clears novos: mantém a baseline (acumulando playTime). playTime regrediu
    // (novo save/jogo) → reancora.
    if (deltaClears <= 0) {
      if (deltaPlay < 0) {
        this.base = { clearCount, playTime: play, stageRaw }
        this.anchored = false
      }
      return []
    }

    // Cruzou ≥ 1 fronteira de clear: ancora a baseline no clear atual.
    const wasAnchored = this.anchored
    this.base = { clearCount, playTime: play, stageRaw }
    this.anchored = true

    // 1ª medição após baseline fresca: pode ter começado no meio de uma corrida.
    if (!wasAnchored) return []

    if (deltaPlay <= 0 || deltaClears > MAX_CLEARS_PER_WINDOW) return []

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
    this.base = null
    this.anchored = false
  }
}
