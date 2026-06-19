// Aba Atualizações (N1): busca patch notes/anúncios oficiais do TBH na Steam News API.
// Postura passiva: apenas um GET HTTPS a serviço público da Steam — não toca no jogo
// nem no save. Resultado é cacheado para não martelar o endpoint.
import { get } from 'node:https'
import type { NewsFeed, NewsItem } from '@shared/types'

const APP_ID = 3678970 // TBH: Task Bar Hero (devs Nugem / Tesseract Studio)
const NEWS_URL =
  `https://api.steampowered.com/ISteamNews/GetNewsForApp/v2/` +
  `?appid=${APP_ID}&count=15&maxlength=700&format=json`
const CACHE_TTL_MS = 10 * 60 * 1000 // 10 min
const SUMMARY_MAX = 320

interface SteamNewsItem {
  gid: string
  title: string
  url: string
  author?: string
  contents: string
  feedlabel: string
  date: number // epoch em segundos
  feedname: string
}

let cache: NewsFeed | null = null

function httpGetJson(url: string, timeoutMs = 8000): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const req = get(url, { headers: { 'User-Agent': 'TBH-Tracker' } }, (res) => {
      const status = res.statusCode ?? 0
      if (status < 200 || status >= 300) {
        res.resume()
        reject(new Error(`HTTP ${status}`))
        return
      }
      let data = ''
      res.setEncoding('utf8')
      res.on('data', (chunk) => (data += chunk))
      res.on('end', () => {
        try {
          resolve(JSON.parse(data))
        } catch {
          reject(new Error('resposta inválida'))
        }
      })
    })
    req.on('error', (err) => reject(err))
    req.setTimeout(timeoutMs, () => req.destroy(new Error('tempo esgotado')))
  })
}

const ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&apos;': "'",
  '&nbsp;': ' '
}

// Steam manda BBCode (e às vezes HTML). Reduz a texto puro para o resumo.
function cleanContents(raw: string): string {
  let s = raw
  s = s.replace(/\[img\][^[]*\[\/img\]/gi, '') // remove imagens
  s = s.replace(/\[url=[^\]]*\]([\s\S]*?)\[\/url\]/gi, '$1') // mantém o texto do link
  s = s.replace(/\[\/?[a-z][^\]]*\]/gi, ' ') // demais tags BBCode
  s = s.replace(/<[^>]+>/g, ' ') // tags HTML
  for (const [ent, ch] of Object.entries(ENTITIES)) s = s.split(ent).join(ch)
  s = s.replace(/\s+/g, ' ').trim()
  if (s.length > SUMMARY_MAX) s = s.slice(0, SUMMARY_MAX).trimEnd() + '…'
  return s
}

function mapItem(it: SteamNewsItem): NewsItem {
  return {
    id: String(it.gid),
    title: it.title?.trim() || '(sem título)',
    url: it.url,
    author: it.author?.trim() || null,
    summary: cleanContents(it.contents ?? ''),
    date: (Number(it.date) || 0) * 1000,
    feedLabel: it.feedlabel || it.feedname || 'Steam'
  }
}

/** Busca o feed de atualizações (com cache). force ignora o cache. */
export async function fetchNews(force = false): Promise<NewsFeed> {
  if (!force && cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) return cache
  try {
    const json = (await httpGetJson(NEWS_URL)) as {
      appnews?: { newsitems?: SteamNewsItem[] }
    }
    const items = (json.appnews?.newsitems ?? []).map(mapItem)
    cache = { fetchedAt: Date.now(), items, error: null }
    return cache
  } catch (err) {
    const message = err instanceof Error ? err.message : 'falha ao buscar'
    // Mantém os itens cacheados (se houver) e sinaliza o erro da última tentativa.
    return { fetchedAt: Date.now(), items: cache?.items ?? [], error: message }
  }
}
