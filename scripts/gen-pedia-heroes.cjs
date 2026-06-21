// Dominio Herois da TBHPedia (W2). Fonte: taskbarherowiki.com/heroes (prop "heroes").
//   node scripts/gen-pedia-heroes.cjs [--refresh]
const { cachedGet, extractFlight, extractProp, writeCorpus, nowIso } = require('./pedia/lib.cjs')

const SOURCE = 'taskbarherowiki.com'
const URL = 'https://taskbarherowiki.com/heroes'

async function main() {
  const refresh = process.argv.includes('--refresh')
  console.log(`[pedia:heroes] ${URL}${refresh ? ' (refresh)' : ''}`)
  const { body, cached } = await cachedGet(URL, { lang: 'en', refresh })
  console.log(`  ${cached ? 'cache' : 'rede'} — ${(body.length / 1024).toFixed(1)} KB`)
  const heroes = extractProp(extractFlight(body), 'heroes')
  if (!Array.isArray(heroes) || heroes.length === 0) throw new Error('nenhum heroi')

  const entries = heroes.map((h) => ({
    key: h.key,
    class: h.class,
    name: h.name,
    description: h.description,
    mainWeapon: h.mainWeapon,
    subWeapon: h.subWeapon,
    isDlc: !!h.isDlc,
    unlockCost: h.unlockCost ?? 0,
    icon: h.icon,
    art: h.art,
    stats: (h.stats || []).map((s) => ({ stat: s.stat, value: s.value, disp: s.disp })),
    baseAttack: {
      damageType: h.baseAttack?.damageType ?? '',
      delivery: h.baseAttack?.delivery ?? [],
      range: h.baseAttack?.range ?? 0
    },
    tree: (h.tree || []).map((g) => ({
      group: g.group,
      tier: g.tier,
      levelGate: g.levelGate,
      nodes: (g.nodes || []).map((n) => ({
        kind: n.kind,
        key: n.key,
        icon: n.icon,
        maxLevel: n.maxLevel ?? 0,
        requiredPoint: n.requiredPoint ?? null,
        stat: n.stat ?? null,
        mod: n.mod ?? null,
        perPoint: n.perPoint ?? null,
        total: n.total ?? null,
        levelDisps: n.levelDisps ?? null,
        name: n.name ?? null,
        descTemplate: n.descTemplate ?? null,
        desc: n.desc ?? null,
        levelValues: n.levelValues ?? null,
        pct: n.pct ?? null,
        activation: n.activation ? { type: n.activation.type, value: n.activation.value ?? null } : null,
        cooldown: n.cooldown ?? null,
        duration: n.duration ?? null,
        charge: n.charge ?? null,
        continuous: n.continuous ?? null,
        damageType: n.damageType ?? null,
        delivery: n.delivery ?? null,
        range: n.range ?? null
      }))
    })),
    maxPoints: h.maxPoints ?? 0
  }))

  writeCorpus('heroes', { source: SOURCE, sourceUrl: URL, lang: 'en', fetchedAt: nowIso() }, entries)
  console.log('[pedia:heroes] OK.')
}

main().catch((e) => {
  console.error('[pedia:heroes] FALHOU:', e.message)
  process.exit(1)
})
