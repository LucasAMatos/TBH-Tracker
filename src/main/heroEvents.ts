import type { HeroEvents, HeroSnapshot, LevelUpEvent } from '@shared/types'

const MAX_EVENTS = 50

/**
 * Detecta level-ups de heróis comparando o `HeroLevel` entre leituras consecutivas
 * do save (H2). A primeira vez que um herói é visto apenas registra a linha de base
 * (sem evento); a partir daí, qualquer aumento de nível vira um `LevelUpEvent`.
 *
 * Em memória, sem persistência — zera quando a sessão/arquivo de save muda (I6 é
 * item separado, como no fluxo de ouro).
 */
export class HeroEventsTracker {
  private levels = new Map<string, number>()
  private events: LevelUpEvent[] = []
  private sessionStartAt: number | null = null

  reset(): void {
    this.levels.clear()
    this.events = []
    this.sessionStartAt = null
  }

  /** Registra uma leitura de heróis. Emite eventos para níveis que subiram. */
  record(at: number, heroes: HeroSnapshot[]): HeroEvents | null {
    if (heroes.length === 0) return this.current()
    if (this.sessionStartAt === null) this.sessionStartAt = at

    for (const hero of heroes) {
      if (hero.level === null) continue
      const id = String(hero.key)
      const prev = this.levels.get(id)
      this.levels.set(id, hero.level)
      // Primeira observação do herói: só fixa a linha de base, sem evento.
      if (prev === undefined) continue
      if (hero.level > prev) {
        this.events.push({
          at,
          heroKey: hero.key,
          heroName: hero.name,
          fromLevel: prev,
          toLevel: hero.level
        })
        if (this.events.length > MAX_EVENTS) this.events.shift()
      }
    }

    return this.current()
  }

  private current(): HeroEvents | null {
    if (this.sessionStartAt === null) return null
    return {
      sessionStartAt: this.sessionStartAt,
      levelUps: [...this.events].reverse()
    }
  }
}
