# TBH-Tracker — Backlog (focada nos pontos observáveis)

Cada item nasce de algo que conseguimos **observar no save** (ver `TBHPEDIA.md › Save`). Nada aqui depende de tocar no jogo. Prioridades: **P0** (fundação/MVP) · **P1** (valor de farm) · **P2** (qualidade de vida) · **P3** (extras).

> **Status:** ⬜ = pendente · ⛔ = parado/bloqueado · ✅ = entregue. Ao entregar um item, marcar `✅ vMAJOR.MINOR.PATCH` **no mesmo PR** do código (regra em `.cursor/rules/tbh-tracker.mdc`). Versionamento (SemVer) detalhado em `CHANGELOG.md`.
>
> **Arquivamento:** a cada 5 MINORs os itens entregues saem daqui e vão para `BACKLOG-HISTORICO.md`; aqui fica só o que está **a fazer/parado**. **Último corte: v2.3.0** — corte extra que **quitou a dívida** do ciclo v0→v2 (arquivados todos os ✅ de v0.16 → v2.3.0). Próximo corte regular: **v2.5.0**.
>
> **Outras visões:** `BACKLOG-ESFORCO.md` ranqueia os itens do mais fácil ao mais difícil de implementar (este arquivo segue sendo a fonte da verdade).

## Pontos observáveis → features

### Ouro (P1) — `CurrencySaveDatas` (key 100001)
- **G4 (P2):** **Calculadora de ouro por kill** — estima o ganho de ouro por abate aplicando os **bônus de ouro das runas** (categoria Ouro do catálogo) sobre o ouro base, com resultados **separados para monstro comum e boss**. *Observável:* `RuneSaveData[]` (níveis) + `runeTree.ts` (runas de ouro: efeito/valor por nível). *Dependência a criar:* ouro base por kill (comum vs boss) — **não há catálogo de estágios/monstros no projeto hoje** (só `stage.ts` com `decodeStage`); derivar por datamine (wiki "Monstros 61" ou gamedata do `tbh-farm`, no padrão dos `scripts/gen-*.cjs`) ou permitir entrada manual, registrando a origem do valor base. *Aproximação pronta (F0, v0.18.0):* `stageDataForRaw(raw)` dá `expectedGold` e `count` por fase → média de ouro por kill ≈ `expectedGold / count` (não separa comum vs boss). *Atualização (v2.1.0):* o corpus **W5 `map.json`** (120 estágios com **monstros/boss/drops**) é candidato a fornecer a base por kill que faltava — revalidar contra ele (ouro base comum × boss); G4 deixa de depender só de entrada manual.

### Estágio & progresso (P1/P2) — `CurrentStageKey`, `CurrentStageWave`, `MaxCompletedStage`
- **S4 (P2):** Sugerir próximo "push" com base no máx. concluído.

