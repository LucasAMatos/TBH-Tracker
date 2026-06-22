// Gera dotnet/TbhTracker.Core/Data/levels.json: curva de XP por nível dos heróis (H14).
// Fonte: gamedata.js do tbh-farm (datamine), campo DB.levels (100 entradas).
//   node scripts/gen-levels.cjs
//
// Convencao: levels[i] = XP necessario para subir do nivel (i+1) para o (i+2)
// (levels[0] = custo do 1->2). Heroi no nivel L precisa de levels[L-1] p/ o proximo.
// Escreve direto o JSON embutido do app .NET.
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const https = require('node:https')

const SRC_URL = 'https://raw.githubusercontent.com/WcgStark/tbh-farm/main/engine/gamedata.js'
const ROOT = path.resolve(__dirname, '..')
const OUT = path.join(ROOT, 'dotnet', 'TbhTracker.Core', 'Data', 'levels.json')

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
  const levels = DB.levels
  if (!Array.isArray(levels) || levels.length === 0) throw new Error('DB.levels vazio')

  const out = levels.map((v) => Number(v) || 0)
  fs.writeFileSync(OUT, JSON.stringify({ levels: out }), 'utf8')
  console.log('wrote', path.relative(ROOT, OUT), `(${out.length} níveis)`)
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
