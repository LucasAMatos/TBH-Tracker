import { stageDataForRaw } from './stage'
import type { Snapshot } from './types'

// Exportação de dados da sessão (E1): funções puras que serializam o snapshot atual
// (fluxo de ouro G3, farm por estágio F2/F3 e inventário D3) em JSON ou CSV.

/** JSON completo da sessão: campos principais + fluxo de ouro + farm + inventário. */
export function buildSessionJson(snapshot: Snapshot): string {
  const data = {
    exportedAt: new Date().toISOString(),
    capturedAt: snapshot.capturedAt,
    gold: snapshot.gold,
    totalKills: snapshot.totalKills,
    playTimeSeconds: snapshot.playTimeSeconds,
    stage: snapshot.stage,
    maxCompletedStage: snapshot.maxCompletedStage,
    heroes: snapshot.heroes,
    goldFlow: snapshot.goldFlow ?? null,
    stageFarm: snapshot.stageFarm ?? null,
    inventory: snapshot.inventory ?? null
  }
  return JSON.stringify(data, null, 2)
}

/** Escapa um campo CSV (aspas/virgula/quebra de linha) no padrão RFC 4180. */
function csvField(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return ''
  const s = String(value)
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

function csvRow(fields: (string | number | null | undefined)[]): string {
  return fields.map(csvField).join(',')
}

/** Arredonda para inteiro ou devolve vazio quando null. */
function intOrEmpty(n: number | null | undefined): number | '' {
  return n === null || n === undefined ? '' : Math.round(n)
}

/**
 * CSV das medições de farm por estágio (F2/F3): uma linha por estágio medido.
 * Sempre inclui o cabeçalho (CSV vazio = só cabeçalho).
 */
export function buildFarmCsv(snapshot: Snapshot): string {
  const header = [
    'estagio',
    'estagio_raw',
    'segundos',
    'ouro_ganho',
    'xp_ganho',
    'kills',
    'ouro_por_hora',
    'xp_por_hora',
    'clears_estimados',
    'clears_por_hora',
    'segundos_por_clear'
  ]
  const lines = [csvRow(header)]
  for (const e of snapshot.stageFarm?.entries ?? []) {
    const label = stageDataForRaw(e.stageRaw)?.label ?? e.stageRaw
    lines.push(
      csvRow([
        label,
        e.stageRaw,
        Math.round(e.seconds),
        Math.round(e.goldGained),
        Math.round(e.expGained),
        Math.round(e.killsGained),
        intOrEmpty(e.goldPerHour),
        intOrEmpty(e.expPerHour),
        intOrEmpty(e.clears),
        intOrEmpty(e.clearsPerHour),
        intOrEmpty(e.secondsPerClear)
      ])
    )
  }
  return lines.join('\n')
}

/** Sufixo de data/hora amigável para nomes de arquivo (ex.: 2026-06-19_14-30-00). */
export function exportStamp(at: number = Date.now()): string {
  const d = new Date(at)
  const p = (n: number): string => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}_${p(d.getHours())}-${p(
    d.getMinutes()
  )}-${p(d.getSeconds())}`
}
