# TBH-Tracker — Backlog (focada nos pontos observáveis)

Cada item nasce de algo que conseguimos **observar no save** (ver `TBHPEDIA.md › Save`). Nada aqui depende de tocar no jogo. Prioridades: **P0** (fundação/MVP) · **P1** (valor de farm) · **P2** (qualidade de vida) · **P3** (extras).

> **Status:** ⬜ = pendente · ⛔ = parado/bloqueado · ✅ = entregue. Ao entregar um item, marcar `✅ vMAJOR.MINOR.PATCH` **no mesmo PR** do código (regra em `.cursor/rules/tbh-tracker.mdc`). Versionamento (SemVer) detalhado em `CHANGELOG.md`.
>
> **Arquivamento:** a cada 5 MINORs os itens entregues saem daqui e vão para `BACKLOG-HISTORICO.md`; aqui fica só o que está **a fazer/parado**. **Último corte: v2.3.0** — corte extra que **quitou a dívida** do ciclo v0→v2 (arquivados todos os ✅ de v0.16 → v2.3.0). Próximo corte regular: **v2.5.0**.
>
> **Outras visões:** `BACKLOG-ESFORCO.md` ranqueia os itens do mais fácil ao mais difícil de implementar (este arquivo segue sendo a fonte da verdade).

## Pontos observáveis → features

### Ouro (P1) — `CurrencySaveDatas` (key 100001)
- **G4 (P2):** **Calculadora de ouro por kill** — estima o ganho de ouro por abate aplicando os **bônus de ouro das runas** (categoria Ouro do catálogo) sobre o ouro base, com resultados **separados para monstro comum e boss**. *Observável:* `RuneSaveData[]` (níveis) + `runeTree.ts` (runas de ouro: efeito/valor por nível). *Dependência a criar:* ouro base por kill (comum vs boss) — **não há catálogo de estágios/monstros no projeto hoje** (só `stage.ts` com `decodeStage`); derivar por datamine (wiki "Monstros 61" ou gamedata do `tbh-farm`, no padrão dos `scripts/gen-*.cjs`) ou permitir entrada manual, registrando a origem do valor base. *Aproximação pronta (F0, v0.18.0):* `stageDataForRaw(raw)` dá `expectedGold` e `count` por fase → média de ouro por kill ≈ `expectedGold / count` (não separa comum vs boss). *Atualização (v2.1.0):* o corpus **W5 `map.json`** (120 estágios com **monstros/boss/drops**) é candidato a fornecer a base por kill que faltava — revalidar contra ele e/ou contra o **V2** do Épico V (ouro base comum × boss); G4 deixa de depender só de entrada manual.

### Estágio & progresso (P1/P2) — `CurrentStageKey`, `CurrentStageWave`, `MaxCompletedStage`
- **S4 (P2):** Sugerir próximo "push" com base no máx. concluído.

