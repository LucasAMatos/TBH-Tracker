# Changelog — TBH-Tracker

## Esquema de versão

**SemVer `MAJOR.MINOR.PATCH`** (a partir da v1.0.0):

- **MAJOR** — marco/release significativo (decisão manual).
- **MINOR** — incrementa a cada **nova implementação** (feature). Ao subir MINOR, PATCH zera.
- **PATCH** — incrementa a cada **fix** (correção/ajuste).

Exemplos: `v1.0.0` → nova feature → `v1.1.0`; `v1.1.0` → correção → `v1.1.1`.

> **Transição (19/06/2026):** todo o desenvolvimento anterior foi o **ciclo v0**. O antigo formato
> `va.b` equivale a **`v0.a.b`** (ex.: o antigo `v20.0` = `v0.20.0`; um fix `v7.1` = `v0.7.1`) —
> a numeração de MINOR/PATCH que já usávamos é mantida, só sob o MAJOR `0`. A partir de agora
> consolidamos tudo em **v1.0.0** (primeiro release maior) e seguimos SemVer. As entradas abaixo
> (de `v20.0` para baixo) são o histórico do ciclo v0, mantidas como estão.
>
> No `package.json` a versão é o SemVer completo (`major.minor.patch`); o app exibe `vMAJOR.MINOR.PATCH`.
> Cada versão tem uma tag git (`vX.Y.Z`).

---

## v1.8.0 — Pets no Dashboard: desbloqueio + bônus ativos (PE1)

### Adicionado
- **Catálogo de pets (PE1):** novo gerador `scripts/gen-pets.cjs` → `src/shared/petData.ts`
  (8 pets) com **nome pt-BR**, **condição de desbloqueio** (`KillMonster`/`DLC`) + `param1`, e os
  **efeitos** (`{st, mt, v}`, com `st` referenciando o catálogo de status do D4).
- **Leitura do save:** o parser agora lê `PetSaveData[]` (`PetKey`/`IsUnlock`) → `snapshot.pets`
  (`PetSnapshot[]`).
- **Helper `src/shared/pets.ts`:** `petEffectLines` (efeitos formatados via `formatStatLine` do D4),
  `petUnlockLabel` e `petById`.
- **Widget "Pets" no Dashboard (U10):** mostra **desbloqueados/total**, o **bônus do pet ativo**
  (equipado) e a lista dos 8 pets (estado bloqueado/desbloqueado/ativo + efeitos + como obter).
  Liga/desliga e colapsável como os demais widgets.
- **Testes:** `test/pets.test.ts` (catálogo, formatação) — suíte sobe para 69.

### Notas
- O bônus de pets **não é cumulativo**: apenas o pet **ativo/equipado** concede seu efeito (correção
  da hipótese inicial de soma). O parser tenta detectar o pet ativo no save de forma tolerante
  (flag de equipado por entrada e/ou chave de pet equipado) — o campo exato do save ainda está
  sendo confirmado; sem ele, a lista ainda mostra o bônus de cada pet e a regra de "só o ativo".

---

## v1.7.0 — Bônus de itens na TBHPedia: busca + filtro por status (U11)

### Adicionado
- **Seção "Bônus de itens" na TBHPedia (U11):** novo componente
  `src/renderer/src/components/ItemBonusExplorer.tsx`, ligado por uma flag `custom: 'itemBonus'`
  no modelo de seção (`PediaSection`). É a **lista de seleção dos bônus** que itens podem conceder:
  - lista os 117 status do catálogo D4 com **nome pt-BR** e a **linha renderizada com a faixa**
    (ex.: `Armadura +min–max`), o **tipo de modificador** (fixo/percentual) e o **tier** do afixo;
  - **busca** por status + **filtro por tipo de modificador** (Todos / Fixo / Percentual) + contagem;
  - resumo de **slots de afixo por raridade** (chips coloridos por grade).
- Consome o catálogo D4 (`STAT_LIST`, `statLine`, `statRange`, `modsForStat`, `affixRep`,
  `gradeSlotTotal`) — **sem dependência do save**.

### Notas
- Escopo entregue = **bônus possíveis** (catálogo). Mostrar os **afixos rolados por instância** dos
  itens que o jogador possui depende de `itemSaveDatas[]` expor esses afixos no save (a verificar
  contra save real — ver D4); enquanto isso, a referência fica pelo catálogo.

---

## v1.6.0 — Catálogo de bônus/atributos de itens (D4)

### Adicionado
- **Catálogo de bônus de itens (D4):** novo gerador `scripts/gen-stats.cjs` → `src/shared/statData.ts`
  a partir do datamine (`gamedata.js` do tbh-farm), com:
  - **`STAT_STRINGS`** — 117 tipos de status com **nome e linha pt-BR** (template `+{0}`,
    ex.: `"Armadura +{0}"`).
  - **`STAT_MODS`** — 620 modificadores rolaveis por `chave:nível` (`FLAT`/`ADDITIVE` + min/max).
  - **`AFFIX_REP`** — representação/orçamento de afixo por status (57).
  - **`GRADE_SLOTS`** — nº de slots de afixo por raridade.
