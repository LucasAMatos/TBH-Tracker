// Ícones dos nós de atributos (baixados de tbh-farm por scripts/gen-attributes.cjs).
// Arquivos nomeados pelo `icon` do catálogo (attributeData.ts); resolvidos por Vite.
const modules = import.meta.glob('../assets/attributes/*.png', {
  eager: true,
  query: '?url',
  import: 'default'
}) as Record<string, string>

const BY_ICON: Record<string, string> = {}
for (const [p, url] of Object.entries(modules)) {
  const name = p.split('/').pop()?.replace('.png', '') ?? ''
  if (name) BY_ICON[name] = url
}

export function attributeIcon(icon: string | null | undefined): string | undefined {
  if (!icon) return undefined
  return BY_ICON[icon]
}
