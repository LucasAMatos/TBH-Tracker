# TBH-Tracker — Fontes & repositórios de pesquisa

Repositórios, wikis e páginas usados para datamine, catálogos e assets do **TBH: Task Bar Hero**.
Conferir antes de criar/atualizar catálogos (`src/shared/*`) ou baixar assets. Tudo é de
fãs/comunidade — **valores e chaves podem mudar com patches**.

## Wikis & bancos de dados da comunidade

| Fonte | Link | Usado para |
|-------|------|-----------|
| TBH Wiki (PT) | https://taskbarhero.wiki/pt/heroes | **Imagens/ícones dos heróis** (6) e atributos; ícones de runas (v4.0/R1). Páginas por herói (ex.: `/pt/heroes/ranger`) trazem **stats base com ranking entre os 6** e a **árvore de habilidades por tier** (passivas/ativas, custos) — base do catálogo `heroes.ts` (H9). **Retratos dos heróis (H8):** `game/ui/Arrage_ChaAnim_<asset>_Large_0.png` — assets: Knight, Ranger, Sorcerer, Priest, **Abalist** (=Hunter), Slayer; baixados por `scripts/gen-heroes.cjs`. Tem ainda equipamento, fases, habilidades, runas, cubo, mascotes e "Inspetor de save". |
| taskbarherowiki.com | https://taskbarherowiki.com | Categorias oficiais das runas (Baús, Herói, Ouro, EXP, Ranhuras, Offline, Cubo, Combate), sobrepostas por `key`. |
| taskbarhero.org | https://taskbarhero.org | Referência geral (datamine de lançamento). |
| task-bar-hero.wiki | https://task-bar-hero.wiki | Referência geral. |
| taskbarhero.xyz | https://taskbarhero.xyz | Referência geral. |

## Ferramentas open-source (mesmo padrão passivo do tracker)

| Repo | Link | Usado para |
|------|------|-----------|
| `WcgStark/tbh-farm` | https://github.com/WcgStark/tbh-farm | Origem do catálogo de runas (`runeTree.ts`) e ícones; referência de leitura de save. **Catálogo de itens (D3):** `engine/gamedata.js` (`DB.items`) traz `ItemKey → {gt, grade, lvl, type}` para 5.944 itens — base de `scripts/gen-items.cjs` → `src/shared/itemData.ts`. **Catálogo de estágios (F0):** `data/farm_stages.json` traz por fase (chave DAPP) `expectedGold`/`expectedEXP`/`totalHP`/`count`/`goldPerHP`/`expPerHP` para 108 estágios (4 dificuldades × 3 atos × fases 1-9, sem boss de ato) — base de `scripts/gen-stages.cjs` → `src/shared/stageData.ts`. |
| `shigake/tbh-copilot` | https://github.com/shigake/tbh-copilot | Cripto do save (chave ES3 hardcoded validada); referência de parsing. |
| `Rupelio/TBH-Optimizer` | https://github.com/Rupelio/TBH-Optimizer | Otimização de farm; referência de modelagem. |

## Oficial & guias

| Fonte | Link | Usado para |
|-------|------|-----------|
| Steam (App ID 3678970) | https://store.steampowered.com/app/3678970 | Página oficial; guia "Task Bar Hero 101"; Steam Market. |
| Steam News API | https://api.steampowered.com/ISteamNews/GetNewsForApp/v2/?appid=3678970 | **Patch notes/anúncios oficiais** (devs Nugem/Tesseract Studio) — fonte da aba Atualizações (N1). Alternativa: RSS de anúncios da Steam. |
| Guias de comunidade | games.gg · mobalytics · ProGameGuides | Mecânicas e dicas gerais. |

> Atualizar esta lista sempre que uma nova fonte for usada para datamine, catálogo ou assets.
