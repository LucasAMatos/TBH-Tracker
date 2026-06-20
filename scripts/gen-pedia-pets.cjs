// Gerador do dominio Pets da TBHPedia (Epico W / prova do pipeline W1).
// Fonte: https://taskbarherowiki.com/pets (payload RSC com a prop "pets").
//
//   node scripts/gen-pedia-pets.cjs            # usa cache se existir
//   node scripts/gen-pedia-pets.cjs --refresh  # forca rebusca da rede

const { cachedGet, extractFlight, extractProp, writeCorpus, nowIso } = require('./pedia/lib.cjs')

const SOURCE = 'taskbarherowiki.com'
const URL = 'https://taskbarherowiki.com/pets'

async function main() {
  const refresh = process.argv.includes('--refresh')
  console.log(`[pedia:pets] buscando ${URL}${refresh ? ' (refresh)' : ''}`)
  const { body, cached } = await cachedGet(URL, { lang: 'en', refresh })
  console.log(`  ${cached ? 'cache' : 'rede'} — ${(body.length / 1024).toFixed(1)} KB`)

  const flight = extractFlight(body)
  const pets = extractProp(flight, 'pets')
  if (!Array.isArray(pets) || pets.length === 0) throw new Error('nenhum pet extraido')

  const entries = pets.map((p) => ({
    key: p.key,
    name: p.name,
    icon: p.icon,
    dlc: !!p.dlc,
    stats: (p.stats || []).map((s) => ({ stat: s.stat, disp: s.disp, label: s.label })),
    unlock: {
      type: p.unlock?.type,
      monsterKey: p.unlock?.monsterKey ?? null,
      monsterName: p.unlock?.monsterName ?? null,
      count: p.unlock?.count ?? null,
      note: p.unlock?.note ?? null,
      farm: p.unlock?.farm
        ? {
            label: p.unlock.farm.label,
            act: p.unlock.farm.act,
            stageNo: p.unlock.farm.stageNo,
            stageName: p.unlock.farm.stageName,
            share: p.unlock.farm.share,
            weight: p.unlock.farm.weight,
            alsoIn: p.unlock.farm.alsoIn
          }
        : null
    }
  }))

  writeCorpus('pets', { source: SOURCE, sourceUrl: URL, lang: 'en', fetchedAt: nowIso() }, entries)
  console.log('[pedia:pets] OK.')
}

main().catch((e) => {
  console.error('[pedia:pets] FALHOU:', e.message)
  process.exit(1)
})
