# TBH-Tracker — Backlog (focada nos pontos observáveis)

Cada item nasce de algo que conseguimos **observar no save** (ver `TBHPEDIA.md › Save`). Nada aqui depende de tocar no jogo. Prioridades: **P0** (fundação/MVP) · **P1** (valor de farm) · **P2** (qualidade de vida) · **P3** (extras).

> **Status:** ⬜ = pendente · ⛔ = parado/bloqueado. Atualizar este arquivo sempre que um item for entregue (marcar `✅ vA.B`). Versionamento em `CHANGELOG.md` (`va.b`).
>
> **Arquivamento:** a cada 5 versões (`a` múltiplo de 5) os itens entregues saem daqui e vão para `BACKLOG-HISTORICO.md`; aqui fica só o que está a fazer. Último arquivamento: **v0.15.0** (v0.11–v0.15: H2, H8, B3, I6, D3, U8).
>
> **Outras visões:** `BACKLOG-ESFORCO.md` ranqueia os itens do mais fácil ao mais difícil de implementar (este arquivo segue sendo a fonte da verdade).

## Pontos observáveis → features

### Ouro (P1) — `CurrencySaveDatas` (key 100001)
- **G4 (P2):** **Calculadora de ouro por kill** — estima o ganho de ouro por abate aplicando os **bônus de ouro das runas** (categoria Ouro do catálogo) sobre o ouro base, com resultados **separados para monstro comum e boss**. *Observável:* `RuneSaveData[]` (níveis) + `runeTree.ts` (runas de ouro: efeito/valor por nível). *Dependência a criar:* ouro base por kill (comum vs boss) — **não há catálogo de estágios/monstros no projeto hoje** (só `stage.ts` com `decodeStage`); derivar por datamine (wiki "Monstros 61" ou gamedata do `tbh-farm`, no padrão dos `scripts/gen-*.cjs`) ou permitir entrada manual, registrando a origem do valor base. *Aproximação pronta (F0, v0.18.0):* `stageDataForRaw(raw)` dá `expectedGold` e `count` por fase → média de ouro por kill ≈ `expectedGold / count` (não separa comum vs boss).

### Estágio & progresso (P1/P2) — `CurrentStageKey`, `CurrentStageWave`, `MaxCompletedStage`
- **S4 (P2):** Sugerir próximo "push" com base no máx. concluído.
- **S5 (P2) ✅ v1.3.0:** **Alerta de nível recomendado vs. seu nível** — compara o nível dos heróis ativos com o **nível recomendado** do estágio e avisa sub/over-level, citando a **penalidade de over-level** de XP. Entregue: banner na **Aba de Farm** via `levelAdvice()` (`shared/stage.ts`) usando `level` do catálogo F0 + média de nível dos ativos. Refino futuro com `DB.stageThreat`/`DB.stageLevels` fica em aberto.
- **S6 (P2) ✅ v1.3.0:** **Progresso por dificuldade/ato** — % de conclusão de Normal/Nightmare/Hell/Torment (e por ato) a partir de `maxCompletedStage` cruzado com o catálogo. Entregue: seção "Progresso por dificuldade" na **Aba de Farm** via `stageProgress()` (`shared/stage.ts`).

