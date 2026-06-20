# TBHPedia — Corpus canônico (Épico W)

Define **o que** ingerimos das wikis da comunidade, **como** normalizamos (esquema canônico) e as
**regras de autoridade/conflito**. Fundação do Épico W (W0). A ingestão é **passiva** sobre páginas
**públicas** (mesma postura da Steam News, N1): nada toca o jogo nem o save.

## Cobertura por fonte (W0)

| Domínio | taskbarherowiki.com | taskbarhero.wiki (PT) | .org / task-bar-hero.wiki / .xyz |
|---|---|---|---|
| Heróis (stats, skills, árvore) | ✅ 6 (estruturado) | ✅ (PT, ranking) | parcial |
| Pets | ✅ 8 (estruturado) | parcial | — |
| Runas | ✅ 197 (árvore + custos) | ✅ ícones/efeitos | parcial |
| Itens | ✅ 5.934 (DB filtrável) | — | — |
| Efeitos de material (deco/engr/inscr) | ✅ 79 | — | — |
| Baús (drop rates) | ✅ 41 | — | — |
| Estágios / mapa / monstros | ✅ 120 + monstros/boss | parcial | parcial |
| EXP/Gold farm | ✅ (ferramenta) | — | — |
| Guias/estratégias (prosa) | parcial | ✅ | ✅ |

**Fonte primária:** `taskbarherowiki.com` — Next.js (App Router) que **embute os dados como JSON
limpo no payload RSC** (`self.__next_f`), "pulled straight from the game data". Cobre W2–W7.
**Secundária:** `taskbarhero.wiki` (PT) — nomes pt-BR canônicos e guias (W2/W3/W8).
As outras três (`taskbarhero.org`, `task-bar-hero.wiki`, `taskbarhero.xyz`) entram depois como
complemento/validação.

## Esquema canônico

Cada domínio é um arquivo `dotnet/TbhTracker.Core/Data/pedia/<domínio>.json` com **envelope de
proveniência** + lista de entradas normalizadas:

```jsonc
{
  "domain": "pets",
  "provenance": {
    "source": "taskbarherowiki.com",
    "sourceUrl": "https://taskbarherowiki.com/pets",
    "lang": "en",
    "fetchedAt": "2026-06-20T20:00:00.000Z"
  },
  "entries": [ /* objetos normalizados do domínio */ ]
}
```

- **`domain`** — identificador do domínio (`pets`, `heroes`, `runes`, `items`, `materials`,
  `chests`, `stages`, `monsters`, `guides`).
- **`provenance`** — `source` (host), `sourceUrl` (URL exata), `lang` (`en`/`pt`), `fetchedAt` (ISO).
  Toda entrada herda a proveniência do arquivo; entradas que cruzam fontes podem sobrescrever `source`.
- **`entries`** — formato **específico do domínio** (tipado em C# por `Pedia*Entry`). Campos comuns a
  todos: `key`/`id` (chave estável do jogo quando existir) e `name`.

### Regras de autoridade / conflito

1. **Dados numéricos do jogo** (stats, custos, drop rates, farm) → **`taskbarherowiki.com`** manda
   (deriva do gamedata).
2. **Nomes/rótulos pt-BR** → **`taskbarhero.wiki`** (PT) manda; cai para o nome EN da fonte primária
   quando não houver tradução.
3. **Prosa/guias** → wiki que tiver o texto mais completo; manter atribuição por artigo.
4. **Dedup/merge** por `key` do jogo (quando houver) ou por `name` normalizado (slug minúsculo).
5. **Proveniência sempre preservada** e **regerada a cada patch** (sinergia com N2 — catálogo velho).

## Pipeline (W1)

Tooling Node em `scripts/`:
- `scripts/pedia/lib.cjs` — utilitário reutilizável: fetch com **cache do bruto** em
  `scripts/.cache/pedia/` (proveniência + *rate limit*), extração do payload RSC (`extractFlight`)
  e das props embutidas (`extractProp`, parser de JSON balanceado), e escrita do envelope canônico.
- `scripts/gen-pedia-<domínio>.cjs` — um gerador por domínio: busca → extrai → normaliza → grava
  `Core/Data/pedia/<domínio>.json`.

O C# carrega via `Catalog` (recurso embutido) e a aba **TBHPedia** (W9) renderiza com busca global,
cross-links e atribuição de fonte.
