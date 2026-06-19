// Gera src/shared/petData.ts: catálogo dos pets (PE1).
// Fonte: gamedata.js do tbh-farm (datamine). Cataloga:
//   - pets      -> nome pt-BR, statKey, condição de unlock (+param1)
//   - petStats  -> efeitos do pet (lista de {st, mt, v}); st é um status do catálogo D4
//   node scripts/gen-pets.cjs
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const https = require('node:https')

const SRC_URL = 'https://raw.githubusercontent.com/WcgStark/tbh-farm/main/engine/gamedata.js'
const ROOT = path.resolve(__dirname, '..')
const OUT_TS = path.join(ROOT, 'src', 'shared', 'petData.ts')

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

// Escolhe a localização PT-BR, com fallback en-US e depois o 1º valor disponível.
function loc(obj) {
  if (!obj || typeof obj !== 'object') return null
  return obj['pt-BR'] ?? obj['en-US'] ?? Object.values(obj)[0] ?? null
}

;(async () => {
  const js = (await get(SRC_URL)).toString('utf8')
  const DB = loadDb(js)
  const pets = DB.pets || {}
  const petStats = DB.petStats || {}
  if (Object.keys(pets).length === 0) throw new Error('DB.pets vazio')

  const rows = Object.keys(pets)
    .map(Number)
    .sort((a, b) => a - b)
    .map((key) => {
      const p = pets[String(key)]
      const stats = (petStats[String(p.statKey)] || []).map((m) => ({
        st: m.st,
        mt: m.mt,
        v: m.v
      }))
      return {
        key,
        name: loc(p.name) ?? String(key),
        unlock: String(p.unlock),
        param1: p.param1 ?? 0,
        statKey: p.statKey,
        stats
      }
    })

  const ts = `// AUTO-GERADO por scripts/gen-pets.cjs (origem: ${SRC_URL}).
// Catálogo dos pets (PE1). Nomes em pt-BR; \`st\` referencia o catálogo de status (statData.ts).
// Não editar à mão; regenerar pelo script.

export interface PetStat {
  st: string // id do status (ver STAT_STRINGS em statData.ts)
  mt: string // tipo de modificador (FLAT/ADDITIVE)
  v: number // valor do bônus
}

export interface PetDef {
  key: number // PetKey (== PetSaveData[].PetKey no save)
  name: string // nome pt-BR
  unlock: string // condição de desbloqueio ('KillMonster' | 'DLC' | ...)
  param1: number // parâmetro do unlock (id do monstro p/ KillMonster; appId da DLC)
  statKey: number // chave em petStats
  stats: PetStat[] // efeitos concedidos pelo pet
}

export const PET_LIST: PetDef[] = [
${rows.map((r) => '  ' + JSON.stringify(r)).join(',\n')}
]
`
  fs.writeFileSync(OUT_TS, ts, 'utf8')
  console.log('wrote', path.relative(ROOT, OUT_TS), `(${rows.length} pets)`)
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