- **Helper `src/shared/stats.ts`:** `STAT_LIST` (lista para seleção, ordenada por nome),
  `formatStatLine` (ex.: `formatStatLine('Armor', 35)` → "Armadura +35"), `statName`/`statLine`,
  `modsForStat`/`statRange` (faixas de valor) e `gradeSlotTotal`/`gradeSlotsFor`.
- **Testes:** `test/stats.test.ts` (catálogo, formatação, faixas, slots) — suíte sobe para 64.

### Notas
- **Foundation, sem UI:** é a base do **U11** (itens na TBHPedia + filtro/seleção por status).
- Em aberto (no U11): se `itemSaveDatas[]` guarda os afixos **rolados por instância** ou se
  mostramos só os **bônus possíveis** por tipo/raridade. O `gear` base fica para o modelo H10.

## v1.5.0 — Raridade do inventário no Dashboard + destaque Legendary+ (D2)

### Adicionado
- **Widget "Raridade do inventário" (D2):** novo widget no Dashboard (fora da aba Inventário)
  com **destaque do total Legendary+** (vendável no Market) e a **distribuição compacta por
  raridade** em chips coloridos, reaproveitando o catálogo de raridade (`classifyItem`/`GRADES`).
  Liga/desliga e recolhe como os demais (U10); ligado por padrão.

### Notas / limitações
- O destaque é sobre o **inventário atual** (snapshot). Destacar drops por **corrida individual**
  continua dependente da fronteira de corrida (D1), inviável pelo formato do save.

## v1.4.0 — Suíte de testes (vitest) para a lógica pura (I8)

### Adicionado
- **Testes automatizados (I8):** **53 testes** (vitest) cobrindo a lógica pura sensível a patch,
  em `test/` — rode com `npm test` (ou `npm run test:watch`):
  - **Estágios:** `decodeStage`, `rankStages`, `stagesByDifficulty`, `stageProgress` (S6),
    `levelAdvice` (S5).
  - **Baús:** `classifyBoxBacklog`, `boxDrainSeconds`, `normalizeBoxThresholds`, `kindFromTypeValue`.
  - **Itens:** `classifyItem` (incl. chave desconhecida).
  - **Runas:** `planRuneTarget`, `summarizeRunes`.
  - **Export:** `buildSessionJson`, `buildFarmCsv`, `exportStamp`.
  - **Farm:** `StageFarmTracker` — atribuição de deltas, anti-ruído (troca de estágio, deltas
    negativos, intervalos longos), clears estimados e `serialize`/`restore`.
- **Config:** `vitest.config.ts` resolve os aliases `@shared`/`@renderer` e roda em ambiente Node.
  Os testes ficam fora dos `include` dos `tsconfig`, então não afetam o `typecheck`.

### Notas
- Trava de regressão para quando regenerarmos catálogos (datamine) ou ajustarmos os trackers.

## v1.3.0 — Lote de melhorias fáceis: nível, progresso, export, janela e IPC enxuto (S5, S6, E1, I10, I7)

### Adicionado
- **Alerta de nível (S5):** a Aba Farm avisa quando os heróis ativos estão **abaixo** (clear lento/
  arriscado) ou **acima** (penalidade de XP por over-level) do **nível recomendado** do estágio
  atual, comparando o `level` do catálogo F0 com a média de nível dos ativos (`levelAdvice()`).
- **Progresso por dificuldade/ato (S6):** nova seção "Progresso por dificuldade" na Aba Farm mostra
  a **% de fases concluídas** por Normal/Nightmare/Hell/Torment e a quebra por ato, cruzando
  `maxCompletedStage` com o catálogo (`stageProgress()`).
- **Exportação de dados (E1):** botões na Aba Farm exportam a **sessão em JSON** (ouro, farm,
  inventário e heróis) e o **farm em CSV**, via funções puras (`shared/export.ts`) + diálogo de
  salvar (`tbh:saveTextFile`).
- **Estado da janela persistido (I10):** tamanho, posição e estado maximizado são lembrados entre
  sessões no config local.

### Mudado
- **JSON bruto sob demanda (I7, dívida técnica):** o snapshot **não carrega mais o save bruto** a
  cada leitura. O visualizador de calibração (Dashboard) busca o `raw` **sob demanda** via IPC
  dedicado (`tbh:getRawSave`), enxugando o tráfego de IPC e a memória do snapshot.

## v1.2.0 — Eficiência de farm por estágio: clears estimados (F1)

### Adicionado
- **Clears estimados por estágio (F1):** a Aba Farm agora mostra, por estágio medido,
  **clears/h**, **tempo médio por clear** e **clears acumulados (estimados)**. A estimativa é
  `kills no estágio ÷ inimigos por clear` (catálogo F0, `stageData.count`).
- **Leitura do total de kills:** o parser passou a ler `aggregateSaveDatas` **Type 0 / SubKey 0**
  (total de kills cumulativo) em `Snapshot.totalKills`.
- **`StageFarmTracker` estendido:** atribui o **delta de kills** ao estágio corrente (mesmo
  anti-ruído de ouro/XP — troca de estágio, deltas negativos e intervalos longos são
  descartados) e deriva clears, clears/h, tempo/clear, ouro/clear e xp/clear. O histórico F3
  ganhou `killsGained` por estágio (retrocompatível com saves antigos: assume 0).

