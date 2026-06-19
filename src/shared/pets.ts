// Helpers do catálogo de pets (PE1; dado puro em petData.ts). Combina o catálogo com o
// estado do save (PetSaveData) para listar desbloqueados/bloqueados e somar os bônus ativos.
import { PET_LIST, type PetDef } from './petData'
import { formatStatLine, statName } from './stats'

// Rótulos pt-BR das condições de desbloqueio conhecidas.
export const PET_UNLOCK_LABELS: Record<string, string> = {
  KillMonster: 'Derrotar um monstro específico (online)',
  DLC: 'DLC (pago)'
}

export function petUnlockLabel(unlock: string): string {
  return PET_UNLOCK_LABELS[unlock] ?? unlock
}

export function petById(key: number): PetDef | undefined {
  return PET_LIST.find((p) => p.key === key)
}

/** Linhas pt-BR dos efeitos de um pet (ex.: "150% de ouro aumentado por abate"). */
export function petEffectLines(pet: PetDef): string[] {
  return pet.stats.map((s) => formatStatLine(s.st, s.v))
}

// Bônus ativo agregado: soma o valor de um status entre todos os pets desbloqueados.
export interface AggregatedPetBonus {
  st: string
  name: string // rótulo curto pt-BR
  total: number // soma dos valores entre os pets desbloqueados
  line: string // linha formatada com o total
}

/**
 * Soma os bônus dos pets cujas keys estão em `unlockedKeys`, agrupando por status.
 * Retorna ordenado pelo rótulo pt-BR.
 */
export function aggregatePetBonuses(unlockedKeys: Iterable<number>): AggregatedPetBonus[] {
  const totals = new Map<string, number>()
  for (const key of unlockedKeys) {
    const pet = petById(key)
    if (!pet) continue
    for (const s of pet.stats) totals.set(s.st, (totals.get(s.st) ?? 0) + s.v)
  }
  return [...totals.entries()]
    .map(([st, total]) => ({ st, name: statName(st), total, line: formatStatLine(st, total) }))
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
}
