# TBH-Tracker — Backlog (focada nos pontos observáveis)

Cada item nasce de algo que conseguimos **observar no save** (ver `TBHPEDIA.md › Save`). Nada aqui depende de tocar no jogo. Prioridades: **P0** (fundação/MVP) · **P1** (valor de farm) · **P2** (qualidade de vida) · **P3** (extras).

> **Status:** ⬜ = pendente · ⛔ = parado/bloqueado. Atualizar este arquivo sempre que um item for entregue (marcar `✅ vA.B`). Versionamento em `CHANGELOG.md` (`va.b`).
>
> **Arquivamento:** a cada 5 versões (`a` múltiplo de 5) os itens entregues saem daqui e vão para `BACKLOG-HISTORICO.md`; aqui fica só o que está a fazer. Último arquivamento: **v15.0** (v11–v15: H2, H8, B3, I6, D3, U8).
>
> **Outras visões:** `BACKLOG-ESFORCO.md` ranqueia os itens do mais fácil ao mais difícil de implementar (este arquivo segue sendo a fonte da verdade).

## Pontos observáveis → features

### Ouro (P1) — `CurrencySaveDatas` (key 100001)
- **G4 (P2):** **Calculadora de ouro por kill** — estima o ganho de ouro por abate aplicando os **bônus de ouro das runas** (categoria Ouro do catálogo) sobre o ouro base, com resultados **separados para monstro comum e boss**. *Observável:* `RuneSaveData[]` (níveis) + `runeTree.ts` (runas de ouro: efeito/valor por nível). *Dependência a criar:* ouro base por kill (comum vs boss) — **não há catálogo de estágios/monstros no projeto hoje** (só `stage.ts` com `decodeStage`); derivar por datamine (wiki "Monstros 61" ou gamedata do `tbh-farm`, no padrão dos `scripts/gen-*.cjs`) ou permitir entrada manual, registrando a origem do valor base. *Aproximação pronta (F0, v18.0):* `stageDataForRaw(raw)` dá `expectedGold` e `count` por fase → média de ouro por kill ≈ `expectedGold / count` (não separa comum vs boss).

### Estágio & progresso (P1/P2) — `CurrentStageKey`, `CurrentStageWave`, `MaxCompletedStage`
- **S4 (P2):** Sugerir próximo "push" com base no máx. concluído.

