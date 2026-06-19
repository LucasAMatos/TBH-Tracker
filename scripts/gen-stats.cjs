// Gera src/shared/statData.ts: catálogo de bônus/atributos de itens (D4).
// Fonte: gamedata.js do tbh-farm (datamine). Cataloga:
//   - statStrings  -> STAT_STRINGS  (rótulo PT-BR + linha "+{0}" por tipo de status)
//   - statMods     -> STAT_MODS     (tabela de rolagem chave:nível -> [statIdx, mtIdx, min, max])
//   - affixRep     -> AFFIX_REP      (representação/orçamento de afixo por status)
//   - gradeSlots   -> GRADE_SLOTS    (nº de slots de afixo por raridade)
//   node scripts/gen-stats.cjs
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const https = require('node:https')

const SRC_URL = 'https://raw.githubusercontent.com/WcgStark/tbh-farm/main/engine/gamedata.js'
const ROOT = path.resolve(__dirname, '..')
const OUT_TS = path.join(ROOT, 'src', 'shared', 'statData.ts')

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

// Rótulo "nome" limpo: usa name; se faltar, deriva da linha removendo o template "+{0}".
function cleanName(ss, id) {
  const name = loc(ss.name)
  if (name) return name
  const line = loc(ss.line)
  if (line) return line.replace(/\s*[+\-]?\s*\{0\}.*/, '').trim() || id
  return id
}

;(async () => {
  const js = (await get(SRC_URL)).toString('utf8')
  const DB = loadDb(js)
  const statStrings = DB.statStrings || {}
  const statMods = DB.statMods || {}
  const affixRep = DB.affixRep || {}
  const gradeSlots = DB.gradeSlots || {}
  if (Object.keys(statStrings).length === 0) throw new Error('DB.statStrings vazio')

  // IDs canônicos dos status, em ordem alfabética (determinismo).
  const statIds = Object.keys(statStrings).sort()
  const statIdx = (s) => statIds.indexOf(s)

  // STAT_STRINGS: rótulo PT + linha PT por status.
  const stringsRows = statIds.map((id) => {
    const ss = statStrings[id]
    const name = cleanName(ss, id)
    const line = loc(ss.line) ?? `${name} +{0}`
    return `  ${JSON.stringify(id)}: ${JSON.stringify({ name, line })}`
  })

  // Tipos de modificador presentes (FLAT/ADDITIVE), ordenados.
  const modTypes = [...new Set(Object.values(statMods).map((m) => m.mt))].sort()
  const mtIdx = (m) => modTypes.indexOf(m)

  // STAT_MODS: "baseKey:level" -> [statIdx, modTypeIdx, min, max]. Pula stat fora do catálogo.
  const modKeys = Object.keys(statMods).sort((a, b) => {
    const [ka, la] = a.split(':')
    const [kb, lb] = b.split(':')
    return Number(ka) - Number(kb) || Number(la) - Number(lb)
  })
  const modsRows = modKeys
    .filter((k) => statIdx(statMods[k].st) >= 0)
    .map((k) => {
      const m = statMods[k]
      return `  ${JSON.stringify(k)}: [${statIdx(m.st)}, ${mtIdx(m.mt)}, ${m.min}, ${m.max}]`
    })

  // AFFIX_REP: status -> { value, mod, tier } (mantém só status catalogados).
  const repRows = Object.keys(affixRep)
    .filter((s) => statIdx(s) >= 0)
    .sort()
    .map((s) => {
      const r = affixRep[s]
      return `  ${JSON.stringify(s)}: ${JSON.stringify({ value: r.value, mod: r.mod, tier: r.tier })}`
    })

  // GRADE_SLOTS: raridade -> contagem de slots de afixo.
  const slotsRows = Object.keys(gradeSlots).map((g) => {
    const s = gradeSlots[g]
    return `  ${JSON.stringify(g)}: ${JSON.stringify(s)}`
  })

  const ts = `// AUTO-GERADO por scripts/gen-stats.cjs (origem: ${SRC_URL}).
// Catálogo de bônus/atributos de itens (D4): tipos de status, tabela de rolagem (afixos),
// representação de afixo e slots por raridade. Base do U11 (filtro/seleção por status) e do
// modelo de stats (H10/H11). Dados da comunidade (datamine) — podem mudar com patches.
// Não editar a mão; regenerar pelo script. Helpers de consulta ficam em src/shared/stats.ts.

// IDs canônicos dos tipos de status (ex.: "Armor", "AttackDamage", "AddHpPerHit").
export const STAT_IDS = ${JSON.stringify(statIds)} as const

// Tipos de modificador: FLAT (valor absoluto) ou ADDITIVE (percentual aditivo).
export const MOD_TYPES = ${JSON.stringify(modTypes)} as const

export interface StatString {
  name: string // rótulo curto PT-BR (ex.: "Armadura")
  line: string // linha com template (ex.: "Armadura +{0}")
}

// Rótulo PT-BR + linha por tipo de status (chave = STAT_IDS).
export const STAT_STRINGS: Record<string, StatString> = {
${stringsRows.join(',\n')}
}

// Modificador rolável: [índice do status em STAT_IDS, índice do tipo em MOD_TYPES, min, max].
export type StatMod = readonly [statIdx: number, modTypeIdx: number, min: number, max: number]

// Tabela de rolagem por "chaveBase:nível" (ex.: "100101:3"). Valores min/max do roll.
export const STAT_MODS: Record<string, StatMod> = {
${modsRows.join(',\n')}
}

export interface AffixRep {
  value: number
  mod: string
  tier: number
}

// Representação/orçamento de afixo por status (subset de STAT_IDS).
export const AFFIX_REP: Record<string, AffixRep> = {
${repRows.join(',\n')}
}

export interface GradeSlots {
  inherent: number
  deco: number
  engr: number
  inscr: number
  extra: number
}

// Nº de slots de afixo por raridade (quantos bônus um item daquela raridade comporta).
export const GRADE_SLOTS: Record<string, GradeSlots> = {
${slotsRows.join(',\n')}
}
`
  fs.writeFileSync(OUT_TS, ts, 'utf8')
  console.log(
    'wrote',
    path.relative(ROOT, OUT_TS),
    `(${statIds.length} status, ${modsRows.length} mods, ${repRows.length} affixRep, ${slotsRows.length} grades)`
  )
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
