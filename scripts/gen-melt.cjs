// Gera dotnet/TbhTracker.Core/Data/meltData.json: ouro de venda + XP de Cubo por ItemKey
// (D5). Fonte: gamedata.js do tbh-farm (datamine): itemSell + itemCubeExp.
//   node scripts/gen-melt.cjs
//
// Escreve direto o JSON embutido do app .NET (o pipeline TS->JSON em export-json.cjs
// depende de src/shared, removido na migracao para .NET).
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const https = require('node:https')

const SRC_URL = 'https://raw.githubusercontent.com/WcgStark/tbh-farm/main/engine/gamedata.js'
const ROOT = path.resolve(__dirname, '..')
const OUT = path.join(ROOT, 'dotnet', 'TbhTracker.Core', 'Data', 'meltData.json')

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

  const keys = [...new Set([...Object.keys(sell), ...Object.keys(cube)])]
    .map(Number)
    .sort((a, b) => a - b)

  const items = {}
  for (const k of keys) {
    const s = Number(sell[String(k)] ?? 0) || 0
    const c = Number(cube[String(k)] ?? 0) || 0
    items[String(k)] = [s, c]
  }

  fs.writeFileSync(OUT, JSON.stringify({ items }), 'utf8')
  const kb = (fs.statSync(OUT).size / 1024).toFixed(1)
  console.log('wrote', path.relative(ROOT, OUT), `(${keys.length} itens, ${kb} KB)`)
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
