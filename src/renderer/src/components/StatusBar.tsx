import type { ConnectionStatus, TrackerState } from '@shared/types'

const LABELS: Record<ConnectionStatus, { text: string; cls: string }> = {
  monitoring: { text: 'Monitorando', cls: 'ok' },
  'no-key': { text: 'Sem chave', cls: 'warn' },
  'no-save': { text: 'Save nao encontrado', cls: 'warn' },
  error: { text: 'Erro', cls: 'err' }
}

export function StatusBar({ state }: { state: TrackerState }): JSX.Element {
  const info = LABELS[state.status]
  return (
    <div className="status">
      <span className={`status__dot status__dot--${info.cls}`} />
      <span className="status__text">{info.text}</span>
    </div>
  )
}
