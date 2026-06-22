# TBH-Tracker — Backlog por esforço de implementação (visão)

**Visão alternativa** do `BACKLOG.md`, ordenando os itens pendentes do **mais fácil** ao
**mais difícil** de implementar. O **detalhe e a fonte da verdade continuam no `BACKLOG.md`**;
aqui é só o ranking. Atualizar quando entrar/sair item ou mudar a estimativa.

**Escala de esforço:** 🟢 Fácil · 🟡 Médio · 🔴 Difícil.
O esforço considera o quanto já existe pronto (catálogos/infra), a complexidade da lógica e as
**dependências** (item que depende de outro tende a ser mais difícil).

**Coluna `Tokens ~`:** estimativa **grosseira** do custo de implementação em **tokens de agente**
(em milhares), incluindo ler o código relevante, gerar catálogos, escrever lógica + UI + testes,
buildar e iterar. É um chute calibrado, não medição — use só para **priorizar e decidir o que
quebrar**. *Âncora (PR v2.3.0):* R4 ≈ **50k**, H14 ≈ **120k**, I14 (doc) ≈ **80k**.
**🔪 = grande demais para uma tacada só (≳ 200k): quebrar em subtarefas antes de implementar.**
Ao quebrar um item, registre as subtarefas no `BACKLOG.md` (fonte da verdade) e reflita aqui.

## 🟢 Fácil — diffs de snapshot, filtros e dados estáticos

> **Sem itens 🟢 pendentes no momento.** Os últimos (R4, H14, I14) foram entregues na **v2.3.0**
> (ver `BACKLOG-HISTORICO.md`). O **C3** (curva de XP do Cubo) era 🟢 mas foi **reclassificado para
> 🟡** — a curva de níveis do Cubo **não está** no `gamedata.js` do `tbh-farm` (a fonte dos
> geradores), então falta resolver a origem dos dados (ver abaixo e no `BACKLOG.md`).

## 🟡 Médio — catálogo novo, UI dedicada ou cálculo moderado

| # | Prioridade | Item | Observação |
|---|-----------|------|-----------|
| C3 | P2 | Curva de XP do Cubo por nível | criar catálogo `cube_levels` (100 níveis) cruzando `CubeLevel`/`CubeExp`; **dados não estão no `gamedata.js`** — precisa de outra fonte (datamine direto ou save); sinergia D5 |
| A3 | P2 | System tray + notificações nativas | Eventos já existem (B2/H2/S3/R3); falta `Tray`/`Notification` |
| N2 | P2 | Detecção de patch / catálogo desatualizado | Chave/`GameAssembly` + chaves fora do catálogo (avisos já no painel de Diagnóstico, I9) |
| O1 | P3 | Estimador de recompensa offline | `DB.offlineRewards` + `[OfflineReward]` no `Player.log` |
| I11 | P3 | Suporte Proton/Linux | `locator` já tem caminhos base (pendente do K1) |
| H7 | P2 | Herói líder em destaque | Depende de localizar o campo do líder no save |
| A1 | P2 | Tempo de sessão / ativo vs. parado | Inferir por mudança do save |
| U4 | P2 | Eventos coloridos / log | Depende de G3/H2/S3 (detecção de eventos) |
| U5 | P3 | Gráficos de sessão | Depende de histórico em memória |
| U6 | P3 | i18n PT/EN | Trabalho amplo, porém mecânico |
| G4 | P2 | Calculadora de ouro por kill | Bônus de runa pronto; falta o ouro base por kill (V2 do Épico V resolve) |
| R5 | P2 | Progresso visual na árvore de Runas | preencher o fundo do nó por nível adquirido/máx |
| R6 | P2 | Runa-alvo: validar nível comprado + detalhar upgrades | sobre o R3; relaciona BUG-1 |
| D6 | P2 | Filtros do Inventário (status + raridade) | D4 pronto; afixos por instância pendentes (raridade é 🟢) |
| X1 | P2 | Fluxo de XP no Dashboard | análogo ao Fluxo de ouro (G3); Σ deltas de `HeroExp` |
| X2 | P2 | ETA do próximo level-up (heróis ativos) | depende de X1 (H14 já pronto, v2.3.0: `Heroes.LevelProgress`) |
| V0 | P2 | Épico V: metodologia & instrumentação | coleta controlada de deltas isolando multiplicadores |
| V1 | P2 | Épico V: reconciliação catálogo × medido | erro por fase; separa multiplicador global de erro do catálogo |
| V2 | P2 | Épico V: ouro por kill (comum × boss) | desbloqueia G4; valida com `aggregateSaveDatas` |
| V4 | P2 | Épico V: validação cruzada (cumulativos) | `aggregateSaveDatas` Type 2/0 como verdade-terreno |
| V5 | P3 | Épico V: documentação & (opcional) nova wiki | depende de V0–V4; o maior do épico |
| I12 | P2 | CI nos PRs (build + testes) | GitHub Actions `dotnet build`+`test`; opcional: check de backlog no PR |
| U13 | P2 | Save → Pedia (deep-links) | reaproveita `PediaNav` (W9); ponte do estado real p/ a entrada da pedia |
| A4 | P2 | Estatísticas acumuladas (`aggregateSaveDatas`) | ouro/ato + kills/monstro (lifetime); cruza com nomes do W5 |
| H15 | P2 | Equipamento atual por herói (loadout) | itens equipados (D3); base de UI do H11; vínculo item→herói a confirmar |
| I13 | P2 | Empacotar/distribuir release (MSIX/exe) | artefato instalável do MAUI + passo a passo da release |
| D7 | P2 | Craftings possíveis pelo inventário | cruzar `itemSaveDatas[]` (D3) com catálogo de receitas (a criar); sinergia D5/W7 |
| D8 | P2 | Item-alvo: avisar quando cair no drop | delta de `itemSaveDatas[]` (item novo); não depende de D1; alerta via A3 |

