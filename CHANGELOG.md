# Changelog — TBH-Tracker

## Esquema de versão

Versão no formato **`va.b`** (por enquanto):

- **`a`** — incrementa a cada **nova implementação** (feature/funcionalidade nova). Ao subir `a`, `b` zera.
- **`b`** — incrementa a cada **fix** (correção de bug/ajuste).

Exemplos: `v1.0` → nova feature → `v2.0`; `v2.0` → correção → `v2.1`.

> No `package.json` a versão é gravada como `a.b.0` (semver válido); o app exibe `va.b`.
> Cada versão deve ter uma tag git (`vA.B`).

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
