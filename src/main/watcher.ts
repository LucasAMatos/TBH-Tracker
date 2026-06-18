import { type FSWatcher, statSync, watch } from 'node:fs'

export interface Fingerprint {
  size: number
  mtimeMs: number
}

/**
 * Observa um arquivo de save e dispara `onChange` apenas quando o conteudo
 * realmente muda (fingerprint = tamanho + mtime). Debounce para evitar
 * leituras parciais enquanto o jogo grava. 100% passivo: so le metadados.
 */
export class SaveWatcher {
  private watcher: FSWatcher | null = null
  private last: Fingerprint | null = null
  private debounceTimer: NodeJS.Timeout | null = null
  private pollTimer: NodeJS.Timeout | null = null

  constructor(
    private readonly filePath: string,
    private readonly onChange: () => void,
    private readonly debounceMs = 300
  ) {}

  start(): void {
    this.stop()
    try {
      this.watcher = watch(this.filePath, () => this.handleEvent())
    } catch {
      // se o watch nativo falhar, o polling abaixo cobre
    }
    // Polling leve de fallback (alguns saves sao reescritos via rename atomico,
    // o que pode escapar do fs.watch).
    this.pollTimer = setInterval(() => this.handleEvent(), 2000)
    // Leitura inicial
    this.handleEvent(true)
  }

  private handleEvent(force = false): void {
    if (this.debounceTimer) clearTimeout(this.debounceTimer)
    this.debounceTimer = setTimeout(() => {
      let fp: Fingerprint
      try {
        const s = statSync(this.filePath)
        fp = { size: s.size, mtimeMs: s.mtimeMs }
      } catch {
        return
      }
      const changed =
        force || !this.last || this.last.size !== fp.size || this.last.mtimeMs !== fp.mtimeMs
      if (changed) {
        this.last = fp
        this.onChange()
      }
    }, this.debounceMs)
  }

  stop(): void {
    if (this.watcher) {
      this.watcher.close()
      this.watcher = null
    }
    if (this.pollTimer) {
      clearInterval(this.pollTimer)
      this.pollTimer = null
    }
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer)
      this.debounceTimer = null
    }
    this.last = null
  }
}
