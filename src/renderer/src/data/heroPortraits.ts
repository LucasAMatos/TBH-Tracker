// Retratos dos heróis (baixados da TBH Wiki por scripts/gen-heroes.cjs).
// Arquivos nomeados pela heroKey do save (101..601); resolvidos por Vite em dev e build.
const modules = import.meta.glob('../assets/heroes/*.png', {
  eager: true,
  query: '?url',
  import: 'default'
}) as Record<string, string>

const BY_KEY: Record<string, string> = {}
for (const [p, url] of Object.entries(modules)) {
  const key = p.split('/').pop()?.replace('.png', '') ?? ''
  if (key) BY_KEY[key] = url
}

export function heroPortrait(key: number | string | null | undefined): string | undefined {
  if (key === null || key === undefined) return undefined
  return BY_KEY[String(key)]
}
