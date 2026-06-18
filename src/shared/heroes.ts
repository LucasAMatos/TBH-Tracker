// Mapa heroKey -> nome (ver TBHPEDIA.md > Herois). Keys observadas no save: 1x1.
export const HERO_NAMES: Record<number, string> = {
  101: 'Knight',
  201: 'Ranger',
  301: 'Sorcerer',
  401: 'Priest',
  501: 'Hunter',
  601: 'Slayer'
}

export function heroName(key: number | string | null | undefined): string {
  const n = Number(key)
  return HERO_NAMES[n] ?? String(key ?? '?')
}
