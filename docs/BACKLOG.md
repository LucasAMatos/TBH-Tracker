# TBH-Tracker — Backlog (focada nos pontos observáveis)

Cada item nasce de algo que conseguimos **observar no save** (ver `TBHPEDIA.md › Save`). Nada aqui depende de tocar no jogo. Prioridades: **P0** (fundação/MVP) · **P1** (valor de farm) · **P2** (qualidade de vida) · **P3** (extras).

> **Status:** ⬜ = pendente · ⛔ = parado/bloqueado · ✅ = entregue. Ao entregar um item, marcar `✅ vMAJOR.MINOR.PATCH` **no mesmo PR** do código (regra em `.cursor/rules/tbh-tracker.mdc`). Versionamento (SemVer) detalhado em `CHANGELOG.md`.
>
> **Arquivamento:** a cada 5 MINORs os itens entregues saem daqui e vão para `BACKLOG-HISTORICO.md`; aqui fica só o que está a fazer. Último corte: **v0.15.0** (v0.11–v0.15). **Dívida:** os ✅ de v0.16 → v2.1.0 ainda estão aqui — pendente um novo corte de arquivamento.
>
> **Outras visões:** `BACKLOG-ESFORCO.md` ranqueia os itens do mais fácil ao mais difícil de implementar (este arquivo segue sendo a fonte da verdade).

## Pontos observáveis → features

### Ouro (P1) — `CurrencySaveDatas` (key 100001)
- **G4 (P2):** **Calculadora de ouro por kill** — estima o ganho de ouro por abate aplicando os **bônus de ouro das runas** (categoria Ouro do catálogo) sobre o ouro base, com resultados **separados para monstro comum e boss**. *Observável:* `RuneSaveData[]` (níveis) + `runeTree.ts` (runas de ouro: efeito/valor por nível). *Dependência a criar:* ouro base por kill (comum vs boss) — **não há catálogo de estágios/monstros no projeto hoje** (só `stage.ts` com `decodeStage`); derivar por datamine (wiki "Monstros 61" ou gamedata do `tbh-farm`, no padrão dos `scripts/gen-*.cjs`) ou permitir entrada manual, registrando a origem do valor base. *Aproximação pronta (F0, v0.18.0):* `stageDataForRaw(raw)` dá `expectedGold` e `count` por fase → média de ouro por kill ≈ `expectedGold / count` (não separa comum vs boss). *Atualização (v2.1.0):* o corpus **W5 `map.json`** (120 estágios com **monstros/boss/drops**) é candidato a fornecer a base por kill que faltava — revalidar contra ele e/ou contra o **V2** do Épico V (ouro base comum × boss); G4 deixa de depender só de entrada manual.

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
- **H13 (P2):** **Stats atuais por herói na aba Heróis** — exibir os **status atuais** de cada herói: **status base do nível** + **bônus calculados** (árvore de atributos + equipamento + runas + pets). *Depende de H10* (modelo de stats; é o consumidor direto dele) e da **curva de crescimento por nível** (questão aberta do H10 — `DB.levels`/wiki). *Esforço:* 🔴 (preso no H10).
- **H14 (P2):** **XP para o próximo level-up na aba Heróis** — mostrar o **XP total necessário** para o próximo nível de cada herói (e o que falta, cruzando com `HeroExp`). *Dependência a criar:* catálogo da **curva de XP por nível** (`levels`/`DB.levels`; o datamine expõe **100 níveis**) via gerador no padrão `gen-*.cjs`. *Sinergia:* alimenta o X2 (ETA do level-up). *Esforço:* 🟢–🟡.
- **H15 (P2):** **Equipamento atual por herói (loadout)** — mostrar **o que cada herói tem equipado** (por slot), lendo os itens marcados como equipados em `itemSaveDatas[]` e classificando por tipo/raridade via D3. *Observável:* `itemSaveDatas[]` (slot/local "equipado") + catálogo `items.ts`/`itemData.ts` (D3) + bônus possíveis (D4). *Sinergia:* é a base de UI do **H11** (comparar item candidato vs. equipado no slot) e do **H10** (insumo de stats). *Em aberto:* confirmar no save real o vínculo item→herói→slot (qual campo amarra a instância ao herói/slot). *Esforço:* 🟡.