### Corridas & eficiência de farm (P1) — ouro + XP + kills (`aggregateSaveDatas` Type 0) + `CurrentStageWave`
- **F5 (P2):** Projeção para estágios ainda não medidos (modelo de tempo/retenção de XP). *Base pronta:* **F0 (v0.18.0)** traz HP total, EXP/clear e ouro/clear base por fase; com a penalidade de over-level (wiki) dá para extrapolar tempo/ganho a partir de poucas medições (F2).
- **F6 (P2):** **Comparar composições (comps) na medição de farm** — medir **qual formação rende mais ouro e mais XP**, atribuindo as taxas de farm à **composição ativa** além do estágio. *Observável:* `ArrangedHeroKeys` (formação) + os mesmos deltas de ouro/XP/tempo do **F2/F3** (`StageFarmTracker`). *A fazer:* adicionar uma **dimensão de comp** ao bucket do `StageFarmTracker` (assinatura ordenada dos heróis ativos) — ou um tracker irmão — acumulando ouro/h, XP/h, ouro/clear e XP/clear **por comp** (e idealmente por comp×estágio); UI na **Aba de Farm** comparando comps lado a lado (melhor ouro vs. melhor XP). *Anti-ruído:* descartar amostras quando a comp mudou entre leituras (igual à troca de estágio). *Sinergia:* F1/F2/F3 (infra de atribuição de deltas). *Esforço:* 🟡.
- **F7 (P2):** **Comparar árvores de skills por velocidade de clear** — medir **qual build (alocação da árvore de atributos) finaliza o estágio mais rápido**, atribuindo o **tempo médio por clear** (F1) à build ativa. *Observável:* `attributeSaveDatas[]` (alocação por herói → assinatura da build) + `secondsPerClear`/`clearsPerHour` do **F1**. *A fazer:* bucketar as medições de clear por **assinatura de build** (hash da alocação dos ativos), acumulando `secondsPerClear` por build (e por build×estágio) e exibindo o ranking "finaliza mais rápido" na **Aba de Farm**. *Anti-ruído:* a build muda raramente — fechar/abrir o bucket quando a assinatura mudar; exigir N clears mínimos por build para comparar. *Sinergia:* F1 (clears/tempo) + H12 (árvore de atributos). *Esforço:* 🟡.
- **F8 (P2):** **Botão para limpar as estatísticas de farm** — ação na **Aba de Farm** para **zerar** as medições acumuladas (ouro/h, XP/h, clears, tempo por clear) do `StageFarmTracker` e **apagar o histórico persistido** do namespace `stageFarm` (por save). *A fazer:* método `Reset()` no `StageFarmTracker` + limpeza do namespace no `HistoryStore`, exposto via `TrackerApi` e um botão (com confirmação) na aba. *Por que vale:* recomeçar a medição limpa ao trocar de estratégia/comp/build (sinergia direta com F6/F7). *Esforço:* 🟡 (🟢 se reaproveitar o `serialize`/`restore` existente).
- **F9 (P2):** **Tempo por clear em segundos** — exibir o **tempo médio por clear** (F1, `secondsPerClear`) sempre **em segundos** na **Aba de Farm** (hoje passa por `FmtDuration`, que vira min/h acima de 60s e perde a granularidade fina para comparar clears curtos). *A fazer:* mostrar o valor cru em `s` (ou `s` com 1 casa) ao lado/no lugar da duração formatada. *Esforço:* 🟢.

### Heróis (P1) — `HeroSaveDatas[]`, `ArrangedHeroKey`
- **H7 (P2):** Herói **líder** em destaque no card de ativos (pendência herdada de H1) — identificar/marcar o líder da formação quando observável no save.
- **H10 (P2):** **Modelo de stats do personagem** — ler/derivar **todos os status** de cada herói (não só o nível). *Por que é preciso modelar:* o save **não guarda os stats finais** — `heroSaveDatas[]` só tem `heroKey/HeroLevel/HeroExp/IsUnLock`; o jogo calcula os 9 atributos a partir de **base + nível + árvore de atributos + equipamento + runas + pets**. *Fontes (datamine `gamedata.js`):* `DB.heroes` (stats base nível 1: `AttackDamage`/`AttackSpeed`/`CastSpeed`/`CriticalChance`/`CriticalDamage`/`MaxHp`/`Armor`/`MovementSpeed`/`CooldownReduction` — já refletidos em `heroes.ts`); `DB.attributes` (132 nós; cada um aponta `val:nível` → `DB.statMods` com `st`/`mt`/min-max) cruzado com `attributeSaveDatas[]` (`Key,Level`) do save; `DB.gear` (afixos inerentes `inh`) + catálogo de bônus do **D4**; `runeTree.ts` (runas) e `DB.petStats` (pets). *A criar:* `src/shared/heroStats.ts` que agrega tudo aplicando as **regras de stacking** (FLAT vs ADDITIVE/percentual). **Pré-requisito do analisador de item (H11).** *Em aberto:* (a) **curva de crescimento por nível** — não está explícita em `DB.heroes` (verificar `DB.levels`/wiki); (b) ordem/forma de combinação dos modificadores (FLAT → ADDITIVE% → multiplicadores?); (c) afixos rolados por instância no save (mesma dúvida do D4). *Nota:* a **curva de XP por nível** já foi catalogada (`levels.json`, H14, v2.3.0); o que falta para H10/H13 é a **curva de crescimento de stats** por nível, distinta da de XP.
- **H11 (P2):** **Analisador de impacto de item** — mostrar **o que um item faz pelo personagem, com dados**: recalcula os stats do herói **com vs. sem** o item equipado e apresenta o **delta por atributo** (ex.: +12% dano, +35 armadura, variação de DPS). *Depende de H10* (modelo de stats) **e D4** (bônus do item). *Ideia de UI:* no detalhe do herói (H9) ou na aba Inventário, comparar o item candidato contra o atualmente equipado no slot. *Esforço:* 🔴 (depende do modelo completo de stats e dos afixos por instância).
- **H13 (P2):** **Stats atuais por herói na aba Heróis** — exibir os **status atuais** de cada herói: **status base do nível** + **bônus calculados** (árvore de atributos + equipamento + runas + pets). *Depende de H10* (modelo de stats; é o consumidor direto dele) e da **curva de crescimento por nível** (questão aberta do H10 — `DB.levels`/wiki). *Esforço:* 🔴 (preso no H10).
- **H15 (P2):** **Equipamento atual por herói (loadout)** — mostrar **o que cada herói tem equipado** (por slot), lendo os itens marcados como equipados em `itemSaveDatas[]` e classificando por tipo/raridade via D3. *Observável:* `itemSaveDatas[]` (slot/local "equipado") + catálogo `items.ts`/`itemData.ts` (D3) + bônus possíveis (D4). *Sinergia:* é a base de UI do **H11** (comparar item candidato vs. equipado no slot) e do **H10** (insumo de stats). *Em aberto:* confirmar no save real o vínculo item→herói→slot (qual campo amarra a instância ao herói/slot). *Esforço:* 🟡.