### Notas / limitações
- **Clears são estimados** (kills ÷ inimigos por clear) e o **tempo por clear é derivado** dessa
  estimativa — robusto ao intervalo de leitura, mas é uma aproximação.
- **Fora de escopo (segue inviável pelo save):** tempo/fronteira por **corrida individual** — o
  save não persiste contador de clears nem tempo por corrida. Por isso o D1 (drops por corrida)
  continua bloqueado.
- Estágios fora do catálogo (ex.: boss de ato) não têm estimativa de clears.

---

## v1.1.0 — Dashboard customizável: liga/desliga e recolhe widgets (U10)

### Adicionado
- **Painel "Personalizar" no Dashboard (U10):** botão no topo abre um painel com um **switch por
  widget** para ligar/desligar cada seção, mais **"Restaurar padrão"**. O layout é **persistido**
  (sobrevive a reinícios).
- **Seções colapsáveis:** cada widget agora tem um **cabeçalho clicável** que recolhe/expande o
  corpo (estado aberto/fechado também persistido).
- **Registro canônico de widgets** (`src/renderer/src/data/dashboardWidgets.ts`): os 9 blocos do
  Dashboard (Resumo, Runa-alvo, Fluxo de ouro, Level-ups, Progresso de estágio, Baús, Marcos do
  Cubo, Heróis ativos, JSON bruto).

### Alterado
- O **JSON bruto** passa a vir **desligado por padrão** (some da poluição inicial); ligue-o pelo
  painel quando precisar calibrar.
- Comportamento padrão = **igual ao de hoje** (tudo ligado/expandido, exceto o JSON bruto).
  Widgets condicionais (ex.: Runa-alvo só com alvo definido) continuam dependendo dos dados — o
  toggle só controla o que **pode** aparecer.

### Implementação
- Persistência no padrão de `boxThresholds`/`runeTarget`: campo `dashboardLayout`
  (`{ hidden, collapsed }`) em `tbh-tracker-config.json` via `store.ts`
  (`get/setDashboardLayout`, com **normalização** que descarta ids desconhecidos) → IPC
  `tbh:getDashboardLayout`/`tbh:setDashboardLayout` → `preload`. Tipos `DashboardLayout`/`WidgetId`
  + `DEFAULT_DASHBOARD_LAYOUT` em `shared/types.ts`.

---

## v1.0.0 — Marco: adoção de SemVer (consolidação do ciclo v0)

Primeiro **release maior**. **Sem mudança de funcionalidade**: consolida tudo que foi entregue no
ciclo **v0** (o antigo `v1.0`–`v20.0`, abaixo) e adota o versionamento **SemVer
`MAJOR.MINOR.PATCH`**. Daqui em diante, novas features sobem o **MINOR** e correções o **PATCH**;
o **MAJOR** muda em marcos.

### Alterado
- `package.json` agora em `1.0.0`; o app passa a exibir `v1.0.0` (major.minor.patch — o patch antes
  ficava oculto).
- Esquema de versão reescrito (ver topo): o histórico anterior passa a ser o ciclo `v0.x`
  (`va.b` ≡ `v0.a.b`).

---

## v0.20.0 — Aba de Farm: ouro/h e xp/h por estágio + melhores estágios (U2, F2, F3, F4)

### Adicionado
- **Aba Farm (U2):** nova aba que reúne as medições de farm e a recomendação de estágios.
  - **Medições da sessão (F2/F3):** tabela de **ouro/h** e **XP/h por estágio**, com tempo
    observado e ouro total, **persistida por save** entre sessões. O estágio atual é destacado.
  - **Melhores estágios (F4):** ranking de eficiência (via `rankStages`, do F0) com seletor de
    **métrica** (Ouro / XP / Combo) e filtro de **dificuldade**; mostra ouro/clear, XP/clear e as
    densidades por HP, destacando onde o jogador está. Funciona mesmo sem save (catálogo puro).
- **Tracker `src/main/stageFarm.ts` (F2):** mede ouro/h e XP/h **por estágio** pelo **delta entre
  leituras** (no padrão do `goldFlow.ts`, mas *bucketed* por estágio). A cada leitura, atribui o
  delta de ouro e de XP (Σ `HeroExp`) — e o tempo do intervalo — ao **estágio corrente**.
  *Anti-ruído:* descarta intervalos com **troca de estágio**, **deltas negativos** (gasto/venda,
  reset de XP em level-up contam como 0) e **intervalos longos** (jogo fechado/parado).
- **Persistência (F3):** novo namespace `stageFarm` em `src/main/history.ts`; o tracker
  `serialize()`/`restore()` retoma as medições do save monitorado ao reabrir (igual a
  `goldFlow`/`stageEvents`). Dados anexados ao snapshot (`Snapshot.stageFarm`).

### Notas / limitações
- É uma **aproximação por snapshot** — o save não registra clears nem tempo por corrida (F1
  segue bloqueado). As taxas medidas servem para comparar estágios; ganhos absolutos variam com
  runas/nível/composição.
