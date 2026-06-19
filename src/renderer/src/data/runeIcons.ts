// Ícones das runas (baixados de taskbarhero.wiki por scripts/gen-runes.cjs).
// Arquivos nomeados pelo `icon` do catálogo (runeTree.ts); resolvidos por Vite em dev e build.
const modules = import.meta.glob('../assets/runes/*.png', {
  eager: true,
  query: '?url',
  import: 'default'
}) as Record<string, string>

const BY_ICON: Record<string, string> = {}
for (const [p, url] of Object.entries(modules)) {
  const name = p.split('/').pop()?.replace('.png', '') ?? ''
  if (name) BY_ICON[name] = url
}

export function runeIcon(icon: string | null | undefined): string | undefined {
  if (!icon) return undefined
  return BY_ICON[icon]
}
