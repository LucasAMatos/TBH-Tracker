import type { WidgetId } from '@shared/types'

// Registro canônico dos widgets do Dashboard (U10). A ordem aqui não importa para o
// render (o Dashboard tem ordem fixa) — serve para montar o painel "Personalizar".
export interface WidgetDef {
  id: WidgetId
  title: string
  collapsible: boolean
  // Liga por padrão? (informativo no painel; o padrão efetivo vem de DEFAULT_DASHBOARD_LAYOUT)
  defaultOn: boolean
}

export const DASHBOARD_WIDGETS: WidgetDef[] = [
  { id: 'cards', title: 'Resumo', collapsible: true, defaultOn: true },
  { id: 'runeTarget', title: 'Runa-alvo', collapsible: true, defaultOn: true },
  { id: 'goldFlow', title: 'Fluxo de ouro', collapsible: true, defaultOn: true },
  { id: 'levelUps', title: 'Level-ups', collapsible: true, defaultOn: true },
  { id: 'stageProgress', title: 'Progresso de estágio', collapsible: true, defaultOn: true },
  { id: 'boxes', title: 'Baús por tipo', collapsible: true, defaultOn: true },
  { id: 'inventoryRarity', title: 'Raridade do inventário', collapsible: true, defaultOn: true },
  { id: 'meltdown', title: 'Derretimento (Alchemy)', collapsible: true, defaultOn: true },
  { id: 'pets', title: 'Pets', collapsible: true, defaultOn: true },
  { id: 'cubeMilestones', title: 'Marcos do Cubo', collapsible: true, defaultOn: true },
  { id: 'activeHeroes', title: 'Heróis ativos', collapsible: true, defaultOn: true },
  { id: 'rawJson', title: 'JSON bruto (calibração)', collapsible: true, defaultOn: false }
]

export const WIDGET_TITLES: Record<WidgetId, string> = DASHBOARD_WIDGETS.reduce(
  (acc, w) => {
    acc[w.id] = w.title
    return acc
  },
  {} as Record<WidgetId, string>
)
