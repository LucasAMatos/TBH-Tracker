# TBH-Tracker — Backlog por esforço de implementação (visão)

**Visão alternativa** do `BACKLOG.md`, ordenando os itens pendentes do **mais fácil** ao
**mais difícil** de implementar. O **detalhe e a fonte da verdade continuam no `BACKLOG.md`**;
aqui é só o ranking. Atualizar quando entrar/sair item ou mudar a estimativa.

**Escala de esforço:** 🟢 Fácil · 🟡 Médio · 🔴 Difícil.
O esforço considera o quanto já existe pronto (catálogos/infra), a complexidade da lógica e as
**dependências** (item que depende de outro tende a ser mais difícil).

## 🟢 Fácil — diffs de snapshot, filtros e dados estáticos

> Nada pendente — todo o tier fácil foi entregue (S5, S6, I7, E1, I10 em **v1.3.0**;
> ver `BACKLOG-HISTORICO.md`). O próximo item mais barato é o tier 🟡 abaixo.

## 🟡 Médio — catálogo novo, UI dedicada ou cálculo moderado

| # | Prioridade | Item | Observação |
|---|-----------|------|-----------|
| D5 | P2 | Calculadora de derretimento (Alchemy) | `DB.itemSell`/`itemCubeExp` + inventário (D3); excluir Legendary+/equipados |
| H12 | P2 | Árvore de atributos por herói (visualizador) | `attributeSaveDatas` × `DB.attributes`/`statMods`; reusa `RuneTree.tsx` |
| A3 | P2 | System tray + notificações nativas | Eventos já existem (B2/H2/S3/R3); falta `Tray`/`Notification` |
| N2 | P2 | Detecção de patch / catálogo desatualizado | Chave/`GameAssembly` + chaves fora do catálogo; sinergia com I9 |
| I9 | P2 | Painel de diagnóstico | Caminho/chave/última leitura + avisos de catálogo velho |
| O1 | P3 | Estimador de recompensa offline | `DB.offlineRewards` + `[OfflineReward]` no `Player.log` |
| I11 | P3 | Suporte Proton/Linux | `locator` já tem caminhos base (pendente do K1) |
| W0 | P2 | Épico W: levantamento das wikis + esquema canônico | Mapear cobertura/estrutura/ToS das 5 wikis; define o corpus. Ponto de partida do épico |
| H7 | P2 | Herói líder em destaque | Depende de localizar o campo do líder no save |
| A1 | P2 | Tempo de sessão / ativo vs. parado | Inferir por mudança do save |
| U4 | P2 | Eventos coloridos / log | Depende de G3/H2/S3 (detecção de eventos) |
| U5 | P3 | Gráficos de sessão | Depende de histórico em memória |
| U6 | P3 | i18n PT/EN | Trabalho amplo, porém mecânico |
| G4 | P2 | Calculadora de ouro por kill | Bônus de runa pronto; falta o ouro base por kill (catálogo de monstros) |

## 🔴 Difícil — dependências pesadas, catálogos grandes ou modelagem

| # | Prioridade | Item | Por que é difícil |
|---|-----------|------|-------------------|
| H10 | P2 | Modelo de stats do personagem (derivar todos os status) | Save não tem stats finais; modelar base+nível+atributos+equip+runas+pets. Fontes mapeadas (`DB.heroes`/`attributes`/`statMods`/`gear`); abertos: curva por nível + regras de stacking. Pré-req do H11 |
| H11 | P2 | Analisador de impacto de item (delta de stats com/sem item) | Depende de H10 + D4 (bônus do item) e dos afixos por instância |
| D1 | P2 | Detectar drops novos por corrida | Depende da **fronteira de corrida**, que segue inviável pelo save (o F1 entregou só eficiência/clears estimados, não a corrida individual) |
| F5 | P2 | Projeção de estágios não medidos | Modelagem de tempo/retenção de XP; agora pode usar as medições reais (F2/F3, v0.20.0) |
| R2 | P2 | Calibrar gasto de ouro em runas | Depende do agente de corridas |
| W1 | P2 | Épico W: pipeline de ingestão das wikis | Parsing heterogêneo (RSC/HTML/espelho) + normalização; fundação do épico |
| W9 | P2 | Épico W: TBHPedia unificada na UI | Busca global + cross-links + atribuição sobre todo o corpus |

> **Épico W (ingerir as 5 wikis na TBHPedia)** — épico grande e faseado; detalhe em `BACKLOG.md`.
> Fundação: **W0** (levantamento + esquema canônico, 🟡) e **W1** (pipeline, 🔴). Ingestão por
> domínio **W2–W8** (🟡 cada, incremental). Unificação na UI **W9** (🟡–🔴).

> Itens entregues (✅) não aparecem aqui; ver `BACKLOG-HISTORICO.md`.
