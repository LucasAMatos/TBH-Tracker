// Gera src/shared/meltData.ts: valor de venda (ouro) e XP de Cubo por ItemKey (D5).
// Fonte: gamedata.js do tbh-farm (datamine): itemSell + itemCubeExp.
//   node scripts/gen-melt.cjs
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const https = require('node:https')

const SRC_URL = 'https://raw.githubusercontent.com/WcgStark/tbh-farm/main/engine/gamedata.js'
const ROOT = path.resolve(__dirname, '..')
const OUT_TS = path.join(ROOT, 'src', 'shared', 'meltData.ts')

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
  const DB = loadDb((await get(SRC_URL)).toString('utf8'))
  const sell = DB.itemSell || {}
  const cube = DB.itemCubeExp || {}
  if (Object.keys(sell).length === 0) throw new Error('DB.itemSell vazio')

  // União das chaves (ordenadas numericamente). Cada entrada: [ouroVenda, xpCubo].
  const keys = [...new Set([...Object.keys(sell), ...Object.keys(cube)])]
    .map(Number)
    .sort((a, b) => a - b)

  const rows = keys.map((k) => {
    const s = Number(sell[String(k)] ?? 0) || 0
    const c = Number(cube[String(k)] ?? 0) || 0
    return `  "${k}": [${s}, ${c}]`
  })

  const ts = `// AUTO-GERADO por scripts/gen-melt.cjs (origem: ${SRC_URL}).
// Mapa ItemKey -> [ouroVenda, xpCubo] para a calculadora de derretimento/Alchemy (D5).
// Dados da comunidade (datamine) — podem mudar com patches. Não editar à mão.

export type MeltDatum = readonly [sellGold: number, cubeXp: number]

export const MELT_DATA: Record<string, MeltDatum> = {
${rows.join(',\n')}
}

/** Ouro de venda + XP de Cubo de um ItemKey (null se fora do catálogo). */
export function meltOf(key: number | string): MeltDatum | null {
  return MELT_DATA[String(key)] ?? null
}
`
  fs.writeFileSync(OUT_TS, ts, 'utf8')
  console.log('wrote', path.relative(ROOT, OUT_TS), `(${rows.length} itens)`)
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
