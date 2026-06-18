import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { app } from 'electron'
import type { RunRecord } from '@shared/types'

const MAX_RUNS = 2000

let cache: RunRecord[] | null = null

function filePath(): string {
  return join(app.getPath('userData'), 'tbh-tracker-runs.json')
}

function load(): RunRecord[] {
  if (cache) return cache
  const path = filePath()
  try {
    cache = existsSync(path) ? (JSON.parse(readFileSync(path, 'utf8')) as RunRecord[]) : []
  } catch {
    cache = []
  }
  return cache
}

function persist(): void {
  const path = filePath()
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, JSON.stringify(cache ?? [], null, 2), 'utf8')
}

export function getRuns(): RunRecord[] {
  return load()
}

export function addRun(run: RunRecord): void {
  const runs = load()
  runs.push(run)
  if (runs.length > MAX_RUNS) runs.splice(0, runs.length - MAX_RUNS)
  persist()
}

export function clearRuns(): RunRecord[] {
  cache = []
  persist()
  return cache
}
