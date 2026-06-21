// Dominio Efeitos de material da TBHPedia (W4). Fonte: taskbarherowiki.com/effects
// (prop "effects": deco/engraving/inscription que concedem stats por slot/tier).
//   node scripts/gen-pedia-effects.cjs [--refresh]
const { cachedGet, extractFlight, extractProp, writeCorpus, nowIso } = require('./pedia/lib.cjs')

const SOURCE = 'taskbarherowiki.com'
const URL = 'https://taskbarherowiki.com/effects'

async function main() {
  const refresh = process.argv.includes('--refresh')
  console.log(`[pedia:effects] ${URL}${refresh ? ' (refresh)' : ''}`)
  const { body, cached } = await cachedGet(URL, { lang: 'en', refresh })
  console.log(`  ${cached ? 'cache' : 'rede'} — ${(body.length / 1024).toFixed(1)} KB`)
  const effects = extractProp(extractFlight(body), 'effects')
  if (!Array.isArray(effects) || effects.length === 0) throw new Error('nenhum efeito')

  const entries = effects.map((e) => ({
    key: e.key,
    name: e.name,
    grade: e.grade,
    gradeRank: e.gradeRank ?? 0,
    icon: e.icon,
    category: e.category,
    groups: (e.groups || []).map((g) => ({
      slot: g.slot,
      stat: g.stat,
      mod: g.mod,
      min: g.min,
      max: g.max,
      minTier: g.minTier,
      maxTier: g.maxTier,
      disp: g.disp,
      slotOptions: g.slotOptions ?? 1,
      chance: g.chance ?? 1
    }))
  }))

  writeCorpus('effects', { source: SOURCE, sourceUrl: URL, lang: 'en', fetchedAt: nowIso() }, entries)
  console.log('[pedia:effects] OK.')
}

main().catch((e) => {
  console.error('[pedia:effects] FALHOU:', e.message)
  process.exit(1)
})
