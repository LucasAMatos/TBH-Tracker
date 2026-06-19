// Gera src/shared/attributeData.ts: catálogo da árvore de atributos por herói (H12).
// Também baixa os ícones (assets/attributes/). Fonte: gamedata.js do tbh-farm (datamine).
//   - attributes      -> nós da árvore (hero/grp/atype/val/req/max)
//   - attributeGroups -> coordenada de coluna por grupo
//   - passives[val]   -> efeito do nó PASSIVO ({st, mt, v})  (+ statStrings p/ rótulo pt-BR)
//   - skills[val]     -> nó ATIVO (act/cd/delivery/dmgType/lvlKey); skillLevels -> escala
//   node scripts/gen-attributes.cjs
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const https = require('node:https')

const SRC_URL = 'https://raw.githubusercontent.com/WcgStark/tbh-farm/main/engine/gamedata.js'
const ICON_BASE = 'https://raw.githubusercontent.com/WcgStark/tbh-farm/main/assets/game/skills'
const ROOT = path.resolve(__dirname, '..')
const OUT_TS = path.join(ROOT, 'src', 'shared', 'attributeData.ts')
const ICONS_DIR = path.join(ROOT, 'src', 'renderer', 'src', 'assets', 'attributes')

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
function loc(obj) {
  if (!obj || typeof obj !== 'object') return null
  return obj['pt-BR'] ?? obj['en-US'] ?? Object.values(obj)[0] ?? null
}
// Rótulo limpo: usa name; senão deriva da linha removendo o template "+{0}".
function cleanName(ss, fallback) {
  if (!ss) return fallback
  const name = loc(ss.name)
  if (name) return name
  const line = loc(ss.line)
  if (line) return line.replace(/\s*[+\-]?\s*\{0\}.*/, '').trim() || fallback
  return fallback
}

;(async () => {
  const js = (await get(SRC_URL)).toString('utf8')
  const DB = loadDb(js)
  const attributes = DB.attributes || {}
  const groups = DB.attributeGroups || {}
  const passives = DB.passives || {}
  const skills = DB.skills || {}
  const skillLevels = DB.skillLevels || {}
  const statStrings = DB.statStrings || {}
  if (Object.keys(attributes).length === 0) throw new Error('DB.attributes vazio')

  const groupRows = Object.keys(groups)
    .map(Number)
    .sort((a, b) => a - b)
    .map((id) => ({ id, x: groups[String(id)] }))

  const icons = new Set()
  const nodes = Object.keys(attributes)
    .map(Number)
    .sort((a, b) => a - b)
    .map((id) => {
      const a = attributes[String(id)]
      const gx = groups[String(a.grp)] ?? 0
      const base = { id, hero: a.hero, grp: a.grp, gx, max: a.max, req: a.req }
      if (a.atype === 'ACTIVESKILL' && skills[a.val]) {
        const sk = skills[a.val]
        const dmg = sk.lvlKey != null ? Object.values(skillLevels[sk.lvlKey] || {}) : []
        const icon = `Skill_${a.val}`
        icons.add(icon)
        return {
          ...base,
          kind: 'active',
          icon,
          skillId: a.val,
          act: sk.act ?? null,
          delivery: sk.delivery ?? null,
          dmgType: sk.dmgType ?? null,
          cd: sk.cd ?? null,
          dmg
        }
      }
      // PASSIVO: efeito em passives[val]
      const p = passives[a.val] || passives[id] || null
      const st = p?.st ?? null
      const ss = st ? statStrings[st] : null
      const name = st ? cleanName(ss, st) : `Nó ${id}`
      const line = st ? loc(ss?.line) ?? `${name} +{0}` : null
      const icon = st ? `Passive_${st}` : 'Passive_AttackDamage'
      icons.add(icon)
      return {
        ...base,
        kind: 'passive',
        icon,
        st,
        mt: p?.mt ?? 'FLAT',
        v: p?.v ?? 0,
        name,
        line
      }
    })

  const ts = `// AUTO-GERADO por scripts/gen-attributes.cjs (origem: ${SRC_URL}).
// Árvore de atributos por herói (H12). Nós PASSIVOS resolvem efeito via \`passives\` ({st,mt,v},
// rótulo pt-BR de \`statStrings\`); nós ATIVOS via \`skills\`/\`skillLevels\`. \`id\` == Key do save.
// Layout: coluna = \`gx\` (de attributeGroups), linha = ordem do nó no grupo. Não editar à mão.

export interface AttrGroup {
  id: number
  x: number // coordenada de coluna (de attributeGroups)
}

export interface AttrNode {
  id: number // id do nó (== attributeSaveDatas[].Key)
  hero: number // 101..601
  grp: number // grupo (coluna)
  gx: number // coordenada de coluna do grupo
  kind: 'passive' | 'active'
  max: number // nível máximo do nó
  req: number // requisito (pontos)
  icon: string // nome do arquivo do ícone (sem extensão)
  // passivo
  st?: string | null // status (ex.: "Armor"); ver statData.ts
  mt?: string // tipo de modificador (FLAT/ADDITIVE)
  v?: number // valor por nível
  name?: string // rótulo pt-BR
  line?: string | null // linha-template pt-BR ("Armadura +{0}")
  // ativo
  skillId?: number
  act?: string | null
  delivery?: string | null
  dmgType?: string | null
  cd?: number | null
  dmg?: number[] // escala por nível
}

export const ATTR_GROUPS: AttrGroup[] = ${JSON.stringify(groupRows)}

export const ATTR_NODES: AttrNode[] = [
${nodes.map((n) => '  ' + JSON.stringify(n)).join(',\n')}
]
`
  fs.writeFileSync(OUT_TS, ts, 'utf8')
  console.log('wrote', path.relative(ROOT, OUT_TS), `(${nodes.length} nós, ${groupRows.length} grupos)`)

  // ícones (best-effort)
  fs.mkdirSync(ICONS_DIR, { recursive: true })
  let ok = 0
  for (const name of icons) {
    try {
      fs.writeFileSync(path.join(ICONS_DIR, name + '.png'), await get(`${ICON_BASE}/${name}.png`))
      ok++
    } catch (e) {
      console.log('  falha ícone', name, e.message)
    }
  }
  console.log('ícones:', ok, '/', icons.size, '→', path.relative(ROOT, ICONS_DIR))
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