### Corridas & eficiência de farm (P1) — ouro + XP + kills (`aggregateSaveDatas` Type 0) + `CurrentStageWave`
- **F6 (P2):** **Comparar composições (comps) na medição de farm** — medir **qual formação rende mais ouro e mais XP**, atribuindo as taxas de farm à **composição ativa** além do estágio. *Observável:* `ArrangedHeroKeys` (formação) + os mesmos deltas de ouro/XP/tempo do **F2/F3** (`StageFarmTracker`). *A fazer:* adicionar uma **dimensão de comp** ao bucket do `StageFarmTracker` (assinatura ordenada dos heróis ativos) — ou um tracker irmão — acumulando ouro/h, XP/h, ouro/clear e XP/clear **por comp** (e idealmente por comp×estágio); UI na **Aba de Farm** comparando comps lado a lado (melhor ouro vs. melhor XP). *Anti-ruído:* descartar amostras quando a comp mudou entre leituras (igual à troca de estágio). *Sinergia:* F1/F2/F3 (infra de atribuição de deltas). *Esforço:* 🟡.
- **F7 (P2):** **Comparar árvores de skills por velocidade de clear** — medir **qual build (alocação da árvore de atributos) finaliza o estágio mais rápido**, atribuindo o **tempo médio por clear** (F1) à build ativa. *Observável:* `attributeSaveDatas[]` (alocação por herói → assinatura da build) + `secondsPerClear`/`clearsPerHour` do **F1**. *A fazer:* bucketar as medições de clear por **assinatura de build** (hash da alocação dos ativos), acumulando `secondsPerClear` por build (e por build×estágio) e exibindo o ranking "finaliza mais rápido" na **Aba de Farm**. *Anti-ruído:* a build muda raramente — fechar/abrir o bucket quando a assinatura mudar; exigir N clears mínimos por build para comparar. *Sinergia:* F1 (clears/tempo) + H12 (árvore de atributos). *Esforço:* 🟡.
### Heróis (P1) — `HeroSaveDatas[]`, `ArrangedHeroKey`
- **H10 (P2):** **Modelo de stats do personagem** — ler/derivar **todos os status** de cada herói (não só o nível). *Por que é preciso modelar:* o save **não guarda os stats finais** — `heroSaveDatas[]` só tem `heroKey/HeroLevel/HeroExp/IsUnLock`; o jogo calcula os 9 atributos a partir de **base + nível + árvore de atributos + equipamento + runas + pets**. *Fontes (datamine `gamedata.js`):* `DB.heroes` (stats base nível 1: `AttackDamage`/`AttackSpeed`/`CastSpeed`/`CriticalChance`/`CriticalDamage`/`MaxHp`/`Armor`/`MovementSpeed`/`CooldownReduction` — já refletidos em `heroes.ts`); `DB.attributes` (132 nós; cada um aponta `val:nível` → `DB.statMods` com `st`/`mt`/min-max) cruzado com `attributeSaveDatas[]` (`Key,Level`) do save; `DB.gear` (afixos inerentes `inh`) + catálogo de bônus do **D4**; `runeTree.ts` (runas) e `DB.petStats` (pets). *A criar:* `src/shared/heroStats.ts` que agrega tudo aplicando as **regras de stacking** (FLAT vs ADDITIVE/percentual). **Pré-requisito do analisador de item (H11).** *Em aberto:* (a) **curva de crescimento por nível** — não está explícita em `DB.heroes` (verificar `DB.levels`/wiki); (b) ordem/forma de combinação dos modificadores (FLAT → ADDITIVE% → multiplicadores?); (c) afixos rolados por instância no save (mesma dúvida do D4). *Nota:* a **curva de XP por nível** já foi catalogada (`levels.json`, H14, v2.3.0); o que falta para H10/H13 é a **curva de crescimento de stats** por nível, distinta da de XP.
- **H11 (P2):** **Analisador de impacto de item** — mostrar **o que um item faz pelo personagem, com dados**: recalcula os stats do herói **com vs. sem** o item equipado e apresenta o **delta por atributo** (ex.: +12% dano, +35 armadura, variação de DPS). *Depende de H10* (modelo de stats) **e D4** (bônus do item). *Ideia de UI:* no detalhe do herói (H9) ou na aba Inventário, comparar o item candidato contra o atualmente equipado no slot. *Esforço:* 🔴 (depende do modelo completo de stats e dos afixos por instância).
- **H13 (P2):** **Stats atuais por herói na aba Heróis** — exibir os **status atuais** de cada herói: **status base do nível** + **bônus calculados** (árvore de atributos + equipamento + runas + pets). *Depende de H10* (modelo de stats; é o consumidor direto dele) e da **curva de crescimento por nível** (questão aberta do H10 — `DB.levels`/wiki). *Esforço:* 🔴 (preso no H10).
- **H15 (P2):** **Equipamento atual por herói (loadout)** — mostrar **o que cada herói tem equipado** (por slot), lendo os itens marcados como equipados em `itemSaveDatas[]` e classificando por tipo/raridade via D3. *Observável:* `itemSaveDatas[]` (slot/local "equipado") + catálogo `items.ts`/`itemData.ts` (D3) + bônus possíveis (D4). *Sinergia:* é a base de UI do **H11** (comparar item candidato vs. equipado no slot) e do **H10** (insumo de stats). *Em aberto:* confirmar no save real o vínculo item→herói→slot (qual campo amarra a instância ao herói/slot). *Esforço:* 🟡.
- **H16 (P2):** **Snapshot de heróis por sessão/período** — registrar e navegar o **estado dos heróis ao longo do tempo** (nível, XP, formação ativa) por sessão/janela — versão **passiva** do "hero snapshot per run" do `tbh-meter` (I15). *Observável:* `heroSaveDatas[]` + `ArrangedHeroKeys` no histórico de snapshots. *Fora de escopo (por ora):* itens/mods/**stats** equipados — dependem do modelo de stats (**H10**), dos afixos por instância e do loadout (**H15**). *Sinergia:* H2 (level-ups) e A5 (sessões). *Esforço:* 🟡.

### Itens / drops (P2) — `itemSaveDatas[]`
- **D1 (P2):** Detectar drops novos por corrida (por `UniqueId`). *Base pronta:* catálogo `items.ts`/`itemData.ts` (D3) classifica cada `ItemKey` por tipo/raridade; falta a **fronteira de corrida individual**, que segue inviável pelo save (o F1, v1.2.0, entregou eficiência/clears estimados, mas não delimita cada corrida).
- **D6 (P2):** **Filtros do Inventário** — na **Aba Inventário**, buscar itens no **baú/inventário** por **status (bônus) desejado** (ex.: "+armadura", "+dano crítico") e filtrar por **raridade**. *Base pronta:* `itemSaveDatas[]` (D3, classifica tipo/raridade/local) + catálogo de bônus **D4** + o `ItemBonusExplorer` (U11) já lista os bônus possíveis. *Em aberto (mesma dúvida do D4/U11):* filtrar pelo **status rolado da instância** exige que o save exponha os **afixos por instância**; enquanto isso, o filtro por status opera pelos **bônus possíveis** por tipo/raridade. O filtro por **raridade** é direto (já temos `GRADES`). *Esforço:* 🟡 (raridade 🟢).
- **D7 (P2):** **Identificar craftings possíveis pelo inventário** — analisar os itens do **baú/inventário** (`itemSaveDatas[]`, classificados por D3) e cruzar com as **receitas de crafting** para listar **o que dá para fabricar agora** (e destacar receitas **quase-completas**, com o que falta). *Dependência a criar:* catálogo de **receitas** (entradas/quantidades e saída por craft) via gerador no padrão `gen-*.cjs` — confirmar a fonte (datamine `DB.*` de crafting/alchemy ou o corpus de **mecânicas do W7**, ainda pendente). *Sinergia:* **D5** (derretimento), **D6** (filtros), **W7** (Crafting/Alchemy na pedia) e **C4** (a aba Crafting já existe — falta cruzar as receitas com o inventário). *Esforço:* 🟡.
- **D8 (P2):** **Item-alvo: avisar quando cair no drop** — marcar um item como **alvo** (por `ItemKey`, à la R3 das runas) e **notificar quando uma nova instância aparecer** no save. *Observável:* **deltas de `itemSaveDatas[]`** entre leituras (novo `UniqueId` / aumento de contagem do `ItemKey` alvo) — **não depende da fronteira de corrida** (D1), só da detecção de item novo (mesmo padrão de eventos do `heroEvents`/`stageEvents`). *Sinergia:* seleção via **D3**, alerta nativo via **A3** (tray/notificação) e a infra de **eventos/histórico**; alvo persistido como o `runeTargetKey` (R3). *Em aberto:* granularidade do alvo (ItemKey específico × tipo+raridade × "qualquer Legendary+"). *Esforço:* 🟡.
- **D9 (P2): ✅ v2.6.0** — **Contador de Soul Stones no Dashboard** — widget que mostra **quantas Soul Stones** há de **cada tipo** (**Normal/Nightmare/Hell/Torment**), somando **baú (stash) + inventário**. *Observável:* `itemSaveDatas[]` (cada Soul Stone é uma instância, sem `Quantity`) + mapa de slots (`BuildItemLocationMap`) para a localização. *Chaves confirmadas* via drops dos bosses X-10 na `pedia/map.json`: `190001` Normal · `190002` Nightmare · `190003` Hell · `190004` Torment (catálogo `SoulStones.cs`). *Entregue:* modelo `SoulStoneCount` + `Snapshot.SoulStones`, `SaveParser.ParseSoulStones`, `WidgetIds.SoulStones`, render `RenderSoulStones` e `dashboardWidgets.json`. *Sinergia:* mapeamento das chaves alimenta a parte de **Soul Stones** do W7 (pedia).

### Runas (P2) — `RuneSaveData[]`
- **R2 (P2):** Gasto de ouro em runas para **calibrar ouro recuperado** (corridas com ouro negativo). *(Catálogo de custos já disponível em `runeTree.ts`; falta a detecção de upgrade + a calibração de ouro/h, que depende do agente de corridas.)*
- **R6 (P2):** **Runa-alvo: validar nível comprado e detalhar upgrades** — no card do Dashboard (R3), considerar o **nível já comprado** do alvo e **listar cada upgrade separadamente** (nível a nível: custo, acumulado e se **já dá para comprar agora**), para validar a próxima atualização. *Relaciona:* BUG-1 (não permitir alvo já no nível máximo). *Esforço:* 🟡.
- **R7 (P2): ✅ v2.5.0** — **Destaque na árvore de Runas do stat selecionado** — ao escolher um stat no combobox "Estatísticas das Runas" (aba **Runas**), os nós que concedem aquele stat ganham um **anel/glow pulsante** no mapa, para localizar visualmente onde investir (além do modal de detalhes, que segue abrindo). *Implementação:* `RuneTree.razor` guarda o stat realçado (`_highlightStat`, definido no `OnStatSelected` e independente do modal) e desenha um anel SVG (`rune-node__hl`) com animação CSS nos nós cujo `Stat` casa; "Selecione um stat..." limpa o destaque. *Esforço:* 🟢.

### Cubo (P2) — `CubeSaveLevelData` (`Level`, `Exp`)
- **C4 (P2): ✅ v2.7.0** — **Aba Crafting: listar as operações de receita do Cubo** — nova aba **Crafting** (após Inventário) listando as **8 operações** do Cubo (Síntese, Alquimia, Fabricação, Decoração, Extração, Gravação, Oferenda, Inscrição) com nome/descrição e **requisito de Cubo**, marcando as **disponíveis** pelo `CubeLevel` do save + a regra de **síntese 9→1**. *Observável:* `cubeRecipeSaveDatas` (por linha: `CubeKey` + `MaxUnlockRecipeKey`). *Fonte do catálogo:* mapeamento `CubeKey`→operação/nome/requisito confirmado pela tabela **Cube Recipes** (`taskbarhero.wiki/database/cube_recipes`) + página do Cubo. *Limite (verificado jun/2026):* o **detalhe por receita** (ingredientes→resultado) **não vem em nenhuma fonte pública** — só a operação e o progresso de desbloqueio. *Entregue:* `CubeRecipes.cs` (catálogo), `CubeRecipeState` + `Snapshot.CubeRecipes`, `SaveParser.ParseCubeRecipes`, `Crafting.razor` + tab no `Shell.razor`. *Sinergia:* base da aba para o **D7** (craftings possíveis pelo inventário) e o **W7** (mecânicas na pedia).
- **C3 (P2):** **Curva de XP do Cubo por nível** — calcular o **XP necessário por nível** do Cubo (e o **total acumulado**) e cruzar com `CubeLevel`/`CubeExp` do save para mostrar **XP até o próximo nível**, **% de progresso** e a **curva completa por nível**. *Base observável:* `cubeSaveLevelData` (`Level`/`Exp`) — já lido pelo `SaveParser` (`Snapshot.CubeLevel`/`CubeExp`). *Bloqueio de dados (verificado em jun/2026):* a curva de XP por nível do Cubo **não está** no `gamedata.js` do `tbh-farm` (a fonte dos geradores `gen-*.cjs`). As chaves de Cubo do datamine são só `itemCubeExp` (XP **por item** derretido) e `synthesis` (crafting) — **não há tabela de XP por nível**. As wikis da comunidade (`taskbarhero.wiki/cube`) expõem só **totais esparsos** (Lv1=0, Lv5=405, Lv10=4.955, … Lv100=234.760.055) e ferramentas de cálculo com a curva embutida num bundle JS (fora do nosso pipeline). *A fazer:* obter a curva completa de **100 níveis** de uma fonte confiável — datamine direto do jogo (tabela de nível do Cubo) **ou** observar/derivar via save real — e criar o catálogo `cube_levels.json` no padrão `gen-*.cjs`. *Sinergia:* com o **D5** (XP de Cubo por item derretido) dá para estimar **quanto gear derreter para chegar a um nível-alvo** do Cubo. *Esforço:* **🟡** (reclassificado de 🟢: a fonte de dados não está pronta).

### Sessão / atividade (P2) — `PlayTime`
- **A5 (P2):** **Agrupamento por sessão** — agrupar a atividade em **sessões de jogo** (separadas por lacunas no `PlayTime`/`CapturedAt` ou pelo heartbeat parado) e resumir cada sessão (ouro ganho, XP, tempo ativo, clears estimados). *Inspirado no* "session grouping" do `tbh-meter` (I15). *Observável:* `PlayTime` + histórico de snapshots (deltas, à la F2/F3). *Saída:* lista de sessões com totais (e ponte para X1/G3/F1). *Sinergia:* X1 (fluxo de XP), F1 (clears) e H16 (snapshot de heróis por sessão). *Esforço:* 🟡.
- **A3 (P2):** ✅ v2.4.0 — **System tray + notificações nativas** — roda minimizado na bandeja e **notifica fora da janela** nos eventos que já detectamos: baús transbordando (B2), level-up (H2), novo estágio máximo (S3) e runa-alvo já comprável (R3). Toggles **por tipo** + "fechar = minimizar para a bandeja", persistidos no `ConfigStore` e ajustáveis na nova aba **Configurações**. *Implementação:* toasts nativos via **Windows App SDK** (`AppNotificationManager`/`AppNotificationBuilder`, com registro de **AppUserModelID** por o app ser unpackaged) e ícone na bandeja via Win32 `Shell_NotifyIcon` (sem dependência externa). H2/S3 já vêm como eventos no snapshot; **B2 e R3 não são eventos** — usam **detecção de transição** entre leituras (`NotificationDetector`, lógica pura testável em `Core`) disparada pelo `NotificationService` (assina `Tracker.OnState`, dedup por `CapturedAt`). *Por que vale:* é um tracker passivo que fica aberto em background — alertas só dentro da UI têm pouco alcance.

### XP & nível (P2) — `HeroSaveDatas[].HeroExp`
- **X1 (P2):** **Fluxo de XP** no Dashboard — widget com **XP/h** por **janela móvel** (taxa + média), análogo ao **Fluxo de ouro** (G3), somando os **deltas de `HeroExp`** (Σ exp dos heróis) entre leituras. Mesmo anti-ruído do `GoldFlowTracker` (descartar deltas negativos/reset, exigir span mínimo). *Saída:* tracker no padrão `goldFlow` + card no Dashboard. **Base do X2.** *Esforço:* 🟡.
- **X2 (P2):** **ETA do próximo level-up (heróis ativos)** — a partir do **Fluxo de XP** (X1) e do **XP que falta** (H14, ✅ v2.3.0 — `Heroes.LevelProgress`), estimar a **média de tempo até o próximo level-up** de cada herói ativo, exibida no card de **Heróis ativos**. *Esforço:* 🟢–🟡 (depende de X1; o "XP que falta" do H14 já está pronto).

## Aplicativo / engenharia (infra)
- **I11 (P3):** **Suporte Proton/Linux** — completar a localização do save/instalação no Linux (o `locator` já tem os caminhos base; é o pendente opcional herdado do K1). *Esforço:* 🟡.
- **I12 (P2):** **CI nos PRs (build + testes)** — GitHub Actions que roda `dotnet build` + `dotnet test` em todo PR com alvo `dev`, barrando regressão antes do merge humano. *Opcional:* um check que **falha se um PR de feature/fix não tocar `docs/BACKLOG.md`**, fazendo cumprir a regra "backlog acompanha o código" (`.cursor/rules`). *Sinergia:* protege os geradores/catálogos (I8). *Esforço:* 🟢–🟡.
- **I13 (P2):** **Empacotar/distribuir release** — produzir um artefato instalável do app .NET MAUI (MSIX assinado ou `.exe` **não-empacotado** `WindowsPackageType=None`, que já é a config atual) e documentar o passo a passo (versão de `ApplicationDisplayVersion` + tag + publish). Opcional: anexar o artefato à release do GitHub na tag `vX.Y.Z`. *Por que vale:* hoje não há caminho de entrega ao usuário final. *Esforço:* 🟡.
- **I16 (P3):** **Auto-update do app** — verificar **nova release no GitHub** (na inicialização + periodicamente) e oferecer **baixar/instalar e reiniciar**, como faz o `tbh-meter` (checa na abertura + a cada 6h, baixa em background, propõe *Restart to update*). Visto na revisão **I15**. *Sinergia/pré-requisito:* **I13** (empacotar/distribuir release — precisa de artefato versionado + releases na tag `vX.Y.Z`). *Em aberto:* mecanismo de update para app **MAUI não-empacotado** (`WindowsPackageType=None`). *Esforço:* 🟡.
- **I15 (P3):** **Validar features contra o `tbh-meter` (referência)** — revisar periodicamente o **`mad-labs-org/tbh-meter`** (ver `FONTES.md`) como **benchmark de features/UX** e abrir itens para o que valer a pena trazer ao TBH-Tracker **dentro da nossa postura passiva**. ⚠️ **Filtro de escopo:** o tbh-meter lê **memória do jogo** (proibido aqui — ver "Fora de escopo"); **descartar** o que dependa de **DPS/dano ao vivo** ou da **fronteira exata de corrida** (D1, inviável pelo save). *Esforço:* 🟢 (revisão).
  - **1ª revisão (jun/2026):** recursos do meter cruzados → overlay always-on-top (MODE/STAGE/DPS/DANO/MOBS/TEMPO), rastreador de corridas (resultado success/fail/abandoned + ouro/XP por segundo + histórico), **agrupamento por sessão**, **snapshot de heróis por corrida** (classe/nível/itens/mods/skills/stats), **auto-update** e **leaderboard**.
    - **Já cobertos:** ouro/s e XP/s (G3 ✅ / X1), estágio/ato (Dashboard), kills por monstro (`aggregateSaveDatas`).
    - **Itens novos gerados:** **U14** (overlay compacto always-on-top), **A5** (agrupamento por sessão), **H16** (snapshot de heróis por sessão/período), **I16** (auto-update do app).
    - **Descartados (fora de escopo):** DPS/dano ao vivo (lê memória), **resultado por corrida** success/fail/abandoned (depende da fronteira de corrida = **D1**, inviável pelo save) e **leaderboard/upload** (conta + envio de dados — fora da postura **local/passiva**).

## UI / TBHPedia (P1/P3)

| # | Item | Notas |
|---|------|-------|
| U13 (P2) | **Save → Pedia (deep-links)** — do estado real abrir a entrada certa da TBHPedia | Payoff do W9: estágio atual → `StagesPedia`; herói ativo → `HeroesPedia`; pet → `PetsPedia`; runa → `RunesPedia`. Reaproveita o `PediaNav` (cross-links) já existente; só falta a ponte a partir dos cards do Dashboard/abas. *Esforço:* 🟡 |
| U14 (P2) | **Overlay compacto always-on-top** — mini-janela sempre-no-topo com estágio/dificuldade, ouro/h (G3), XP/h (X1) e tempo de sessão | UX inspirada no overlay do `tbh-meter` (I15), porém **passiva**: **sem DPS/dano ao vivo** (memória, fora de escopo). Sinergia A5 (tempo de sessão). *Esforço:* 🟡 |
| U4 (P2) | Eventos coloridos / log de atividade | Progress, gold, level-up, chest |
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
  Engraving/Inscription/Offering, fórmulas) — parte sai com o W8. *Atualização (v2.6.0):* as **chaves de item
  das Soul Stones** já estão mapeadas (`190001`-`190004`, via **D9**); falta só o conteúdo de **pedia** (descrição/
  mecânica de uso e o **Cubo**). *Sinergia:* C3 (curva do Cubo), D7 (receitas), D9 (chaves das Soul Stones). *Esforço:* 🟡.
- **W8 (P3) ⛔ deferido — Guias & estratégias (prosa):** "Task Bar Hero 101" e guias de comunidade, como
  artigos navegáveis. *Deferido na v2.1.0:* fonte `taskbarhero.wiki` é **Remix** (estrutura distinta), conteúdo
  P3 em prosa, baixo valor relativo. Follow-up. *Esforço:* 🟡.

## Bugs conhecidos (não corrigir agora — período de estabilidade)

- **BUG-1 — Runa-alvo aceita runa já no nível máximo (R3):** ✅ **corrigido** (pendente de stamp de
  versão `PATCH` na PR/release) — era possível clicar **"Definir como alvo"** numa runa já no
  **nível máximo** (`level >= node.MaxLevel`), deixando o card de runa-alvo no Dashboard sem sentido
  (alvo já 100%). *Correção:* em `RuneTree.razor`, quando a runa selecionada está no máximo o botão
  vira **"Já no nível máximo"** (desabilitado) com aviso, em vez de "Definir como alvo"; além disso
  `ToggleTarget` passou a **bloquear** a definição de alvo de runa no máximo (defesa em profundidade;
  remover alvo continua sempre permitido). *Possível evolução:* validar também na camada
  `TrackerApi`/`ConfigStore.SetRuneTarget` (hoje a guarda é no componente).

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
