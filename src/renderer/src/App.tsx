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

export function App(): JSX.Element {
  const [state, setState] = useState<TrackerState>(EMPTY)

  useEffect(() => {
    let mounted = true
    window.tbh.getState().then((s) => {
      if (mounted && s) setState(s)
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
            <h1>TBH-Tracker</h1>
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
