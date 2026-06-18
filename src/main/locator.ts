import { existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

const SAVE_FILENAME = 'SaveFile_Live.es3'

/**
 * Caminhos candidatos do save (ver TBHPEDIA.md > Save).
 * Windows: %USERPROFILE%\AppData\LocalLow\TesseractStudio\TaskbarHero\
 * Proton/Linux: compatdata/3678970/pfx/... (suporte futuro)
 */
export function candidateSavePaths(): string[] {
  const home = homedir()
  const paths: string[] = []

  // Windows (LocalLow nao tem env var dedicada; derivamos de USERPROFILE)
  paths.push(
    join(home, 'AppData', 'LocalLow', 'TesseractStudio', 'TaskbarHero', SAVE_FILENAME)
  )

  // Proton (Steam) no Linux
  const steamApp = '3678970'
  paths.push(
    join(
      home,
      '.steam',
      'steam',
      'steamapps',
      'compatdata',
      steamApp,
      'pfx',
      'drive_c',
      'users',
      'steamuser',
      'AppData',
      'LocalLow',
      'TesseractStudio',
      'TaskbarHero',
      SAVE_FILENAME
    )
  )

  return paths
}

/** Retorna o primeiro caminho de save existente, ou null. */
export function locateSave(): string | null {
  for (const p of candidateSavePaths()) {
    if (existsSync(p)) return p
  }
  return null
}