### Itens / drops (P2) — `itemSaveDatas[]`
- **D1 (P2):** Detectar drops novos por corrida (por `UniqueId`). *Base pronta:* catálogo `items.ts`/`itemData.ts` (D3) classifica cada `ItemKey` por tipo/raridade; falta a **fronteira de corrida individual**, que segue inviável pelo save (o F1, v1.2.0, entregou eficiência/clears estimados, mas não delimita cada corrida).
- **D6 (P2):** **Filtros do Inventário** — na **Aba Inventário**, buscar itens no **baú/inventário** por **status (bônus) desejado** (ex.: "+armadura", "+dano crítico") e filtrar por **raridade**. *Base pronta:* `itemSaveDatas[]` (D3, classifica tipo/raridade/local) + catálogo de bônus **D4** + o `ItemBonusExplorer` (U11) já lista os bônus possíveis. *Em aberto (mesma dúvida do D4/U11):* filtrar pelo **status rolado da instância** exige que o save exponha os **afixos por instância**; enquanto isso, o filtro por status opera pelos **bônus possíveis** por tipo/raridade. O filtro por **raridade** é direto (já temos `GRADES`). *Esforço:* 🟡 (raridade 🟢).
- **D7 (P2):** **Identificar craftings possíveis pelo inventário** — analisar os itens do **baú/inventário** (`itemSaveDatas[]`, classificados por D3) e cruzar com as **receitas de crafting** para listar **o que dá para fabricar agora** (e destacar receitas **quase-completas**, com o que falta). *Dependência a criar:* catálogo de **receitas** (entradas/quantidades e saída por craft) via gerador no padrão `gen-*.cjs` — confirmar a fonte (datamine `DB.*` de crafting/alchemy ou o corpus de **mecânicas do W7**, ainda pendente). *Sinergia:* **D5** (derretimento), **D6** (filtros) e **W7** (Crafting/Alchemy na pedia). *Esforço:* 🟡.
- **D8 (P2):** **Item-alvo: avisar quando cair no drop** — marcar um item como **alvo** (por `ItemKey`, à la R3 das runas) e **notificar quando uma nova instância aparecer** no save. *Observável:* **deltas de `itemSaveDatas[]`** entre leituras (novo `UniqueId` / aumento de contagem do `ItemKey` alvo) — **não depende da fronteira de corrida** (D1), só da detecção de item novo (mesmo padrão de eventos do `heroEvents`/`stageEvents`). *Sinergia:* seleção via **D3**, alerta nativo via **A3** (tray/notificação) e a infra de **eventos/histórico**; alvo persistido como o `runeTargetKey` (R3). *Em aberto:* granularidade do alvo (ItemKey específico × tipo+raridade × "qualquer Legendary+"). *Esforço:* 🟡.

