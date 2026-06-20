// Dominio Runas da TBHPedia (W3). Fonte: taskbarherowiki.com/runes
// (props "runes", "edges", "categories"). Envelope com metadados extra (edges/categories).
//   node scripts/gen-pedia-runes.cjs [--refresh]
const { cachedGet, extractFlight, extractProp, writeJson, nowIso } = require('./pedia/lib.cjs')

const SOURCE = 'taskbarherowiki.com'
const URL = 'https://taskbarherowiki.com/runes'

function toIntList(v) {
  if (v == null) return []
  if (Array.isArray(v)) return v.map(Number).filter((n) => Number.isFinite(n))
  return Number.isFinite(Number(v)) ? [Number(v)] : []
}

async function main() {
  const refresh = process.argv.includes('--refresh')
  console.log(`[pedia:runes] ${URL}${refresh ? ' (refresh)' : ''}`)
  const { body, cached } = await cachedGet(URL, { lang: 'en', refresh })
  console.log(`  ${cached ? 'cache' : 'rede'} — ${(body.length / 1024).toFixed(1)} KB`)
  const flight = extractFlight(body)
  const runes = extractProp(flight, 'runes')
  if (!Array.isArray(runes) || runes.length === 0) throw new Error('nenhuma runa')
  let edges = []
  let categories = []
  try { edges = extractProp(flight, 'edges') } catch {}
  try { categories = extractProp(flight, 'categories') } catch {}

  const entries = runes.map((r) => ({
    key: r.key,
    name: r.name,
    icon: r.icon,
    x: r.x,
    y: r.y,
    maxLevel: r.maxLevel ?? 0,
    next: toIntList(r.next),
    prevReq: toIntList(r.prevReq),
    stat: r.stat ?? '',
    effect: r.effect ?? '',
    category: r.category ?? '',
    isUnlock: !!r.isUnlock,
    levels: (r.levels || []).map((l) => ({ level: l.level, value: String(l.value), cost: l.cost })),
    totalCost: r.totalCost ?? 0
  }))

  const payload = {
    domain: 'runes',
    provenance: { source: SOURCE, sourceUrl: URL, lang: 'en', fetchedAt: nowIso() },
    entries,
    edges: Array.isArray(edges) ? edges.map((e) => [Number(e[0]), Number(e[1])]) : [],
    categories: Array.isArray(categories) ? categories : []
  }
  writeJson('runes', payload, entries.length)
  console.log('[pedia:runes] OK.')
}

main().catch((e) => {
  console.error('[pedia:runes] FALHOU:', e.message)
  process.exit(1)
})