### Corridas & eficiência de farm (P1) — `PlayTime` + ouro + XP + `CurrentStageWave`
- **F0 (P1):** ✅ **v18.0** — **Catálogo de estágios** `src/shared/stageData.ts` (108 estágios: 4 dificuldades × 3 atos × fases 1-9; **sem boss de ato**), por chave DAPP, com **EXP/clear**, **ouro/clear**, **HP total**, **nº de inimigos**, ondas e **densidades** `goldPerHP`/`expPerHP`. Gerado por `scripts/gen-stages.cjs` (datamine de `data/farm_stages.json` do `tbh-farm`, no padrão de `gen-runes`/`gen-items`; nomes pt-BR com correção de mojibake). Helpers em `stage.ts`: `stageDataForRaw(raw)`, `rankStages(metric, {difficulty, limit})` (eficiência por densidade de HP — ouro/exp/combo) e `stagesByDifficulty()`. **Fundação da Fase 2** — desbloqueia F4, F5 e a aproximação de ouro/kill do G4.
- **F1 (P1):** ⛔ **PARADO (investigado)** — Detectar fim de corrida e medir tempo/ouro/xp da janela. *Bloqueio:* o save **não tem contador de clears** e **não persiste o tempo por corrida** (ver `TBHPEDIA.md › Detecção de corridas`). Reabrir quando partirmos para detecção por **salto de ouro** + leitura mais frequente, ou pivotar para ouro/h e kills/h (exatos). Branch arquivado: `feature/run-detection` (PR #3 fechado).
- **F2 (P1):** Ouro/h e XP/h **por estágio**, com filtros anti-ruído (clear curto/longo, troca de mapa, morte, venda). *Plano técnico (reaproveita a infra atual):* novo tracker `src/main/stageFarm.ts` no padrão de `goldFlow.ts`/`stageEvents.ts`, alimentado pelo `Tracker.readSave()` a cada leitura. A cada leitura, atribui o **delta de ouro** (e o **delta de XP** = soma de `snapshot.heroes[].exp`) ao **estágio corrente** (`snapshot.stage.raw`), mantendo amostras + taxas (janela móvel + média) **por chave de estágio** — mesma lógica do `GoldFlowTracker`, só que *bucketed*. *Anti-ruído:* descartar a amostra quando o estágio mudou entre leituras (cruzar com `stageEvents`), ignorar **deltas negativos de ouro** (gasto em runa/venda) e exigir span mínimo (como o `MIN_WINDOW_SPAN`). *Exatidão (opcional):* o save tem contadores **cumulativos** em `aggregateSaveDatas[]` (`Type 2` = ouro ganho — `SubKey 0` total, `SubKey 1/2/3` por **ato**; `Type 0` = kills por **monstro**, `SubKey 0` total — ver `TBHPEDIA.md › aggregateSaveDatas[]`). Eles **não são por fase individual** (granularidade total/ato/monstro), mas dão ouro/kills **exatos** para métricas globais e por ato — útil para validar/calibrar as taxas por estágio derivadas do delta de snapshot. *Saída:* anexar `Snapshot.stageFarm` (taxas por estágio) ao snapshot e exibir na Aba de Farm (U2).
- **F3 (P1):** Histórico persistente por estágio (médias acumuladas). *Pronto para usar:* `src/main/history.ts` (I6) já persiste estado de tracker por save (isolado por hash do caminho); basta o `StageFarmTracker` (F2) ganhar `serialize()`/`restore()` e um namespace novo `stageFarm` (adicionar a `HistoryNamespace`), idêntico ao que `goldFlow`/`stageEvents` já fazem no `Tracker`.
- **F4 (P1):** Recomendar melhor estágio para **ouro**, **XP** e **combo**. *Base pronta:* **F0 (v18.0)** — `rankStages(metric, {difficulty, limit})` já ranqueia por eficiência (densidade de HP). Falta a **UI** (Aba de Farm, U2) e, opcionalmente, refinar com **medições reais** por estágio (F2/F3).
- **F5 (P2):** Projeção para estágios ainda não medidos (modelo de tempo/retenção de XP). *Base pronta:* **F0 (v18.0)** traz HP total, EXP/clear e ouro/clear base por fase; com a penalidade de over-level (wiki) dá para extrapolar tempo/ganho a partir de poucas medições (F2).

### Heróis (P1) — `HeroSaveDatas[]`, `ArrangedHeroKey`
- **H7 (P2):** Herói **líder** em destaque no card de ativos (pendência herdada de H1) — identificar/marcar o líder da formação quando observável no save.

### Itens / drops (P2) — `itemSaveDatas[]`
- **D1 (P2):** Detectar drops novos por corrida (por `UniqueId`). *Base pronta:* catálogo `items.ts`/`itemData.ts` (D3) classifica cada `ItemKey` por tipo/raridade; falta a fronteira de corrida (depende de F1, bloqueado).
- **D2 (P3):** Classificar por raridade (catálogo) e destacar Legendary+ (vendável no Market) **fora da aba Inventário** — ex.: nos drops/dashboard. *Base pronta:* `classifyItem` + `GRADES` (catálogo de raridade) entregues no D3 (v15.0); falta aplicar no contexto de drops.

### Runas (P2) — `RuneSaveData[]`
- **R2 (P2):** Gasto de ouro em runas para **calibrar ouro recuperado** (corridas com ouro negativo). *(Catálogo de custos já disponível em `runeTree.ts`; falta a detecção de upgrade + a calibração de ouro/h, que depende do agente de corridas.)*
- **R3 (P2):** ✅ **v16.0** — **Runa-alvo**: marcar uma runa como alvo na aba **Runas** e calcular **quanto ouro falta** para comprá-la **considerando os pré-requisitos** (caminho de menor custo até a raiz + níveis restantes do alvo, menos o ouro atual, com progresso %). Card no Dashboard (ícone/nome, custo, falta, barra, passos) + seleção persistida (`runeTargetKey` em `tbh-tracker-config.json`). Pré-req em soul stones entra no caminho mas não soma ouro.

### Onboarding / chave ES3 (infra)
- **K1 (P1):** ✅ **v18.0→v19.0** *(entregue v19.0)* — **Localizar chave ES3 automaticamente**: localiza a instalação do jogo (Steam) e lê o `resources.assets` (asset `ES3Defaults` do Easy Save 3) **somente leitura**, validando as strings candidatas contra o save (a chave certa decifra para JSON). Aviso/consentimento nativo antes de ler arquivos do jogo; chave aplicada via `safeStorage` e nunca exposta ao renderer. `src/main/keyFinder.ts` + IPC `tbh:findKey`. *Pendente opcional:* suporte Proton/Linux (locator já tem os caminhos base).

### Sessão / atividade (P2) — `PlayTime`
- **A1 (P2):** Tempo de sessão e detecção ativo vs. parado (inferido por mudança do save — **não** enumerar processo).

### Atualizações do jogo (P2) — fonte oficial (externo ao save)
- **N1 (P2):** ✅ **v17.0** — **Aba Atualizações** (com U9): busca patch notes/anúncios oficiais na **Steam News API** (`ISteamNews/GetNewsForApp`, `appid=3678970`) e lista título, data, resumo (BBCode/HTML limpos) e link para o anúncio completo (abre no navegador via `shell.openExternal`). Busca no processo main (`src/main/news.ts`) com cache de 10 min e botão "Atualizar". *Segurança:* só GET HTTPS a serviço público da Steam — não interage com o jogo nem com o save. *Extra ainda pendente:* destacar quando há versão mais nova que a observada (chave/`GameAssembly` muda com patches).

## UI / TBHPedia (P1/P3)

| # | Item | Notas |
|---|------|-------|
| U2 (P1) | Aba de Farm (ouro/h, xp/h, melhores estágios, histórico) | Depende de F1–F4 |
| U9 (P2) ✅ v17.0 | Aba **Atualizações** (patch notes/anúncios da Steam) | Entregue junto do N1 (`Updates.tsx` + aba na navegação) |
| U4 (P2) | Eventos coloridos / log de atividade | Progress, gold, level-up, chest |
| U5 (P3) | Gráficos de sessão (ouro acumulado, taxa) | — |
| U6 (P3) | i18n PT/EN | Jogo já é multilíngue |

> Itens entregues até a **v15.0** foram arquivados em `BACKLOG-HISTORICO.md` (último corte: v11–v15). Os próximos ✅ ficam aqui até o corte da v20.0.

## Fora de escopo (regra de segurança)

- Qualquer leitura/escrita de memória do jogo.
- Injeção, hooks, automação de input, aceleração ou auto-clicker.
- Modificação do save.
- Enumerar/observar o processo do jogo para "forçar" comportamento.