## 🔴 Difícil — dependências pesadas, catálogos grandes ou modelagem

| # | Prioridade | Item | Tokens ~ | Por que é difícil |
|---|-----------|------|----------|-------------------|
| R2 | P2 | Calibrar gasto de ouro em runas | ~150k | Depende do agente de corridas (parte bloqueada) |
| H13 | P2 | Stats atuais por herói (base + bônus) | ~160k | Consome **H10** (preso nele) + curva de crescimento por nível — estimativa **depois** do H10 |
| D1 | P2 | Detectar drops novos por corrida | ~200k | Depende da **fronteira de corrida**, que segue inviável pelo save (o F1 entregou só eficiência/clears estimados, não a corrida individual) — **bloqueado** |
| F5 | P2 | Projeção de estágios não medidos | 🔪 ~240k | Modelagem de tempo/retenção de XP; agora pode usar as medições reais (F2/F3, v0.20.0) |
| H11 | P2 | Analisador de impacto de item (delta de stats com/sem item) | 🔪 ~260k | Depende de H10 + D4 (bônus do item) e dos afixos por instância |
| V3 | P2 | Épico V: modelo de XP (clear/kill, over-level, retenção) | 🔪 ~260k | Base do F5; modelagem |
| H10 | P2 | Modelo de stats do personagem (derivar todos os status) | 🔪 ~400k | Save não tem stats finais; modelar base+nível+atributos+equip+runas+pets. Fontes mapeadas (`DB.heroes`/`attributes`/`statMods`/`gear`); abertos: curva por nível + regras de stacking. Pré-req do H11 — **o maior candidato a quebrar** (catálogo de stacking → curva por nível → 1 fonte de stat por vez) |

> **🔪 Candidatos a quebrar antes de implementar (≳ 200k):** **H10** (~400k), **U6** (~280k),
> **H11** (~260k), **V3** (~260k), **F5** (~240k), **V5** (~220k). Para esses, criar subtarefas no
> `BACKLOG.md` (ex.: H10 → catálogo de regras de stacking → curva de crescimento por nível → uma
> fonte de stat por vez; U6 → uma aba/tela por subtarefa) e só então puxar uma subtarefa por PR.

> **Épico W (ingerir as 5 wikis na TBHPedia)** — **entregue na v2.1.0** (W0–W7 + W9; W4/W7 parciais,
> W8 deferido). Detalhe e pendências em `BACKLOG.md`. As fontes estruturadas (`taskbarherowiki.com`)
> foram ingeridas via payload RSC; falta itens-DB/afixos (W4), Cubo/Soul Stones/mecânicas (W7) e os
> guias em prosa (W8, Remix).

> **Épico V (análise empírica de XP & ouro das fases)** — novo épico (jun/2026); detalhe em
> `BACKLOG.md`. V0–V2/V4 são 🟡, V3 é 🟡 (modelagem) e V5 (🟡) é o maior (doc/wiki). Valida/refuta os
> números da wiki com medições do próprio save.

> Itens entregues (✅) não aparecem aqui; ver `BACKLOG-HISTORICO.md`.
