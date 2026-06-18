# Changelog — TBH-Tracker

## Esquema de versão

Versão no formato **`va.b`** (por enquanto):

- **`a`** — incrementa a cada **nova implementação** (feature/funcionalidade nova). Ao subir `a`, `b` zera.
- **`b`** — incrementa a cada **fix** (correção de bug/ajuste).

Exemplos: `v1.0` → nova feature → `v2.0`; `v2.0` → correção → `v2.1`.

> No `package.json` a versão é gravada como `a.b.0` (semver válido); o app exibe `va.b`.
> Cada versão deve ter uma tag git (`vA.B`).

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
