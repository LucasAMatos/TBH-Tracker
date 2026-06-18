# TBH-Tracker — Backlog (focada nos pontos observáveis)

Cada item nasce de algo que conseguimos **observar no save** (ver `TBHPEDIA.md › Save`). Nada aqui depende de tocar no jogo. Prioridades: **P0** (fundação/MVP) · **P1** (valor de farm) · **P2** (qualidade de vida) · **P3** (extras).

> **Status:** ⬜ = pendente · ⛔ = parado/bloqueado. Atualizar este arquivo sempre que um item for entregue (marcar `✅ vA.B`). Versionamento em `CHANGELOG.md` (`va.b`).
>
> **Arquivamento:** a cada 5 versões (`a` múltiplo de 5) os itens entregues saem daqui e vão para `BACKLOG-HISTORICO.md`; aqui fica só o que está a fazer. Último arquivamento: **v5.0**.
>
> **Outras visões:** `BACKLOG-ESFORCO.md` ranqueia os itens do mais fácil ao mais difícil de implementar (este arquivo segue sendo a fonte da verdade).

## Infra & leitura (P0)

| # | Status | Item | Observável / base | Notas |
|---|--------|------|-------------------|-------|
| I6 | ⬜ | Persistência local de histórico | — | Histórico por estágio, entre sessões |

## Pontos observáveis → features

### Ouro (P1) — `CurrencySaveDatas` (key 100001)
- **G2 (P1):** ✅ v7.0 (base) — Taxa de ouro/h por janela móvel (120s) e média de sessão. *(Em memória, sem persistência — depende de I6 para histórico entre sessões.)*
- **G3 (P1):** ✅ v7.0 — Delta de ouro por evento (com sinal e total).
- **G4 (P2):** **Calculadora de ouro por kill** — estima o ganho de ouro por abate aplicando os **bônus de ouro das runas** (categoria Ouro do catálogo) sobre o ouro base, com resultados **separados para monstro comum e boss**. *Observável:* `RuneSaveData[]` (níveis) + `runeTree.ts` (runas de ouro: efeito/valor por nível). *Dependência/assunção:* ouro base por kill (comum vs boss) — derivar de catálogo de monstros/estágio (wiki "Monstros 61") ou permitir entrada manual; registrar a origem do valor base.

### Estágio & progresso (P1/P2) — `CurrentStageKey`, `CurrentStageWave`, `MaxCompletedStage`
- **S3 (P1):** ✅ v10.0 — Detectar troca de estágio e novos estágios desbloqueados (eventos): compara `CurrentStageKey` e `MaxCompletedStage` entre leituras e registra **troca de estágio** e **novo recorde**; seção **Progresso de estágio** no Dashboard. *(Em memória, sem persistência — depende de I6.)*
- **S4 (P2):** Sugerir próximo "push" com base no máx. concluído.

