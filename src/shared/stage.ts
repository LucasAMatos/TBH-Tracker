import type { StageInfo } from './types'

const DIFFICULTY_NAMES: Record<number, string> = {
  1: 'Normal',
  2: 'Nightmare',
  3: 'Hell',
  4: 'Torment'
}

/**
 * Decodifica o codigo de estagio DAPP do save (ver TBHPEDIA.md > Estagios).
 * Formato: Dificuldade(1) + Ato(1) + Fase(2). Ex.: "1101" = Normal/Ato1/Fase1.
 * Boss de ato = fase 10.
 */
export function decodeStage(value: number | string | null | undefined): StageInfo | null {
  if (value === null || value === undefined) return null
  const digits = String(value).trim()
  if (!/^\d{3,4}$/.test(digits)) return null

  const padded = digits.padStart(4, '0')
  const difficulty = Number(padded[0])
  const act = Number(padded[1])
  const phase = Number(padded.slice(2))

  if (difficulty < 1 || difficulty > 4 || act < 1 || act > 3 || phase < 1 || phase > 10) {
    return null
  }

  const difficultyName = DIFFICULTY_NAMES[difficulty] ?? `?${difficulty}`
  const isBoss = phase === 10

  return {
    raw: padded,
    difficulty,
    difficultyName,
    act,
    phase,
    isBoss,
    label: `${difficultyName} · Ato ${act} · Fase ${phase}${isBoss ? ' (boss)' : ''}`
  }
}
