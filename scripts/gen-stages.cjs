// Gera src/shared/stageData.ts: catalogo de estagios (ouro/EXP/HP/inimigos por fase).
// Fonte: datamine da comunidade (tbh-farm, data/farm_stages.json).
//   node scripts/gen-stages.cjs
const fs = require('node:fs')
const path = require('node:path')
const https = require('node:https')

const SRC_URL = 'https://raw.githubusercontent.com/WcgStark/tbh-farm/main/data/farm_stages.json'
const ROOT = path.resolve(__dirname, '..')
const OUT_TS = path.join(ROOT, 'src', 'shared', 'stageData.ts')

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

// A fonte gravou nomes nao-ascii com UTF-8 duplamente codificado ("ú" -> "Ãº").
// Revertemos reinterpretando os bytes latin1 como UTF-8 (mesmo tratamento das runas).
function fixMojibake(s) {
  if (!/[\u0080-\u00ff]/.test(s)) return s
  const fixed = Buffer.from(s, 'latin1').toString('utf8')
  return fixed.includes('\uFFFD') ? s : fixed
}
function loc(obj) {
  if (!obj) return ''
  return fixMojibake(obj['pt-BR'] || obj['en-US'] || Object.values(obj)[0] || '')
}

;(async () => {
  const stages = JSON.parse((await get(SRC_URL)).toString('utf8'))
  if (!Array.isArray(stages) || stages.length === 0) throw new Error('farm_stages vazio')

  // Ordena pela chave DAPP (dificuldade+ato+fase) para saida deterministica.
  stages.sort((a, b) => a.key - b.key)

  const rows = stages.map((s) => {
    const key = s.key
    const difficulty = Math.floor(key / 1000) // 1=Normal .. 4=Torment
    const datum = {
      key,
      label: String(s.label),
      difficulty,
      act: s.act,
      phase: key % 100, // == stageNo; casa com decodeStage (fase no DAPP)
      level: s.level,
      name: loc(s.name),
      waves: s.waves,
      perWave: s.perWave,
      monsterTypes: s.monsterTypes,
      count: s.count, // nº de inimigos por clear
      totalHP: s.totalHP,
      expectedGold: s.expectedGold, // ouro/clear base
      expectedEXP: s.expectedEXP, // EXP/clear base
      goldPerHP: s.goldPerHP, // eficiencia: ouro por HP abatido
      expPerHP: s.expPerHP // eficiencia: EXP por HP abatido
    }
    return `  "${key}": ${JSON.stringify(datum)}`
  })

  const ts = `// AUTO-GERADO por scripts/gen-stages.cjs (origem: ${SRC_URL}).
// Catalogo de estagios de farm: por chave DAPP (dificuldade+ato+fase), ouro/EXP/HP base
// e nº de inimigos por clear. Cobre as fases 1-9 de cada ato (NAO inclui boss de ato).
// Dados da comunidade (datamine) — podem mudar com patches. Nao editar a mao; regenerar
// pelo script. Helpers de consulta/ranqueamento ficam em src/shared/stage.ts.

export interface StageDatum {
  key: number // chave DAPP (ex.: 1101 = Normal/Ato1/Fase1)
  label: string // rotulo curto do jogo (ex.: "1-1")
  difficulty: number // 1=Normal · 2=Nightmare · 3=Hell · 4=Torment
  act: number // 1..3
  phase: number // 1..9 (numero da fase dentro do ato; == key % 100)
  level: number // nivel recomendado do estagio
  name: string // nome do estagio (pt-BR)
  waves: number // nº de ondas
  perWave: number // inimigos por onda
  monsterTypes: number // tipos de monstro distintos
  count: number // nº de inimigos por clear
  totalHP: number // HP total a abater no clear
  expectedGold: number // ouro/clear base
  expectedEXP: number // EXP/clear base
  goldPerHP: number // eficiencia: ouro por HP abatido (proxy de ouro/tempo)
  expPerHP: number // eficiencia: EXP por HP abatido (proxy de EXP/tempo)
}

// Mapa chave DAPP (string de 4 digitos) -> dados do estagio. ${stages.length} estagios.
export const STAGE_DATA: Record<string, StageDatum> = {
${rows.join(',\n')}
}
`
  fs.writeFileSync(OUT_TS, ts, 'utf8')
  const diffs = [...new Set(stages.map((s) => Math.floor(s.key / 1000)))].length
  console.log(
    'wrote',
    path.relative(ROOT, OUT_TS),
    `(${stages.length} estagios, ${diffs} dificuldades)`
  )
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
