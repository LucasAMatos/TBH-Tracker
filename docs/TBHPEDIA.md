# TBHPedia — base de conhecimento (TBH: Task Bar Hero)

Compilado de referência do jogo, para alimentar o tracker e a aba "TBHPedia" do app.

> Versão interativa (estilo Civilopedia): canvas `TBHpedia.canvas.tsx` (abre ao lado do chat no Cursor).
>
> **Fontes:** páginas oficiais e de comunidade (taskbarhero.org, task-bar-hero.wiki, taskbarhero.xyz, games.gg, mobalytics, ProGameGuides, guia "Task Bar Hero 101" no Steam) e ferramentas open-source (`WcgStark/tbh-farm`, `shigake/tbh-copilot`, `Rupelio/TBH-Optimizer`). Dados de datamine no período de lançamento — **valores podem mudar com patches**.

## Identidade do jogo

- RPG idle hack-and-slash que "ancora" um grupo pixel-art na barra de tarefas do Windows.
- Devs: **Nugem Studio** / **Tesseract Studio**. Free-to-play na Steam (**App ID 3678970**), lançado em **27 mai 2026**.
- Grupo de até **3 heróis** lutando automaticamente; loot estilo Diablo + economia real via Steam Market.

## Loop central

- Renda escala com **clears por hora**, não com nível do estágio.
- Melhor farm = estágio mais alto que o time limpa **rápido e com segurança** (sem morrer). Se o clear demora ou arrisca morte, desce um estágio.
- **Offline não dropa baús** — o jogo precisa estar rodando.

## Heróis (6)

| Herói | Arma | Papel | HP | ATK | Crit | Armor | Atk Spd | Tier | Disponibilidade |
|-------|------|-------|----|-----|------|-------|---------|------|-----------------|
| Knight | Espada/Escudo | Tank | 130 | 2 | 2.5% | 45 | 0.90 | S | Base |
| Ranger | Arco | DPS físico | 60 | 1 | 4% | 8 | 1.00 | B | Base |
| Sorcerer | Cajado | DPS AoE | 50 | 2 | 5% | 5 | 0.55 | A | Base |
| Priest | Cetro | Suporte/Cura | 95 | 1 | 2% | 30 | 0.90 | S | DLC grátis |
| Hunter | Besta | DPS tático | 70 | 2 | 4.5% | 15 | 0.70 | S | DLC pago |
| Slayer | Machado | Bruiser melee | 115 | 2 | 2.5% | 40 | 0.70 | A | DLC pago |

- Começa com 1 slot; abrir 2º/3º (Runa de Comando) é a prioridade nº 1.
- Redeploy tem cooldown de 60s. Classes DLC desbloqueáveis na Formação por 500 moedas.
- Composição grátis: Knight + Priest + Sorcerer. Farm popular: Knight + Ranger + Priest.

## Estágios, Atos & Dificuldades

- **3 Atos × 10 estágios × 4 dificuldades = 120 estágios.**
- X-10 = boss de Ato; exige **Soul Stone** (consumida só ao vencer; falhas são grátis).
- Alcançar um estágio destrava o **nível** de item que dropa ali, mas raridade **não** escala por área.

**Código do estágio (`CurrentStageKey`) = `DAPP`**: Dificuldade (1 Normal · 2 Nightmare · 3 Hell · 4 Torment) + Ato (1–3) + fase (01–10). Ex.: `1101` = Normal/Ato1/Fase1; `2110` = Nightmare/Ato1/boss.

| Dificuldade | Faixa de nível |
|-------------|----------------|
| Normal | 1–32 |
| Nightmare (Pesadelo) | 33–52 |
| Hell (Inferno) | 53–77 |
| Torment (Tormento) | 78–95 |

| Ato | Tema | Boss | Local (X-10) |
|-----|------|------|--------------|
| 1 | Campos Verdes & Terras Amaldiçoadas | Skeleton King | Throne of Darkness |
| 2 | Deserto & Tumbas | Desert Overlord | Pharaoh's Underchannel |
| 3 | Ermos Gelados & Inferno | Archon Morkar | Hell Command Chamber |

Amostra (Normal · Ato 1): `1101` Pasture (Lv1, 10 ondas, 140 ouro, 155 exp, Goblin Thief) · `1102` Shadow Meadow · `1103` Wasteland · `1108` Cemetery (Lv10) · `1110` Throne of Darkness (boss).

## Hero-dric Cube

Hub de crafting; desbloqueia no nível 4. Trade Ship (envio para inventário Steam) exige Cubo **nível 10**.