### Itens / drops (P2) — `itemSaveDatas[]`
- **D1 (P2):** Detectar drops novos por corrida (por `UniqueId`). *Base pronta:* catálogo `items.ts`/`itemData.ts` (D3) classifica cada `ItemKey` por tipo/raridade; falta a **fronteira de corrida individual**, que segue inviável pelo save (o F1, v1.2.0, entregou eficiência/clears estimados, mas não delimita cada corrida).
- **D2 (P3) ✅ v1.5.0:** Classificar por raridade (catálogo) e destacar Legendary+ (vendável no Market) **fora da aba Inventário** — entregue: widget **"Raridade do inventário"** no Dashboard (liga/desliga + colapsável, U10) com destaque do total **Legendary+** e a distribuição compacta por raridade (chips), usando `classifyItem` + `GRADES` (D3, v0.15.0). *Obs.:* destaque por **corrida/drop individual** segue dependente da fronteira de corrida (D1, inviável pelo save).
- **D4 (P2) ✅ v1.6.0:** **Catálogo de bônus/atributos de itens** — base para o filtro por status e a lista de seleção de bônus (ex.: "+35 de armadura"). *Entregue:* novo gerador `scripts/gen-stats.cjs` → `src/shared/statData.ts` cataloga **`statStrings`** (117 tipos, com **nome + linha pt-BR** — ex.: `"Armadura +{0}"`) em `STAT_STRINGS`; **`statMods`** (620, por `id:nível`: FLAT/ADDITIVE + min/max) em `STAT_MODS`; **`affixRep`** (57) em `AFFIX_REP`; e **`gradeSlots`** (slots de afixo por raridade) em `GRADE_SLOTS`. Helper `src/shared/stats.ts` expõe `STAT_LIST` (seleção, ordenada), `formatStatLine`/`statName`/`statLine`, `modsForStat`/`statRange` (faixas) e `gradeSlotTotal`. Coberto por testes (`test/stats.test.ts`). **Pré-requisito do filtro por status (U11).** *Em aberto (verificar contra save real, no U11):* se `itemSaveDatas[]` guarda os **afixos rolados por instância** (para mostrar os bônus do item específico) ou se só dá para mostrar os **bônus possíveis** por tipo/raridade. O catálogo de **`gear`** base (`b1`/`b2`/`inh`/`uniq`) fica para o modelo de stats (H10).

- **D5 (P2) ✅ v2.2.0:** **Calculadora de derretimento (Alchemy/Cubo)** — estima **quanto ouro + XP de Cubo** você ganha derretendo o gear. *Entregue:* gerador `scripts/gen-melt.cjs` → `dotnet/TbhTracker.Core/Data/meltData.json` (5.744 itens: `itemSell` + `itemCubeExp` por `ItemKey`); lógica pura `Logic/Melt.cs` (`Melt.Summarize`) que soma ouro + XP de Cubo do gear **excluindo equipados e Legendary+** (vendável no Market), com quebra por raridade; `SaveParser.ParseMelt` popula `Snapshot.Melt` (`MeltSummary`); e widget **"Derretimento (Alchemy)"** no Dashboard (liga/desliga + colapsável) com totais, nº derretível e exclusões. Coberto por `MeltTests`. *Em aberto:* confirmar se "derreter" usa exatamente `itemSell` ou outra tabela e se o valor escala com o nível do item.

- **D6 (P2):** **Filtros do Inventário** — na **Aba Inventário**, buscar itens no **baú/inventário** por **status (bônus) desejado** (ex.: "+armadura", "+dano crítico") e filtrar por **raridade**. *Base pronta:* `itemSaveDatas[]` (D3, classifica tipo/raridade/local) + catálogo de bônus **D4** + o `ItemBonusExplorer` (U11) já lista os bônus possíveis. *Em aberto (mesma dúvida do D4/U11):* filtrar pelo **status rolado da instância** exige que o save exponha os **afixos por instância**; enquanto isso, o filtro por status opera pelos **bônus possíveis** por tipo/raridade. O filtro por **raridade** é direto (já temos `GRADES`). *Esforço:* 🟡 (raridade 🟢).

