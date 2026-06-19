# TBH-Tracker — Grande Plano

Tracker **somente leitura** para **TBH: Task Bar Hero**. Lê o save do jogo, interpreta o progresso e ajuda a otimizar o farm — sem nunca tocar no jogo.

## 1. Princípios inegociáveis (segurança)

O jogo roda anti-cheat (ACTk) que escaneia processos em segundo plano. Para não dar nenhum motivo técnico de detecção, o tracker:

1. **Só lê arquivos em disco** — o save (`SaveFile_Live.es3`, relendo só quando muda) e, **opcionalmente e com aviso/consentimento explícito**, os arquivos de **instalação do jogo** (ex.: `resources.assets`) para **descobrir a chave ES3 automaticamente** (v0.19.0). Tudo é leitura passiva de arquivo; nada é executado nem alterado.
2. **Nunca** lê/escreve a memória do jogo, anexa a processos, injeta DLL ou automatiza input.
3. **Nunca** modifica o save, os arquivos do jogo, nem força qualquer comportamento no jogo.
4. É **externo e passivo** — mesmo padrão das ferramentas open-source da comunidade (tbh-farm, tbh-copilot, TBH-Optimizer).
5. Mantém **transparência**: documenta o risco residual e **avisa antes** de ler arquivos do jogo; a decisão de uso é do jogador.

## 2. Blocos de construção (independente de stack)

```
[ SaveFile_Live.es3 ]
        │  (file watcher + fingerprint: relê só quando muda)
        ▼
[ Descriptografia ES3 ]  AES-CBC + PBKDF2-SHA1; chave fornecida pelo usuário
        │
        ▼
[ Parser → Snapshot ]  campos observáveis (ver TBHPEDIA.md › Save)
        │
        ├──► [ Catálogo do jogo ]  estágios, heróis, runas, pets, raridades (datamine)
        │
        ▼
[ Motor de analytics ]  detecção de corrida, ouro/h e xp/h por estágio, melhores estágios
        │
        ▼
[ Estado central observável ]  ──►  [ UI com abas ]  +  [ Persistência local (histórico) ]
```

- **Localização do save:** auto-detectar no caminho padrão (Windows; suportar Proton/Linux depois).
- **Chave ES3:** fornecida pelo usuário (campo na UI, guardada com proteção local; ou variável de ambiente). Nunca commitada.
- **Catálogo:** dados de `docs/TBHPEDIA.md` viram JSON de apoio (`farm_stages`, `heroes`, `runes`, `pets`, `rarities`).
- **Analytics:** ⚠️ a hipótese "corrida = onda volta a 0" não se sustentou (save esparso e sem contador de clears; tempo por corrida não é persistido — ver `TBHPEDIA.md › Detecção de corridas`). Caminho preferido: ouro/h e xp/h por estágio (exatos via contadores cumulativos) e, se quiser tempo por corrida, detecção por salto de ouro + leitura mais frequente.

## 3. Decisões em aberto (precisam de você)

| Tema | Opções | Observação |
|------|--------|------------|
| **Stack** | ✅ **Electron + Vite + React + TypeScript** (decidido em 18/06/2026) | Facilita a "aba TBHPedia" rica; mesmo padrão de tbh-farm/tbh-copilot |
| **Escopo do MVP** | Dashboard básico (ouro/estágio/baús) primeiro, farm depois | Ver fases abaixo |
| **TBHPedia no app** | Reaproveitar o conteúdo do canvas/`TBHPEDIA.md` como aba navegável | Conteúdo já compilado |
| **Detectar jogo ativo** | Inferir por mudança do save (seguro) vs. enumerar processo (evitar) | Preferir inferência pelo save |

## 4. Fases