### Runas (P2) — `RuneSaveData[]`
- **R2 (P2):** Gasto de ouro em runas para **calibrar ouro recuperado** (corridas com ouro negativo). *(Catálogo de custos já disponível em `runeTree.ts`; falta a detecção de upgrade + a calibração de ouro/h, que depende do agente de corridas.)*
- **R5 (P2):** **Progresso visual na árvore de Runas** — preencher o **fundo de cada nó** proporcionalmente ao **nível adquirido / máximo** (e/ou resumo por categoria), para bater o olho e ver o quanto já foi pego. *Base:* `RuneTree.razor` já desenha nós + níveis; falta o indicador de preenchimento. *Esforço:* 🟢–🟡.
- **R6 (P2):** **Runa-alvo: validar nível comprado e detalhar upgrades** — no card do Dashboard (R3), considerar o **nível já comprado** do alvo e **listar cada upgrade separadamente** (nível a nível: custo, acumulado e se **já dá para comprar agora**), para validar a próxima atualização. *Relaciona:* BUG-1 (não permitir alvo já no nível máximo). *Esforço:* 🟡.
- **R7 (P2):** **Destaque na árvore de Runas do stat selecionado** — ao escolher um stat no combobox "Estatísticas das Runas" (aba **Runas**), **realçar no mapa** os nós que concedem aquele stat (anel/glow nos nós correspondentes), para localizar visualmente onde investir. *Base:* `RuneTree.razor` já tem o `<select>` de stats (`statsCount`/`OnStatSelected`) e desenha os nós; falta propagar o stat selecionado para o render dos nós e aplicar o destaque (além do modal atual). *Sinergia:* R5 (indicador de preenchimento por nível). *Esforço:* 🟢.

### Cubo (P2) — `CubeSaveLevelData` (`Level`, `Exp`)
- **C3 (P2):** **Curva de XP do Cubo por nível** — calcular o **XP necessário por nível** do Cubo (e o **total acumulado**) e cruzar com `CubeLevel`/`CubeExp` do save para mostrar **XP até o próximo nível**, **% de progresso** e a **curva completa por nível**. *Base observável:* `cubeSaveLevelData` (`Level`/`Exp`) — já lido pelo `SaveParser` (`Snapshot.CubeLevel`/`CubeExp`). *Bloqueio de dados (verificado em jun/2026):* a curva de XP por nível do Cubo **não está** no `gamedata.js` do `tbh-farm` (a fonte dos geradores `gen-*.cjs`). As chaves de Cubo do datamine são só `itemCubeExp` (XP **por item** derretido) e `synthesis` (crafting) — **não há tabela de XP por nível**. As wikis da comunidade (`taskbarhero.wiki/cube`) expõem só **totais esparsos** (Lv1=0, Lv5=405, Lv10=4.955, … Lv100=234.760.055) e ferramentas de cálculo com a curva embutida num bundle JS (fora do nosso pipeline). *A fazer:* obter a curva completa de **100 níveis** de uma fonte confiável — datamine direto do jogo (tabela de nível do Cubo) **ou** observar/derivar via save real — e criar o catálogo `cube_levels.json` no padrão `gen-*.cjs`. *Sinergia:* com o **D5** (XP de Cubo por item derretido) dá para estimar **quanto gear derreter para chegar a um nível-alvo** do Cubo. *Esforço:* **🟡** (reclassificado de 🟢: a fonte de dados não está pronta).

