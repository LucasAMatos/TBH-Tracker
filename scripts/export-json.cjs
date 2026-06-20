// Exporta os catalogos de dados (TS estatico em src/shared e src/renderer/src/data)
// para JSON embutido no app C# (dotnet/TbhTracker.Core/Data). Usa esbuild para
// transpilar/empacotar cada modulo em CJS e le os exports nomeados.
//
// Rodar uma vez (e a cada regeneracao dos *Data.ts pelos gen-*.cjs):
//   node scripts/export-json.cjs
//
// Os geradores gen-*.cjs continuam sendo a fonte (datamine); este script so congela
// o resultado em JSON para o C# carregar como recurso embutido.

const esbuild = require('esbuild')
const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '..')
const outDir = path.resolve(root, 'dotnet', 'TbhTracker.Core', 'Data')
fs.mkdirSync(outDir, { recursive: true })

function loadModule(rel) {
  const entry = path.resolve(root, rel)
  const result = esbuild.buildSync({
    entryPoints: [entry],
    bundle: true,
    format: 'cjs',
    platform: 'node',
    write: false,
    logLevel: 'silent'
  })
  const code = result.outputFiles[0].text
  const mod = { exports: {} }
  const fn = new Function('module', 'exports', 'require', code)
  fn(mod, mod.exports, require)
  return mod.exports
}

function write(name, data) {
  const file = path.join(outDir, name)
  fs.writeFileSync(file, JSON.stringify(data), 'utf8')
  const kb = (fs.statSync(file).size / 1024).toFixed(1)
  console.log(`  ${name} (${kb} KB)`)
}

console.log('Exportando catalogos para', path.relative(root, outDir))

const runeTree = loadModule('src/shared/runeTree.ts')
write('runeTree.json', {
  bounds: runeTree.RUNE_BOUNDS,
  start: runeTree.RUNE_START,
  edges: runeTree.RUNE_EDGES,
  nodes: runeTree.RUNE_NODES
})

const statData = loadModule('src/shared/statData.ts')
write('statData.json', {
  statIds: statData.STAT_IDS,
  modTypes: statData.MOD_TYPES,
  statStrings: statData.STAT_STRINGS,
  statMods: statData.STAT_MODS,
  affixRep: statData.AFFIX_REP,
  gradeSlots: statData.GRADE_SLOTS
})

const itemData = loadModule('src/shared/itemData.ts')
write('itemData.json', {
  itemTypeIds: itemData.ITEM_TYPE_IDS,
  gearTypeIds: itemData.GEAR_TYPE_IDS,
  gradeIds: itemData.GRADE_IDS,
  items: itemData.ITEM_DATA
})

const attributeData = loadModule('src/shared/attributeData.ts')
write('attributeData.json', {
  groups: attributeData.ATTR_GROUPS,
  nodes: attributeData.ATTR_NODES
})

const stageData = loadModule('src/shared/stageData.ts')
write('stageData.json', { stages: stageData.STAGE_DATA })

const heroes = loadModule('src/shared/heroes.ts')
write('heroes.json', heroes.HERO_CATALOG)

const pedia = loadModule('src/renderer/src/data/tbhpedia.ts')
write('tbhpedia.json', pedia.TBHPEDIA)

const widgets = loadModule('src/renderer/src/data/dashboardWidgets.ts')
write('dashboardWidgets.json', widgets.DASHBOARD_WIDGETS)

console.log('OK.')