- **Fase 0 — Fundação:** pesquisa + TBHPedia + plano + backlog. ✅ (este documento)
- **Fase 1 — MVP leitura:** ✅ *concluída.* localizar/descriptografar/parsear o save; Dashboard com ouro, estágio (DAPP decodificado), onda, heróis (com nome), cubo, baús, máx. estágio; status (monitorando / sem chave / sem save). Parser calibrado contra save real (estrutura `PlayerSaveData.value` duplamente codificada — ver TBHPEDIA › Save).
- **Fase 2 — Farm analytics:** ✅ *núcleo entregue (v0.20.0).* ouro/h e xp/h por estágio (**F2**, `stageFarm.ts`), histórico persistente (**F3**), recomendação de melhor estágio ouro/xp/combo (**F4**, `rankStages`) e **Aba de Farm** (**U2**), sobre a fundação **F0 (v0.18.0)** (catálogo `stageData.ts`). **F1** (eficiência de farm: clears estimados, clears/h e tempo por clear via kills ÷ inimigos por clear) ✅ v1.2.0 — só o tempo por **corrida individual** segue inviável pelo save. *Pendentes:* **F5** (projeção de estágios não medidos) e o refino da recomendação com medições reais ficam para depois.
- **Fase 3 — Aba TBHPedia:** ✅ v0.2.0 (entregue antes da Fase 2). referência navegável dentro do app (heróis, estágios, cubo, runas, pets, raridades, baús).
- **Fase 4 — Qualidade de vida:** 🚧 alertas (✅ baús acumulando — B2 v0.5.0, por tipo; ✅ nível recomendado vs. nível dos ativos — S5 v1.3.0; pendente: level-up, novo estágio), **dashboard customizável** (✅ v1.1.0 / U10 — widgets liga/desliga + colapsáveis, layout persistido), ~~progresso por dificuldade/ato~~ (✅ v1.3.0 / S6), ~~estado da janela persistido~~ (✅ v1.3.0 / I10), ~~raridade do inventário no Dashboard + destaque Legendary+~~ (✅ v1.5.0 / D2), gráficos de sessão, i18n PT/EN.
- **Fase 5 — Extras:** suporte Proton/Linux, ~~marcos do Cubo~~ (✅ v0.3.0 / C2), ~~níveis/mapa de runas~~ (✅ v0.4.0 / R1), calibração de gasto de runas, ~~exportação de dados~~ (✅ v1.3.0 / E1 — sessão JSON + farm CSV).
- **Fase 6 — TBHPedia completa (Épico W):** ingerir **100% do conhecimento das 5 wikis** da comunidade (`FONTES.md`) e fazer a TBHPedia conter tudo, navegável e cruzado com o save/datamine. Faseado: **W0** (levantamento + esquema canônico) → **W1** (pipeline de ingestão) → **W2–W8** (ingestão por domínio: heróis, runas, itens/efeitos, estágios/monstros, pets, cubo/baús/mecânicas, guias) → **W9** (TBHPedia unificada na UI com busca global e atribuição). Leitura passiva de páginas públicas, preferindo dados estruturados/espelhos, com proveniência e respeito a ToS. Detalhe em `BACKLOG.md › Épico W`.

> **Engenharia / qualidade:** suíte de testes da lógica pura (✅ v1.4.0 / I8 — vitest, `npm test`)
> trava regressões ao regenerar catálogos e ajustar trackers. Próximos de infra no `BACKLOG.md ›
> Aplicativo / engenharia` (I9 diagnóstico, N2 detecção de patch).
>
> **Catálogo de bônus de itens** (✅ v1.6.0 / D4 — `gen-stats.cjs` → `statData.ts` + `stats.ts`):
> tipos de status pt-BR, faixas de rolagem e slots por raridade. Foundation do **U11** (itens na
> TBHPedia + filtro/seleção por status) e insumo do futuro modelo de stats (H10/H11).

## 5. Estrutura de docs

- `docs/TBHPEDIA.md` — base de conhecimento do jogo (dados).
- `docs/PLAN.md` — este plano.
- `docs/BACKLOG.md` — backlog focada nos pontos observáveis do save (só itens a fazer/bloqueados).
- `docs/BACKLOG-HISTORICO.md` — itens entregues, arquivados a cada 5 versões.
- `docs/BACKLOG-ESFORCO.md` — visão do backlog ranqueada por esforço de implementação.
- `docs/FONTES.md` — repositórios, wikis e páginas usados para datamine/catálogos/assets.
- Canvas `TBHpedia.canvas.tsx` — versão interativa da TBHPedia.