- **D7 (P2):** **Identificar craftings possíveis pelo inventário** — analisar os itens do **baú/inventário** (`itemSaveDatas[]`, classificados por D3) e cruzar com as **receitas de crafting** para listar **o que dá para fabricar agora** (e destacar receitas **quase-completas**, com o que falta). *Dependência a criar:* catálogo de **receitas** (entradas/quantidades e saída por craft) via gerador no padrão `gen-*.cjs` — confirmar a fonte (datamine `DB.*` de crafting/alchemy ou o corpus de **mecânicas do W7**, ainda pendente). *Sinergia:* **D5** (derretimento), **D6** (filtros) e **W7** (Crafting/Alchemy na pedia). *Esforço:* 🟡.
- **D8 (P2):** **Item-alvo: avisar quando cair no drop** — marcar um item como **alvo** (por `ItemKey`, à la R3 das runas) e **notificar quando uma nova instância aparecer** no save. *Observável:* **deltas de `itemSaveDatas[]`** entre leituras (novo `UniqueId` / aumento de contagem do `ItemKey` alvo) — **não depende da fronteira de corrida** (D1), só da detecção de item novo (mesmo padrão de eventos do `heroEvents`/`stageEvents`). *Sinergia:* seleção via **D3**, alerta nativo via **A3** (tray/notificação) e a infra de **eventos/histórico**; alvo persistido como o `runeTargetKey` (R3). *Em aberto:* granularidade do alvo (ItemKey específico × tipo+raridade × "qualquer Legendary+"). *Esforço:* 🟡.

### Pets (P2) — `PetSaveData[]`
- **PE1 (P2) ✅ v2.2.0:** **Pets no Dashboard** — antes o app **não cobria pets**. *Entregue:* `SaveParser.ParsePets` lê `PetSaveData[]` (`PetKey`/`IsUnlock` + detecção tolerante do **pet ativo/equipado**) → `Snapshot.Pets` (`PetSnapshot`); o widget **"Pets"** no Dashboard (liga/desliga + colapsável) reusa o corpus **W6 `pets.json`** (`Catalog.PediaPets`) e mostra **desbloqueados/total**, o **bônus do pet ativo** (não cumulativo) e a lista dos 8 pets (estado bloqueado/desbloqueado/ativo + efeitos). *Obs.:* o bônus **não é cumulativo** — só o pet ativo concede; o campo exato do "pet equipado" no save ainda está sendo confirmado (detecção tolerante por ora — ver BUG-PET-ATIVO).

### Runas (P2) — `RuneSaveData[]`
- **R2 (P2):** Gasto de ouro em runas para **calibrar ouro recuperado** (corridas com ouro negativo). *(Catálogo de custos já disponível em `runeTree.ts`; falta a detecção de upgrade + a calibração de ouro/h, que depende do agente de corridas.)*
- **R3 (P2):** ✅ **v0.16.0** — **Runa-alvo**: marcar uma runa como alvo na aba **Runas** e calcular **quanto ouro falta** para comprá-la **considerando os pré-requisitos** (caminho de menor custo até a raiz + níveis restantes do alvo, menos o ouro atual, com progresso %). Card no Dashboard (ícone/nome, custo, falta, barra, passos) + seleção persistida (`runeTargetKey` em `tbh-tracker-config.json`). Pré-req em soul stones entra no caminho mas não soma ouro.
- **R4 (P2):** **Custo para maximizar todas as runas** — somar o ouro de pegar **todos os nós em todos os níveis** (catálogo `runeTree`, custo por nível) e cruzar com os níveis atuais (`RuneSaveData[]`) para mostrar **custo total**, **já investido** e **quanto falta** para o 100%. *Esforço:* 🟢.
- **R5 (P2):** **Progresso visual na árvore de Runas** — preencher o **fundo de cada nó** proporcionalmente ao **nível adquirido / máximo** (e/ou resumo por categoria), para bater o olho e ver o quanto já foi pego. *Base:* `RuneTree.razor` já desenha nós + níveis; falta o indicador de preenchimento. *Esforço:* 🟢–🟡.
- **R6 (P2):** **Runa-alvo: validar nível comprado e detalhar upgrades** — no card do Dashboard (R3), considerar o **nível já comprado** do alvo e **listar cada upgrade separadamente** (nível a nível: custo, acumulado e se **já dá para comprar agora**), para validar a próxima atualização. *Relaciona:* BUG-1 (não permitir alvo já no nível máximo). *Esforço:* 🟡.