- `HeroExp` é XP do nível atual (reseta em level-up); por isso o XP/h ignora deltas negativos e
  pode subestimar logo após um level-up.

---

## v0.19.0 — Descoberta automática da chave ES3 (onboarding)

### Adicionado
- **Localizar chave automaticamente:** novo botão no painel de configuração que descobre a
  **chave de descriptografia ES3** sem digitação. Fluxo: localiza a instalação do jogo
  (Steam: registro → `libraryfolders.vdf` → `appmanifest_3678970.acf`), lê **somente em
  modo leitura** o `resources.assets` (onde o **Easy Save 3** guarda a senha no asset
  `ES3Defaults`), extrai as strings candidatas e **valida cada uma contra o save real** —
  a chave correta é a que descriptografa o save para JSON válido (~120 ms via busca
  ancorada no marcador `ES3Defaults`).
- **Aviso/consentimento antes de ler arquivos do jogo:** um popup nativo explica que a
  operação é **somente leitura** de arquivos em disco, **não** toca no processo/memória do
  jogo, **não** injeta nada, **não** modifica nada e **não** acessa a internet. Só prossegue
  se o usuário confirmar.
- `src/main/keyFinder.ts` (locator do jogo + extração/validação da chave) e IPC
  `tbh:findKey`. A chave encontrada é aplicada via `store.setKey` (cifrada por `safeStorage`)
  e **nunca é devolvida ao renderer** — vive só no processo main.

### Notas / segurança
- **Mudança de postura (documentada em `PLAN.md`):** o tracker agora pode ler — **com aviso
  explícito** — arquivos de **instalação do jogo** além do save. Continua 100% passivo: só
  leitura de arquivo em disco, mesmo princípio da leitura do save.
- Fallbacks: sem save → pede para abrir o jogo uma vez; sem instalação localizada ou chave
  não encontrada → orienta colar manualmente (entrada manual segue disponível).
- A chave **não acompanha o repositório**; é descoberta localmente a partir dos arquivos do
  próprio usuário.

---

## v0.18.0 — Catálogo de estágios: ouro/EXP/HP por fase (F0)

### Adicionado
- **Catálogo de estágios (F0):** `src/shared/stageData.ts` (auto-gerado) com **108
  estágios** (4 dificuldades × 3 atos × fases 1-9) indexados pela **chave DAPP**, cada um
  com **ouro/clear** (`expectedGold`), **EXP/clear** (`expectedEXP`), **HP total**,
  **nº de inimigos** (`count`), ondas e as **densidades** `goldPerHP`/`expPerHP`
  (proxy de ganho por tempo). Nomes em pt-BR.
- **Gerador** `scripts/gen-stages.cjs`: datamine de `data/farm_stages.json` do `tbh-farm`
  (mesmo padrão de `gen-runes.cjs`/`gen-items.cjs`), com correção de mojibake nos nomes.
- **Helpers** em `src/shared/stage.ts`: `stageDataForRaw(raw)` (lookup por código DAPP),
  `rankStages(metric, { difficulty, limit })` (ranqueia por eficiência — ouro/exp/combo via
  densidade de HP) e `stagesByDifficulty()`; mais `difficultyName(n)`.

### Notas
- **Fundação da Fase 2** — desbloqueia F4 (recomendação de estágio, via `rankStages`),
  F5 (projeção) e a aproximação de ouro/kill do G4 (`expectedGold / count`).
- O catálogo **não inclui boss de ato** (fase 10): a fonte cobre só as fases 1-9 de cada
  ato. `stageDataForRaw` retorna `null` para chaves fora do catálogo.
- Dado estático da comunidade (datamine) — pode mudar com patches; regenerar pelo script.
  Fonte registrada em `FONTES.md`.

---

## v0.17.0 — Aba Atualizações: Steam News (N1 / U9)

### Adicionado
- **Aba Atualizações (N1 + U9):** lista patch notes/anúncios oficiais do TBH puxados da
  **Steam News API** (`ISteamNews/GetNewsForApp`, `appid=3678970` — devs Nugem/Tesseract).
  Cada anúncio mostra **canal, data, título, resumo** (BBCode/HTML reduzidos a texto) e
  abre o **anúncio completo** no navegador padrão (`shell.openExternal`, só URLs http(s)).
  Botão **"Atualizar"** força nova busca.
- **Busca no processo main** (`src/main/news.ts`): GET HTTPS via `node:https` com timeout,
  **cache de 10 min** e limpeza do conteúdo; exposta por IPC `tbh:getNews` (+ `tbh:openExternal`).
  Em caso de falha, mantém o último resultado e sinaliza o erro na UI.

### Notas / segurança
- **1ª feature de rede externa** — mantém a postura passiva: apenas requisição a um serviço
  público da Steam; **não** interage com o jogo nem com o save.
- Extra ainda pendente: destacar quando há versão mais nova que a observada.

---

## v0.16.0 — Runa-alvo: ouro faltante com pré-requisitos (R3)