### Corridas & eficiência de farm (P1) — ouro + XP + kills (`aggregateSaveDatas` Type 0) + `CurrentStageWave`
- **F0 (P1):** ✅ **v0.18.0** — **Catálogo de estágios** `src/shared/stageData.ts` (108 estágios: 4 dificuldades × 3 atos × fases 1-9; **sem boss de ato**), por chave DAPP, com **EXP/clear**, **ouro/clear**, **HP total**, **nº de inimigos**, ondas e **densidades** `goldPerHP`/`expPerHP`. Gerado por `scripts/gen-stages.cjs` (datamine de `data/farm_stages.json` do `tbh-farm`, no padrão de `gen-runes`/`gen-items`; nomes pt-BR com correção de mojibake). Helpers em `stage.ts`: `stageDataForRaw(raw)`, `rankStages(metric, {difficulty, limit})` (eficiência por densidade de HP — ouro/exp/combo) e `stagesByDifficulty()`. **Fundação da Fase 2** — desbloqueia F4, F5 e a aproximação de ouro/kill do G4.
- **F1 (P1):** ✅ **v1.2.0** — **Eficiência de farm por estágio (clears estimados)**. O parser passou a ler o **total de kills cumulativo** (`aggregateSaveDatas` Type 0/SubKey 0 → `Snapshot.totalKills`); o `StageFarmTracker` atribui o **delta de kills** ao estágio corrente (mesmo anti-ruído de ouro/XP) e, dividindo pelo **nº de inimigos por clear** do catálogo F0 (`stageData.count`), estima **clears**, **clears/h** e **tempo médio por clear** (+ ouro/clear e xp/clear medidos), exibidos na **Aba Farm**. Robusto ao intervalo de leitura. *Fora de escopo (segue inviável pelo save):* tempo/fronteira por **corrida individual** — sem contador de clears nem tempo por corrida persistido (ver `TBHPEDIA.md › Detecção de corridas`); por isso o D1 (drops por corrida) continua bloqueado. Branch original arquivado: `feature/run-detection` (PR #3 fechado).
- **F2 (P1):** ✅ **v0.20.0** — **Ouro/h e XP/h por estágio** via delta entre leituras. Tracker `src/main/stageFarm.ts` (padrão do `goldFlow.ts`, *bucketed* por estágio): atribui delta de ouro + delta de XP (Σ `HeroExp`) + tempo ao estágio corrente. Anti-ruído: descarta troca de estágio, deltas negativos (gasto/venda/reset de XP) e intervalos longos (jogo parado). Anexado em `Snapshot.stageFarm`. *Plano técnico original (reaproveita a infra atual):* novo tracker `src/main/stageFarm.ts` no padrão de `goldFlow.ts`/`stageEvents.ts`, alimentado pelo `Tracker.readSave()` a cada leitura. A cada leitura, atribui o **delta de ouro** (e o **delta de XP** = soma de `snapshot.heroes[].exp`) ao **estágio corrente** (`snapshot.stage.raw`), mantendo amostras + taxas (janela móvel + média) **por chave de estágio** — mesma lógica do `GoldFlowTracker`, só que *bucketed*. *Anti-ruído:* descartar a amostra quando o estágio mudou entre leituras (cruzar com `stageEvents`), ignorar **deltas negativos de ouro** (gasto em runa/venda) e exigir span mínimo (como o `MIN_WINDOW_SPAN`). *Exatidão (opcional):* o save tem contadores **cumulativos** em `aggregateSaveDatas[]` (`Type 2` = ouro ganho — `SubKey 0` total, `SubKey 1/2/3` por **ato**; `Type 0` = kills por **monstro**, `SubKey 0` total — ver `TBHPEDIA.md › aggregateSaveDatas[]`). Eles **não são por fase individual** (granularidade total/ato/monstro), mas dão ouro/kills **exatos** para métricas globais e por ato — útil para validar/calibrar as taxas por estágio derivadas do delta de snapshot. *Saída:* anexar `Snapshot.stageFarm` (taxas por estágio) ao snapshot e exibir na Aba de Farm (U2).
- **F3 (P1):** ✅ **v0.20.0** — Histórico persistente por estágio. `StageFarmTracker` ganhou `serialize()`/`restore()` e o namespace `stageFarm` em `src/main/history.ts`; as medições retomam por save ao reabrir (igual a `goldFlow`/`stageEvents`).
- **F4 (P1):** ✅ **v0.20.0** — Recomendar melhor estágio para **ouro**, **XP** e **combo** via `rankStages` (F0), exibido na **Aba de Farm** (U2) com seletor de métrica + filtro de dificuldade e destaque do estágio atual. *Refino opcional futuro:* combinar com as **medições reais** (F2/F3) em vez de só a densidade do catálogo.
- **F5 (P2):** Projeção para estágios ainda não medidos (modelo de tempo/retenção de XP). *Base pronta:* **F0 (v0.18.0)** traz HP total, EXP/clear e ouro/clear base por fase; com a penalidade de over-level (wiki) dá para extrapolar tempo/ganho a partir de poucas medições (F2).

### Heróis (P1) — `HeroSaveDatas[]`, `ArrangedHeroKey`
- **H7 (P2):** Herói **líder** em destaque no card de ativos (pendência herdada de H1) — identificar/marcar o líder da formação quando observável no save.
- **H10 (P2):** **Modelo de stats do personagem** — ler/derivar **todos os status** de cada herói (não só o nível). *Por que é preciso modelar:* o save **não guarda os stats finais** — `heroSaveDatas[]` só tem `heroKey/HeroLevel/HeroExp/IsUnLock`; o jogo calcula os 9 atributos a partir de **base + nível + árvore de atributos + equipamento + runas + pets**. *Fontes (datamine `gamedata.js`):* `DB.heroes` (stats base nível 1: `AttackDamage`/`AttackSpeed`/`CastSpeed`/`CriticalChance`/`CriticalDamage`/`MaxHp`/`Armor`/`MovementSpeed`/`CooldownReduction` — já refletidos em `heroes.ts`); `DB.attributes` (132 nós; cada um aponta `val:nível` → `DB.statMods` com `st`/`mt`/min-max) cruzado com `attributeSaveDatas[]` (`Key,Level`) do save; `DB.gear` (afixos inerentes `inh`) + catálogo de bônus do **D4**; `runeTree.ts` (runas) e `DB.petStats` (pets). *A criar:* `src/shared/heroStats.ts` que agrega tudo aplicando as **regras de stacking** (FLAT vs ADDITIVE/percentual). **Pré-requisito do analisador de item (H11).** *Em aberto:* (a) **curva de crescimento por nível** — não está explícita em `DB.heroes` (verificar `DB.levels`/wiki); (b) ordem/forma de combinação dos modificadores (FLAT → ADDITIVE% → multiplicadores?); (c) afixos rolados por instância no save (mesma dúvida do D4).
- **H11 (P2):** **Analisador de impacto de item** — mostrar **o que um item faz pelo personagem, com dados**: recalcula os stats do herói **com vs. sem** o item equipado e apresenta o **delta por atributo** (ex.: +12% dano, +35 armadura, variação de DPS). *Depende de H10* (modelo de stats) **e D4** (bônus do item). *Ideia de UI:* no detalhe do herói (H9) ou na aba Inventário, comparar o item candidato contra o atualmente equipado no slot. *Esforço:* 🔴 (depende do modelo completo de stats e dos afixos por instância).
- **H12 (P2) ✅ v1.9.0:** **Visualizador da árvore de atributos por herói** — aba **Atributos** com seletor de herói (retrato + pontos alocados) e a árvore em colunas (grupos), cada nó com ícone, rótulo pt-BR, tipo (passiva/ativa), **nível alocado/máx** e efeito. *Entregue:* gerador `scripts/gen-attributes.cjs` → `src/shared/attributeData.ts` (132 nós, 8 grupos; passivos via **`passives`** `{st,mt,v}` + rótulo de `statStrings`, ativos via **`skills`**/`skillLevels`; +59 ícones baixados); parser lê `attributeSaveDatas[]` (`Key,Level`) → `snapshot.heroAttributes`; helper `src/shared/attributes.ts` (`heroAttributeTree`, `attrEffectAtLevel`/`attrPerLevel`, layout por grupo). Coberto por testes (`test/attributes.test.ts`). *Nota:* o layout veio de `attributeGroups` (sem x/y como nas runas), então é uma **grade por grupo** (não o pan/zoom do `RuneTree`). Os valores são por ponto (datamine); o stat final do herói é o **H10**.

### Itens / drops (P2) — `itemSaveDatas[]`
- **D1 (P2):** Detectar drops novos por corrida (por `UniqueId`). *Base pronta:* catálogo `items.ts`/`itemData.ts` (D3) classifica cada `ItemKey` por tipo/raridade; falta a **fronteira de corrida individual**, que segue inviável pelo save (o F1, v1.2.0, entregou eficiência/clears estimados, mas não delimita cada corrida).
- **D2 (P3) ✅ v1.5.0:** Classificar por raridade (catálogo) e destacar Legendary+ (vendável no Market) **fora da aba Inventário** — entregue: widget **"Raridade do inventário"** no Dashboard (liga/desliga + colapsável, U10) com destaque do total **Legendary+** e a distribuição compacta por raridade (chips), usando `classifyItem` + `GRADES` (D3, v0.15.0). *Obs.:* destaque por **corrida/drop individual** segue dependente da fronteira de corrida (D1, inviável pelo save).
- **D4 (P2) ✅ v1.6.0:** **Catálogo de bônus/atributos de itens** — base para o filtro por status e a lista de seleção de bônus (ex.: "+35 de armadura"). *Entregue:* novo gerador `scripts/gen-stats.cjs` → `src/shared/statData.ts` cataloga **`statStrings`** (117 tipos, com **nome + linha pt-BR** — ex.: `"Armadura +{0}"`) em `STAT_STRINGS`; **`statMods`** (620, por `id:nível`: FLAT/ADDITIVE + min/max) em `STAT_MODS`; **`affixRep`** (57) em `AFFIX_REP`; e **`gradeSlots`** (slots de afixo por raridade) em `GRADE_SLOTS`. Helper `src/shared/stats.ts` expõe `STAT_LIST` (seleção, ordenada), `formatStatLine`/`statName`/`statLine`, `modsForStat`/`statRange` (faixas) e `gradeSlotTotal`. Coberto por testes (`test/stats.test.ts`). **Pré-requisito do filtro por status (U11).** *Em aberto (verificar contra save real, no U11):* se `itemSaveDatas[]` guarda os **afixos rolados por instância** (para mostrar os bônus do item específico) ou se só dá para mostrar os **bônus possíveis** por tipo/raridade. O catálogo de **`gear`** base (`b1`/`b2`/`inh`/`uniq`) fica para o modelo de stats (H10).

- **D5 (P2):** **Calculadora de derretimento (Alchemy/Cubo)** — estima **quanto ouro + XP de Cubo** você ganha derretendo o gear (Alchemy é a renda principal do jogo). *Base pronta:* o inventário (D3) já classifica por tipo/raridade/local e o datamine tem **`DB.itemSell`** (valor de venda por `ItemKey`, ~5.744 itens) e **`DB.itemCubeExp`** (XP de Cubo por item). *Saída:* total derretível do stash/inventário, **excluindo Legendary+** (vendável no Market) e equipados, com filtro por raridade/local. *Em aberto:* confirmar se "derreter" usa `itemSell` ou outra tabela; valor pode escalar com nível do item. *Esforço:* 🟢–🟡.

### Pets (P2) — `PetSaveData[]`
- **PE1 (P2):** **Aba/catálogo de Pets** — hoje o app **não cobre pets**. Mostrar os 8 pets (desbloqueado/bloqueado) e **o que cada um concede**. *Base pronta:* `PetSaveData[]` (`PetKey,IsUnlock`) no save; datamine `DB.pets` (metadados/nomes pt-BR) + `DB.petStats` (efeitos). *Saída:* aba ou seção no Dashboard com progresso de pets e bônus ativos. *Esforço:* 🟡 (catálogo novo `gen-pets.cjs` → `petData.ts`, no padrão dos demais).

### Runas (P2) — `RuneSaveData[]`
- **R2 (P2):** Gasto de ouro em runas para **calibrar ouro recuperado** (corridas com ouro negativo). *(Catálogo de custos já disponível em `runeTree.ts`; falta a detecção de upgrade + a calibração de ouro/h, que depende do agente de corridas.)*
- **R3 (P2):** ✅ **v0.16.0** — **Runa-alvo**: marcar uma runa como alvo na aba **Runas** e calcular **quanto ouro falta** para comprá-la **considerando os pré-requisitos** (caminho de menor custo até a raiz + níveis restantes do alvo, menos o ouro atual, com progresso %). Card no Dashboard (ícone/nome, custo, falta, barra, passos) + seleção persistida (`runeTargetKey` em `tbh-tracker-config.json`). Pré-req em soul stones entra no caminho mas não soma ouro.

### Onboarding / chave ES3 (infra)
- **K1 (P1):** ✅ **v0.18.0→v0.19.0** *(entregue v0.19.0)* — **Localizar chave ES3 automaticamente**: localiza a instalação do jogo (Steam) e lê o `resources.assets` (asset `ES3Defaults` do Easy Save 3) **somente leitura**, validando as strings candidatas contra o save (a chave certa decifra para JSON). Aviso/consentimento nativo antes de ler arquivos do jogo; chave aplicada via `safeStorage` e nunca exposta ao renderer. `src/main/keyFinder.ts` + IPC `tbh:findKey`. *Pendente opcional:* suporte Proton/Linux (locator já tem os caminhos base).

### Sessão / atividade (P2) — `PlayTime`
- **A1 (P2):** Tempo de sessão e detecção ativo vs. parado (inferido por mudança do save — **não** enumerar processo).
- **A3 (P2):** **System tray + notificações nativas** — rodar minimizado na bandeja e **notificar fora da janela** nos eventos que já detectamos: baús transbordando (B2), level-up (H2), novo estágio máximo (S3) e runa-alvo já comprável (R3). *Base pronta:* todos esses eventos já existem no snapshot; falta só o `Tray` + `Notification` do Electron (com toggle por tipo, persistido no config) e janela "fechar = minimizar para a bandeja". *Por que vale:* é um tracker passivo que fica aberto em background — alertas só dentro da UI têm pouco alcance. *Esforço:* 🟡.

### Atualizações do jogo (P2) — fonte oficial (externo ao save)
- **N1 (P2):** ✅ **v0.17.0** — **Aba Atualizações** (com U9): busca patch notes/anúncios oficiais na **Steam News API** (`ISteamNews/GetNewsForApp`, `appid=3678970`) e lista título, data, resumo (BBCode/HTML limpos) e link para o anúncio completo (abre no navegador via `shell.openExternal`). Busca no processo main (`src/main/news.ts`) com cache de 10 min e botão "Atualizar". *Segurança:* só GET HTTPS a serviço público da Steam — não interage com o jogo nem com o save. *Extra ainda pendente:* destacar quando há versão mais nova que a observada (chave/`GameAssembly` muda com patches).
- **N2 (P2):** **Detecção de patch / catálogo desatualizado** — avisar quando o jogo foi atualizado e os catálogos (datamine) podem estar velhos. *Sinais observáveis:* mudança da **chave ES3**/`GameAssembly` (já lidos pelo `keyFinder`), aparição de `ItemKey`/estágios **fora do catálogo** durante o parsing, ou versão nova na Steam News (N1). *Saída:* banner "o jogo atualizou — regenere os catálogos (`scripts/gen-*.cjs`)". Realiza o "extra pendente" do N1. *Esforço:* 🟡.

### Recompensas offline (P3)
- **O1 (P3):** **Estimador de recompensa offline** — estimar ouro/loot acumulado enquanto o jogo esteve fechado. *Base observável:* `DB.offlineRewards` (datamine) + entradas `[OfflineReward]` no `Player.log` (leitura passiva de arquivo, mesma postura do save). *Esforço:* 🟡 (depende de modelar a taxa offline e de parsear o log).

## Aplicativo / engenharia (infra)
- **I7 (P2) ✅ v1.3.0:** **JSON bruto sob demanda** *(dívida técnica)* — o snapshot deixou de carregar o save bruto a cada leitura; o visualizador de calibração agora busca o `raw` **sob demanda** via IPC dedicado (`tbh:getRawSave` → `Tracker.readRawSave()`), só quando o widget abre. Enxuga o tráfego de IPC e a memória do snapshot.
- **I8 (P2) ✅ v1.4.0:** **Suíte de testes (vitest)** — entregue: 53 testes da lógica pura em `test/` (`npm test`), cobrindo `decodeStage`/`rankStages`/`stageProgress`/`levelAdvice` (estágios), `classifyBoxBacklog`/`boxDrainSeconds`/`normalizeBoxThresholds` (baús), `classifyItem` (itens), `planRuneTarget`/`summarizeRunes` (runas), `buildSessionJson`/`buildFarmCsv` (export) e o `StageFarmTracker` (atribuição de deltas + anti-ruído + clears + serialize/restore). Config em `vitest.config.ts` (aliases `@shared`/`@renderer`, fora dos `include` do `typecheck`). Protege contra regressão ao regenerar catálogos.
- **I9 (P2):** **Painel de diagnóstico** — um lugar único com caminho do save, status da chave, última leitura/heartbeat e **avisos de chaves desconhecidas** (ItemKeys/estágios fora do catálogo) — sinaliza datamine velho após patch (sinergia com N2). *Esforço:* 🟢–🟡.
- **E1 (P3) ✅ v1.3.0:** **Exportação de dados** — entregue: botões na **Aba de Farm** exportam a **sessão em JSON** (ouro G3 + farm F2/F3 + inventário D3 + heróis) e o **farm em CSV**, via `shared/export.ts` (funções puras) + IPC `tbh:saveTextFile` (diálogo de salvar). Previsto na Fase 5 do `PLAN.md`.
- **I10 (P3) ✅ v1.3.0:** **Persistir estado da janela** — entregue: tamanho/posição/maximizado lembrados entre sessões no config local (`store.getWindowState`/`setWindowState`; aplicado/salvo em `createWindow`).
- **I11 (P3):** **Suporte Proton/Linux** — completar a localização do save/instalação no Linux (o `locator` já tem os caminhos base; é o pendente opcional herdado do K1). *Esforço:* 🟡.

## UI / TBHPedia (P1/P3)

| # | Item | Notas |
|---|------|-------|
| U10 (P2) ✅ v1.1.0 | **Dashboard customizável** — flags para ligar/desligar widgets + seções colapsáveis, com layout persistido | Entregue: painel "Personalizar" + cabeçalhos colapsáveis; `dashboardWidgets.ts` + `DashboardLayout` persistido (`store`/IPC). JSON bruto desligado por padrão. |
| U11 (P2) ✅ v1.7.0 | **Itens na TBHPedia** com **filtro por status (bônus)** + **lista de seleção de bônus** (ex.: "+35 de armadura") | Entregue: seção **"Bônus de itens"** na TBHPedia (`ItemBonusExplorer`) — busca + filtro por tipo de modificador + faixas (min–max), consumindo o catálogo D4. Afixos por instância seguem pendentes (save). |
| U2 (P1) ✅ v0.20.0 | Aba de Farm (ouro/h, xp/h, melhores estágios, histórico) | Entregue: `Farm.tsx` + aba; medições F2/F3 + recomendação F4. (F1 segue bloqueado, mas a aba não depende dele) |
| U9 (P2) ✅ v0.17.0 | Aba **Atualizações** (patch notes/anúncios da Steam) | Entregue junto do N1 (`Updates.tsx` + aba na navegação) |
| U4 (P2) | Eventos coloridos / log de atividade | Progress, gold, level-up, chest |
| U5 (P3) | Gráficos de sessão (ouro acumulado, taxa) | — |
| U6 (P3) | i18n PT/EN | Jogo já é multilíngue |

### U10 (P2) ✅ v1.1.0 — Dashboard customizável (entregue)
> **Entregue na v1.1.0** conforme o plano abaixo: painel "Personalizar" com switch por widget +
> "Restaurar padrão", seções colapsáveis, layout persistido (`dashboardLayout` no config) e JSON
> bruto desligado por padrão.

O Dashboard hoje empilha **9 blocos sempre visíveis e em ordem fixa** (grid de cards → Runa-alvo →
Fluxo de ouro → Level-ups → Progresso de estágio → Baús → Marcos do Cubo → Heróis ativos → JSON
bruto), sem como esconder nada — daí a poluição. Objetivo: dar **flags para ligar/desligar** as
ferramentas que mais importam (ou que estão em teste) e **lembrar a configuração de tela**.

**Decisões fechadas (19/06/2026):** escopo **só o Dashboard** (próxima feature sob SemVer, ex.: v1.1.0); granularidade **por
seção/widget** (não por card individual); layout = **toggles on/off + seções colapsáveis**
(lembrar aberto/fechado), **sem** drag & drop; ordem dos widgets fixa (padrão atual).

**Persistência (segue o padrão de `boxThresholds`/`runeTarget`):** novo campo no
`tbh-tracker-config.json`:
```ts
dashboardLayout?: { hidden: WidgetId[]; collapsed: WidgetId[] }
```
via `store.ts` (`getDashboardLayout`/`setDashboardLayout` com normalização — descarta ids
desconhecidos) → IPC `tbh:getDashboardLayout`/`tbh:setDashboardLayout` (`index.ts`) → `preload`.
Tipos `DashboardLayout`/`WidgetId` em `shared/types.ts`. (Escolhido config do main em vez de
`localStorage` por consistência com o resto do app.)

**Passos:**
1. `src/renderer/src/data/dashboardWidgets.ts` (novo) — registro canônico dos 9 widgets
   (`id`, `title`, `defaultOn`, `collapsible`). JSON bruto entra **desligado por padrão**.
2. `shared/types.ts` — `DashboardLayout` + `WidgetId`.
3. `main/store.ts` — get/set com normalização.
4. `main/index.ts` — IPC get/set.
5. `preload/index.ts` — expor no `window.tbh`.
6. `renderer/.../Dashboard.tsx` — wrapper `<Widget id title collapsible>` (visibilidade +
   cabeçalho colapsável) envolvendo cada seção; botão **"Personalizar"** abre painel com um
   switch por widget + **"Restaurar padrão"** (estilo do `ThresholdEditor`); toggles/colapsos
   persistem via IPC na hora.
7. CSS do painel/switch/cabeçalho colapsável.

**Comportamento:** tudo ligado/expandido por padrão = visual igual ao de hoje (exceto JSON bruto,
desligado). Widgets condicionais (ex.: Runa-alvo só com alvo definido) seguem condicionais — o
toggle só controla o que **pode** aparecer. *Esforço:* 🟡 médio (refactor + plumbing, mas
reaproveita padrões existentes).

### U11 (P2) ✅ v1.7.0 — Itens na TBHPedia + filtro por status (bônus)
A TBHPedia ganhou a seção **"Bônus de itens"** (`src/renderer/src/components/ItemBonusExplorer.tsx`,
ligada via flag `custom: 'itemBonus'` no modelo de seção). Ela é a **lista de seleção dos bônus
disponíveis**: lista os 117 status do catálogo D4 com **nome pt-BR**, a **linha renderizada com a
faixa** (ex.: `Armadura +min–max`), o **tipo de modificador** (fixo/percentual) e o **tier** do
afixo; tem **busca** por status e **filtro por tipo de modificador** (Todos/Fixo/Percentual), além
de um resumo de **slots de afixo por raridade**. Consome `STAT_LIST`/`statLine`/`statRange`/
`modsForStat`/`affixRep`/`gradeSlotTotal` (D4) — sem dependência do save.

*Escopo entregue = catálogo (bônus possíveis).* O filtro opera sobre os **bônus possíveis**, não
sobre os itens específicos do jogador. *Em aberto (futuro):* mostrar os **afixos rolados por
instância** dos itens que o jogador possui depende de `itemSaveDatas[]` expor esses afixos no save
(a verificar contra um save real — ver D4); enquanto isso, a referência fica pelo catálogo.

> Itens entregues até a **v0.15.0** foram arquivados em `BACKLOG-HISTORICO.md` (último corte: v0.11–v0.15). Os próximos ✅ ficam aqui até o corte da v0.20.0.

## Épico W — TBHPedia completa: ingerir 100% das 5 wikis

**Objetivo:** absorver **todo o conhecimento** das 5 wikis da comunidade (ver `FONTES.md`) e
fazer a **TBHPedia do app conter tudo isso**, navegável e cruzado com o que já lemos do save/datamine.
Fontes: **taskbarhero.wiki** (PT), **taskbarherowiki.com**, **taskbarhero.org**,
**task-bar-hero.wiki**, **taskbarhero.xyz**.

> **Postura/segurança:** leitura **passiva** de páginas **públicas** (mesma postura da Steam News, N1) —
> nada de tocar no jogo. Preferir **dados estruturados/espelhos** (ex.: payload RSC de
> `taskbarherowiki.com`; `tbh-farm` espelha `taskbarhero.wiki`) a *scraping* de HTML. Respeitar
> **ToS/rate limit** de cada site e **manter atribuição** (cada conteúdo guarda a fonte + data de
> coleta). Conteúdo é de fãs — versionar a proveniência e regenerar a cada patch (sinergia com N2).

> **Faseado e incremental.** W0/W1 são a fundação; W2–W8 ingerem um domínio por vez (cada um já
> entrega valor na TBHPedia); W9 unifica a navegação. *Esforço do épico:* 🔴 (grande).

- **W0 (P2) — Levantamento + esquema canônico:** inventariar **o que cada uma das 5 wikis cobre**
  (heróis, pets, runas, itens, efeitos, estágios/farm, monstros, cubo, baús, soul stones, mecânicas,
  guias) e **como expõe os dados** (JSON/RSC estruturado vs. HTML; idiomas). Definir o **esquema
  canônico** da TBHPedia (tópico → entrada → campos/seções, com `source`, `sourceUrl`, `lang`,
  `fetchedAt`) e as **regras de conflito/autoridade** (qual wiki manda por domínio; PT-BR canônico;
  dedup/merge). Saída: doc de cobertura + tipos do corpus. *Esforço:* 🟡.
- **W1 (P2) — Pipeline de ingestão reutilizável:** geradores no padrão `scripts/gen-*.cjs`
  (um por wiki/domínio) que **buscam, parseiam e normalizam** para o esquema do W0, com **cache do
  bruto + proveniência** e *rate limit*. Saída: `src/shared/pedia/*` (catálogo gerado) + helpers.
  *Esforço:* 🔴 (parsing heterogêneo entre as fontes).
- **W2 (P2) — Domínio Heróis (completo):** stats, árvore de habilidades, builds e descrições de
  todas as wikis. *Estende:* `heroes.ts`/H9 (já temos a base via `taskbarhero.wiki`). *Esforço:* 🟡.
- **W3 (P2) — Domínio Runas:** preencher lacunas além do R1 (efeitos completos, prioridades,
  notas) cruzando as fontes. *Base:* `runeTree.ts` (v0.4.0). *Esforço:* 🟡.
- **W4 (P2) — Domínio Itens & Efeitos:** gear, **efeitos/afixos**, drops e descrições. *Sinergia:*
  D3 (catálogo de itens) e **D4** (catálogo de bônus). *Esforço:* 🟡.
- **W5 (P2) — Domínio Estágios/Farm/Monstros/Mapa:** além do F0 (108 fases), trazer **monstros**,
  *threat*, bosses de ato e o mapa do mundo. *Sinergia:* F0/S5/S6 e G4 (ouro por kill). *Esforço:* 🟡.
- **W6 (P3) — Domínio Pets/Mascotes:** catálogo completo + efeitos. *Sinergia:* **PE1**. *Esforço:* 🟡.
- **W7 (P3) — Domínio Cubo, Baús, Soul Stones e mecânicas gerais:** Alchemy/Crafting/Decoration/
  Removal/Engraving/Inscription/Offering, tipos de baú, soul stones, fórmulas e mecânicas. *Esforço:* 🟡.
- **W8 (P3) — Guias & estratégias (prosa):** "Task Bar Hero 101" e guias de comunidade, como
  artigos navegáveis (texto longo, não só tabelas). *Esforço:* 🟡.
- **W9 (P2) — TBHPedia unificada na UI:** reconstruir a aba TBHPedia para renderizar **todo o
  corpus** com **busca global**, **cross-links** (herói → runas/itens/estágios recomendados),
  **atribuição de fonte** e "atualizado em <data>". Opcional: ação "atualizar das wikis" (como o
  refresh da N1) ou geração em build. *Sinergia:* U6 (i18n, wikis são multilíngues). *Esforço:* 🟡–🔴.

## Bugs conhecidos (não corrigir agora — período de estabilidade)

- **BUG-1 — Runa-alvo aceita runa já no nível máximo (R3):** é possível clicar **"Definir como
  alvo"** numa runa que já está no **nível máximo** (`level >= node.MaxLevel`). Nesse caso não há
  ouro a faltar, então o card de runa-alvo no Dashboard fica sem sentido (alvo já 100%). *Onde:* o
  botão em `dotnet/TbhTracker.App/Components/Tabs/RuneTree.razor` (~linha 252) é renderizado sem
  checar `maxed`. *Correção futura:* esconder/desabilitar "Definir como alvo" quando a runa
  selecionada está no nível máximo (e, idealmente, validar também em `ToggleTarget`/`TrackerApi`).
  *Status:* anotado, **não corrigir agora**.

## Fora de escopo (regra de segurança)

- Qualquer leitura/escrita de memória do jogo.
- Injeção, hooks, automação de input, aceleração ou auto-clicker.
- Modificação do save.
- Enumerar/observar o processo do jogo para "forçar" comportamento.
