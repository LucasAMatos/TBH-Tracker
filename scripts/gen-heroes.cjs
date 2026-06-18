// Baixa os retratos dos 6 heróis da TBH Wiki para src/renderer/src/assets/heroes/.
// Os arquivos são nomeados pela heroKey do save (101..601), mapeada em heroes.ts.
// Fonte: taskbarhero.wiki (retrato grande usado na página de cada herói).
//   node scripts/gen-heroes.cjs
const fs = require('node:fs')
const path = require('node:path')
const https = require('node:https')

const ART_BASE = 'https://taskbarhero.wiki/game/ui'
const ROOT = path.resolve(__dirname, '..')
const OUT_DIR = path.join(ROOT, 'src', 'renderer', 'src', 'assets', 'heroes')

// heroKey -> nome interno do asset (o jogo usa "Abalist" para o Hunter).
const HEROES = [
  { key: 101, asset: 'Knight' },
  { key: 201, asset: 'Ranger' },
  { key: 301, asset: 'Sorcerer' },
  { key: 401, asset: 'Priest' },
  { key: 501, asset: 'Abalist' },
  { key: 601, asset: 'Slayer' }
]

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

;(async () => {
  fs.mkdirSync(OUT_DIR, { recursive: true })
  let ok = 0
  for (const h of HEROES) {
    const url = `${ART_BASE}/Arrage_ChaAnim_${h.asset}_Large_0.png`
    try {
      fs.writeFileSync(path.join(OUT_DIR, `${h.key}.png`), await get(url))
      ok++
    } catch (e) {
      console.log('  falha retrato', h.key, h.asset, e.message)
    }
  }
  console.log('retratos:', ok, '/', HEROES.length, '→', path.relative(ROOT, OUT_DIR))
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
