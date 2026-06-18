// Gera src/shared/itemData.ts: mapa ItemKey -> tipo / gear-type / raridade / nivel.
// Fonte: catalogo de itens da comunidade (gamedata do tbh-farm, datamine do jogo).
//   node scripts/gen-items.cjs
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const https = require('node:https')

const SRC_URL = 'https://raw.githubusercontent.com/WcgStark/tbh-farm/main/engine/gamedata.js'
const ROOT = path.resolve(__dirname, '..')
const OUT_TS = path.join(ROOT, 'src', 'shared', 'itemData.ts')

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

// O gamedata.js faz `module.exports = DB` quando carregado como modulo CommonJS.
// Salvamos num arquivo temporario e damos require para extrair o objeto DB.
function loadDb(jsText) {
  const tmp = path.join(os.tmpdir(), `tbh-gamedata-${Date.now()}.cjs`)
  fs.writeFileSync(tmp, jsText, 'utf8')
  try {
    delete require.cache[require.resolve(tmp)]
    return require(tmp)
  } finally {
    fs.unlinkSync(tmp)
  }
}

;(async () => {
  const js = (await get(SRC_URL)).toString('utf8')
  const DB = loadDb(js)
  const items = DB.items || {}
  const grades = Array.isArray(DB.grades) ? DB.grades.slice() : []
  if (grades.length === 0) throw new Error('DB.grades vazio')

  // Tipos de item observados (GEAR / MATERIAL / STAGEBOX), em ordem estavel.
  const TYPE_ORDER = ['GEAR', 'MATERIAL', 'STAGEBOX']
  const types = [...new Set(Object.values(items).map((i) => i.type))]
  types.sort((a, b) => {
    const ia = TYPE_ORDER.indexOf(a)
    const ib = TYPE_ORDER.indexOf(b)
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib)
  })

  // Gear types (slot/categoria) em ordem alfabetica para determinismo.
  const gearTypes = [
    ...new Set(Object.values(items).map((i) => i.gt).filter(Boolean))
  ].sort()

  const typeIdx = (t) => types.indexOf(t)
  const gtIdx = (g) => (g ? gearTypes.indexOf(g) : -1)
  const gradeIdx = (g) => (g ? grades.indexOf(g) : -1)

  const keys = Object.keys(items).sort((a, b) => Number(a) - Number(b))
  const rows = keys.map((k) => {
    const it = items[k]
    const lvl = typeof it.lvl === 'number' ? it.lvl : -1
    return `  "${k}": [${typeIdx(it.type)}, ${gtIdx(it.gt)}, ${gradeIdx(it.grade)}, ${lvl}]`
  })

  const ts = `// AUTO-GERADO por scripts/gen-items.cjs (origem: ${SRC_URL}).
// Mapa ItemKey -> [tipoIdx, gearTypeIdx, raridadeIdx, nivel]. Indices referem-se aos
// arrays exportados abaixo; -1 = ausente. Dados da comunidade (datamine) — podem mudar
// com patches. Nao editar a mao; regenerar pelo script.

// Tipos de item (GEAR = equipamento; MATERIAL = material; STAGEBOX = baú de fase).
export const ITEM_TYPE_IDS = ${JSON.stringify(types)} as const
// Tipos de gear (slot/categoria) usados pelos itens GEAR.
export const GEAR_TYPE_IDS = ${JSON.stringify(gearTypes)} as const
// Raridades, da mais baixa (Common) à mais alta (Cosmic).
export const GRADE_IDS = ${JSON.stringify(grades)} as const

export type ItemDatum = readonly [
  typeIdx: number,
  gearTypeIdx: number,
  gradeIdx: number,
  level: number
]

export const ITEM_DATA: Record<string, ItemDatum> = {
${rows.join(',\n')}
}
`
  fs.writeFileSync(OUT_TS, ts, 'utf8')
  console.log(
    'wrote',
    path.relative(ROOT, OUT_TS),
    `(${keys.length} itens, ${gearTypes.length} tipos de gear, ${grades.length} raridades)`
  )
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