### Sessão / atividade (P2) — `PlayTime`
- **A1 (P2):** Tempo de sessão e detecção ativo vs. parado (inferido por mudança do save — **não** enumerar processo).
- **A3 (P2):** **System tray + notificações nativas** — rodar minimizado na bandeja e **notificar fora da janela** nos eventos que já detectamos: baús transbordando (B2), level-up (H2), novo estágio máximo (S3) e runa-alvo já comprável (R3). *Base pronta:* todos esses eventos já existem no snapshot; falta só o `Tray` + `Notification` do Electron (com toggle por tipo, persistido no config) e janela "fechar = minimizar para a bandeja". *Por que vale:* é um tracker passivo que fica aberto em background — alertas só dentro da UI têm pouco alcance. *Esforço:* 🟡.

### Estatísticas acumuladas (P2) — `aggregateSaveDatas[]`
- **A4 (P2):** **Painel de estatísticas acumuladas (lifetime)** — expor na UI os **contadores cumulativos** que hoje só usamos internamente: **ouro ganho por ato** (`Type 2` → `SubKey 0` total, `1/2/3` por ato) e **kills por monstro** (`Type 0` → `SubKey 0` total). *Observável:* `aggregateSaveDatas[]` (já lido pelo `SaveParser`; ver `TBHPEDIA.md`). *Sinergia:* cruzar os kills por monstro com os **nomes/ícones do W5** (`map.json`); é a **verdade-terreno** do **V4** (Épico V). *Saída:* página/seção read-only (totais + top monstros por kills + ouro por ato). *Esforço:* 🟡.

### XP & nível (P2) — `HeroSaveDatas[].HeroExp`
- **X1 (P2):** **Fluxo de XP** no Dashboard — widget com **XP/h** por **janela móvel** (taxa + média), análogo ao **Fluxo de ouro** (G3), somando os **deltas de `HeroExp`** (Σ exp dos heróis) entre leituras. Mesmo anti-ruído do `GoldFlowTracker` (descartar deltas negativos/reset, exigir span mínimo). *Saída:* tracker no padrão `goldFlow` + card no Dashboard. **Base do X2.** *Esforço:* 🟡.
- **X2 (P2):** **ETA do próximo level-up (heróis ativos)** — a partir do **Fluxo de XP** (X1) e do **XP que falta** (H14, ✅ v2.3.0 — `Heroes.LevelProgress`), estimar a **média de tempo até o próximo level-up** de cada herói ativo, exibida no card de **Heróis ativos**. *Esforço:* 🟢–🟡 (depende de X1; o "XP que falta" do H14 já está pronto).

### Atualizações do jogo (P2) — fonte oficial (externo ao save)
- **N2 (P2):** **Detecção de patch / catálogo desatualizado** — avisar quando o jogo foi atualizado e os catálogos (datamine) podem estar velhos. *Sinais observáveis:* mudança da **chave ES3**/`GameAssembly` (já lidos pelo `keyFinder`), aparição de `ItemKey`/estágios **fora do catálogo** durante o parsing, ou versão nova na Steam News (N1). *Saída:* banner "o jogo atualizou — regenere os catálogos (`scripts/gen-*.cjs`)". Realiza o "extra pendente" do N1. *Esforço:* 🟡. *Atualização (v2.1.0):* incluir também o **frescor do corpus da pedia** (Épico W) — cada entrada guarda `fetchedAt`; avisar quando a coleta envelheceu vs. a versão do jogo e sugerir `npm run gen:pedia`.

### Recompensas offline (P3)
- **O1 (P3):** **Estimador de recompensa offline** — estimar ouro/loot acumulado enquanto o jogo esteve fechado. *Base observável:* `DB.offlineRewards` (datamine) + entradas `[OfflineReward]` no `Player.log` (leitura passiva de arquivo, mesma postura do save). *Esforço:* 🟡 (depende de modelar a taxa offline e de parsear o log).

