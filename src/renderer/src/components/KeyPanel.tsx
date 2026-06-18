import { useState } from 'react'
import type { TrackerState } from '@shared/types'

interface Props {
  state: TrackerState
  onChange: (state: TrackerState) => void
}

export function KeyPanel({ state, onChange }: Props): JSX.Element {
  const [key, setKey] = useState('')
  const [busy, setBusy] = useState(false)

  const saveKey = async (): Promise<void> => {
    if (!key.trim()) return
    setBusy(true)
    const next = await window.tbh.setKey(key.trim())
    if (next) onChange(next)
    setKey('')
    setBusy(false)
  }

  const pickSave = async (): Promise<void> => {
    setBusy(true)
    const next = await window.tbh.pickSaveFile()
    if (next) onChange(next)
    setBusy(false)
  }

  return (
    <div className="panel">
      <h2 className="panel__title">Configuracao</h2>

      <section className="panel__row">
        <div>
          <strong>Arquivo de save</strong>
          <p className="panel__hint">
            {state.savePath ? state.savePath : 'Nao localizado automaticamente.'}
          </p>
        </div>
        <button className="btn" onClick={pickSave} disabled={busy}>
          Escolher SaveFile_Live.es3
        </button>
      </section>

      <section className="panel__row panel__row--stack">
        <div>
          <strong>Chave de descriptografia ES3</strong>
          <p className="panel__hint">
            Guardada localmente e cifrada pelo sistema. Nunca enviada para lugar nenhum nem
            commitada. {state.hasKey ? 'Uma chave ja esta salva.' : ''}
          </p>
        </div>
        <div className="panel__keyrow">
          <input
            className="input"
            type="password"
            placeholder={state.hasKey ? 'Substituir chave...' : 'Cole a chave ES3'}
            value={key}
            onChange={(e) => setKey(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && saveKey()}
          />
          <button className="btn btn--primary" onClick={saveKey} disabled={busy || !key.trim()}>
            Salvar
          </button>
        </div>
      </section>

      {state.status === 'error' && state.lastError && (
        <div className="alert alert--err">{state.lastError}</div>
      )}
      {state.status === 'no-save' && (
        <div className="alert alert--warn">
          Save nao encontrado. Abra o jogo ao menos uma vez ou selecione o arquivo manualmente.
        </div>
      )}
      {state.status === 'no-key' && (
        <div className="alert alert--warn">
          Save localizado. Informe a chave ES3 para comecar a monitorar.
        </div>
      )}
    </div>
  )
}