### Adicionado
- **Runa-alvo (R3):** na aba **Runas**, o painel de detalhes ganha **"Definir como alvo"**
  (e "Remover alvo"); o nó marcado fica com um anel pulsante no mapa. A seleção é
  **persistida localmente** (`tbh-tracker-config.json`, chave `runeTargetKey`).
- **Card "Runa-alvo" no Dashboard:** mostra ícone/nome/categoria da runa, **nível atual →
  máximo**, **custo total em ouro**, **ouro atual**, **quanto falta** e uma **barra de
  progresso (%)**, além da **lista de passos** do caminho (pré-requisitos a desbloquear +
  o próprio alvo, com nível e custo de cada um). Cada passo é **marcado como "✓ dá pra
  comprar"** quando o ouro atual cobre o **custo acumulado na sequência** até ele.
- **Cálculo do caminho** (`planRuneTarget` em `src/shared/runes.ts`): soma o custo em ouro
  dos **pré-requisitos pendentes** (desbloquear nível 1) pelo **caminho de menor custo** até
  a raiz quando há mais de um, mais os **níveis restantes do próprio alvo** (até o máximo),
  e subtrai o **ouro observado** (`CurrencySaveDatas` 100001). Usa as **arestas/custos** já
  catalogados no `runeTree.ts` (v4.0).

### Notas
- Pré-requisitos que custam **soul stones** (não-ouro) entram no caminho mas **não somam
  ouro** — sinalizados no card.
- Helper de ícones de runa extraído para `src/renderer/src/data/runeIcons.ts` (reutilizado
  pela aba Runas e pelo Dashboard).

---

## v0.15.0 — Aba Inventário: tipo × raridade (D3 / U8)

### Adicionado
- **Aba Inventário** (`src/renderer/src/components/Inventory.tsx`): lê `itemSaveDatas[]`,
  classifica cada item por **tipo** (slot/categoria) e **raridade** (10 níveis: Common →
  Cosmic) e monta a **matriz tipo × raridade** com contagens, mais **barras de distribuição
  por raridade** e cards de resumo (equipamentos, **Legendary+**, materiais, baús).
- **Filtro por localização**: as instâncias são associadas ao local (equipado, inventário,
  stash, Trade Ship ou solto) via `inventorySaveDatas[]` / `stashSaveDatas[]` /
  `tradingStashSaveDatas[]` / `equippedItemIds[]`; o usuário alterna o escopo (Tudo /
  Inventário / Stash / …) e a matriz/barras recalculam.
- **Destaque Legendary+**: colunas e células de raridade vendável no Market ficam realçadas.
- **Catálogo de itens** (`src/shared/items.ts` + `src/shared/itemData.ts`, gerado por
  `scripts/gen-items.cjs`): mapa `ItemKey → tipo/gear-type/raridade/nível` para 5.944 itens
  (5.760 equipamentos, 125 materiais, 59 baús), com rótulos PT e helper `classifyItem`.

### Notas
- Raridade **não** escala por área (só o nível do item); apenas **Legendary+** é vendável.
- ItemKeys fora do catálogo (datamine desatualizado) aparecem como "Desconhecidos".
- Fonte do catálogo: datamine da comunidade (gamedata do `tbh-farm`) — ver `FONTES.md`.

### Arquivamento de backlog (corte v15)
- Itens entregues em **v11–v15** (H2, H8, B3, I6, D3, U8) movidos de `BACKLOG.md` para
  `BACKLOG-HISTORICO.md`. O `BACKLOG.md` mantém apenas o que está a fazer/bloqueado.

---

## v0.14.0 — Persistência local de histórico (I6)

### Adicionado
- **Camada de persistência reutilizável** `src/main/history.ts`: grava o estado dos
  trackers num único JSON no `userData` (`tbh-tracker-history.json`), **isolado por
  arquivo de save** (hash do caminho), com escrita *debounced* e *flush* ao fechar.
- **Histórico entre sessões (I6):** o **fluxo de ouro** (G2/G3), os **level-ups** (H2) e
  os **eventos de estágio** (S3) agora **sobrevivem a reinícios** — ao abrir, o tracker
  recarrega os eventos e as linhas de base do save monitorado em vez de começar do zero.
  Trocar de save carrega o histórico daquele save (cada um retoma o seu).
- Trackers ganharam `serialize()`/`restore()`; `Tracker` carrega no início e persiste a
  cada leitura; `flushHistory()` no `stop()`/`before-quit`.

### Notas
- Base de fundação para **F3** (histórico por estágio) e **U5** (gráficos de sessão).
- Como o fluxo de ouro agora acumula entre sessões, a **taxa "de sessão"** passa a refletir
  o histórico persistido (limitado pelos tetos de amostras/eventos); a taxa por **janela
  móvel (120s)** segue sendo a métrica "recente".

---

## v0.13.0 — Estimativa de esvaziamento de baús (B3)

### Adicionado
- **Cooldowns de auto-abrir (B3):** o card **Baús por tipo** passa a estimar, por
  categoria, **quanto tempo o auto-abrir leva para esvaziar o acúmulo** (quantidade ×
  cooldown base: Comum 300s, Estágio 600s), além de um **resumo** do tempo total para
  zerar o acúmulo (limitado pelo tipo mais lento, já que as categorias auto-abrem em
  paralelo). Baús de **Ato** (sem auto-abrir) são marcados como **"abrir manualmente"**.
