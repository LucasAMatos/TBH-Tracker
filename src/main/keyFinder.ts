import { execFileSync } from 'node:child_process'
import { createDecipheriv, pbkdf2Sync } from 'node:crypto'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { decryptAndParseES3 } from './es3'
import type { KeyFindResult } from '@shared/types'

// Descoberta automatica da chave ES3 a partir dos ARQUIVOS do jogo no disco.
//
// O Easy Save 3 guarda a senha de criptografia num asset `ES3Defaults` dentro de
// `resources.assets` (ScriptableObject serializado pela Unity). Lemos esse arquivo
// (somente leitura), extraimos as strings candidatas e validamos cada uma contra o
// save real: a senha correta e a que descriptografa o save para JSON valido.
//
// Postura de seguranca: isto le SO arquivos em disco (instalacao do jogo + save).
// NAO toca no processo/memoria do jogo, nao injeta nada, nao modifica nada e nao
// acessa a rede. Mesmo padrao passivo da leitura do save.

const APPID = '3678970'
const ES3_ANCHOR = 'ES3Defaults'
// Faixa de tamanho plausivel para a senha ES3 (a do TBH tem 22 chars).
const MIN_LEN = 8
const MAX_LEN = 48

/** Raizes de instalacao do Steam: registro (Windows) + caminhos padrao. */
function steamRoots(): string[] {
  const roots = new Set<string>()
  if (process.platform === 'win32') {
    try {
      const out = execFileSync(
        'reg',
        ['query', 'HKCU\\Software\\Valve\\Steam', '/v', 'SteamPath'],
        { encoding: 'utf8', windowsHide: true, timeout: 4000 }
      )
      const m = out.match(/SteamPath\s+REG_SZ\s+(.+)/i)
      if (m) roots.add(m[1].trim().replace(/\//g, '\\'))
    } catch {
      // sem registro: cai nos padroes
    }
    roots.add('C:\\Program Files (x86)\\Steam')
    roots.add('C:\\Program Files\\Steam')
  } else {
    // Linux/Proton (suporte futuro): caminhos comuns do Steam.
    const home = homedir()
    roots.add(join(home, '.steam', 'steam'))
    roots.add(join(home, '.local', 'share', 'Steam'))
  }
  return [...roots].filter((r) => existsSync(r))
}

/** Bibliotecas do Steam (a raiz + as extras do libraryfolders.vdf). */
function steamLibraries(root: string): string[] {
  const libs = new Set<string>([root])
  try {
    const vdf = readFileSync(join(root, 'steamapps', 'libraryfolders.vdf'), 'utf8')
    const re = /"path"\s+"([^"]+)"/g
    let m: RegExpExecArray | null
    while ((m = re.exec(vdf)) !== null) libs.add(m[1].replace(/\\\\/g, '\\'))
  } catch {
    // sem vdf: usa so a raiz
  }
  return [...libs]
}

/** Localiza a pasta de instalacao do TBH (via appmanifest do appid). */
function findGameDir(): string | null {
  for (const root of steamRoots()) {
    for (const lib of steamLibraries(root)) {
      const acf = join(lib, 'steamapps', `appmanifest_${APPID}.acf`)
      if (!existsSync(acf)) continue
      let installdir = 'TaskbarHero'
      try {
        const m = readFileSync(acf, 'utf8').match(/"installdir"\s+"([^"]+)"/)
        if (m) installdir = m[1]
      } catch {
        // usa o default
      }
      const dir = join(lib, 'steamapps', 'common', installdir)
      if (existsSync(dir)) return dir
    }
  }
  return null
}

/** Acha o `resources.assets` dentro da pasta `*_Data` do jogo. */
function findResourcesAssets(gameDir: string): string | null {
  try {
    for (const entry of readdirSync(gameDir, { withFileTypes: true })) {
      if (entry.isDirectory() && entry.name.endsWith('_Data')) {
        const p = join(gameDir, entry.name, 'resources.assets')
        if (existsSync(p)) return p
      }
    }
  } catch {
    // ignora
  }
  return null
}

/** Cria um validador: dada uma senha, diz se ela descriptografa o save para JSON. */
function makeValidator(saveBuf: Buffer): (pw: string) => boolean {
  const iv = saveBuf.subarray(0, 16)
  const cipher = saveBuf.subarray(16)
  return (pw: string): boolean => {
    // Filtro rapido: deriva a chave, decifra so o 1o bloco e exige que comece com '{'.
    try {
      const key = pbkdf2Sync(Buffer.from(pw, 'utf8'), iv, 100, 16, 'sha1')
      const d = createDecipheriv('aes-128-cbc', key, iv)
      d.setAutoPadding(false)
      if (d.update(cipher.subarray(0, 16))[0] !== 0x7b) return false
    } catch {
      return false
    }
    // Confirmacao completa: descriptografa tudo e faz JSON.parse.
    try {
      decryptAndParseES3(saveBuf, pw)
      return true
    } catch {
      return false
    }
  }
}

/** Extrai runs ASCII imprimiveis (MIN_LEN..MAX_LEN) e retorna o 1o que valida. */
function scanRuns(buf: Buffer, isKey: (s: string) => boolean): string | null {
  const seen = new Set<string>()
  let start = -1
  for (let i = 0; i <= buf.length; i++) {
    const b = i < buf.length ? buf[i] : 0
    const printable = b >= 0x20 && b <= 0x7e
    if (printable) {
      if (start === -1) start = i
    } else if (start !== -1) {
      const len = i - start
      if (len >= MIN_LEN && len <= MAX_LEN) {
        const s = buf.toString('latin1', start, i)
        if (!seen.has(s)) {
          seen.add(s)
          if (isKey(s)) return s
        }
      }
      start = -1
    }
  }
  return null
}

/** Procura a chave no asset: primeiro perto do marcador ES3Defaults, depois no arquivo todo. */
function extractKey(assetsBuf: Buffer, isKey: (s: string) => boolean): string | null {
  const anchor = assetsBuf.indexOf(ES3_ANCHOR)
  if (anchor !== -1) {
    const end = Math.min(assetsBuf.length, anchor + 8192)
    const hit = scanRuns(assetsBuf.subarray(anchor, end), isKey)
    if (hit) return hit
  }
  return scanRuns(assetsBuf, isKey)
}

/**
 * Tenta descobrir a chave ES3 lendo os arquivos do jogo e validando contra o save.
 * Precisa do caminho do save (para validar). Nao retorna a chave ao chamador — quem
 * decide grava-la; aqui so devolvemos o resultado e a chave encontrada para o main.
 */
export function findEs3Key(savePath: string | null): KeyFindResult & { key?: string } {
  if (!savePath || !existsSync(savePath)) {
    return { status: 'no-save' }
  }
  const gameDir = findGameDir()
  if (!gameDir) {
    return { status: 'no-game' }
  }
  const assetsPath = findResourcesAssets(gameDir)
  if (!assetsPath) {
    return { status: 'no-game', gamePath: gameDir }
  }
  try {
    const saveBuf = readFileSync(savePath)
    const assetsBuf = readFileSync(assetsPath)
    const key = extractKey(assetsBuf, makeValidator(saveBuf))
    if (key) return { status: 'found', gamePath: assetsPath, key }
    return { status: 'not-found', gamePath: assetsPath }
  } catch (err) {
    return {
      status: 'error',
      gamePath: assetsPath,
      message: err instanceof Error ? err.message : 'Erro ao ler os arquivos do jogo.'
    }
  }
}
