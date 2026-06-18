# TBH-Tracker — Backlog Histórico (itens entregues)

Itens **entregues (✅)** arquivados do `BACKLOG.md`. A cada 5 versões (`a` múltiplo de 5)
o backlog é separado: o que foi feito vem para cá; o que está a fazer permanece em
`BACKLOG.md`. Detalhes de cada release em `CHANGELOG.md`.

> **Recorte atual:** até **v15.0** (terceiro arquivamento; v11–v15). Itens entregues em v16+ permanecem no `BACKLOG.md` até o próximo corte (v20).

## Infra & leitura (P0)

| # | Versão | Item | Notas |
|---|--------|------|-------|
| I1 | v1.0 | Localizar o save automaticamente | caminho padrão Windows + override manual |
| I2 | v1.0 | Descriptografar ES3 (AES-CBC + PBKDF2-SHA1) | chave fornecida pelo usuário; nunca no repo |
| I3 | v1.0 | File watcher + fingerprint (mtime+tamanho) | relê só quando muda |
| I4 | v1.0 | Parser save → snapshot tipado | campos em TBHPEDIA.md |
| I5 | v1.0 | Estado de conexão | monitorando / sem chave / sem save / erro |
| I6 | v14.0 | Persistência local de histórico | camada reutilizável (`src/main/history.ts`); eventos sobrevivem a reinícios, isolados por save |

## Ouro — `CurrencySaveDatas` (key 100001)
- **G1 (P0):** v1.0 — Ouro total no dashboard.
- **G2 (P1):** v7.0 — Taxa de ouro/h por janela móvel (120s) e média de sessão (em memória).
- **G3 (P1):** v7.0 — Delta de ouro por evento (com sinal e total); seção **Fluxo de ouro** no Dashboard.

## Estágio & progresso — `CurrentStageKey`, `CurrentStageWave`, `MaxCompletedStage`
- **S1 (P0):** v1.0 — Decodificar `DAPP` → "Dificuldade · Ato · Fase" + onda atual.
- **S2 (P0):** v1.0 — Mostrar estágio máx. concluído.
- **S3 (P1):** v10.0 — Eventos de troca de estágio e novo recorde (`CurrentStageKey`/`MaxCompletedStage`); seção **Progresso de estágio** no Dashboard (em memória).

## Heróis — `HeroSaveDatas[]`, `ArrangedHeroKey`
- **H1 (P1):** v1.0 — Nível e XP por herói. *(herói líder: pendente)*
- **H2 (P1):** v11.0 — Detectar level-ups (eventos): compara `HeroLevel` entre snapshots e registra herói + nível anterior→novo + horário; seção **Level-ups** no Dashboard.
- **H3 (P1):** v1.0 — Nº de heróis ativos → normalizar XP/h por herói.
- **H4 (P2):** v1.0 — Composição ativa (nomes via catálogo de heróis).
- **H5 (P1):** v6.0 — Aba **Heróis** com o roster completo (6 heróis: desbloqueado/bloqueado, nível/XP, dados do catálogo) e marcação dos ativos.
- **H6 (P1):** v6.0 — Dashboard só com heróis **ativos** (arranjados, até 3) + slots vazios; roster completo migrado para a aba Heróis.
- **H8 (P2):** v12.0 — **Retratos/ícones dos heróis** (TBH Wiki via `scripts/gen-heroes.cjs`) nos cards de ativos, roster e detalhe; assets em `src/renderer/src/assets/heroes/<heroKey>.png`.
- **H9 (P2):** v8.0 — **Análise detalhada do herói** (drill-down): stats base com **ranking entre os 6** (★ melhor) e **árvore de habilidades por tier** (1–8).

## Cubo — `CubeSaveLevelData`
- **C1 (P2):** v1.0 — Nível e XP do Cubo no dashboard.
- **C2 (P2):** v3.0 — Alertas de marcos do Cubo (níveis 4/5/8/10; nível 10 = Trade Ship). Card mostra próximo desbloqueio + seção "Marcos do Cubo".

## Baús — `BoxData.BoxQuantity`
- **B1 (P1):** v1.0 — Contagem de baús não abertos.
- **B2 (P2):** v5.0 — Baús por categoria (Comum/Estágio/Ato) + alerta de **acúmulo** (limiares calibráveis na UI, persistidos localmente).
- **B3 (P2):** v13.0 — Estimar cooldowns de auto-abrir (comum 300s / boss 600s): tempo estimado para esvaziar o acúmulo por categoria + resumo (categorias auto-abrem em paralelo). Ato fica como "abrir manualmente".

## Itens / drops — `itemSaveDatas[]`
- **D3 (P2):** v15.0 — **Aba Inventário**: classifica itens por **tipo** (slot/categoria via `ItemKey` → catálogo `items.ts`/`itemData.ts`) e **raridade** (10 níveis), monta a **matriz tipo × raridade** + barras por raridade, filtro por localização (inventário/stash/equipado/Trade Ship/solto) e destaque **Legendary+**. Catálogo gerado por `scripts/gen-items.cjs` (5.944 itens).

## Runas — `RuneSaveData[]`
- **R1 (P2):** v4.0 — Níveis de runa observados + **mapa da árvore com zoom/pan** (197 nós, ícones, nomes/efeitos pt-BR, custos em ouro). Catálogo `RuneKey → nó` (join direto). Aba **Runas**.

## Sessão / atividade — `PlayTime`
- **A2 (P2):** v10.0 — **Heartbeat de status** (pulso de 5s) + barra de status **ativo/parado** com tempo desde a última mudança (ponto pulsante).

## UI / TBHPedia
| # | Versão | Item | Notas |
|---|--------|------|-------|
| U1 (P0) | v1.0 | Dashboard com cards (ouro, estágio, heróis, cubo, baús, máx. estágio) | MVP |
| U3 (P1) | v2.0 | Aba **TBHPedia** navegável dentro do app | Conteúdo de TBHPEDIA.md |
| U7 (P1) | v6.0 | Aba **Heróis** (roster completo) + dashboard só com ativos | Implementa H5/H6 |
| U8 (P2) | v15.0 | Aba **Inventário** (itens por tipo × raridade, contagem + visualização) | Implementa D3 na navegação por abas |
