# TBH-Tracker — Backlog Histórico (itens entregues)

Itens **entregues (✅)** arquivados do `BACKLOG.md`. A cada 5 versões (`a` múltiplo de 5)
o backlog é separado: o que foi feito vem para cá; o que está a fazer permanece em
`BACKLOG.md`. Detalhes de cada release em `CHANGELOG.md`.

> **Recorte atual:** até **v2.3.0** (quarto arquivamento — corte extra que quitou a dívida do
> ciclo v0→v2; abaixo, primeiro o recorte legado **até v0.15.0** e depois o lote **v0.16 → v2.3.0**).
> Próximo corte regular: **v2.5.0**.

## Infra & leitura (P0)

| # | Versão | Item | Notas |
|---|--------|------|-------|
| I1 | v0.1.0 | Localizar o save automaticamente | caminho padrão Windows + override manual |
| I2 | v0.1.0 | Descriptografar ES3 (AES-CBC + PBKDF2-SHA1) | chave fornecida pelo usuário; nunca no repo |
| I3 | v0.1.0 | File watcher + fingerprint (mtime+tamanho) | relê só quando muda |
| I4 | v0.1.0 | Parser save → snapshot tipado | campos em TBHPEDIA.md |
| I5 | v0.1.0 | Estado de conexão | monitorando / sem chave / sem save / erro |
| I6 | v0.14.0 | Persistência local de histórico | camada reutilizável (`src/main/history.ts`); eventos sobrevivem a reinícios, isolados por save |

## Ouro — `CurrencySaveDatas` (key 100001)
- **G1 (P0):** v0.1.0 — Ouro total no dashboard.
- **G2 (P1):** v0.7.0 — Taxa de ouro/h por janela móvel (120s) e média de sessão (em memória).
- **G3 (P1):** v0.7.0 — Delta de ouro por evento (com sinal e total); seção **Fluxo de ouro** no Dashboard.

## Estágio & progresso — `CurrentStageKey`, `CurrentStageWave`, `MaxCompletedStage`
- **S1 (P0):** v0.1.0 — Decodificar `DAPP` → "Dificuldade · Ato · Fase" + onda atual.
- **S2 (P0):** v0.1.0 — Mostrar estágio máx. concluído.
- **S3 (P1):** v0.10.0 — Eventos de troca de estágio e novo recorde (`CurrentStageKey`/`MaxCompletedStage`); seção **Progresso de estágio** no Dashboard (em memória).

## Heróis — `HeroSaveDatas[]`, `ArrangedHeroKey`
- **H1 (P1):** v0.1.0 — Nível e XP por herói. *(herói líder: pendente)*
- **H2 (P1):** v0.11.0 — Detectar level-ups (eventos): compara `HeroLevel` entre snapshots e registra herói + nível anterior→novo + horário; seção **Level-ups** no Dashboard.
- **H3 (P1):** v0.1.0 — Nº de heróis ativos → normalizar XP/h por herói.
- **H4 (P2):** v0.1.0 — Composição ativa (nomes via catálogo de heróis).
- **H5 (P1):** v0.6.0 — Aba **Heróis** com o roster completo (6 heróis: desbloqueado/bloqueado, nível/XP, dados do catálogo) e marcação dos ativos.
- **H6 (P1):** v0.6.0 — Dashboard só com heróis **ativos** (arranjados, até 3) + slots vazios; roster completo migrado para a aba Heróis.
- **H8 (P2):** v0.12.0 — **Retratos/ícones dos heróis** (TBH Wiki via `scripts/gen-heroes.cjs`) nos cards de ativos, roster e detalhe; assets em `src/renderer/src/assets/heroes/<heroKey>.png`.
- **H9 (P2):** v0.8.0 — **Análise detalhada do herói** (drill-down): stats base com **ranking entre os 6** (★ melhor) e **árvore de habilidades por tier** (1–8).

## Cubo — `CubeSaveLevelData`
- **C1 (P2):** v0.1.0 — Nível e XP do Cubo no dashboard.
- **C2 (P2):** v0.3.0 — Alertas de marcos do Cubo (níveis 4/5/8/10; nível 10 = Trade Ship). Card mostra próximo desbloqueio + seção "Marcos do Cubo".

## Baús — `BoxData.BoxQuantity`
- **B1 (P1):** v0.1.0 — Contagem de baús não abertos.
- **B2 (P2):** v0.5.0 — Baús por categoria (Comum/Estágio/Ato) + alerta de **acúmulo** (limiares calibráveis na UI, persistidos localmente).
- **B3 (P2):** v0.13.0 — Estimar cooldowns de auto-abrir (comum 300s / boss 600s): tempo estimado para esvaziar o acúmulo por categoria + resumo (categorias auto-abrem em paralelo). Ato fica como "abrir manualmente".