| Função | Desbloqueio | O que faz |
|--------|-------------|-----------|
| Synthesis | Nível 4 | 9 itens de mesma raridade → 1 de raridade superior (pode pular tiers) |
| Alchemy | Nível 4 | Derrete gear em ouro + XP de Cubo (renda principal) |
| Crafting | Nível 5 | Cria gear/acessórios aleatórios a partir de materiais |
| Decoration | Nível 8 | Gemas de 1 atributo em gear Rare+ |
| Removal | Nível 10 | Remove sockets (destrói material, taxa em ouro) |
| Engraving | Immortal+ | Gravações de material de monstro (2 atributos) |
| Inscription | Arcana+ | +1 atributo aleatório em gear Arcana+ |
| Offering | Endgame | Lootbox por moedas comemorativas |

## Árvore de Runas (197 nós, abre ~nível 3)

| Direção / nó | Foco |
|--------------|------|
| Sul | Runa de Comando → slots 2 e 3 (3º = 150.000 ouro). 2º slot de skill à direita (50.000) |
| Noroeste | Ganho de ouro (por kill, de boss, da Alquimia) |
| Extremo Norte | Inventário, stash, auto-abrir baús (comum 300s / boss 600s) |
| Nordeste | Chance de drop e capacidade de baús |
| Sudeste | Ataque/Armadura/Velocidade de todos os heróis |
| Repose | Recompensas offline (XP/ouro; sem baús) |
| Runa de Despertar | Slot extra de skill por herói |

Prioridade comum: slots de herói → offline → automação Extremo Norte → ouro/XP → Despertar. Nós finais 1–3M; zona de ouro começa ~20M; última stash 50M.

## Pets (8 — sempre ativos e empilháveis; equipar é cosmético)

| Pet | Bônus | Como obter | Origem |
|-----|-------|-----------|--------|
| Bat | +100% baú comum · +150 EXP | 5.000 Bats (City Outskirts) | Grátis |
| Watcher | +150 ouro | 5.000 Giant Fly (Scorching Dunes) | Grátis |
| Burning Skeleton | +100% baú de boss | 5.000 Fire Elemental (Sacred Tomb) | Grátis |
| Blue Golem | +150% baú comum | 5.000 Hell Golem (Burning Ravine) | Grátis |
| Dark Spirit | +150% baú de boss | 5.000 Ghost (Frozen Glacier Cavern) | Grátis |
| Sword | +150 EXP | Supporter Pack | DLC |
| Butterfly | +100 ouro | Supporter Pack | DLC |
| Dragon | +200% baú comum · +150 ouro · +200 EXP | Supporter Pack | DLC |

Apenas kills **online** contam para desbloquear pets. Melhor pago: Dragon. Melhor grátis p/ ouro: Watcher.

## Itens & Raridades (10)

| Raridade | Valor rel. | Vendável no Market | Sockets |
|----------|-----------|--------------------|---------|
| Common | 1× | Não | — |
| Uncommon | 3× | Não | — |
| Rare | 9× | Não | Decoration |
| Legendary | 27× | Sim | Decoration |
| Immortal | 81× | Sim | + Engraving |
| Arcana | 259× | Sim | + Inscription |
| Beyond | 829× | Sim | Todos |
| Celestial | 2.986× | Sim | Todos |
| Divine | 10.750× | Sim | Todos |
| Cosmic | 45.150× | Sim | Todos |

Só Legendary+ é vendável; materiais vendáveis em qualquer raridade. Remover sockets antes de listar.

## Baús & Soul Stones

| Baú | Origem | Auto-abrir |
|-----|--------|-----------|
| Comum (branco) | Drop em combate, qualquer hora | 300s |
| Stage Boss (azul) | Bosses de estágio (chance, +runas) | 600s |
| Act Boss (vermelho) | Bosses de Ato (garantido; consome Soul Stone) | — |

Soul Stones gateiam bosses de Ato (consumidas só ao vencer); dropam de baús (mais no Ato 2+); vendáveis no Market. Red soulstone alquimiza ~9.720 ouro.

## Anti-cheat & segurança (CRÍTICO)

- Jogo usa **ACTk (Anti-Cheat Toolkit)**: detecta modificação de memória, protege o save e **escaneia processos em segundo plano** (speedhacks/editores de memória).
- Punição = **ban permanente do Steam Market** (jogo continua jogável). Política de duas detecções (devs); ~350 contas banidas no início.
- Falsos-positivos: autoclickers/macros, Cheat Engine/trainers de OUTROS jogos, overlays/otimizadores, anti-cheat de outros jogos.

