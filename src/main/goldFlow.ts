import type { GoldEvent, GoldFlow } from '@shared/types'

interface Sample {
  t: number // epoch ms
  gold: number
}

const MAX_EVENTS = 50
const MAX_SAMPLES = 2000
// Janela móvel para a taxa "recente". O save é esparso (só relemos quando ele muda),
// então uma janela curta demais fica instável; 120s dá uma taxa mais estável.
const WINDOW_SECONDS = 120
// Span mínimo (s) dentro da janela para calcular taxa — evita números absurdos.
const MIN_WINDOW_SPAN = 8

/**
 * Acumula as leituras de ouro de uma sessão (em memória) e deriva o fluxo:
 * deltas por evento (G3) e taxa de ouro/h por sessão e por janela móvel (G2, básico).
 * Sem persistência — zera quando a sessão/arquivo de save muda (I6 é item separado).
 */
export class GoldFlowTracker {
  private samples: Sample[] = []
  private events: GoldEvent[] = []

  reset(): void {
    this.samples = []
    this.events = []
  }

  /** Registra uma leitura. Só cria amostra/evento quando o ouro realmente muda. */
  record(at: number, gold: number | null): GoldFlow | null {
    if (gold === null) return this.current()

    const prev = this.samples[this.samples.length - 1]
    if (!prev) {
      this.samples.push({ t: at, gold })
    } else if (prev.gold !== gold) {
      this.events.push({ at, delta: gold - prev.gold, gold })
      if (this.events.length > MAX_EVENTS) this.events.shift()
      this.samples.push({ t: at, gold })
      if (this.samples.length > MAX_SAMPLES) this.samples.shift()
    }
    // ouro inalterado: ignora (não infla a sessão com leituras sem mudança).

    return this.current()
  }

  private current(): GoldFlow | null {
    if (this.samples.length === 0) return null

    const first = this.samples[0]
    const last = this.samples[this.samples.length - 1]
    const elapsedSeconds = Math.max(0, (last.t - first.t) / 1000)
    const netDelta = last.gold - first.gold
    const sessionRatePerHour =
      elapsedSeconds > 0 ? (netDelta / elapsedSeconds) * 3600 : null

    let windowRatePerHour: number | null = null
    const windowStart = last.t - WINDOW_SECONDS * 1000
    const windowSamples = this.samples.filter((s) => s.t >= windowStart)
    if (windowSamples.length >= 2) {
      const wf = windowSamples[0]
      const span = (last.t - wf.t) / 1000
      if (span >= MIN_WINDOW_SPAN) {
        windowRatePerHour = ((last.gold - wf.gold) / span) * 3600
      }
    }

    return {
      sessionStartAt: first.t,
      sessionStartGold: first.gold,
      currentGold: last.gold,
      netDelta,
      elapsedSeconds,
      sessionRatePerHour,
      windowRatePerHour,
      windowSeconds: WINDOW_SECONDS,
      events: [...this.events].reverse()
    }
  }
}