### Cubo (P2) — `CubeSaveLevelData` (`Level`, `Exp`)
- **C3 (P2):** **Curva de XP do Cubo por nível** — calcular o **XP necessário por nível** do Cubo (e o **total acumulado**) e cruzar com `CubeLevel`/`CubeExp` do save para mostrar **XP até o próximo nível**, **% de progresso** e a **curva completa por nível**. *Base observável:* `cubeSaveLevelData` (`Level`/`Exp`) — já lido pelo `SaveParser` (`Snapshot.CubeLevel`/`CubeExp`). *Dependência a criar:* catálogo `cube_levels` (XP por nível; o datamine expõe **100 níveis** de Cubo) via gerador no padrão `gen-*.cjs` (`tbh-farm`/wiki). *Sinergia:* com o **D5** (XP de Cubo por item derretido) dá para estimar **quanto gear derreter para chegar a um nível-alvo** do Cubo. Estende o C1/C2 (nível/XP e marcos do Cubo, arquivados). *Esforço:* 🟢–🟡.

### Onboarding / chave ES3 (infra)
- **K1 (P1):** ✅ **v0.18.0→v0.19.0** *(entregue v0.19.0)* — **Localizar chave ES3 automaticamente**: localiza a instalação do jogo (Steam) e lê o `resources.assets` (asset `ES3Defaults` do Easy Save 3) **somente leitura**, validando as strings candidatas contra o save (a chave certa decifra para JSON). Aviso/consentimento nativo antes de ler arquivos do jogo; chave aplicada via `safeStorage` e nunca exposta ao renderer. `src/main/keyFinder.ts` + IPC `tbh:findKey`. *Pendente opcional:* suporte Proton/Linux (locator já tem os caminhos base).

### Sessão / atividade (P2) — `PlayTime`
- **A1 (P2):** Tempo de sessão e detecção ativo vs. parado (inferido por mudança do save — **não** enumerar processo).
- **A3 (P2):** **System tray + notificações nativas** — rodar minimizado na bandeja e **notificar fora da janela** nos eventos que já detectamos: baús transbordando (B2), level-up (H2), novo estágio máximo (S3) e runa-alvo já comprável (R3). *Base pronta:* todos esses eventos já existem no snapshot; falta só o `Tray` + `Notification` do Electron (com toggle por tipo, persistido no config) e janela "fechar = minimizar para a bandeja". *Por que vale:* é um tracker passivo que fica aberto em background — alertas só dentro da UI têm pouco alcance. *Esforço:* 🟡.

### Estatísticas acumuladas (P2) — `aggregateSaveDatas[]`
- **A4 (P2):** **Painel de estatísticas acumuladas (lifetime)** — expor na UI os **contadores cumulativos** que hoje só usamos internamente: **ouro ganho por ato** (`Type 2` → `SubKey 0` total, `1/2/3` por ato) e **kills por monstro** (`Type 0` → `SubKey 0` total). *Observável:* `aggregateSaveDatas[]` (já lido pelo `SaveParser`; ver `TBHPEDIA.md`). *Sinergia:* cruzar os kills por monstro com os **nomes/ícones do W5** (`map.json`); é a **verdade-terreno** do **V4** (Épico V). *Saída:* página/seção read-only (totais + top monstros por kills + ouro por ato). *Esforço:* 🟡.

### XP & nível (P2) — `HeroSaveDatas[].HeroExp`
- **X1 (P2):** **Fluxo de XP** no Dashboard — widget com **XP/h** por **janela móvel** (taxa + média), análogo ao **Fluxo de ouro** (G3), somando os **deltas de `HeroExp`** (Σ exp dos heróis) entre leituras. Mesmo anti-ruído do `GoldFlowTracker` (descartar deltas negativos/reset, exigir span mínimo). *Saída:* tracker no padrão `goldFlow` + card no Dashboard. **Base do X2.** *Esforço:* 🟡.
- **X2 (P2):** **ETA do próximo level-up (heróis ativos)** — a partir do **Fluxo de XP** (X1) e do **XP que falta** (H14), estimar a **média de tempo até o próximo level-up** de cada herói ativo, exibida no card de **Heróis ativos**. *Esforço:* 🟢–🟡 (depende de X1 + H14).