### Corridas & eficiência de farm (P1) — `PlayTime` + ouro + XP + `CurrentStageWave`
- **F1 (P1):** ⛔ **PARADO (investigado)** — Detectar fim de corrida e medir tempo/ouro/xp da janela. *Bloqueio:* o save **não tem contador de clears** e **não persiste o tempo por corrida** (ver `TBHPEDIA.md › Detecção de corridas`). Reabrir quando partirmos para detecção por **salto de ouro** + leitura mais frequente, ou pivotar para ouro/h e kills/h (exatos). Branch arquivado: `feature/run-detection` (PR #3 fechado).
- **F2 (P1):** Ouro/h e XP/h **por estágio**, com filtros anti-ruído (clear curto/longo, troca de mapa, morte, venda).
- **F3 (P1):** Histórico persistente por estágio (médias acumuladas).
- **F4 (P1):** Recomendar melhor estágio para **ouro**, **XP** e **combo**.
- **F5 (P2):** Projeção para estágios ainda não medidos (modelo de tempo/retenção de XP).

### Heróis (P1) — `HeroSaveDatas[]`, `ArrangedHeroKey`
- **H2 (P1):** ✅ v11.0 — Detectar level-ups (eventos): compara `HeroLevel` entre snapshots e registra herói + nível anterior→novo + horário; seção **Level-ups** no Dashboard. *(Em memória, sem persistência — depende de I6 para histórico entre sessões.)*
- **H5 (P1):** ✅ v6.0 — Nova aba **Heróis** com a visão completa do roster: os 6 heróis com estado **desbloqueado/bloqueado** (`IsUnLock`), nível e XP (progresso até o próximo nível), e dados do catálogo (papel, arma, tier, stats base, disponibilidade). Marcar quais estão **ativos** no momento (`arrangedHeroKey`). *Observável:* `heroSaveDatas[]` + catálogo de heróis. *(Barra de progresso de XP fica pendente: falta a curva de XP por nível.)*
- **H6 (P1):** ✅ v6.0 — **Dashboard só com heróis ativos:** o card de heróis da tela principal passa a mostrar **apenas os heróis arranjados** (`arrangedHeroKey`, até 3), com nome/nível e indicação de **slots vazios** (`-1`). A lista completa do roster sai do dashboard e vai para a aba **Heróis** (H5).
- **H7 (P2):** Herói **líder** em destaque no card de ativos (pendência herdada de H1) — identificar/marcar o líder da formação quando observável no save.
- **H8 (P2):** ✅ v12.0 — **Retratos/ícones dos heróis** — imagens dos 6 heróis baixadas da TBH Wiki (`scripts/gen-heroes.cjs`) e exibidas nos cards de ativos (dashboard, H6), nos cards do roster e no detalhe (aba **Heróis**, H5/H9). Mesmo padrão dos ícones de runa (v4.0): assets em `src/renderer/src/assets/heroes/<heroKey>.png`, mapeados por `heroKey` via `heroPortraits.ts`. *(Hunter usa o asset interno "Abalist".)*
- **H9 (P2):** ✅ v8.0 — **Análise detalhada do herói** (drill-down dentro da aba Heróis), modelada na página da wiki (ex.: `taskbarhero.wiki/pt/heroes/ranger`): papel/arma principal+secundária, condição de desbloqueio, **stats base** (Dano, Vel. de ataque, Crít., Dano crít., PV, Armadura, Vel. de movimento, Vel. de conjuração, Red. recarga) com o **ranking do atributo entre os 6 heróis** (calculado em código; ★ marca o melhor), e a **árvore de habilidades por tier** (Tiers 1–8; passivas/ativas com nível máx. e custo em pontos por tier; tiers 7–8 marcados como bloqueados). *Observável:* nível do herói (`HeroLevel` → pontos de habilidade disponíveis, 1/nível) sobreposto ao **catálogo** `src/shared/heroes.ts` (stats + skill tree dos 6). *Fonte:* `taskbarhero.wiki/pt/heroes/<slug>`.

### Baús (P2) — `BoxData.BoxQuantity`
- **B3 (P2):** Estimar cooldowns de auto-abrir (comum 300s / boss 600s) — informativo.

### Itens / drops (P2) — `ItemSaveDatas[]`
- **D1 (P2):** Detectar drops novos por corrida (por `UniqueId`).
- **D2 (P3):** Classificar por raridade (catálogo) e destacar Legendary+ (vendável no Market).
- **D3 (P2):** **Aba Inventário** — identificar os itens por **tipo** (slot/categoria via `ItemKey` → catálogo) e por **raridade** (10 níveis: Common → Cosmic), **contar** e montar uma **visualização** da distribuição (ex.: matriz tipo × raridade com contagens, e/ou barras por raridade), separando **inventário** e **stash** (`inventorySaveDatas[]` / `stashSaveDatas[]`) e destacando **Legendary+** (vendável). *Observável:* `itemSaveDatas[]` (`ItemKey`, `UniqueId`, raridade) + catálogo de itens/raridades. Reaproveita D2 (classificação por raridade).

### Runas (P2) — `RuneSaveData[]`
- **R2 (P2):** Gasto de ouro em runas para **calibrar ouro recuperado** (corridas com ouro negativo). *(Catálogo de custos já disponível em `runeTree.ts`; falta a detecção de upgrade + a calibração de ouro/h, que depende do agente de corridas.)*
- **R3 (P2):** **Runa-alvo** — marcar uma runa como alvo na aba **Runas** e calcular **quanto ouro falta** para comprá-la **considerando os pré-requisitos**: somar o custo de **todos os nós do caminho** até o alvo que ainda não foram comprados/desbloqueados (incluindo os níveis restantes do próprio alvo), e subtrair o **ouro atual**, com progresso (%). A runa-alvo aparece em um **card no dashboard** (nome/ícone, quanto falta, progresso). Persistir a seleção localmente (`tbh-tracker-config.json`). *Observável:* ouro atual (`CurrencySaveDatas` 100001) + `RuneSaveData[]` (níveis) + `runeTree.ts` (custo em ouro por nível + arestas/pré-requisitos). *Nota:* se houver mais de um caminho até o nó, usar o de **menor custo total**.

### Sessão / atividade (P2) — `PlayTime`
- **A1 (P2):** Tempo de sessão e detecção ativo vs. parado (inferido por mudança do save — **não** enumerar processo).
- **A2 (P2):** ✅ v10.0 — Heartbeat de status quando não há mudanças: pulso periódico (5s) do tracker mesmo sem mudança no save; a barra de status mostra **ativo/parado** e **tempo desde a última mudança**, com ponto pulsante. *(Passivo: apenas timer no processo.)*

### Atualizações do jogo (P2) — fonte oficial (externo ao save)
- **N1 (P2):** **Aba Atualizações** — puxar patch notes / anúncios da **fonte oficial da empresa** (canal Steam do TBH, App ID 3678970 — devs Nugem Studio / Tesseract Studio) e listar título, data, resumo e link para o anúncio completo. *Fonte:* Steam News API (`ISteamNews/GetNewsForApp`, `appid=3678970`) ou RSS de anúncios da Steam (ver `FONTES.md`). *Segurança:* apenas requisição HTTP a serviço público da Steam — **não** interage com o jogo nem com o save; respeitar a postura passiva. *Extra possível:* destacar quando há versão mais nova que a observada (chave/`GameAssembly` muda com patches).

## UI / TBHPedia (P1/P3)

| # | Item | Notas |
|---|------|-------|
| U2 (P1) | Aba de Farm (ouro/h, xp/h, melhores estágios, histórico) | Depende de F1–F4 |
| U7 (P1) | ✅ v6.0 Aba **Heróis** (roster completo) + dashboard só com ativos | Implementa H5/H6 na navegação por abas |
| U8 (P2) | Aba **Inventário** (itens por tipo × raridade, contagem + visualização) | Implementa D3 na navegação por abas |
| U9 (P2) | Aba **Atualizações** (patch notes/anúncios da Steam) | Implementa N1 na navegação por abas |
| U4 (P2) | Eventos coloridos / log de atividade | Progress, gold, level-up, chest |
| U5 (P3) | Gráficos de sessão (ouro acumulado, taxa) | — |
| U6 (P3) | i18n PT/EN | Jogo já é multilíngue |

> Itens entregues (✅) foram arquivados em `BACKLOG-HISTORICO.md`.

## Fora de escopo (regra de segurança)

- Qualquer leitura/escrita de memória do jogo.
- Injeção, hooks, automação de input, aceleração ou auto-clicker.
- Modificação do save.
- Enumerar/observar o processo do jogo para "forçar" comportamento.
