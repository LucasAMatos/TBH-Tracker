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

| # | Prioridade | Item | Observação |
|---|-----------|------|-----------|
| I15 | P3 | Validar features contra o `tbh-meter` (referência) | revisão/benchmark de features-UX vs. `mad-labs-org/tbh-meter` (ver `FONTES.md`); só portar o derivável do save (filtrar memória/DPS/D1) |

> O **C4** (aba Crafting listando as operações de receita do Cubo) era 🟢 — catálogo pequeno/estável
> + leitura do `cubeRecipeSaveDatas` — e foi **entregue na v2.7.0** (ver `BACKLOG.md`/`CHANGELOG.md`).
> O **D9** (contador de Soul Stones no Dashboard) era 🟢 — toda a infra já existia (parser de itens,
> mapa de slots, widgets) — e foi **entregue na v2.6.0** (ver `BACKLOG.md`/`CHANGELOG.md`).
> Os 🟢 anteriores (R4, H14, I14) foram entregues na **v2.3.0** (ver `BACKLOG-HISTORICO.md`). O **C3**
> (curva de XP do Cubo) era 🟢 mas foi **reclassificado para 🟡** — a curva de níveis do Cubo **não
> está** no `gamedata.js` do `tbh-farm` (a fonte dos geradores), então falta resolver a origem dos
> dados (ver abaixo e no `BACKLOG.md`).

## 🟡 Médio — catálogo novo, UI dedicada ou cálculo moderado

| # | Prioridade | Item | Observação |
|---|-----------|------|-----------|
| C3 | P2 | Curva de XP do Cubo por nível | criar catálogo `cube_levels` (100 níveis) cruzando `CubeLevel`/`CubeExp`; **dados não estão no `gamedata.js`** — precisa de outra fonte (datamine direto ou save); sinergia D5 |
| I11 | P3 | Suporte Proton/Linux | `locator` já tem caminhos base (pendente do K1) |
| U4 | P2 | Eventos coloridos / log | Depende de G3/H2/S3 (detecção de eventos) |
| U6 | P3 | i18n PT/EN | Trabalho amplo, porém mecânico |
| G4 | P2 | Calculadora de ouro por kill | Bônus de runa pronto; falta o ouro base por kill (comum × boss) — derivar do W5 (`map.json`) ou entrada manual |
| R6 | P2 | Runa-alvo: validar nível comprado + detalhar upgrades | sobre o R3; relaciona BUG-1 |
| D6 | P2 | Filtros do Inventário (status + raridade) | D4 pronto; afixos por instância pendentes (raridade é 🟢) |
| X1 | P2 | Fluxo de XP no Dashboard | análogo ao Fluxo de ouro (G3); Σ deltas de `HeroExp` |
| X2 | P2 | ETA do próximo level-up (heróis ativos) | depende de X1 (H14 já pronto, v2.3.0: `Heroes.LevelProgress`) |
| I12 | P2 | CI nos PRs (build + testes) | GitHub Actions `dotnet build`+`test`; opcional: check de backlog no PR |
| U13 | P2 | Save → Pedia (deep-links) | reaproveita `PediaNav` (W9); ponte do estado real p/ a entrada da pedia |
| H15 | P2 | Equipamento atual por herói (loadout) | itens equipados (D3); base de UI do H11; vínculo item→herói a confirmar |
| I13 | P2 | Empacotar/distribuir release (MSIX/exe) | artefato instalável do MAUI + passo a passo da release |
| D7 | P2 | Craftings possíveis pelo inventário | cruzar `itemSaveDatas[]` (D3) com catálogo de receitas (a criar); sinergia D5/W7 |
| D8 | P2 | Item-alvo: avisar quando cair no drop | delta de `itemSaveDatas[]` (item novo); não depende de D1; alerta via A3 |
| A5 | P2 | Agrupamento por sessão | sessões por lacunas de `PlayTime`/heartbeat; totais ouro/XP/tempo/clears (I15) |
| H16 | P2 | Snapshot de heróis por sessão/período | estado dos heróis no tempo (nível/XP/comp) via histórico; sem stats ao vivo (H10/H15) (I15) |
| U14 | P2 | Overlay compacto always-on-top | mini-janela com estágio/dificuldade + ouro/h (G3) + XP/h (X1); sem DPS/dano (memória) (I15) |
| I16 | P3 | Auto-update do app | checar release no GitHub + baixar/reiniciar; pré-requisito I13; update p/ MAUI não-empacotado em aberto (I15) |

## 🔴 Difícil — dependências pesadas, catálogos grandes ou modelagem

| # | Prioridade | Item | Tokens ~ | Por que é difícil |
|---|-----------|------|----------|-------------------|
| R2 | P2 | Calibrar gasto de ouro em runas | ~150k | Depende do agente de corridas (parte bloqueada) |
| H13 | P2 | Stats atuais por herói (base + bônus) | ~160k | Consome **H10** (preso nele) + curva de crescimento por nível — estimativa **depois** do H10 |
| D1 | P2 | Detectar drops novos por corrida | ~200k | Depende da **fronteira de corrida**, que segue inviável pelo save (o F1 entregou só eficiência/clears estimados, não a corrida individual) — **bloqueado** |
| H11 | P2 | Analisador de impacto de item (delta de stats com/sem item) | 🔪 ~260k | Depende de H10 + D4 (bônus do item) e dos afixos por instância |
| H10 | P2 | Modelo de stats do personagem (derivar todos os status) | 🔪 ~400k | Save não tem stats finais; modelar base+nível+atributos+equip+runas+pets. Fontes mapeadas (`DB.heroes`/`attributes`/`statMods`/`gear`); abertos: curva por nível + regras de stacking. Pré-req do H11 — **o maior candidato a quebrar** (catálogo de stacking → curva por nível → 1 fonte de stat por vez) |

> **🔪 Candidatos a quebrar antes de implementar (≳ 200k):** **H10** (~400k), **U6** (~280k),
> **H11** (~260k). Para esses, criar subtarefas no
> `BACKLOG.md` (ex.: H10 → catálogo de regras de stacking → curva de crescimento por nível → uma
> fonte de stat por vez; U6 → uma aba/tela por subtarefa) e só então puxar uma subtarefa por PR.

> **Épico W (ingerir as 5 wikis na TBHPedia)** — **entregue na v2.1.0** (W0–W7 + W9; W4/W7 parciais,
> W8 deferido). Detalhe e pendências em `BACKLOG.md`. As fontes estruturadas (`taskbarherowiki.com`)
> foram ingeridas via payload RSC; falta itens-DB/afixos (W4), Cubo/Soul Stones/mecânicas (W7) e os
> guias em prosa (W8, Remix).

> Itens entregues (✅) não aparecem aqui; ver `BACKLOG-HISTORICO.md`.
