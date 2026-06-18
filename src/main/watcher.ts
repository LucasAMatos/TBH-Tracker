import { statSync } from 'node:fs'

export interface Fingerprint {
  size: number
  mtimeMs: number
}

/**
 * Lê o save por polling em intervalo fixo (padrão 2 min) e dispara `onChange`
 * apenas quando o conteúdo realmente mudou (fingerprint = tamanho + mtime).
 *
 * Antes observava cada gravação do save (~28s); agora atualiza a cada 2 min para
 * reduzir a frequência de leitura/descriptografia. 100% passivo: só lê metadados
 * para o fingerprint e o arquivo quando muda.
 */
export class SaveWatcher {
  private timer: NodeJS.Timeout | null = null
  private last: Fingerprint | null = null

  constructor(
    private readonly filePath: string,
    private readonly onChange: () => void,
    private readonly intervalMs = 120_000
  ) {}

  start(): void {
    this.stop()
    this.check(true) // leitura inicial imediata
    this.timer = setInterval(() => this.check(), this.intervalMs)
  }

  private check(force = false): void {
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
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
    this.last = null
  }
}
