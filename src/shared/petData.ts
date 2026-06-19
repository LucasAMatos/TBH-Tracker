// AUTO-GERADO por scripts/gen-pets.cjs (origem: https://raw.githubusercontent.com/WcgStark/tbh-farm/main/engine/gamedata.js).
// Catálogo dos pets (PE1). Nomes em pt-BR; `st` referencia o catálogo de status (statData.ts).
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
  {"key":1001,"name":"Morcego","unlock":"KillMonster","param1":10031,"statKey":1001,"stats":[{"st":"DropChanceNormalChestPercent","mt":"FLAT","v":100},{"st":"IncreaseExpAmount","mt":"FLAT","v":150}]},
  {"key":1002,"name":"Vigia","unlock":"KillMonster","param1":20051,"statKey":1002,"stats":[{"st":"IncreaseGoldAmount","mt":"FLAT","v":150}]},
  {"key":1003,"name":"Esqueleto Ardente","unlock":"KillMonster","param1":20091,"statKey":1003,"stats":[{"st":"DropChanceStageBossChestPercent","mt":"FLAT","v":100}]},
  {"key":1004,"name":"Golem Azul","unlock":"KillMonster","param1":30091,"statKey":1004,"stats":[{"st":"DropChanceNormalChestPercent","mt":"FLAT","v":150}]},
  {"key":1005,"name":"Espírito Sombrio","unlock":"KillMonster","param1":30051,"statKey":1005,"stats":[{"st":"DropChanceStageBossChestPercent","mt":"FLAT","v":150}]},
  {"key":6001,"name":"Espada","unlock":"DLC","param1":4427390,"statKey":6001,"stats":[{"st":"IncreaseExpAmount","mt":"FLAT","v":150}]},
  {"key":6002,"name":"Borboleta","unlock":"DLC","param1":4427390,"statKey":6002,"stats":[{"st":"IncreaseGoldAmount","mt":"FLAT","v":100}]},
  {"key":6003,"name":"Dragão","unlock":"DLC","param1":4427390,"statKey":6003,"stats":[{"st":"DropChanceNormalChestPercent","mt":"FLAT","v":200},{"st":"IncreaseGoldAmount","mt":"FLAT","v":150},{"st":"IncreaseExpAmount","mt":"FLAT","v":200}]}
]
