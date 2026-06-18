// Gera src/shared/runeTree.ts e baixa os ícones das runas.
// Fonte: catálogo da comunidade (tbh-farm) espelhando taskbarhero.wiki.
//   node scripts/gen-runes.cjs
const fs = require('node:fs')
const path = require('node:path')
const https = require('node:https')

const TREE_URL = 'https://raw.githubusercontent.com/WcgStark/tbh-farm/main/data/rune_tree.json'
const ICON_BASE = 'https://taskbarhero.wiki/game/runes'
// Categorias oficiais (as mesmas exibidas no mapa público): sobrepostas por key.
const WIKI_URL = 'https://taskbarherowiki.com/pt/runes'
const ROOT = path.resolve(__dirname, '..')
const OUT_TS = path.join(ROOT, 'src', 'shared', 'runeTree.ts')
const ICONS_DIR = path.join(ROOT, 'src', 'renderer', 'src', 'assets', 'runes')

function get(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
        if (res.statusCode !== 200) {
          res.resume()
          return reject(new Error(`${res.statusCode} ${url}`))
        }
        const chunks = []
        res.on('data', (c) => chunks.push(c))
        res.on('end', () => resolve(Buffer.concat(chunks)))
      })
      .on('error', reject)
  })
}

// A fonte gravou locais nao-ascii com UTF-8 duplamente codificado ("ã" -> "Ã£").
// Revertemos reinterpretando os bytes latin1 como UTF-8.
function fixMojibake(s) {
  if (!/[\u0080-\u00ff]/.test(s)) return s
  const fixed = Buffer.from(s, 'latin1').toString('utf8')
  return fixed.includes('\uFFFD') ? s : fixed
}
function loc(obj) {
  if (!obj) return ''
  return fixMojibake(obj['pt-BR'] || obj['en-US'] || Object.values(obj)[0] || '')
}
function iconName(p) {
  return String(p || '').replace(/^.*\//, '').replace(/\.png$/i, '')
}

// Categoria oficial (taskbarherowiki) -> id interno.
const WIKI_CAT_TO_ID = {
  Hero: 'hero',
  Gold: 'gold',
  Slots: 'slots',
  EXP: 'exp',
  Chests: 'chests',
  Combat: 'combat',
  Cube: 'cube',
  Offline: 'offline'
}

// Fallback heurístico pelo stat caso a wiki mude/ falhe.
function categoryFromStat(stat) {
  const s = String(stat || '')
  if (/Chest|Box/.test(s)) return 'chests'
  if (/Inventory|Slot|Stash|Storage/.test(s)) return 'slots'
  if (/Gold/.test(s)) return 'gold'
  if (/Exp/.test(s)) return 'exp'
  if (/Offline/.test(s)) return 'offline'
  if (/Cube|Alchemy/.test(s)) return 'cube'
  if (/Attack|Damage|Hp|Crit|Defense|AtkSpeed|Skill|Penetration|Heal/.test(s)) return 'hero'
  return 'combat'
}

// Extrai key -> categoria oficial do HTML (flight do Next) da wiki pública.
async function fetchWikiCategories() {
  try {
    const html = (await get(WIKI_URL)).toString('utf8')
    const unesc = html.replace(/\\"/g, '"').replace(/\\\\/g, '\\')
    const map = new Map()
    let i = 0
    while ((i = unesc.indexOf('"maxLevel"', i + 1)) !== -1) {
      let start = i
      let depth = 0
      for (let j = i; j >= 0; j--) {
        if (unesc[j] === '}') depth++
        else if (unesc[j] === '{') {
          if (depth === 0) {
            start = j
            break
          }
          depth--
        }
      }
      depth = 0
      let end = i
      for (let j = start; j < unesc.length; j++) {
        if (unesc[j] === '{') depth++
        else if (unesc[j] === '}') {
          depth--
          if (depth === 0) {
            end = j
            break
          }
        }
      }
      try {
        const o = JSON.parse(unesc.slice(start, end + 1))
        if (o && typeof o.key === 'number' && o.category) map.set(o.key, WIKI_CAT_TO_ID[o.category])
      } catch {
        /* parcial */
      }
    }
    return map
  } catch (e) {
    console.log('  aviso: falha ao buscar categorias da wiki, usando heurística:', e.message)
    return new Map()
  }
}

;(async () => {
  const cat = JSON.parse((await get(TREE_URL)).toString('utf8'))
  const wikiCats = await fetchWikiCategories()
  console.log('categorias oficiais obtidas:', wikiCats.size)
  const out = cat.nodes.map((n) => ({
    key: n.key,
    x: n.x,
    y: n.y,
    name: loc(n.name),
    icon: iconName(n.icon),
    stat: n.stat,
    category: wikiCats.get(n.key) || categoryFromStat(n.stat),
    maxLevel: n.maxLevel,
    effect: loc(n.effect),
    values: (n.levels || []).map((l) => l.value),
    goldCost: (n.levels || []).map((l) => (l.costItem === 100001 ? l.costValue : 0))
  }))

  const ts = `// AUTO-GERADO por scripts/gen-runes.cjs (origem: tbh-farm / taskbarhero.wiki).
// Nomes/efeitos em pt-BR. Posicoes (x,y), arestas e bounds para o mapa da arvore.
// Nao editar a mao; regenerar pelo script.

export interface RuneNode {
  key: number
  x: number
  y: number
  name: string
  icon: string // nome do arquivo do icone (sem extensao)
  stat: string
  category: RuneCategory
  maxLevel: number
  effect: string // template pt-BR com {0}
  values: number[] // valor do efeito por nivel
  goldCost: number[] // custo em ouro por nivel (0 quando o custo nao e ouro)
}

// Categorias oficiais do mapa público (taskbarherowiki.com).
export type RuneCategory =
  | 'hero'
  | 'gold'
  | 'slots'
  | 'exp'
  | 'chests'
  | 'combat'
  | 'cube'
  | 'offline'

export interface RuneEdge {
  from: number
  to: number
}

export const RUNE_BOUNDS = ${JSON.stringify(cat.bounds)} as const
export const RUNE_START: number[] = ${JSON.stringify(cat.startNodes)}
export const RUNE_EDGES: RuneEdge[] = ${JSON.stringify(cat.edges)}
export const RUNE_NODES: RuneNode[] = [
${out.map((n) => '  ' + JSON.stringify(n)).join(',\n')}
]
`
  fs.writeFileSync(OUT_TS, ts, 'utf8')
  console.log('wrote', path.relative(ROOT, OUT_TS), `(${out.length} nós, ${cat.edges.length} arestas)`)

  fs.mkdirSync(ICONS_DIR, { recursive: true })
  const unique = [...new Set(out.map((n) => n.icon))]
  let ok = 0
  for (const name of unique) {
    try {
      fs.writeFileSync(path.join(ICONS_DIR, name + '.png'), await get(`${ICON_BASE}/${name}.png`))
      ok++
    } catch (e) {
      console.log('  falha icone', name, e.message)
    }
  }
  console.log('ícones:', ok, '/', unique.length, '→', path.relative(ROOT, ICONS_DIR))
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