- `boxDrainSeconds(kind, quantity)` em `src/shared/boxes.ts` e `fmtDuration` no Dashboard.

### Notas
- Estimativa **base** (sem as runas do Extremo Norte, que reduzem o cooldown); puramente
  informativa — o jogo não expõe o timestamp do último auto-abrir.

---

## v0.12.0 — Retratos dos heróis (H8)

> Renumerada de v11.0 para v12.0 após rebase sobre a `main` (que já recebeu o H2 em v11.0).

### Adicionado
- **Retratos dos heróis (H8):** as artes dos 6 heróis (baixadas da TBH Wiki) passam a
  aparecer nos **cards do roster** e no **detalhe do herói** (aba Heróis) e nos **heróis
  ativos** do Dashboard. Mesmo padrão dos ícones de runa (v4.0): assets versionados em
  `src/renderer/src/assets/heroes/`, **mapeados por `heroKey`** e resolvidos pelo Vite.
- `scripts/gen-heroes.cjs`: baixa os retratos (`Arrage_ChaAnim_<asset>_Large_0.png`) para
  `assets/heroes/<heroKey>.png`. O Hunter usa o nome interno **"Abalist"** no asset do jogo.
- `src/renderer/src/data/heroPortraits.ts`: helper `heroPortrait(heroKey)` via `import.meta.glob`.

### Notas
- Assets são de fã/comunidade (TBH Wiki, ver `FONTES.md`); podem mudar com patches.

---

## v0.11.0 — Detecção de level-ups de heróis (H2)

> Renumerada de v9.0 para v11.0 após rebase sobre a `main` (que já tinha v8.0–v10.0).

### Adicionado
- **Level-ups (H2):** o app compara o **nível de cada herói** (`HeroLevel`) entre
  leituras consecutivas do save e registra um evento quando um herói sobe de nível,
  com **herói**, **nível anterior → novo** e **horário**. O Dashboard ganha uma seção
  **"Level-ups"** com o log dos eventos recentes (mais recente primeiro).
- `HeroEventsTracker` (`src/main/heroEvents.ts`): acumula os níveis observados da
  sessão **em memória** e deriva os level-ups; a 1ª leitura de cada herói fixa a linha
  de base (sem evento). Zera ao trocar de arquivo de save. Os dados viajam anexados ao
  snapshot (`Snapshot.heroEvents`), sem mudanças no preload — mesmo padrão do fluxo de ouro.

### Notas / limitações
- **Sem persistência entre sessões** — o histórico vive na memória do processo enquanto
  o app está aberto (persistência é o item **I6**, separado).
- Depende do jogo **estar rodando** e gravando o save; só registra level-ups ocorridos
  **após** a primeira leitura da sessão.

Backlog entregue: H2.

---

## v0.10.0 — Progresso de estágio + heartbeat de status (S3, A2)

### Adicionado
- **Progresso de estágio (S3):** o app compara o **estágio atual** (`CurrentStageKey`) e o
  **estágio máximo concluído** (`MaxCompletedStage`) entre leituras do save e registra
  eventos de **troca de estágio** e **novo recorde** (estágio máximo avançou), com rótulo
  legível e horário. O Dashboard ganha a seção **"Progresso de estágio"**.
- **Heartbeat de status (A2):** o tracker emite um **pulso periódico** (5s) mesmo quando o
  save não muda, atualizando `heartbeatAt`/`lastChangeAt`. A barra de status passa a mostrar
  **"ativo · atualizado há Xs"** ou **"parado há Xs"** (sem mudança ≥ 30s) e um **ponto que
  pulsa** enquanto o tracker está vivo.
- `StageEventsTracker` (`src/main/stageEvents.ts`): acumula os estágios observados da sessão
  **em memória** e deriva os eventos; a 1ª leitura fixa a linha de base. Zera ao trocar de
  save. Dados anexados ao snapshot (`Snapshot.stageEvents`), sem mudanças no preload.

### Notas / limitações
- **Sem persistência entre sessões** (memória do processo enquanto o app está aberto — I6).
- Os eventos dependem do jogo **estar rodando**; só registram mudanças após a 1ª leitura.
- O heartbeat é **passivo**: apenas um timer no processo; não toca no jogo nem no save.

### Pendência de processo
- **Arquivamento do backlog (marco v10):** mover os itens entregues (✅) de `BACKLOG.md`
  para `BACKLOG-HISTORICO.md`. Adiado para um passo dedicado após as versões em PR
  (H2/H8) estarem na `main`, para refletir o estado real do backlog.

Backlog entregue: S3, A2.

---

## v0.8.0 — Análise detalhada do herói: stats com ranking + árvore de habilidades (H9)

### Adicionado
- **Drill-down do herói na aba Heróis (H9):** clicar em um herói abre uma tela de
  detalhe modelada na página da TBH Wiki, com **voltar ao roster**.
- **Atributos base com ranking:** os **9 atributos** (Dano, Vel. de ataque, Chance crít.,
  Dano crítico, PV, Armadura, Vel. de movimento, Vel. de conjuração, Red. recarga) com
  a **posição de cada um entre os 6 heróis** (★ destaca o melhor). O ranking é
  **calculado em código** a partir do catálogo (não fixado manualmente).