## Itens / drops — `itemSaveDatas[]`
- **D3 (P2):** v0.15.0 — **Aba Inventário**: classifica itens por **tipo** (slot/categoria via `ItemKey` → catálogo `items.ts`/`itemData.ts`) e **raridade** (10 níveis), monta a **matriz tipo × raridade** + barras por raridade, filtro por localização (inventário/stash/equipado/Trade Ship/solto) e destaque **Legendary+**. Catálogo gerado por `scripts/gen-items.cjs` (5.944 itens).

## Runas — `RuneSaveData[]`
- **R1 (P2):** v0.4.0 — Níveis de runa observados + **mapa da árvore com zoom/pan** (197 nós, ícones, nomes/efeitos pt-BR, custos em ouro). Catálogo `RuneKey → nó` (join direto). Aba **Runas**.

## Sessão / atividade — `PlayTime`
- **A2 (P2):** v0.10.0 — **Heartbeat de status** (pulso de 5s) + barra de status **ativo/parado** com tempo desde a última mudança (ponto pulsante).

## UI / TBHPedia
| # | Versão | Item | Notas |
|---|--------|------|-------|
| U1 (P0) | v0.1.0 | Dashboard com cards (ouro, estágio, heróis, cubo, baús, máx. estágio) | MVP |
| U3 (P1) | v0.2.0 | Aba **TBHPedia** navegável dentro do app | Conteúdo de TBHPEDIA.md |
| U7 (P1) | v0.6.0 | Aba **Heróis** (roster completo) + dashboard só com ativos | Implementa H5/H6 |
| U8 (P2) | v0.15.0 | Aba **Inventário** (itens por tipo × raridade, contagem + visualização) | Implementa D3 na navegação por abas |

---

# Lote v0.16 → v2.3.0 (quarto arquivamento)

Itens entregues durante o ciclo **v0.16 → v2.3.0**, movidos do `BACKLOG.md` no corte da **v2.3.0**
(corte extra que quitou a dívida de arquivamento herdada da transição v0→v1→v2). Detalhe de cada
release em `CHANGELOG.md`.

## Estágio & progresso — `CurrentStageKey`, `CurrentStageWave`, `MaxCompletedStage`
- **S5 (P2):** v1.3.0 — **Alerta de nível recomendado vs. seu nível** — compara o nível dos heróis ativos com o **nível recomendado** do estágio e avisa sub/over-level, citando a **penalidade de over-level** de XP. Banner na **Aba de Farm** via `levelAdvice()` (`shared/stage.ts`).
- **S6 (P2):** v1.3.0 — **Progresso por dificuldade/ato** — % de conclusão de Normal/Nightmare/Hell/Torment (e por ato) a partir de `maxCompletedStage` cruzado com o catálogo. Seção "Progresso por dificuldade" na **Aba de Farm** via `stageProgress()`.

