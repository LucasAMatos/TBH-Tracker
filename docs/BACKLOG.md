# TBH-Tracker — Backlog (focada nos pontos observáveis)

Cada item nasce de algo que conseguimos **observar no save** (ver `TBHPEDIA.md › Save`). Nada aqui depende de tocar no jogo. Prioridades: **P0** (fundação/MVP) · **P1** (valor de farm) · **P2** (qualidade de vida) · **P3** (extras).

> **Status:** ✅ = entregue (versão indicada) · ⬜ = pendente. Atualizar este arquivo sempre que um item for entregue. Versionamento em `CHANGELOG.md` (`va.b`).

## Infra & leitura (P0)

| # | Status | Item | Observável / base | Notas |
|---|--------|------|-------------------|-------|
| I1 | ✅ v1.0 | Localizar o save automaticamente | caminho padrão Windows | Suportar override manual de caminho |
| I2 | ✅ v1.0 | Descriptografar ES3 (AES-CBC + PBKDF2-SHA1) | arquivo `.es3` | Chave fornecida pelo usuário; nunca no repo |
| I3 | ✅ v1.0 | File watcher + fingerprint (mtime+tamanho) | arquivo no disco | Reler só quando muda; evitar descriptografia redundante |
| I4 | ✅ v1.0 | Parser save → snapshot tipado | JSON interno | Campos da tabela em TBHPEDIA.md |
| I5 | ✅ v1.0 | Estado de conexão | chave / arquivo presentes | Monitorando · sem chave · sem save · erro |
| I6 | ⬜ | Persistência local de histórico | — | Histórico por estágio, entre sessões |

## Pontos observáveis → features

### Ouro (P0/P1) — `CurrencySaveDatas` (key 100001)
- **G1 (P0):** ✅ v1.0 — Ouro total no dashboard.
- **G2 (P1):** Taxa de ouro/h por janela móvel (ex.: 30s) e média de sessão.
- **G3 (P1):** Delta de ouro por evento (com sinal e total).

### Estágio & progresso (P0/P1) — `CurrentStageKey`, `CurrentStageWave`, `MaxCompletedStage`
- **S1 (P0):** ✅ v1.0 — Decodificar `DAPP` → "Dificuldade · Ato · Fase" + onda atual.
- **S2 (P0):** ✅ v1.0 — Mostrar estágio máx. concluído.
- **S3 (P1):** Detectar troca de estágio e novos estágios desbloqueados (eventos).
- **S4 (P2):** Sugerir próximo "push" com base no máx. concluído.

### Corridas & eficiência de farm (P1) — `PlayTime` + ouro + XP + `CurrentStageWave`
- **F1 (P1):** Detectar fim de corrida (onda→0 = clear) e medir tempo/ouro/xp da janela.
- **F2 (P1):** Ouro/h e XP/h **por estágio**, com filtros anti-ruído (clear curto/longo, troca de mapa, morte, venda).
- **F3 (P1):** Histórico persistente por estágio (médias acumuladas).
- **F4 (P1):** Recomendar melhor estágio para **ouro**, **XP** e **combo**.
- **F5 (P2):** Projeção para estágios ainda não medidos (modelo de tempo/retenção de XP).

### Heróis (P1) — `HeroSaveDatas[]`, `ArrangedHeroKey`
- **H1 (P1):** ✅ v1.0 — Nível e XP por herói. *(herói líder: pendente)*
- **H2 (P1):** Detectar level-ups (eventos).
- **H3 (P1):** ✅ v1.0 — Nº de heróis ativos → normalizar XP/h por herói.
- **H4 (P2):** ✅ v1.0 — Composição ativa (nomes via catálogo de heróis).

### Cubo (P2) — `CubeSaveLevelData`
- **C1 (P2):** ✅ v1.0 — Nível e XP do Cubo no dashboard.
- **C2 (P2):** Alertas de marcos (ex.: nível 10 = Trade Ship liberado).

### Baús (P1/P2) — `BoxData.BoxQuantity`
- **B1 (P1):** ✅ v1.0 — Contagem de baús não abertos.
- **B2 (P2):** Alerta de transbordo (capacidade ↔ runas do Nordeste/Extremo Norte).
- **B3 (P2):** Estimar cooldowns de auto-abrir (comum 300s / boss 600s) — informativo.

### Itens / drops (P2) — `ItemSaveDatas[]`
- **D1 (P2):** Detectar drops novos por corrida (por `UniqueId`).
- **D2 (P3):** Classificar por raridade (catálogo) e destacar Legendary+ (vendável no Market).

### Runas (P2) — `RuneSaveData[]`
- **R1 (P2):** Níveis de runa observados.
- **R2 (P2):** Gasto de ouro em runas para **calibrar ouro recuperado** (corridas com ouro negativo).

### Sessão / atividade (P2) — `PlayTime`
- **A1 (P2):** Tempo de sessão e detecção ativo vs. parado (inferido por mudança do save — **não** enumerar processo).
- **A2 (P2):** Heartbeat de status quando não há mudanças.

## UI / TBHPedia (P1/P3)

| # | Item | Notas |
|---|------|-------|
| U1 (P0) ✅ v1.0 | Dashboard com cards (ouro, estágio, heróis, cubo, baús, máx. estágio) | MVP |
| U2 (P1) | Aba de Farm (ouro/h, xp/h, melhores estágios, histórico) | Depende de F1–F4 |
| U3 (P1) | Aba **TBHPedia** navegável dentro do app | Conteúdo já em TBHPEDIA.md / canvas |
| U4 (P2) | Eventos coloridos / log de atividade | Progress, gold, level-up, chest |
| U5 (P3) | Gráficos de sessão (ouro acumulado, taxa) | — |
| U6 (P3) | i18n PT/EN | Jogo já é multilíngue |

## Fora de escopo (regra de segurança)

- Qualquer leitura/escrita de memória do jogo.
- Injeção, hooks, automação de input, aceleração ou auto-clicker.
- Modificação do save.
- Enumerar/observar o processo do jogo para "forçar" comportamento.