- **Árvore de habilidades por tier (Tiers 1–8):** habilidades **passivas/ativas** com o
  **nível máximo** e o **custo em pontos** de cada tier; tiers 7–8 marcados como
  **bloqueados** (ainda indisponíveis no jogo) e tiers **alcançáveis** destacados pelo
  nível atual do herói (1 ponto por nível).
- **Dados ao vivo do save:** nível, XP, pontos de habilidade e estado (ativo/desbloqueado)
  no cabeçalho do detalhe.

### Mudanças internas
- `src/shared/heroes.ts` reescrito: catálogo completo dos 6 heróis (papel, armas,
  desbloqueio, descrição, DPS, 9 stats base e árvore de habilidades por tier) + helpers
  `HERO_STAT_DEFS` e `heroStatRank`. Fonte: `taskbarhero.wiki/pt/heroes/<slug>`.

Backlog entregue: H9.

---

## v0.7.0 — Fluxo de ouro: delta por evento + ouro/h (G3, G2 parcial)

### Adicionado
- **Delta de ouro por evento (G3):** a cada leitura do save em que o ouro muda, o
  app registra um evento com a **variação (com sinal)** e o **total resultante**. O
  Dashboard ganha uma seção **"Fluxo de ouro"** com o log dos eventos recentes
  (horário · delta · total). Gasto (ex.: runas) aparece como valor negativo.
- **Ouro/h (G2, básico/"por enquanto"):** taxa de ouro por hora em duas visões —
  **janela móvel** (120s) e **média da sessão** — além do **líquido da sessão**. O
  card "Ouro" mostra a taxa como dica.
- `GoldFlowTracker` (`src/main/goldFlow.ts`): acumula as leituras de ouro da sessão
  **em memória** e deriva deltas + taxas; zera ao trocar de arquivo de save. Os
  dados viajam anexados ao snapshot (`Snapshot.goldFlow`), sem mudanças no preload.

### Notas / limitações
- **Sem persistência entre sessões** — o histórico vive na memória do processo
  enquanto o app está aberto (persistência é o item **I6**, separado).
- As taxas dependem do jogo **estar rodando** e gravando o save; com save esparso a
  janela curta pode oscilar — por isso há também a média de sessão.

Backlog entregue: G3 (e base do G2).

---

## v0.6.0 — Heróis: dashboard só com ativos + aba Heróis (H5, H6, U7)

### Adicionado
- Nova aba **Heróis** (U7) com o **roster completo dos 6** (H5): cada herói num card
  com **estado** (Ativo · Slot N / Desbloqueado / Bloqueado, via `IsUnLock` +
  `arrangedHeroKey`), **nível** e **XP** do save, e dados do **catálogo** — papel,
  arma, **tier**, disponibilidade e **stats base** (HP, ATK, Crít., Armadura,
  Vel. atq.). Funciona mesmo sem save lido (mostra só o catálogo).
- Catálogo de heróis em `src/shared/heroes.ts` (`HERO_CATALOG`): os 6 heróis com
  papel/arma/tier/disponibilidade/stats base; `HERO_NAMES` agora deriva dele e
  novo helper `heroByKey`.

### Alterado
- O card de heróis do Dashboard (H6) agora mostra **apenas os heróis arranjados**
  (`arrangedHeroKey`), em **3 slots de formação** na ordem do save, com nome e
  nível. Slots não ocupados aparecem como **"Vazio"** (slot livre), refletindo os
  `-1` da formação.
- O card "Heróis ativos" do grid passa a exibir o uso da formação (`ativos / 3`)
  com o tamanho do roster como dica.

### Removido
- A **tabela do roster completo** saiu do Dashboard (H6) — essa visão completa
  passou para a aba **Heróis**.

### Notas / limitações
- "Progresso até o próximo nível" (barra de XP) fica para depois: o save expõe o XP
  acumulado, mas a **curva de XP por nível** ainda não está catalogada (datamine).
- Drill-down do herói com **árvore de habilidades** é o item **H9** (separado).

Backlog entregue: H5, H6, U7.

---

## v0.5.0 — Baús por tipo + alerta de acúmulo (B2)