### Atualizações do jogo (P2) — fonte oficial (externo ao save)
- **N1 (P2):** ✅ **v0.17.0** — **Aba Atualizações** (com U9): busca patch notes/anúncios oficiais na **Steam News API** (`ISteamNews/GetNewsForApp`, `appid=3678970`) e lista título, data, resumo (BBCode/HTML limpos) e link para o anúncio completo (abre no navegador via `shell.openExternal`). Busca no processo main (`src/main/news.ts`) com cache de 10 min e botão "Atualizar". *Segurança:* só GET HTTPS a serviço público da Steam — não interage com o jogo nem com o save. *Extra ainda pendente:* destacar quando há versão mais nova que a observada (chave/`GameAssembly` muda com patches).
- **N2 (P2):** **Detecção de patch / catálogo desatualizado** — avisar quando o jogo foi atualizado e os catálogos (datamine) podem estar velhos. *Sinais observáveis:* mudança da **chave ES3**/`GameAssembly` (já lidos pelo `keyFinder`), aparição de `ItemKey`/estágios **fora do catálogo** durante o parsing, ou versão nova na Steam News (N1). *Saída:* banner "o jogo atualizou — regenere os catálogos (`scripts/gen-*.cjs`)". Realiza o "extra pendente" do N1. *Esforço:* 🟡. *Atualização (v2.1.0):* incluir também o **frescor do corpus da pedia** (Épico W) — cada entrada guarda `fetchedAt`; avisar quando a coleta envelheceu vs. a versão do jogo e sugerir `npm run gen:pedia`.

### Recompensas offline (P3)
- **O1 (P3):** **Estimador de recompensa offline** — estimar ouro/loot acumulado enquanto o jogo esteve fechado. *Base observável:* `DB.offlineRewards` (datamine) + entradas `[OfflineReward]` no `Player.log` (leitura passiva de arquivo, mesma postura do save). *Esforço:* 🟡 (depende de modelar a taxa offline e de parsear o log).

## Aplicativo / engenharia (infra)
- **I7 (P2) ✅ v1.3.0:** **JSON bruto sob demanda** *(dívida técnica)* — o snapshot deixou de carregar o save bruto a cada leitura; o visualizador de calibração agora busca o `raw` **sob demanda** via IPC dedicado (`tbh:getRawSave` → `Tracker.readRawSave()`), só quando o widget abre. Enxuga o tráfego de IPC e a memória do snapshot.
- **I8 (P2) ✅ v1.4.0:** **Suíte de testes (vitest)** — entregue: 53 testes da lógica pura em `test/` (`npm test`), cobrindo `decodeStage`/`rankStages`/`stageProgress`/`levelAdvice` (estágios), `classifyBoxBacklog`/`boxDrainSeconds`/`normalizeBoxThresholds` (baús), `classifyItem` (itens), `planRuneTarget`/`summarizeRunes` (runas), `buildSessionJson`/`buildFarmCsv` (export) e o `StageFarmTracker` (atribuição de deltas + anti-ruído + clears + serialize/restore). Config em `vitest.config.ts` (aliases `@shared`/`@renderer`, fora dos `include` do `typecheck`). Protege contra regressão ao regenerar catálogos.
- **I9 (P2) ✅ v2.2.0:** **Painel de diagnóstico** — entregue: aba **"Diagnóstico"** (`Components/Tabs/Diagnostics.razor`) reúne num só lugar o **estado da conexão**, **caminho** e **status da chave** do save, **heartbeat** e **última leitura** (relógio + "há Xs"), mais **avisos de catálogo desatualizado** (ItemKeys fora do catálogo via `Inventory.UnknownCount`, gear sem valor de derretimento, estágio não reconhecido) — sinaliza datamine velho após patch (sinergia com N2). Somente leitura.
- **E1 (P3) ✅ v1.3.0:** **Exportação de dados** — entregue: botões na **Aba de Farm** exportam a **sessão em JSON** (ouro G3 + farm F2/F3 + inventário D3 + heróis) e o **farm em CSV**, via `shared/export.ts` (funções puras) + IPC `tbh:saveTextFile` (diálogo de salvar). Previsto na Fase 5 do `PLAN.md`.
- **I10 (P3) ✅ v1.3.0:** **Persistir estado da janela** — entregue: tamanho/posição/maximizado lembrados entre sessões no config local (`store.getWindowState`/`setWindowState`; aplicado/salvo em `createWindow`).
- **I11 (P3):** **Suporte Proton/Linux** — completar a localização do save/instalação no Linux (o `locator` já tem os caminhos base; é o pendente opcional herdado do K1). *Esforço:* 🟡.
- **I12 (P2):** **CI nos PRs (build + testes)** — GitHub Actions que roda `dotnet build` + `dotnet test` (83 testes) em todo PR com alvo `dev`, barrando regressão antes do merge humano. *Opcional:* um check que **falha se um PR de feature/fix não tocar `docs/BACKLOG.md`**, fazendo cumprir a regra "backlog acompanha o código" (`.cursor/rules`). *Sinergia:* protege os geradores/catálogos (I8). *Esforço:* 🟢–🟡.
- **I13 (P2):** **Empacotar/distribuir release** — produzir um artefato instalável do app .NET MAUI (MSIX assinado ou `.exe` **não-empacotado** `WindowsPackageType=None`, que já é a config atual) e documentar o passo a passo (versão de `ApplicationDisplayVersion` + tag + publish). Opcional: anexar o artefato à release do GitHub na tag `vX.Y.Z`. *Por que vale:* hoje não há caminho de entrega ao usuário final. *Esforço:* 🟡.
- **I14 (P2):** **Passe de arquivamento do backlog** — mover os itens **entregues (✅)** de **v0.16 → v2.1.0** para `BACKLOG-HISTORICO.md` e deixar em `BACKLOG.md` só o que está a fazer/parado, **resetando a convenção de corte para o ciclo v2** (a transição v0→v1→v2 deixou a regra "a cada 5 MINORs" defasada). *Saída:* histórico atualizado + cabeçalho do backlog com o novo recorte. *Esforço:* 🟢 (mecânico).

