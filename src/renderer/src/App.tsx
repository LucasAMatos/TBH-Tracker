import { useEffect, useState } from 'react'
import { Dashboard } from './components/Dashboard'
import { Heroes } from './components/Heroes'
import { Inventory } from './components/Inventory'
import { KeyPanel } from './components/KeyPanel'
import { RuneTree } from './components/RuneTree'
import { StatusBar } from './components/StatusBar'
import { TbhPedia } from './components/TbhPedia'
import type { TrackerState } from '@shared/types'

type Tab = 'dashboard' | 'herois' | 'inventario' | 'runes' | 'tbhpedia'

const EMPTY: TrackerState = {
  status: 'no-save',
  savePath: null,
  hasKey: false,
  lastError: null,
  snapshot: null,
  lastChangeAt: null,
  heartbeatAt: null
}

function formatVersion(raw: string): string {
  const [major = '0', minor = '0'] = raw.split('.')
  return `v${major}.${minor}`
}

export function App(): JSX.Element {
  const [state, setState] = useState<TrackerState>(EMPTY)
  const [version, setVersion] = useState('')
  const [tab, setTab] = useState<Tab>('dashboard')

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

      <nav className="tabs">
        <button
          className={`tabs__btn ${tab === 'dashboard' ? 'tabs__btn--active' : ''}`}
          onClick={() => setTab('dashboard')}
        >
          Dashboard
        </button>
        <button
          className={`tabs__btn ${tab === 'herois' ? 'tabs__btn--active' : ''}`}
          onClick={() => setTab('herois')}
        >
          Heróis
        </button>
        <button
          className={`tabs__btn ${tab === 'inventario' ? 'tabs__btn--active' : ''}`}
          onClick={() => setTab('inventario')}
        >
          Inventário
        </button>
        <button
          className={`tabs__btn ${tab === 'runes' ? 'tabs__btn--active' : ''}`}
          onClick={() => setTab('runes')}
        >
          Runas
        </button>
        <button
          className={`tabs__btn ${tab === 'tbhpedia' ? 'tabs__btn--active' : ''}`}
          onClick={() => setTab('tbhpedia')}
        >
          TBHPedia
        </button>
      </nav>

      <main className="app__main">
        {tab === 'tbhpedia' ? (
          <TbhPedia />
        ) : tab === 'herois' ? (
          <Heroes
            heroes={state.snapshot?.heroes ?? []}
            arrangedKeys={state.snapshot?.arrangedHeroKeys ?? []}
          />
        ) : tab === 'inventario' ? (
          <Inventory inventory={state.snapshot?.inventory ?? null} />
        ) : tab === 'runes' ? (
          <RuneTree levels={state.snapshot?.runes ?? []} />
        ) : state.status === 'monitoring' && state.snapshot ? (
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