Item de qualidade de vida (B2), sem tocar no agente de detecção de corridas
(que segue arquivado). Esta feature havia sido implementada antes (PR #4), mas
foi mergeada sobre o branch `feature/run-detection` (PR #3, fechado) e nunca
chegou à `main`; aqui ela é reaplicada limpa sobre a `main` atual.

### Adicionado
- **Baús separados por tipo** no dashboard. `BoxData` são arrays paralelos
  (`BoxTypes`/`BoxUniqueId`/`BoxQuantity`); a contagem agrupa por `BoxTypes` e
  soma `BoxQuantity`. Exibe as três categorias do jogo — Comum (300s) · Estágio
  (600s) · Ato (sem auto-abrir) — com quantidade, cor e cooldown de auto-abrir.
- **Alerta de acúmulo (B2):** o card "Baús" e um banner mudam de cor quando os
  baús não abertos acumulam (⚠️ a partir de 25, 🔴 a partir de 75 por padrão). O
  texto orienta a abrir/garantir auto-abrir (runas do Extremo Norte) e espaço de
  inventário/stash.
- **Limiares configuráveis na UI:** botão "Ajustar limiares" na seção de baús edita
  os valores de aviso/alerta; persistidos localmente (`tbh-tracker-config.json`) e
  normalizados (inteiros ≥ 1, alerta ≥ aviso).
- `shared/boxes.ts`: metadados dos tipos de baú + classificação de acúmulo,
  reutilizáveis por main e renderer. `Snapshot.boxes[]` (por tipo) somado a
  `boxQuantity` (total, mantido para compatibilidade).

### Notas / limitações
- O jogo **não tem um teto fixo** de baús; o gargalo real é o acúmulo (auto-abrir
  lento/desligado ou inventário/stash cheio param de processar drops). Por isso o
  alerta é de **acúmulo**, não de um "limite".
- O enum `BoxTypes` foi validado contra save real: tipo 1 = baú azul (Estágio).
  0 (Comum/branco) e 2 (Ato/vermelho) inferidos pela ordem das categorias; tipos
  fora do mapa são ignorados (o jogo só tem estas três categorias).

Backlog entregue: B2.

---

## v0.4.0 — Árvore de Runas (R1)

### Adicionado
- Nova aba **Runas** com o **mapa da árvore de runas** (197 nós) com **zoom** (roda
  do mouse) e **pan** (arrastar). Nós trazem o ícone da runa, ficam acesos conforme
  o nível observado no save e mostram `nível/máx`; arestas conectam os nós e
  destacam o caminho já desbloqueado.
- **Painel de detalhes** ao clicar numa runa: nome e efeito em pt-BR, categoria,
  nível atual/máximo e custo em ouro (próximo nível ou total investido).
- **Resumo** no topo: nós desbloqueados/total, nós no máximo e contagem pelas
  categorias oficiais (Baús, Herói, Ouro, EXP, Ranhuras, Offline, Cubo, Combate).
- Parsing de `RuneSaveData[]` (`RuneKey` + `Level`) no snapshot (`runes`), guardando
  só os nós com nível > 0.
- Catálogo de runas em `src/shared/runeTree.ts` (197 nós: posição `x,y`, nome/efeito
  pt-BR, ícone, `maxLevel`, valores e **custo em ouro por nível**) + helpers em
  `src/shared/runes.ts`. Ícones (39 únicos) baixados de `taskbarhero.wiki`; categorias
  oficiais sobrepostas por `key` a partir de `taskbarherowiki.com`.
- O `RuneKey` do save bate **1:1** com a `key` do catálogo (join direto).

Backlog entregue: R1. (Base para R2 — custos de runa já catalogados.)

---

## v0.3.0 — Alertas de marcos do Cubo (C2)

### Adicionado
- **Marcos do Hero-dric Cube** no Dashboard: card do Cubo mostra o próximo
  desbloqueio (ex.: "Próx: Nv 10 · Removal + Trade Ship") e uma nova seção
  **"Marcos do Cubo"** lista todos os marcos por nível (4 = desbloqueio · 5 =
  Crafting · 8 = Decoration · 10 = Removal + Trade Ship) com estado
  alcançado/próximo/bloqueado e um alerta de quantos níveis faltam para o próximo.
- Catálogo de marcos em `src/shared/cube.ts` (fonte: `docs/TBHPEDIA.md`).

Backlog entregue: C2.

---

## v0.2.0 — Aba TBHPedia

### Adicionado
- Navegação por abas no app (Dashboard | TBHPedia).
- Aba **TBHPedia** navegável estilo Civilopedia, com conteúdo do `docs/TBHPEDIA.md`
  estruturado em dados: visão geral, heróis, estágios/atos, cubo, runas, pets, raridades,
  baús & soul stones e segurança/anti-cheat.
- Busca de texto que filtra as seções da TBHPedia.

Backlog entregue: U3.

---

## v0.1.0 — Fase 1: MVP de leitura

Primeira versão funcional. Tracker somente-leitura do save do TBH.

### Adicionado
- Scaffold Electron + Vite + React + TypeScript (electron-vite).
- Descriptografia Easy Save 3 (AES-128-CBC + PBKDF2-SHA1; IV = salt; 100 iterações).
- Localizador automático do save (Windows/Proton) + seleção manual.
- File watcher passivo com fingerprint (relê só quando o save muda).
- Parser do save calibrado contra save real (estrutura `PlayerSaveData.value` duplamente
  codificada): ouro, estágio (DAPP), onda, estágio máximo, cubo, baús, heróis (com nome),
  tempo de jogo.
- Chave ES3 guardada localmente e cifrada via `safeStorage`; nunca commitada.
- Dashboard com cards, estados de conexão (monitorando / sem chave / sem save / erro),
  painel de configuração da chave e visualizador de JSON bruto para calibração.
- Exibição da versão no cabeçalho do app.

Backlog entregue: I1–I5, G1, S1, S2, H1, H3, H4, C1, B1, U1.
