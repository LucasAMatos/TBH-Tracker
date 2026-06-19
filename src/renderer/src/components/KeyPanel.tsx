import { useState } from 'react'
import type { KeyFindResult, TrackerState } from '@shared/types'

interface Props {
  state: TrackerState
  onChange: (state: TrackerState) => void
}

type FindFeedback = { kind: 'ok' | 'warn' | 'err'; text: string }

function findFeedback(result: KeyFindResult): FindFeedback {
  switch (result.status) {
    case 'found':
      return { kind: 'ok', text: 'Chave localizada e aplicada! Monitorando o save.' }
    case 'cancelled':
      return { kind: 'warn', text: 'Busca cancelada.' }
    case 'no-save':
      return {
        kind: 'warn',
        text: 'Nenhum save encontrado para validar. Abra o jogo uma vez ou selecione o save.'
      }
    case 'no-game':
      return {
        kind: 'warn',
        text: 'Instalação do jogo (Steam) não localizada. Cole a chave manualmente.'
      }
    case 'not-found':
      return {
        kind: 'warn',
        text: 'Arquivos do jogo lidos, mas a chave não foi encontrada (o jogo pode ter mudado). Cole a chave manualmente.'
      }
    default:
      return { kind: 'err', text: result.message ?? 'Falha ao localizar a chave.' }
  }
}

export function KeyPanel({ state, onChange }: Props): JSX.Element {
  const [key, setKey] = useState('')
  const [busy, setBusy] = useState(false)
  const [finding, setFinding] = useState(false)
  const [feedback, setFeedback] = useState<FindFeedback | null>(null)

  const saveKey = async (): Promise<void> => {
    if (!key.trim()) return
    setBusy(true)
    const next = await window.tbh.setKey(key.trim())
    if (next) onChange(next)
    setKey('')
    setBusy(false)
  }

  const findKey = async (): Promise<void> => {
    setFinding(true)
    setFeedback(null)
    try {
      const result = await window.tbh.findKey()
      setFeedback(findFeedback(result))
    } catch {
      setFeedback({ kind: 'err', text: 'Falha ao localizar a chave.' })
    } finally {
      setFinding(false)
    }
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
          <p className="panel__hint">
            Não sabe a chave? O app pode <strong>localizá-la automaticamente</strong> lendo
            (somente leitura) os arquivos do jogo no disco e validando contra o seu save —
            sem tocar no jogo. Um aviso é mostrado antes.
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

      <section className="panel__row">
        <div>
          <strong>Localizar chave automaticamente</strong>
          <p className="panel__hint">
            Procura a senha do Easy Save 3 nos arquivos da instalação do jogo (Steam).
          </p>
        </div>
        <button className="btn" onClick={findKey} disabled={finding}>
          {finding ? 'Procurando…' : 'Localizar chave'}
        </button>
      </section>

      {feedback && (
        <div
          className={`alert ${
            feedback.kind === 'ok'
              ? 'alert--ok'
              : feedback.kind === 'err'
                ? 'alert--err'
                : 'alert--warn'
          }`}
        >
          {feedback.text}
        </div>
      )}

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