## UI / TBHPedia (P1/P3)

| # | Item | Notas |
|---|------|-------|
| U10 (P2) ✅ v1.1.0 | **Dashboard customizável** — flags para ligar/desligar widgets + seções colapsáveis, com layout persistido | Entregue: painel "Personalizar" + cabeçalhos colapsáveis; `dashboardWidgets.ts` + `DashboardLayout` persistido (`store`/IPC). JSON bruto desligado por padrão. |
| U11 (P2) ✅ v1.7.0 | **Itens na TBHPedia** com **filtro por status (bônus)** + **lista de seleção de bônus** (ex.: "+35 de armadura") | Entregue: seção **"Bônus de itens"** na TBHPedia (`ItemBonusExplorer`) — busca + filtro por tipo de modificador + faixas (min–max), consumindo o catálogo D4. Afixos por instância seguem pendentes (save). |
| U2 (P1) ✅ v0.20.0 | Aba de Farm (ouro/h, xp/h, melhores estágios, histórico) | Entregue: `Farm.tsx` + aba; medições F2/F3 + recomendação F4. (F1 segue bloqueado, mas a aba não depende dele) |
| U9 (P2) ✅ v0.17.0 | Aba **Atualizações** (patch notes/anúncios da Steam) | Entregue junto do N1 (`Updates.tsx` + aba na navegação) |
| U13 (P2) | **Save → Pedia (deep-links)** — do estado real abrir a entrada certa da TBHPedia | Payoff do W9: estágio atual → `StagesPedia`; herói ativo → `HeroesPedia`; pet → `PetsPedia`; runa → `RunesPedia`. Reaproveita o `PediaNav` (cross-links) já existente; só falta a ponte a partir dos cards do Dashboard/abas. *Esforço:* 🟡 |
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

> **Entregue na v2.1.0 (jun/2026):** fundação **W0+W1** (esquema canônico `docs/PEDIA-CORPUS.md` +
> pipeline `scripts/pedia/lib.cjs` + geradores `gen-pedia-*.cjs` → `Core/Data/pedia/*.json`),
> domínios **W2/W3/W5/W6** (heróis, runas, mapa/estágios/monstros, pets) **completos** e **W4/W7
> parciais** (efeitos de material e baús), e a UI **W9** (TBHPedia unificada: busca global, nav
> agrupada, cross-links, atribuição). Fonte primária: `taskbarherowiki.com` (JSON no payload RSC).
> **Pendentes:** itens-DB/afixos por instância (W4), Cubo/Soul Stones/mecânicas (W7) e **W8** (guias
> em prosa da `taskbarhero.wiki`, Remix — **deferido**).

- **W0 (P2) ✅ v2.1.0 — Levantamento + esquema canônico:** inventariar **o que cada uma das 5 wikis cobre**
  (heróis, pets, runas, itens, efeitos, estágios/farm, monstros, cubo, baús, soul stones, mecânicas,
  guias) e **como expõe os dados** (JSON/RSC estruturado vs. HTML; idiomas). Definir o **esquema
  canônico** da TBHPedia (tópico → entrada → campos/seções, com `source`, `sourceUrl`, `lang`,
  `fetchedAt`) e as **regras de conflito/autoridade** (qual wiki manda por domínio; PT-BR canônico;
  dedup/merge). Saída: doc de cobertura + tipos do corpus. *Esforço:* 🟡.
