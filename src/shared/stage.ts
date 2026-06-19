import { STAGE_DATA, type StageDatum } from './stageData'
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

/** Nome legivel da dificuldade (1=Normal .. 4=Torment) ou null se fora do intervalo. */
export function difficultyName(difficulty: number): string | null {
  return DIFFICULTY_NAMES[difficulty] ?? null
}

/**
 * Normaliza um codigo de estagio (DAPP, numero ou string) para a chave de 4 digitos
 * usada pelo catalogo (`STAGE_DATA`). Aceita 3-4 digitos; retorna null se invalido.
 */
function normalizeStageKey(value: number | string | null | undefined): string | null {
  if (value === null || value === undefined) return null
  const digits = String(value).trim()
  if (!/^\d{3,4}$/.test(digits)) return null
  return digits.padStart(4, '0')
}

/**
 * Dados de farm do estagio (ouro/EXP/HP base, nº de inimigos) a partir do codigo DAPP.
 * Retorna null quando o estagio nao esta no catalogo (ex.: boss de ato, fase 10 — o
 * catalogo cobre as fases 1-9 de cada ato). Base para F2/F4/F5/G4.
 */
export function stageDataForRaw(value: number | string | null | undefined): StageDatum | null {
  const key = normalizeStageKey(value)
  return key ? (STAGE_DATA[key] ?? null) : null
}

export type StageMetric = 'gold' | 'exp' | 'combo'

export interface RankStagesOptions {
  difficulty?: number // 1..4; quando definido, filtra so aquela dificuldade
  limit?: number // corta o ranking nos N melhores
}

/**
 * Pontua a "eficiencia" de um estagio na metrica pedida. Usa as densidades por HP
 * (`goldPerHP` / `expPerHP`) como proxy de ganho por tempo — abater mais HP ~ mais tempo,
 * entao ouro/HP e EXP/HP aproximam ouro/h e EXP/h sem depender do tempo medido (F2).
 * `combo` normaliza ambas pelo maximo do conjunto e soma (peso igual). Base para F4.
 */
function stageScore(s: StageDatum, metric: StageMetric, maxGold: number, maxExp: number): number {
  if (metric === 'gold') return s.goldPerHP
  if (metric === 'exp') return s.expPerHP
  const g = maxGold > 0 ? s.goldPerHP / maxGold : 0
  const e = maxExp > 0 ? s.expPerHP / maxExp : 0
  return g + e
}

/**
 * Ranqueia os estagios do catalogo (do melhor ao pior) pela metrica de eficiencia.
 * Foundation para a recomendacao de melhor estagio (F4). Os valores sao do catalogo
 * estatico; medicoes reais (F2/F3) podem refinar essa recomendacao depois.
 */
export function rankStages(metric: StageMetric, opts: RankStagesOptions = {}): StageDatum[] {
  let stages = Object.values(STAGE_DATA)
  if (opts.difficulty !== undefined) {
    stages = stages.filter((s) => s.difficulty === opts.difficulty)
  }
  const maxGold = stages.reduce((m, s) => Math.max(m, s.goldPerHP), 0)
  const maxExp = stages.reduce((m, s) => Math.max(m, s.expPerHP), 0)
  const ranked = [...stages].sort(
    (a, b) => stageScore(b, metric, maxGold, maxExp) - stageScore(a, metric, maxGold, maxExp)
  )
  return opts.limit !== undefined ? ranked.slice(0, opts.limit) : ranked
}

/** Agrupa os estagios do catalogo por dificuldade (1..4), cada lista ordenada por chave. */
export function stagesByDifficulty(): Record<number, StageDatum[]> {
  const out: Record<number, StageDatum[]> = {}
  for (const s of Object.values(STAGE_DATA)) {
    ;(out[s.difficulty] ??= []).push(s)
  }
  for (const list of Object.values(out)) list.sort((a, b) => a.key - b.key)
  return out
}
