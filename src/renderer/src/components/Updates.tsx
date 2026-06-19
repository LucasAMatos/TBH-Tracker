import { useCallback, useEffect, useState } from 'react'
import type { NewsFeed } from '@shared/types'

function fmtDate(at: number): string {
  if (!at) return '—'
  return new Date(at).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}

export function Updates(): JSX.Element {
  const [feed, setFeed] = useState<NewsFeed | null>(null)
  const [loading, setLoading] = useState(false)

  const load = useCallback((force: boolean): void => {
    setLoading(true)
    window.tbh
      .getNews(force)
      .then((f) => setFeed(f))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load(false)
  }, [load])

  const open = (url: string): void => {
    window.tbh.openExternal(url)
  }

  const items = feed?.items ?? []

  return (
    <div className="updates">
      <div className="updates__head">
        <div>
          <h2 className="updates__title">Atualizações do jogo</h2>
          <p className="card__hint">
            Patch notes e anúncios oficiais via Steam News (TBH · App 3678970). Só leitura de
            um serviço público — não toca no jogo nem no save.
          </p>
        </div>
        <button className="btn btn--ghost btn--sm" onClick={() => load(true)} disabled={loading}>
          {loading ? 'Atualizando…' : 'Atualizar'}
        </button>
      </div>

      {feed?.error && (
        <div className="alert alert--warn">
          Não foi possível buscar as atualizações ({feed.error}).
          {items.length > 0 && ' Exibindo o último resultado carregado.'}
        </div>
      )}

      {loading && items.length === 0 ? (
        <p className="card__hint">Carregando anúncios…</p>
      ) : items.length === 0 ? (
        <p className="card__hint">
          Nenhum anúncio disponível {feed?.error ? 'no momento' : 'ainda'}. Tente “Atualizar”.
        </p>
      ) : (
        <ul className="newslist">
          {items.map((item) => (
            <li className="newscard" key={item.id}>
              <div className="newscard__meta">
                <span className="newscard__feed">{item.feedLabel}</span>
                <span className="newscard__date">{fmtDate(item.date)}</span>
              </div>
              <button className="newscard__title" onClick={() => open(item.url)}>
                {item.title}
              </button>
              {item.summary && <p className="newscard__summary">{item.summary}</p>}
              <button className="newscard__link" onClick={() => open(item.url)}>
                Ver anúncio completo ↗
              </button>
            </li>
          ))}
        </ul>
      )}

      {feed && !feed.error && items.length > 0 && (
        <p className="card__hint updates__foot">
          Atualizado {new Date(feed.fetchedAt).toLocaleTimeString('pt-BR')}.
        </p>
      )}
    </div>
  )
}
