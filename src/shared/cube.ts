/**
 * Marcos do Hero-dric Cube por nível (fonte: docs/TBHPEDIA.md › Hero-dric Cube).
 * Usado para alertar quais funções já estão liberadas e qual é o próximo desbloqueio.
 */
export interface CubeMilestone {
  level: number
  name: string
  description: string
}

export const CUBE_MILESTONES: CubeMilestone[] = [
  {
    level: 4,
    name: 'Cubo desbloqueado',
    description: 'Synthesis + Alchemy (derrete gear em ouro + XP de Cubo)'
  },
  {
    level: 5,
    name: 'Crafting',
    description: 'Cria gear/acessórios aleatórios a partir de materiais'
  },
  {
    level: 8,
    name: 'Decoration',
    description: 'Gemas de 1 atributo em gear Rare+'
  },
  {
    level: 10,
    name: 'Removal + Trade Ship',
    description: 'Remove sockets; libera envio ao inventário Steam'
  }
]

/** Próximo marco ainda não atingido, ou `null` se todos já foram desbloqueados. */
export function nextCubeMilestone(level: number | null): CubeMilestone | null {
  const lvl = level ?? 0
  return CUBE_MILESTONES.find((m) => m.level > lvl) ?? null
}

/** Se o marco já foi atingido pelo nível atual do Cubo. */
export function isMilestoneReached(milestone: CubeMilestone, level: number | null): boolean {
  return level !== null && level >= milestone.level
}
