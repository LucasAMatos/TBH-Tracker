# TBH-Tracker — Backlog por esforço de implementação (visão)

**Visão alternativa** do `BACKLOG.md`, ordenando os itens pendentes do **mais fácil** ao
**mais difícil** de implementar. O **detalhe e a fonte da verdade continuam no `BACKLOG.md`**;
aqui é só o ranking. Atualizar quando entrar/sair item ou mudar a estimativa.

**Escala de esforço:** 🟢 Fácil · 🟡 Médio · 🔴 Difícil.
O esforço considera o quanto já existe pronto (catálogos/infra), a complexidade da lógica e as
**dependências** (item que depende de outro tende a ser mais difícil).

## 🟢 Fácil — diffs de snapshot, filtros e dados estáticos

| # | Prioridade | Item | Por que é fácil |
|---|-----------|------|-----------------|
| H2 | P1 | Detectar level-ups | Comparar `HeroLevel` entre snapshots |
| S3 | P1 | Detectar troca de estágio / novos desbloqueados | Diff de `CurrentStageKey`/`MaxCompletedStage` |
| A2 | P2 | Heartbeat de status | Sinal quando não há mudança no save |
| B3 | P2 | Estimar cooldowns de auto-abrir | Valores fixos (300s/600s), informativo |

## 🟡 Médio — catálogo novo, UI dedicada ou cálculo moderado

| # | Prioridade | Item | Observação |
|---|-----------|------|-----------|
| H8 | P2 | Retratos/ícones dos heróis | Baixar assets + mapear por `heroKey` (padrão runas v4.0) |
| H7 | P2 | Herói líder em destaque | Depende de localizar o campo do líder no save |
| R3 | P2 | Runa-alvo + ouro faltante (com pré-requisitos) | Catálogo de custos/arestas já existe (v4.0); falta o cálculo de caminho |
| D2 | P3 | Classificar por raridade + destacar Legendary+ | Fácil se a raridade vier no item; senão precisa catálogo |
| A1 | P2 | Tempo de sessão / ativo vs. parado | Inferir por mudança do save |
| I6 | P0 | Persistência local de histórico | Camada de storage reutilizável por vários itens |
| N1 | P2 | Aba Atualizações (Steam News) | HTTP fetch + render; 1ª feature de rede externa |
| U9 | P2 | Aba Atualizações (UI) | Render do feed do N1 |
| U4 | P2 | Eventos coloridos / log | Depende de G3/H2/S3 (detecção de eventos) |
| U5 | P3 | Gráficos de sessão | Depende de histórico em memória |
| U6 | P3 | i18n PT/EN | Trabalho amplo, porém mecânico |
| G4 | P2 | Calculadora de ouro por kill | Bônus de runa pronto; falta o ouro base por kill (catálogo de monstros) |

## 🔴 Difícil — dependências pesadas, catálogos grandes ou modelagem

| # | Prioridade | Item | Por que é difícil |
|---|-----------|------|-------------------|
| D3 | P2 | Aba Inventário (tipo × raridade + visualização) | Mapear `ItemKey`→tipo/raridade (~5760 itens) + viz |
| U8 | P2 | Aba Inventário (UI) | Depende de D3 |
| D1 | P2 | Detectar drops novos por corrida | Depende de fronteira de corrida (F1, bloqueado) |
| F2 | P1 | Ouro/h e XP/h por estágio | Janela + filtros anti-ruído; base da Fase 2 |
| F3 | P1 | Histórico persistente por estágio | Depende de F2 + storage |
| F4 | P1 | Recomendar melhor estágio | Depende de F2/F3 |
| F5 | P2 | Projeção de estágios não medidos | Modelagem de tempo/retenção de XP |
| U2 | P1 | Aba de Farm | Depende de F1–F4 |
| R2 | P2 | Calibrar gasto de ouro em runas | Depende do agente de corridas |
| F1 | P1 | ⛔ Detectar fim de corrida | **Bloqueado** — save não persiste tempo/clears por corrida |

> Itens entregues (✅) não aparecem aqui; ver `BACKLOG-HISTORICO.md`.
