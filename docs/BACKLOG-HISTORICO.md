# TBH-Tracker — Backlog Histórico (itens entregues)

Itens **entregues (✅)** arquivados do `BACKLOG.md`. A cada 5 versões (`a` múltiplo de 5)
o backlog é separado: o que foi feito vem para cá; o que está a fazer permanece em
`BACKLOG.md`. Detalhes de cada release em `CHANGELOG.md`.

> **Recorte atual:** até **v5.0** (primeiro arquivamento, 5 versões fechadas).

## Infra & leitura (P0)

| # | Versão | Item | Notas |
|---|--------|------|-------|
| I1 | v1.0 | Localizar o save automaticamente | caminho padrão Windows + override manual |
| I2 | v1.0 | Descriptografar ES3 (AES-CBC + PBKDF2-SHA1) | chave fornecida pelo usuário; nunca no repo |
| I3 | v1.0 | File watcher + fingerprint (mtime+tamanho) | relê só quando muda |
| I4 | v1.0 | Parser save → snapshot tipado | campos em TBHPEDIA.md |
| I5 | v1.0 | Estado de conexão | monitorando / sem chave / sem save / erro |

## Ouro — `CurrencySaveDatas` (key 100001)
- **G1 (P0):** v1.0 — Ouro total no dashboard.

## Estágio & progresso — `CurrentStageKey`, `CurrentStageWave`, `MaxCompletedStage`
- **S1 (P0):** v1.0 — Decodificar `DAPP` → "Dificuldade · Ato · Fase" + onda atual.
- **S2 (P0):** v1.0 — Mostrar estágio máx. concluído.

## Heróis — `HeroSaveDatas[]`, `ArrangedHeroKey`
- **H1 (P1):** v1.0 — Nível e XP por herói. *(herói líder: pendente)*
- **H3 (P1):** v1.0 — Nº de heróis ativos → normalizar XP/h por herói.
- **H4 (P2):** v1.0 — Composição ativa (nomes via catálogo de heróis).

## Cubo — `CubeSaveLevelData`
- **C1 (P2):** v1.0 — Nível e XP do Cubo no dashboard.
- **C2 (P2):** v3.0 — Alertas de marcos do Cubo (níveis 4/5/8/10; nível 10 = Trade Ship). Card mostra próximo desbloqueio + seção "Marcos do Cubo".

## Baús — `BoxData.BoxQuantity`
- **B1 (P1):** v1.0 — Contagem de baús não abertos.
- **B2 (P2):** v5.0 — Baús por categoria (Comum/Estágio/Ato) + alerta de **acúmulo** (limiares calibráveis na UI, persistidos localmente).

## Runas — `RuneSaveData[]`
- **R1 (P2):** v4.0 — Níveis de runa observados + **mapa da árvore com zoom/pan** (197 nós, ícones, nomes/efeitos pt-BR, custos em ouro). Catálogo `RuneKey → nó` (join direto). Aba **Runas**.

## UI / TBHPedia
| # | Versão | Item | Notas |
|---|--------|------|-------|
| U1 (P0) | v1.0 | Dashboard com cards (ouro, estágio, heróis, cubo, baús, máx. estágio) | MVP |
| U3 (P1) | v2.0 | Aba **TBHPedia** navegável dentro do app | Conteúdo de TBHPEDIA.md |
