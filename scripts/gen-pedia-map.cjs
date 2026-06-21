// Dominio Mapa/Estagios/Monstros da TBHPedia (W5). Fonte: taskbarherowiki.com/map
// (prop "stages": 120 estagios com monstros, boss e drops).
//   node scripts/gen-pedia-map.cjs [--refresh]
const { cachedGet, extractFlight, extractProp, writeCorpus, nowIso } = require('./pedia/lib.cjs')

const SOURCE = 'taskbarherowiki.com'
const URL = 'https://taskbarherowiki.com/map'

async function main() {
  const refresh = process.argv.includes('--refresh')
  console.log(`[pedia:map] ${URL}${refresh ? ' (refresh)' : ''}`)
  const { body, cached } = await cachedGet(URL, { lang: 'en', refresh })
  console.log(`  ${cached ? 'cache' : 'rede'} — ${(body.length / 1024).toFixed(1)} KB`)
  const stages = extractProp(extractFlight(body), 'stages')
  if (!Array.isArray(stages) || stages.length === 0) throw new Error('nenhum estagio')

  const entries = stages.map((s) => ({
    key: s.key,
    difficulty: s.difficulty,
    act: s.act,
    stageNo: s.stageNo,
    label: s.label,
    type: s.type,
    level: s.level,
    name: s.name,
    monsters: (s.monsters || []).map((m) => ({ key: m.key, name: m.name, count: m.count })),
    boss: s.boss ? { key: s.boss.key, name: s.boss.name } : null,
    drops: (s.drops || []).map((d) => ({
      itemKey: d.itemKey,
      name: d.name,
      icon: d.icon,
      grade: d.grade,
      source: d.source,
      rate: d.rate,
      dropKey: d.dropKey
    }))
  }))

  writeCorpus('map', { source: SOURCE, sourceUrl: URL, lang: 'en', fetchedAt: nowIso() }, entries)
  console.log('[pedia:map] OK.')
}

main().catch((e) => {
  console.error('[pedia:map] FALHOU:', e.message)
  process.exit(1)
})
