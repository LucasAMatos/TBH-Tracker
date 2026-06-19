import { describe, expect, it } from 'vitest'
import { ATTR_NODES } from '@shared/attributeData'
import {
  attrEffectAtLevel,
  attrHeroes,
  attrPerLevel,
  attrTitle,
  heroAttributeTree,
  nodesForHero
} from '@shared/attributes'

describe('catálogo de atributos (attributeData)', () => {
  it('tem 132 nós, 6 heróis com 22 cada', () => {
    expect(ATTR_NODES.length).toBe(132)
    const heroes = attrHeroes()
    expect(heroes).toEqual([101, 201, 301, 401, 501, 601])
    for (const h of heroes) expect(nodesForHero(h).length).toBe(22)
  })

  it('todo nó tem efeito (passivo com line/v ou ativo com dmg)', () => {
    for (const n of ATTR_NODES) {
      if (n.kind === 'passive') expect(n.st ?? n.name).toBeTruthy()
      else expect(Array.isArray(n.dmg)).toBe(true)
    }
  })
})

describe('attrEffectAtLevel / attrPerLevel', () => {
  const armor = ATTR_NODES.find((n) => n.id === 101011)!

  it('passivo: total = valor por ponto × nível', () => {
    expect(armor.kind).toBe('passive')
    expect(armor.line).toContain('{0}')
    // v=10 → nível 5 = +50
    expect(attrEffectAtLevel(armor, 5)).toBe(armor.line!.replace('{0}', String((armor.v ?? 0) * 5)))
  })

  it('nível 0 cai para o efeito por ponto', () => {
    expect(attrEffectAtLevel(armor, 0)).toBe(attrPerLevel(armor))
    expect(attrPerLevel(armor)).toMatch(/por ponto/)
  })

  it('ativo: descreve a escala por nível', () => {
    const active = ATTR_NODES.find((n) => n.kind === 'active')!
    expect(attrTitle(active)).toMatch(/ataque|habilidade/i)
    expect(attrPerLevel(active)).toMatch(/valor/)
  })
})

describe('heroAttributeTree', () => {
  it('sem alocação: colunas ordenadas por x e contagem zero', () => {
    const tree = heroAttributeTree(101, [])
    expect(tree.totalNodes).toBe(22)
    expect(tree.totalAllocated).toBe(0)
    expect(tree.allocatedNodes).toBe(0)
    const xs = tree.columns.map((c) => c.x)
    expect(xs).toEqual([...xs].sort((a, b) => a - b))
  })

  it('cruza os níveis alocados do save', () => {
    const tree = heroAttributeTree(101, [
      { key: 101011, level: 5 },
      { key: 101001, level: 2 }
    ])
    expect(tree.totalAllocated).toBe(7)
    expect(tree.allocatedNodes).toBe(2)
    const node = tree.columns.flatMap((c) => c.nodes).find((v) => v.node.id === 101011)
    expect(node?.level).toBe(5)
  })

  it('ignora níveis de nós de outro herói', () => {
    const tree = heroAttributeTree(201, [{ key: 101011, level: 5 }])
    expect(tree.totalAllocated).toBe(0)
  })
})