## Aplicativo / engenharia (infra)
- **I11 (P3):** **Suporte Proton/Linux** — completar a localização do save/instalação no Linux (o `locator` já tem os caminhos base; é o pendente opcional herdado do K1). *Esforço:* 🟡.
- **I12 (P2):** **CI nos PRs (build + testes)** — GitHub Actions que roda `dotnet build` + `dotnet test` em todo PR com alvo `dev`, barrando regressão antes do merge humano. *Opcional:* um check que **falha se um PR de feature/fix não tocar `docs/BACKLOG.md`**, fazendo cumprir a regra "backlog acompanha o código" (`.cursor/rules`). *Sinergia:* protege os geradores/catálogos (I8). *Esforço:* 🟢–🟡.
- **I13 (P2):** **Empacotar/distribuir release** — produzir um artefato instalável do app .NET MAUI (MSIX assinado ou `.exe` **não-empacotado** `WindowsPackageType=None`, que já é a config atual) e documentar o passo a passo (versão de `ApplicationDisplayVersion` + tag + publish). Opcional: anexar o artefato à release do GitHub na tag `vX.Y.Z`. *Por que vale:* hoje não há caminho de entrega ao usuário final. *Esforço:* 🟡.

## UI / TBHPedia (P1/P3)

| # | Item | Notas |
|---|------|-------|
| U13 (P2) | **Save → Pedia (deep-links)** — do estado real abrir a entrada certa da TBHPedia | Payoff do W9: estágio atual → `StagesPedia`; herói ativo → `HeroesPedia`; pet → `PetsPedia`; runa → `RunesPedia`. Reaproveita o `PediaNav` (cross-links) já existente; só falta a ponte a partir dos cards do Dashboard/abas. *Esforço:* 🟡 |
| U4 (P2) | Eventos coloridos / log de atividade | Progress, gold, level-up, chest |
| U5 (P3) | Gráficos de sessão (ouro acumulado, taxa) | — |
| U6 (P3) | i18n PT/EN | Jogo já é multilíngue |

## Épico W — TBHPedia completa: ingerir 100% das 5 wikis

**Objetivo:** absorver **todo o conhecimento** das 5 wikis da comunidade (ver `FONTES.md`) e
fazer a **TBHPedia do app conter tudo isso**, navegável e cruzado com o que já lemos do save/datamine.
Fontes: **taskbarhero.wiki** (PT), **taskbarherowiki.com**, **taskbarhero.org**,
**task-bar-hero.wiki**, **taskbarhero.xyz**.

> **Postura/segurança:** leitura **passiva** de páginas **públicas** (mesma postura da Steam News, N1) —
> nada de tocar no jogo. Preferir **dados estruturados/espelhos** (ex.: payload RSC de
> `taskbarherowiki.com`; `tbh-farm` espelha `taskbarhero.wiki`) a *scraping* de HTML. Respeitar
> **ToS/rate limit** de cada site e **manter atribuição** (cada conteúdo guarda a fonte + data de
> coleta).

> **Fundação entregue na v2.1.0** (W0+W1) e domínios **W2/W3/W5/W6/W9** completos — arquivados em
> `BACKLOG-HISTORICO.md`. Aqui ficam só as **pendências** do épico.

- **W4 (P2) ⬜ (parte pendente):** **DB de itens & afixos por instância** — o domínio **Efeitos de material**
  já saiu (`effects.json`, v2.1.0); falta o **DB de itens** (5.934), que **não vem no SSR** (segue pelo
  catálogo **D3/D4**), e os **afixos rolados por instância**, que dependem do que o save expõe (ver D4/U11). *Esforço:* 🟡.
- **W7 (P3) ⬜ (parte pendente):** **Cubo, Soul Stones e mecânicas gerais** — os **Baús** já saíram
  (`chests.json`, v2.1.0); falta **Cubo/Soul Stones** e as **mecânicas** (Alchemy/Crafting/Decoration/
  Engraving/Inscription/Offering, fórmulas) — parte sai com o W8. *Sinergia:* C3 (curva do Cubo), D7 (receitas). *Esforço:* 🟡.
- **W8 (P3) ⛔ deferido — Guias & estratégias (prosa):** "Task Bar Hero 101" e guias de comunidade, como
  artigos navegáveis. *Deferido na v2.1.0:* fonte `taskbarhero.wiki` é **Remix** (estrutura distinta), conteúdo
  P3 em prosa, baixo valor relativo. Follow-up. *Esforço:* 🟡.

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
