# Changelog — TBH-Tracker

## Esquema de versão

Versão no formato **`va.b`** (por enquanto):

- **`a`** — incrementa a cada **nova implementação** (feature/funcionalidade nova). Ao subir `a`, `b` zera.
- **`b`** — incrementa a cada **fix** (correção de bug/ajuste).

Exemplos: `v1.0` → nova feature → `v2.0`; `v2.0` → correção → `v2.1`.

> No `package.json` a versão é gravada como `a.b.0` (semver válido); o app exibe `va.b`.
> Cada versão deve ter uma tag git (`vA.B`).

---

## v15.0 — Aba Inventário: tipo × raridade (D3 / U8)

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

## v14.0 — Persistência local de histórico (I6)

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

## v13.0 — Estimativa de esvaziamento de baús (B3)

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

## v12.0 — Retratos dos heróis (H8)

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

## v11.0 — Detecção de level-ups de heróis (H2)

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

## v10.0 — Progresso de estágio + heartbeat de status (S3, A2)

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

## v8.0 — Análise detalhada do herói: stats com ranking + árvore de habilidades (H9)

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

## v7.0 — Fluxo de ouro: delta por evento + ouro/h (G3, G2 parcial)

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

## v6.0 — Heróis: dashboard só com ativos + aba Heróis (H5, H6, U7)

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

## v5.0 — Baús por tipo + alerta de acúmulo (B2)

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

## v4.0 — Árvore de Runas (R1)

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

## v3.0 — Alertas de marcos do Cubo (C2)

### Adicionado
- **Marcos do Hero-dric Cube** no Dashboard: card do Cubo mostra o próximo
  desbloqueio (ex.: "Próx: Nv 10 · Removal + Trade Ship") e uma nova seção
  **"Marcos do Cubo"** lista todos os marcos por nível (4 = desbloqueio · 5 =
  Crafting · 8 = Decoration · 10 = Removal + Trade Ship) com estado
  alcançado/próximo/bloqueado e um alerta de quantos níveis faltam para o próximo.
- Catálogo de marcos em `src/shared/cube.ts` (fonte: `docs/TBHPEDIA.md`).

Backlog entregue: C2.

---

## v2.0 — Aba TBHPedia

### Adicionado
- Navegação por abas no app (Dashboard | TBHPedia).
- Aba **TBHPedia** navegável estilo Civilopedia, com conteúdo do `docs/TBHPEDIA.md`
  estruturado em dados: visão geral, heróis, estágios/atos, cubo, runas, pets, raridades,
  baús & soul stones e segurança/anti-cheat.
- Busca de texto que filtra as seções da TBHPedia.

Backlog entregue: U3.

---

## v1.0 — Fase 1: MVP de leitura

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
