# Changelog — TBH-Tracker

## Esquema de versão

Versão no formato **`va.b`** (por enquanto):

- **`a`** — incrementa a cada **nova implementação** (feature/funcionalidade nova). Ao subir `a`, `b` zera.
- **`b`** — incrementa a cada **fix** (correção de bug/ajuste).

Exemplos: `v1.0` → nova feature → `v2.0`; `v2.0` → correção → `v2.1`.

> No `package.json` a versão é gravada como `a.b.0` (semver válido); o app exibe `va.b`.
> Cada versão deve ter uma tag git (`vA.B`).

---

## v4.0 — Baús por tipo + alerta de acúmulo

Item de qualidade de vida (B2), sem tocar no agente de detecção de corridas.

### Adicionado
- **Baús separados por tipo** no dashboard. `BoxData` são arrays paralelos
  (`BoxTypes`/`BoxUniqueId`/`BoxQuantity`); a contagem agrupa por `BoxTypes` e
  soma `BoxQuantity`. Exibe as três categorias do jogo — Comum (300s) · Estágio
  (600s) · Ato (sem auto-abrir) — com quantidade, cor e cooldown de auto-abrir.
- **Alerta de transbordo (B2):** o card "Baús" e um banner mudam de cor quando os
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

## v3.0 — Farm analytics: detecção de corridas

Início da Fase 2 (farm analytics).

### Adicionado
- **Detecção de corridas (F1, parcial):** corridas contadas pelo **contador cumulativo
  de clears** do save (`aggregateSaveDatas` Type 15 / SubKey 0). Entre dois snapshots no
  mesmo estágio: nº de corridas = Δcontador e tempo por corrida = Δ`playTime` ÷ Δcontador.
  Validado por amostragem ao vivo.
- **Aba Corridas:** histórico persistente (estágio + duração + quando), resumo
  (total, duração média, estágios farmados) e agregação por estágio. Botão para limpar.
- Persistência local das corridas (`tbh-tracker-runs.json` em userData).

### Corrigido
- A detecção inicial usava a transição `currentStageWave > 0 → 0`, mas o jogo autossalva
  esparsamente (~28-30s) e o instante do clear quase nunca era gravado, fazendo o tempo
  agregar várias corridas (ex.: 1‑1 real ~26s marcava 2m46s). Trocado pelo método de
  contador cumulativo, que é exato mesmo com save esparso.
- Outliers curtos (ex.: corridas de ~11-13s que não constavam no log do jogo): o save
  grava também **fora de ciclo** e o clear às vezes caía numa janela curta entre dois
  saves, enquanto a janela vizinha (com a maior parte do playTime) ficava com 0 clears.
  Corrigido medindo **de clear-a-clear** (a baseline só avança quando o contador sobe,
  acumulando playTime através dos saves intermediários) e descartando a 1ª medição após
  iniciar/trocar de estágio (warm-up).

### Alterado
- **Leitura do save a cada 2 minutos** (antes: a cada gravação, ~28s), para reduzir a
  frequência de descriptografia. As informações do app atualizam nesse intervalo.
- A marcação de corridas **recomeça no próximo clear** após iniciar o monitoramento ou
  limpar o histórico (o detector é reancorado), evitando que a 1ª corrida registrada some
  o tempo acumulado de antes.

### Notas / limitações
- O tempo por corrida pode ter um leve viés (poucos segundos) porque o save que registra
  o clear às vezes chega um pouco depois do clear de fato; sem os outliers grosseiros de
  antes. A média de muitas corridas converge para o valor real. Ouro/xp por corrida virão na F2.

Backlog: F1 (parcial — estágio + tempo).

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