- **W1 (P2) ✅ v2.1.0 — Pipeline de ingestão reutilizável:** geradores no padrão `scripts/gen-pedia-*.cjs`
  (um por wiki/domínio) que **buscam, parseiam e normalizam** para o esquema do W0, com **cache do
  bruto + proveniência** e *rate limit*. *Entregue:* `scripts/pedia/lib.cjs` (extração do payload RSC
  do Next.js + parser de JSON balanceado) → corpus em `Core/Data/pedia/*.json`, carregado por `Catalog`.
  *Esforço:* 🔴 (parsing heterogêneo entre as fontes).
- **W2 (P2) ✅ v2.1.0 — Domínio Heróis (completo):** stats, árvore de habilidades, builds e descrições.
  *Entregue:* `gen-pedia-heroes.cjs` → `heroes.json` (6 heróis: stats base, ataque base e árvore
  passiva/ativa). *Esforço:* 🟡.
- **W3 (P2) ✅ v2.1.0 — Domínio Runas:** efeitos completos, valores por nível e custos. *Entregue:*
  `gen-pedia-runes.cjs` → `runes.json` (197 runas + 195 edges + 8 categorias). *Base:* R1 (v0.4.0). *Esforço:* 🟡.
- **W4 (P2) ✅ (parcial) v2.1.0 — Domínio Itens & Efeitos:** *Entregue:* domínio **Efeitos de material**
  (`gen-pedia-effects.cjs` → `effects.json`, 79 deco/gravação/inscrição com stat/slot/tier). *Pendente:*
  o **DB de itens** (5.934) não vem no SSR — segue pelo catálogo **D3/D4**; **afixos por instância** ainda
  dependem do save (ver D4/U11). *Esforço:* 🟡.
- **W5 (P2) ✅ v2.1.0 — Domínio Estágios/Farm/Monstros/Mapa:** *Entregue:* `gen-pedia-map.cjs` →
  `map.json` (120 estágios com **monstros**, **boss** e **drops**). *Sinergia:* F0/S5/S6 e G4. *Esforço:* 🟡.
- **W6 (P3) ✅ v2.1.0 — Domínio Pets/Mascotes:** catálogo completo + efeitos. *Entregue:* `gen-pedia-pets.cjs`
  → `pets.json` (8 pets: stats + desbloqueio/farm), como prova do pipeline. *Sinergia:* **PE1**. *Esforço:* 🟡.
- **W7 (P3) ✅ (parcial) v2.1.0 — Domínio Cubo, Baús, Soul Stones e mecânicas gerais:** *Entregue:* **Baús**
  (`gen-pedia-chests.cjs` → `chests.json`, 41 com pools/odds e onde aparecem). *Pendente:* Cubo/Soul Stones e
  mecânicas (Alchemy/Crafting/Decoration/Engraving/Inscription/Offering, fórmulas) — parte sai com o W8. *Esforço:* 🟡.
- **W8 (P3) ⛔ deferido — Guias & estratégias (prosa):** "Task Bar Hero 101" e guias de comunidade, como
  artigos navegáveis. *Deferido na v2.1.0:* fonte `taskbarhero.wiki` é **Remix** (estrutura distinta), conteúdo
  P3 em prosa, baixo valor relativo. Follow-up. *Esforço:* 🟡.
- **W9 (P2) ✅ v2.1.0 — TBHPedia unificada na UI:** *Entregue:* aba TBHPedia reconstruída com **busca global**,
  navegação agrupada (Wikis + Guia), **6 componentes de domínio**, **cross-links** (ex.: pet → estágio de farm)
  e **atribuição de fonte** ("atualizado em <data>"). *Pendente opcional:* ação "atualizar das wikis" em runtime.
  *Sinergia:* U6 (i18n). *Esforço:* 🟡–🔴.

## Épico V — Análise empírica de XP & ouro das fases

**Objetivo:** **entender a fundo** e **validar empiricamente** como o **XP** e o **ouro** funcionam
por fase — porque os números das wikis/datamine (F0/W5) **podem estar imprecisos**. Em vez de
confiar só no catálogo, **medir com o próprio save** (deltas entre leituras), **modelar** os
mecanismos (ouro/kill comum vs boss, XP/clear, multiplicadores, over-level, retenção) e **detalhar**
tudo em documentação. Se as fontes não baterem, **publicar uma wiki própria** explicando, com a
**proveniência das medições**.

