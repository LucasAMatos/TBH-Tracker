import { useEffect, useState } from 'react'
import { Dashboard } from './components/Dashboard'
import { KeyPanel } from './components/KeyPanel'
import { StatusBar } from './components/StatusBar'
import type { TrackerState } from '@shared/types'

const EMPTY: TrackerState = {
  status: 'no-save',
  savePath: null,
  hasKey: false,
  lastError: null,
  snapshot: null
}

function formatVersion(raw: string): string {
  const [major = '0', minor = '0'] = raw.split('.')
  return `v${major}.${minor}`
}

export function App(): JSX.Element {
  const [state, setState] = useState<TrackerState>(EMPTY)
  const [version, setVersion] = useState('')

  useEffect(() => {
    let mounted = true
    window.tbh.getState().then((s) => {
      if (mounted && s) setState(s)
    })
    window.tbh.getVersion().then((v) => {
      if (mounted && v) setVersion(formatVersion(v))
    })
    const off = window.tbh.onState((s) => setState(s))
    return () => {
      mounted = false
      off()
    }
  }, [])

  return (
    <div className="app">
      <header className="app__header">
        <div className="app__brand">
          <span className="app__logo">TBH</span>
          <div>
            <h1>
              TBH-Tracker {version && <span className="app__version">{version}</span>}
            </h1>
            <p className="app__subtitle">Leitura passiva do save · Task Bar Hero</p>
          </div>
        </div>
        <StatusBar state={state} />
      </header>

      <main className="app__main">
        {state.status === 'monitoring' && state.snapshot ? (
          <Dashboard snapshot={state.snapshot} />
        ) : (
          <KeyPanel state={state} onChange={setState} />
        )}
      </main>

      <footer className="app__footer">
        Somente leitura · nunca toca no jogo, na memoria ou no save.
      </footer>
    </div>
  )
}
