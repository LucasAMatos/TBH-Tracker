# TBH-Tracker — Backlog (focada nos pontos observáveis)

Cada item nasce de algo que conseguimos **observar no save** (ver `TBHPEDIA.md › Save`). Nada aqui depende de tocar no jogo. Prioridades: **P0** (fundação/MVP) · **P1** (valor de farm) · **P2** (qualidade de vida) · **P3** (extras).

> **Status:** ⬜ = pendente · ⛔ = parado/bloqueado. Atualizar este arquivo sempre que um item for entregue (marcar `✅ vA.B`). Versionamento em `CHANGELOG.md` (`va.b`).
>
> **Arquivamento:** a cada 5 versões (`a` múltiplo de 5) os itens entregues saem daqui e vão para `BACKLOG-HISTORICO.md`; aqui fica só o que está a fazer. Último arquivamento: **v15.0** (v11–v15: H2, H8, B3, I6, D3, U8).
>
> **Outras visões:** `BACKLOG-ESFORCO.md` ranqueia os itens do mais fácil ao mais difícil de implementar (este arquivo segue sendo a fonte da verdade).

## Pontos observáveis → features

### Ouro (P1) — `CurrencySaveDatas` (key 100001)
- **G4 (P2):** **Calculadora de ouro por kill** — estima o ganho de ouro por abate aplicando os **bônus de ouro das runas** (categoria Ouro do catálogo) sobre o ouro base, com resultados **separados para monstro comum e boss**. *Observável:* `RuneSaveData[]` (níveis) + `runeTree.ts` (runas de ouro: efeito/valor por nível). *Dependência/assunção:* ouro base por kill (comum vs boss) — derivar de catálogo de monstros/estágio (wiki "Monstros 61") ou permitir entrada manual; registrar a origem do valor base. *Aproximação disponível:* `stageData.ts` traz **ouro/clear** e **nº de inimigos** por fase → média de ouro por kill ≈ `expectedGold / count` (não separa comum vs boss).

### Estágio & progresso (P1/P2) — `CurrentStageKey`, `CurrentStageWave`, `MaxCompletedStage`
- **S4 (P2):** Sugerir próximo "push" com base no máx. concluído.

### Corridas & eficiência de farm (P1) — `PlayTime` + ouro + XP + `CurrentStageWave`
- **F1 (P1):** ⛔ **PARADO (investigado)** — Detectar fim de corrida e medir tempo/ouro/xp da janela. *Bloqueio:* o save **não tem contador de clears** e **não persiste o tempo por corrida** (ver `TBHPEDIA.md › Detecção de corridas`). Reabrir quando partirmos para detecção por **salto de ouro** + leitura mais frequente, ou pivotar para ouro/h e kills/h (exatos). Branch arquivado: `feature/run-detection` (PR #3 fechado).
- **F2 (P1):** Ouro/h e XP/h **por estágio**, com filtros anti-ruído (clear curto/longo, troca de mapa, morte, venda).
- **F3 (P1):** Histórico persistente por estágio (médias acumuladas).
- **F4 (P1):** Recomendar melhor estágio para **ouro**, **XP** e **combo**. *Dependência pronta:* catálogo `src/shared/stageData.ts` (EXP/ouro base por fase × dificuldade) + helpers em `stage.ts` (`stageDataForRaw`, `rankStages`, `stagesByDifficulty`) — ver `FONTES.md › Farm`.
- **F5 (P2):** Projeção para estágios ainda não medidos (modelo de tempo/retenção de XP). *Dependência pronta:* `stageData.ts` traz HP total, EXP/clear e ouro/clear base por fase (e a wiki documenta a penalidade de over-level) — base para extrapolar tempo/ganho a partir de poucas medições.

### Heróis (P1) — `HeroSaveDatas[]`, `ArrangedHeroKey`
- **H7 (P2):** Herói **líder** em destaque no card de ativos (pendência herdada de H1) — identificar/marcar o líder da formação quando observável no save.

### Itens / drops (P2) — `itemSaveDatas[]`
- **D1 (P2):** Detectar drops novos por corrida (por `UniqueId`). *Base pronta:* catálogo `items.ts`/`itemData.ts` (D3) classifica cada `ItemKey` por tipo/raridade; falta a fronteira de corrida (depende de F1, bloqueado).
- **D2 (P3):** Classificar por raridade (catálogo) e destacar Legendary+ (vendável no Market) **fora da aba Inventário** — ex.: nos drops/dashboard. *Base pronta:* `classifyItem` + `GRADES` (catálogo de raridade) entregues no D3 (v15.0); falta aplicar no contexto de drops.

### Runas (P2) — `RuneSaveData[]`
- **R2 (P2):** Gasto de ouro em runas para **calibrar ouro recuperado** (corridas com ouro negativo). *(Catálogo de custos já disponível em `runeTree.ts`; falta a detecção de upgrade + a calibração de ouro/h, que depende do agente de corridas.)*
- **R3 (P2):** ✅ **v16.0** — **Runa-alvo**: marcar uma runa como alvo na aba **Runas** e calcular **quanto ouro falta** para comprá-la **considerando os pré-requisitos** (caminho de menor custo até a raiz + níveis restantes do alvo, menos o ouro atual, com progresso %). Card no Dashboard (ícone/nome, custo, falta, barra, passos) + seleção persistida (`runeTargetKey` em `tbh-tracker-config.json`). Pré-req em soul stones entra no caminho mas não soma ouro.

### Sessão / atividade (P2) — `PlayTime`
- **A1 (P2):** Tempo de sessão e detecção ativo vs. parado (inferido por mudança do save — **não** enumerar processo).

### Atualizações do jogo (P2) — fonte oficial (externo ao save)
- **N1 (P2):** **Aba Atualizações** — puxar patch notes / anúncios da **fonte oficial da empresa** (canal Steam do TBH, App ID 3678970 — devs Nugem Studio / Tesseract Studio) e listar título, data, resumo e link para o anúncio completo. *Fonte:* Steam News API (`ISteamNews/GetNewsForApp`, `appid=3678970`) ou RSS de anúncios da Steam (ver `FONTES.md`). *Segurança:* apenas requisição HTTP a serviço público da Steam — **não** interage com o jogo nem com o save; respeitar a postura passiva. *Extra possível:* destacar quando há versão mais nova que a observada (chave/`GameAssembly` muda com patches).

## UI / TBHPedia (P1/P3)

| # | Item | Notas |
|---|------|-------|
| U2 (P1) | Aba de Farm (ouro/h, xp/h, melhores estágios, histórico) | Depende de F1–F4 |
| U9 (P2) | Aba **Atualizações** (patch notes/anúncios da Steam) | Implementa N1 na navegação por abas |
| U4 (P2) | Eventos coloridos / log de atividade | Progress, gold, level-up, chest |
| U5 (P3) | Gráficos de sessão (ouro acumulado, taxa) | — |
| U6 (P3) | i18n PT/EN | Jogo já é multilíngue |

> Itens entregues até a **v15.0** foram arquivados em `BACKLOG-HISTORICO.md` (último corte: v11–v15). Os próximos ✅ ficam aqui até o corte da v20.0.

## Fora de escopo (regra de segurança)

- Qualquer leitura/escrita de memória do jogo.
- Injeção, hooks, automação de input, aceleração ou auto-clicker.
- Modificação do save.
- Enumerar/observar o processo do jogo para "forçar" comportamento.