> **Postura/segurança:** mesma do resto — leitura **passiva** do save (nada de tocar no jogo). Cruza
> com **F0** (catálogo de 108 fases), **F2/F3** (ouro/h e xp/h medidos), **G4** (ouro por kill),
> **F5** (projeção), **X1** (fluxo de XP), **W5** (corpus de monstros/HP) e os **contadores
> cumulativos** `aggregateSaveDatas[]` (ouro por ato, kills por monstro). *Esforço do épico:* 🔴 (grande, pesquisa).

- **V0 (P2) — Metodologia & instrumentação:** definir um **protocolo de coleta controlada** (fixar
  herói/nível e estágio; medir os **deltas de ouro/XP/kills por tempo**) registrando o **estado dos
  multiplicadores** (runas de Ouro/EXP, pets, Cubo, buffs) para **isolar variáveis**. Saída: captura
  de **amostras rotuladas** (estágio + estado + deltas) reutilizável pelas etapas seguintes.
- **V1 (P2) — Reconciliação catálogo × medido:** comparar `expectedGold`/`expectedEXP` (F0/wiki) com
  o **medido**; quantificar o **erro por fase/dificuldade**; separar **fatores sistemáticos**
  (multiplicador global de ouro/exp do jogador) de **erros do catálogo**. Saída: relatório de
  divergências + fatores de correção.
- **V2 (P2) — Modelo de ouro por kill (comum × boss):** derivar o **ouro base por abate** separando
  **monstro comum** e **boss** — desbloqueia o **G4**. Validar contra `aggregateSaveDatas` (ouro por
  ato) e contagem de kills.
- **V3 (P2) — Modelo de XP:** XP por **clear/kill**, **penalidade de over-level** e **retenção** —
  base do **F5** (projeção para fases não medidas).
- **V4 (P2) — Validação cruzada com contadores cumulativos:** usar `aggregateSaveDatas` (Type 2 =
  ouro por ato; Type 0 = kills por monstro) como **verdade-terreno exata** para calibrar/refutar as
  taxas derivadas de delta de snapshot.
- **V5 (P3) — Documentação & (opcional) nova wiki:** detalhar as **fórmulas/mecânicas** em
  `docs/TBHPEDIA.md`; se as fontes existentes não baterem, **publicar uma wiki própria** explicando
  XP/ouro das fases, citando as **medições** (proveniência + versão do jogo). Sinergia com **N2**
  (avisar quando o jogo atualizou e o catálogo/medições envelheceram).

## Bugs conhecidos (não corrigir agora — período de estabilidade)

- **BUG-1 — Runa-alvo aceita runa já no nível máximo (R3):** é possível clicar **"Definir como
  alvo"** numa runa que já está no **nível máximo** (`level >= node.MaxLevel`). Nesse caso não há
  ouro a faltar, então o card de runa-alvo no Dashboard fica sem sentido (alvo já 100%). *Onde:* o
  botão em `dotnet/TbhTracker.App/Components/Tabs/RuneTree.razor` (~linha 252) é renderizado sem
  checar `maxed`. *Correção futura:* esconder/desabilitar "Definir como alvo" quando a runa
  selecionada está no nível máximo (e, idealmente, validar também em `ToggleTarget`/`TrackerApi`).
  *Status:* anotado, **não corrigir agora**.

- **BUG-PET-ATIVO — detecção do pet equipado/ativo (PE1):** o widget de Pets trata o bônus como
  **não cumulativo** (só o ativo concede), mas o **campo do save que indica o pet equipado ainda não
  foi confirmado**. `SaveParser.ParsePets` tenta nomes prováveis (`equippedPetKey`/`arrangedPetKey`/
  `currentPetKey`/`selectedPetKey` no player/common, ou flag `IsEquip`/`Equipped`/`IsActive` por
  entrada em `PetSaveData`); se nenhum casar, **nenhum pet aparece como ativo** (★) e o "Bônus ativo"
  não é exibido. *A fazer:* inspecionar o JSON bruto de um save com pet equipado, identificar o campo
  e fixar a detecção (+ teste). *Status:* anotado, **corrigir depois**.

## Fora de escopo (regra de segurança)

- Qualquer leitura/escrita de memória do jogo.
- Injeção, hooks, automação de input, aceleração ou auto-clicker.
- Modificação do save.
- Enumerar/observar o processo do jogo para "forçar" comportamento.
