// Helpers do catálogo de pets (PE1; dado puro em petData.ts). Combina o catálogo com o
// estado do save (PetSaveData) para listar desbloqueados/bloqueados e o bônus do pet ativo.
// Importante: o bônus NÃO é cumulativo — apenas o pet ativo (equipado) concede seu efeito.
import { PET_LIST, type PetDef } from './petData'
import { formatStatLine } from './stats'

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