## Corridas & eficiência de farm — ouro + XP + kills + `CurrentStageWave`
- **F0 (P1):** v0.18.0 — **Catálogo de estágios** `stageData.ts` (108 estágios; EXP/clear, ouro/clear, HP total, nº de inimigos, ondas e densidades). Gerado por `scripts/gen-stages.cjs`. Helpers `stageDataForRaw`/`rankStages`/`stagesByDifficulty`. **Fundação da Fase 2** (desbloqueia F4/F5/G4).
- **F1 (P1):** v1.2.0 — **Eficiência de farm por estágio (clears estimados)** — lê o total de kills cumulativo (`aggregateSaveDatas` Type 0) → delta de kills por estágio ÷ inimigos por clear (F0) = clears, clears/h e tempo médio por clear. *Fora de escopo (inviável pelo save):* fronteira por corrida individual (bloqueia D1). Branch arquivado: `feature/run-detection` (PR #3 fechado).
- **F2 (P1):** v0.20.0 — **Ouro/h e XP/h por estágio** via delta entre leituras. Tracker `stageFarm.ts` (bucketed por estágio) com anti-ruído; anexado em `Snapshot.stageFarm`.
- **F3 (P1):** v0.20.0 — Histórico persistente por estágio (`serialize`/`restore` + namespace `stageFarm` no `history.ts`).
- **F4 (P1):** v0.20.0 — Recomendar melhor estágio para **ouro/XP/combo** via `rankStages` (F0), exibido na **Aba de Farm** com seletor de métrica + filtro de dificuldade.

## Heróis — `HeroSaveDatas[]`
- **H12 (P2):** v1.9.0 — **Visualizador da árvore de atributos por herói** — aba **Atributos** com seletor de herói e a árvore em colunas (132 nós, 8 grupos). Gerador `gen-attributes.cjs` → `attributeData.ts`; parser lê `attributeSaveDatas[]`; helper `attributes.ts`. Coberto por testes.
- **H14 (P2):** v2.3.0 — **XP para o próximo level-up na aba Heróis** — catálogo da curva de XP por nível (`scripts/gen-levels.cjs` → `Core/Data/levels.json`, 100 níveis; `DB.levels`); lógica `Heroes.LevelProgress` (XP exigido, falta e % do nível atual); UI no card e no detalhe do herói (barra + "faltam X p/ o Nv N+1"). Coberto por `HeroesTests`. *Em aberto:* confirmar contra save real que `HeroExp` é o progresso no nível atual. *Sinergia:* alimenta o X2.

## Itens / drops — `itemSaveDatas[]`
- **D2 (P3):** v1.5.0 — Classificar por raridade e destacar Legendary+ **fora da aba Inventário** — widget **"Raridade do inventário"** no Dashboard (liga/desliga + colapsável, U10) com total Legendary+ e distribuição por raridade. Usa `classifyItem` + `GRADES` (D3).
- **D4 (P2):** v1.6.0 — **Catálogo de bônus/atributos de itens** — gerador `gen-stats.cjs` → `statData.ts`: `STAT_STRINGS` (117), `STAT_MODS` (620), `AFFIX_REP` (57), `GRADE_SLOTS`. Helper `stats.ts` (`STAT_LIST`/`statLine`/`statRange`/`modsForStat`/`gradeSlotTotal`). Coberto por testes. **Pré-requisito do U11.**
- **D5 (P2):** v2.2.0 — **Calculadora de derretimento (Alchemy/Cubo)** — gerador `gen-melt.cjs` → `meltData.json` (5.744 itens: `itemSell` + `itemCubeExp`); `Logic/Melt.cs` (`Melt.Summarize`) soma ouro + XP de Cubo do gear **excluindo equipados e Legendary+**, com quebra por raridade; `SaveParser.ParseMelt` → `Snapshot.Melt`; widget **"Derretimento (Alchemy)"** no Dashboard. Coberto por `MeltTests`.

## Pets — `PetSaveData[]`
- **PE1 (P2):** v2.2.0 — **Pets no Dashboard** — `SaveParser.ParsePets` lê `PetSaveData[]` → `Snapshot.Pets`; widget **"Pets"** (liga/desliga + colapsável) reusando o corpus **W6 `pets.json`**: desbloqueados/total, bônus do pet ativo (não cumulativo) e lista dos 8 pets. *Aberto:* campo do pet equipado no save (ver BUG-PET-ATIVO).

## Runas — `RuneSaveData[]`
- **R3 (P2):** v0.16.0 — **Runa-alvo** — marcar uma runa como alvo e calcular **quanto ouro falta** considerando pré-requisitos (caminho de menor custo até a raiz + níveis restantes), com progresso %. Card no Dashboard + seleção persistida (`runeTargetKey`).
- **R4 (P2):** v2.3.0 — **Custo para maximizar todas as runas** — `Runes.SummarizeMaxCost` soma o ouro de levar **todos os nós a todos os níveis** (catálogo `runeTree`) e cruza com os níveis atuais para mostrar **custo total**, **já investido**, **quanto falta** e **% / níveis adquiridos**. Card "Maximizar todas as runas" na aba **Runas**. Soul stones não entram no ouro. Coberto por `RunesTests`.

## Onboarding / chave ES3 (infra)
- **K1 (P1):** v0.18.0→v0.19.0 — **Localizar chave ES3 automaticamente** — localiza a instalação (Steam), lê `resources.assets` (asset `ES3Defaults`) **somente leitura** e valida as strings candidatas contra o save. Consentimento nativo; chave via `safeStorage`, nunca exposta ao renderer. `keyFinder.ts` + IPC `tbh:findKey`. *Pendente opcional:* Proton/Linux (I11).

## Atualizações do jogo
- **N1 (P2):** v0.17.0 — **Aba Atualizações** (com U9) — patch notes/anúncios via **Steam News API** (`appid=3678970`), com BBCode/HTML limpos e link externo. `news.ts` (cache 10 min). Só GET HTTPS público.

## Aplicativo / engenharia (infra)
- **I7 (P2):** v1.3.0 — **JSON bruto sob demanda** (dívida técnica) — o snapshot deixou de carregar o save bruto a cada leitura; o visualizador busca o `raw` sob demanda via IPC (`tbh:getRawSave`).
- **I8 (P2):** v1.4.0 — **Suíte de testes** — lógica pura coberta (estágios, baús, itens, runas, export, `StageFarmTracker`). Protege contra regressão ao regenerar catálogos. *(Migrada para xUnit no app .NET.)*
- **I9 (P2):** v2.2.0 — **Painel de diagnóstico** — aba **"Diagnóstico"** com estado/caminho/chave do save, heartbeat, última leitura e avisos de catálogo desatualizado (ItemKeys fora do catálogo, gear sem melt, estágio não reconhecido). Somente leitura. Sinergia com N2.
- **E1 (P3):** v1.3.0 — **Exportação de dados** — botões na **Aba de Farm** exportam sessão em **JSON** (ouro G3 + farm F2/F3 + inventário D3 + heróis) e farm em **CSV** (`shared/export.ts` + IPC `tbh:saveTextFile`).
- **I10 (P3):** v1.3.0 — **Persistir estado da janela** — tamanho/posição/maximizado lembrados entre sessões (`getWindowState`/`setWindowState`).
- **I14 (P2):** v2.3.0 — **Passe de arquivamento do backlog** — movidos os ✅ de **v0.16 → v2.3.0** para este arquivo, deixando em `BACKLOG.md` só o que está a fazer/parado; cabeçalho de corte resetado (dívida do ciclo v0→v2 quitada; próximo corte regular v2.5.0).

## UI / TBHPedia
| # | Versão | Item | Notas |
|---|--------|------|-------|
| U2 (P1) | v0.20.0 | Aba de **Farm** (ouro/h, xp/h, melhores estágios, histórico) | `Farm` + medições F2/F3 + recomendação F4 |
| U9 (P2) | v0.17.0 | Aba **Atualizações** (patch notes/anúncios da Steam) | Entregue junto do N1 |
| U10 (P2) | v1.1.0 | **Dashboard customizável** — widgets liga/desliga + seções colapsáveis, layout persistido | Painel "Personalizar" + cabeçalhos colapsáveis; `dashboardWidgets` + `DashboardLayout` persistido. JSON bruto desligado por padrão |
| U11 (P2) | v1.7.0 | **Itens na TBHPedia** com **filtro por status (bônus)** + lista de seleção de bônus | Seção **"Bônus de itens"** (`ItemBonusExplorer`) consumindo o catálogo D4 (117 status, faixas min–max, slots por raridade). Afixos por instância seguem pendentes (save) |

## Épico W — TBHPedia completa (fundação + domínios entregues na v2.1.0)
- **W0 (P2):** v2.1.0 — Levantamento + **esquema canônico** (`docs/PEDIA-CORPUS.md`; regras de conflito/autoridade; PT-BR canônico).
- **W1 (P2):** v2.1.0 — **Pipeline de ingestão** reutilizável — `scripts/pedia/lib.cjs` (extração do payload RSC do Next.js + parser de JSON balanceado) → `Core/Data/pedia/*.json`, carregado por `Catalog`.
- **W2 (P2):** v2.1.0 — **Domínio Heróis** — `gen-pedia-heroes.cjs` → `heroes.json` (6 heróis: stats base, ataque base, árvore passiva/ativa).
- **W3 (P2):** v2.1.0 — **Domínio Runas** — `gen-pedia-runes.cjs` → `runes.json` (197 runas + 195 edges + 8 categorias).
- **W5 (P2):** v2.1.0 — **Domínio Estágios/Farm/Monstros/Mapa** — `gen-pedia-map.cjs` → `map.json` (120 estágios com monstros, boss e drops). Sinergia: F0/S5/S6/G4.
- **W6 (P3):** v2.1.0 — **Domínio Pets** — `gen-pedia-pets.cjs` → `pets.json` (8 pets: stats + desbloqueio/farm). Sinergia: PE1.
- **W9 (P2):** v2.1.0 — **TBHPedia unificada na UI** — busca global, navegação agrupada, 6 componentes de domínio, cross-links e atribuição de fonte ("atualizado em <data>").
> **Pendentes do épico** (seguem no `BACKLOG.md`): W4 (DB de itens/afixos), W7 (Cubo/Soul Stones/mecânicas) e W8 (guias em prosa, deferido). W4/W7 saíram **parciais** na v2.1.0 (Efeitos de material e Baús, respectivamente).
