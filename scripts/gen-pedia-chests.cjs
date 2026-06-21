// Dominio Baus da TBHPedia (W7). Fonte: taskbarherowiki.com/chests (prop "chests": 41 baus
// com pools/odds, onde aparecem e faixa de nivel de gear). O campo "sources" (catalogo de
// itens por bau) e descartado — redundante com itemData (D3) e enorme.
//   node scripts/gen-pedia-chests.cjs [--refresh]
const { cachedGet, extractFlight, extractProp, writeCorpus, nowIso } = require('./pedia/lib.cjs')

const SOURCE = 'taskbarherowiki.com'
const URL = 'https://taskbarherowiki.com/chests'

async function main() {
  const refresh = process.argv.includes('--refresh')
  console.log(`[pedia:chests] ${URL}${refresh ? ' (refresh)' : ''}`)
  const { body, cached } = await cachedGet(URL, { lang: 'en', refresh })
  console.log(`  ${cached ? 'cache' : 'rede'} — ${(body.length / 1024).toFixed(1)} KB`)
  const chests = extractProp(extractFlight(body), 'chests')
  if (!Array.isArray(chests) || chests.length === 0) throw new Error('nenhum bau')

  const entries = chests.map((c) => ({
    dropKey: c.dropKey,
    dropType: c.dropType,
    gearLevelMin: c.gearLevelMin ?? null,
    gearLevelMax: c.gearLevelMax ?? null,
    pools: (c.pools || []).map((p) => ({
      label: p.label,
      totalWeight: p.totalWeight,
      entries: (p.entries || []).map((e) => ({
        rewardType: e.rewardType,
        rewardKey: e.rewardKey,
        weight: e.weight,
        probability: e.probability
      }))
    })),
    stages: (c.stages || []).map((s) => ({
      label: s.label,
      difficulty: s.difficulty,
      act: s.act,
      stageNo: s.stageNo,
      level: s.level,
      source: s.source
    }))
  }))

  writeCorpus('chests', { source: SOURCE, sourceUrl: URL, lang: 'en', fetchedAt: nowIso() }, entries)
  console.log('[pedia:chests] OK.')
}

main().catch((e) => {
  console.error('[pedia:chests] FALHOU:', e.message)
  process.exit(1)
})
