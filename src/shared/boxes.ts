// Metadados dos baús (tipos, auto-abrir) + classificação de acúmulo.
// Pura: importada tanto pelo main (parser) quanto pelo renderer (UI).

export type BoxKind = 'common' | 'stageBoss' | 'actBoss'

export interface BoxType {
  kind: BoxKind
  label: string
  /** Cor para o indicador na UI (aproxima a cor do baú no jogo). */
  color: string
  /** Cooldown do auto-abrir (Extremo Norte) em segundos; null = sem auto-abrir. */
  autoOpenSeconds: number | null
}

/**
 * As três categorias de baú do jogo (TBHPedia › Baús), na ordem de exibição.
 * Cores aproximam o baú no jogo: Comum branco, Estágio azul, Ato vermelho.
 */
export const BOX_TYPES: BoxType[] = [
  { kind: 'common', label: 'Comum', color: '#c9d1d9', autoOpenSeconds: 300 },
  { kind: 'stageBoss', label: 'Estágio', color: '#58a6ff', autoOpenSeconds: 600 },
  { kind: 'actBoss', label: 'Ato', color: '#f85149', autoOpenSeconds: null }
]

/**
 * Mapa do valor de `BoxData.BoxTypes[i]` (enum do jogo) → categoria.
 * Validado contra save real: tipo 1 = baú azul (Estágio). 0/2 inferidos pela
 * ordem das categorias (branco=Comum, vermelho=Ato). Valores fora do mapa são
 * ignorados (o jogo só tem estas três categorias).
 */
export const BOX_TYPE_VALUE_TO_KIND: Record<number, BoxKind> = {
  0: 'common',
  1: 'stageBoss',
  2: 'actBoss'
}

export function kindFromTypeValue(value: number): BoxKind | null {
  return BOX_TYPE_VALUE_TO_KIND[value] ?? null
}

export function boxColor(kind: BoxKind): string {
  return BOX_TYPES.find((t) => t.kind === kind)?.color ?? '#8b949e'
}

export function boxAutoOpenSeconds(kind: BoxKind): number | null {
  return BOX_TYPES.find((t) => t.kind === kind)?.autoOpenSeconds ?? null
}

/**
 * Estimativa (B3, informativa) do tempo em segundos para o auto-abrir esvaziar
 * `quantity` baús desta categoria no ritmo **base** (1 baú por cooldown, sem as
 * runas do Extremo Norte que reduzem o cooldown). Retorna null quando a categoria
 * não tem auto-abrir (Ato) ou não há baús.
 */
export function boxDrainSeconds(kind: BoxKind, quantity: number): number | null {
  const cooldown = boxAutoOpenSeconds(kind)
  if (cooldown === null || quantity <= 0) return null
  return quantity * cooldown
}

/**
 * O jogo NÃO tem um teto fixo de baús. O problema real é o acúmulo: com o
 * auto-abrir lento/desligado (ou inventário/stash cheio) os baús param de ser
 * processados e drops podem ser perdidos. Por isso o alerta é sobre o total de
 * baús NÃO ABERTOS, com limiares calibráveis (não um "limite" do jogo).
 */
export interface BoxThresholds {
  warn: number // a partir daqui: "acumulando" (aviso)
  high: number // a partir daqui: "transbordando" (alerta)
}

export const DEFAULT_BOX_THRESHOLDS: BoxThresholds = { warn: 25, high: 75 }

/** Normaliza limiares vindos da UI/config (inteiros ≥ 1 e high ≥ warn). */
export function normalizeBoxThresholds(t: Partial<BoxThresholds>): BoxThresholds {
  const warn = Math.max(1, Math.round(t.warn ?? DEFAULT_BOX_THRESHOLDS.warn))
  const high = Math.max(warn, Math.round(t.high ?? DEFAULT_BOX_THRESHOLDS.high))
  return { warn, high }
}

export type BoxBacklogLevel = 'ok' | 'warn' | 'high'

export function classifyBoxBacklog(
  total: number | null,
  thresholds: BoxThresholds = DEFAULT_BOX_THRESHOLDS
): BoxBacklogLevel {
  if (total === null) return 'ok'
  if (total >= thresholds.high) return 'high'
  if (total >= thresholds.warn) return 'warn'
  return 'ok'
}
