// Pipeline de ingestao reutilizavel da TBHPedia (Epico W / W1).
// Fonte primaria: taskbarherowiki.com (Next.js App Router) — os dados vem embutidos
// como JSON limpo no payload RSC (self.__next_f.push([1,"..."])). Esta lib busca (com
// cache do bruto + proveniencia + rate limit), extrai o flight e as props embutidas, e
// grava o envelope canonico em dotnet/TbhTracker.Core/Data/pedia/<dominio>.json.
//
// Esquema: docs/PEDIA-CORPUS.md (W0).

const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const https = require('node:https')

const ROOT = path.resolve(__dirname, '..', '..')
const CACHE_DIR = path.resolve(ROOT, 'scripts', '.cache', 'pedia')
const OUT_DIR = path.resolve(ROOT, 'dotnet', 'TbhTracker.Core', 'Data', 'pedia')

const UA = 'Mozilla/5.0 (TBH-Tracker datamine; passive read of public pages)'
const RATE_LIMIT_MS = 1500
let _lastFetchAt = 0

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

function nowIso() {
  return new Date().toISOString()
}

function slugify(s) {
  return String(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function httpGet(url, headers = {}) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { 'User-Agent': UA, ...headers } }, (res) => {
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          const next = new URL(res.headers.location, url).toString()
          res.resume()
          return resolve(httpGet(next, headers))
        }
        if (res.statusCode !== 200) {
          res.resume()
          return reject(new Error(`HTTP ${res.statusCode} em ${url}`))
        }
        let data = ''
        res.setEncoding('utf8')
        res.on('data', (c) => (data += c))
        res.on('end', () => resolve(data))
      })
      .on('error', reject)
  })
}

/** Busca uma pagina com cache em disco do HTML bruto (+ proveniencia). Respeita rate limit
 *  apenas quando bate na rede. `lang` vira cookie de locale (Next.js i18n por cookie). */
async function cachedGet(url, { lang = 'en', refresh = false } = {}) {
  fs.mkdirSync(CACHE_DIR, { recursive: true })
  const key = `${slugify(new URL(url).host + new URL(url).pathname)}.${lang}.html`
  const file = path.join(CACHE_DIR, key)
  if (!refresh && fs.existsSync(file)) {
    return { body: fs.readFileSync(file, 'utf8'), url, cached: true }
  }
  const wait = RATE_LIMIT_MS - (Date.now() - _lastFetchAt)
  if (wait > 0) await sleep(wait)
  const headers = lang && lang !== 'en' ? { Cookie: `NEXT_LOCALE=${lang}; lang=${lang}` } : {}
  const body = await httpGet(url, headers)
  _lastFetchAt = Date.now()
  fs.writeFileSync(file, body, 'utf8')
  return { body, url, cached: false }
}

/** Concatena+desescapa os pushes RSC do Next.js App Router num unico flight payload. */
function extractFlight(html) {
  const pushes = [...html.matchAll(/self\.__next_f\.push\(\[1,("(?:[^"\\]|\\.)*")\]\)/g)]
  let flight = ''
  for (const m of pushes) {
    try {
      flight += JSON.parse(m[1])
    } catch {
      /* ignora pushes nao-string */
    }
  }
  return flight
}

/** Faz parsing balanceado de um valor JSON (objeto/array) a partir de um indice de abertura. */
function parseBalanced(text, openIdx) {
  const open = text[openIdx]
  const close = open === '[' ? ']' : '}'
  let depth = 0
  let inStr = false
  let esc = false
  for (let i = openIdx; i < text.length; i++) {
    const ch = text[i]
    if (inStr) {
      if (esc) esc = false
      else if (ch === '\\') esc = true
      else if (ch === '"') inStr = false
    } else if (ch === '"') {
      inStr = true
    } else if (ch === open) {
      depth++
    } else if (ch === close) {
      depth--
      if (depth === 0) {
        const raw = text.slice(openIdx, i + 1)
        return JSON.parse(raw)
      }
    }
  }
  throw new Error('JSON balanceado nao fechou')
}

/** Extrai a primeira prop `"<key>":` do flight como JSON (array/objeto). Ex.: extractProp(f,'pets'). */
function extractProp(flight, key) {
  const needle = `"${key}":`
  let from = 0
  while (true) {
    const k = flight.indexOf(needle, from)
    if (k < 0) throw new Error(`prop "${key}" nao encontrada no flight`)
    let j = k + needle.length
    while (j < flight.length && /\s/.test(flight[j])) j++
    if (flight[j] === '[' || flight[j] === '{') {
      try {
        return parseBalanced(flight, j)
      } catch {
        /* tenta a proxima ocorrencia */
      }
    }
    from = k + needle.length
  }
}

/** Grava o envelope canonico do dominio em Core/Data/pedia/<domain>.json. */
function writeCorpus(domain, provenance, entries) {
  fs.mkdirSync(OUT_DIR, { recursive: true })
  const file = path.join(OUT_DIR, `${domain}.json`)
  const payload = { domain, provenance, entries }
  fs.writeFileSync(file, JSON.stringify(payload), 'utf8')
  const kb = (fs.statSync(file).size / 1024).toFixed(1)
  console.log(`  ${path.relative(ROOT, file)} — ${entries.length} entradas (${kb} KB)`)
  return file
}

module.exports = {
  ROOT,
  CACHE_DIR,
  OUT_DIR,
  nowIso,
  slugify,
  sleep,
  cachedGet,
  extractFlight,
  extractProp,
  parseBalanced,
  writeCorpus
}