**Postura do TBH-Tracker:** somente leitura do save, relendo quando muda; **nunca** ler/escrever memória, anexar a processos, injetar ou automatizar input; nunca modificar o save. Operação 100% passiva e externa (mesmo padrão de tbh-farm/tbh-copilot). Risco residual existe — decisão de uso é do jogador.

## Save / pontos observáveis

Arquivo: `%USERPROFILE%\AppData\LocalLow\TesseractStudio\TaskbarHero\SaveFile_Live.es3` (Easy Save 3: AES-CBC + PBKDF2-SHA1; chave extraída do `GameAssembly.dll`). Linux/Proton: sob `compatdata/3678970/pfx/...`.

**Cripto (validado):** os 16 primeiros bytes são o IV, usado também como **salt** no PBKDF2-SHA1 (100 iterações, chave de 16 bytes / AES-128-CBC, PKCS7). Chave observada (v1.00.14): `emuMqG3bLYJ938ZDCfieWJ` (também hardcoded no `tbh-copilot`). **Pode mudar com patches.**

**Estrutura real (validada em v1.00.14) — duplamente codificada:** o JSON externo tem `SystemInfo`, `PlayerSaveData`, `AccountSaveData`, cada um no formato ES3 `{ "__type": "string", "value": <...> }`. O `value` de `PlayerSaveData` é uma **string JSON** que precisa de novo `JSON.parse` → objeto `player`. (`SystemInfo.value` é base64 opaco.)

| Caminho real (em `player`) | Conteúdo | Uso |
|----------------------------|----------|-----|
| `commonSaveData.playTime` | Tempo de jogo (s, float) | Relógio das corridas |
| `commonSaveData.currentStageKey` | Estágio atual (DAPP, número) | Onde está farmando |
| `commonSaveData.currentStageWave` | Onda atual | Indicador de progresso (ver nota sobre detecção de corridas) |
| `aggregateSaveDatas[]` `{Type:15,SubKey:0}` | **Contador cumulativo de clears** (+1 por estágio limpo) | Detecção/contagem de corridas |
| `aggregateSaveDatas[]` `{Type:2,SubKey:0}` | Ouro total ganho (SubKey 1/2/3 = por ato) | Ouro/h acumulado |
| `aggregateSaveDatas[]` `{Type:0,SubKey:0}` | Total de kills (SubKeys = IDs de monstro) | Estatísticas |
| `commonSaveData.maxCompletedStage` | Estágio máx. concluído (DAPP) | Progresso / push |
| `commonSaveData.arrangedHeroKey` | Heróis ativos (array; `-1` = slot vazio) | Nº de heróis ativos |
| `currenySaveDatas[]` (sic; `{Key,Quantity}`, Key 100001) | Ouro | Ouro total e ouro/h |
| `heroSaveDatas[]` (`heroKey,HeroLevel,HeroExp,IsUnLock`) | Heróis | Level-ups, XP/h, composição |
| `cubeSaveLevelData.Level/Exp` | Cubo | Marcos (nível 10 = Trade Ship) |
| `BoxData` = arrays paralelos `BoxTypes[]`/`BoxUniqueId[]`/`BoxQuantity[]` | Baús não abertos (lote i: tipo `BoxTypes[i]`, qtd `BoxQuantity[i]`) | Somar `BoxQuantity` agrupando por `BoxTypes` (0=Comum · 1=Estágio · 2=Ato) + alerta de acúmulo |
| `itemSaveDatas[]` (`ItemKey,UniqueId,...`) | Itens/inventário | Drops novos por corrida |
| `RuneSaveData[]` (`RuneKey,Level`) | Runas (197) | Gasto de ouro (calibrar recuperação) |
| `PetSaveData[]` (`PetKey,IsUnlock`) | Pets (8) | Progresso de pets |
| `attributeSaveDatas[]` (`Key,Level`) | Atributos da árvore | — |
| `inventorySaveDatas[]` / `stashSaveDatas[]` | Slots de inventário/stash | Capacidade |

> Nota: o nome do campo de moeda tem typo no próprio jogo (`currenySaveDatas`). heroKey: 101 Knight · 201 Ranger · 301 Sorcerer · 401 Priest · 501 Hunter · 601 Slayer.

> **Detecção de corridas:** o jogo **autossalva esparsamente** (~28-30s, com backups rotativos `SaveFile_Live_N.es3.bak`), então o instante exato do clear (`currentStageWave == 0`) quase nunca é gravado. Em vez disso, contamos corridas pelo **delta do contador cumulativo de clears** (`aggregateSaveDatas` Type 15/SubKey 0) e medimos o tempo por corrida como Δ`playTime` ÷ Δcontador — exato mesmo com save esparso.
