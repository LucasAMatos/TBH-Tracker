# TBH-Tracker — Grande Plano

Tracker **somente leitura** para **TBH: Task Bar Hero**. Lê o save do jogo, interpreta o progresso e ajuda a otimizar o farm — sem nunca tocar no jogo.

## 1. Princípios inegociáveis (segurança)

O jogo roda anti-cheat (ACTk) que escaneia processos em segundo plano. Para não dar nenhum motivo técnico de detecção, o tracker:

1. **Só lê** o arquivo de save (`SaveFile_Live.es3`), relendo apenas quando ele muda no disco.
2. **Nunca** lê/escreve a memória do jogo, anexa a processos, injeta DLL ou automatiza input.
3. **Nunca** modifica o save nem força qualquer comportamento no jogo.
4. É **externo e passivo** — mesmo padrão das ferramentas open-source da comunidade (tbh-farm, tbh-copilot, TBH-Optimizer).
5. Mantém **transparência**: documenta o risco residual; a decisão de uso é do jogador.

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
- **Analytics:** corrida = onda volta a 0 (clear); medir tempo/ouro/xp da janela e calibrar com filtros anti-ruído.

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
- **Fase 2 — Farm analytics:** detecção de corridas, ouro/h e xp/h por estágio, histórico persistente, recomendação de melhor estágio (ouro / xp / combo).
- **Fase 3 — Aba TBHPedia:** referência navegável dentro do app (heróis, estágios, cubo, runas, pets, raridades, baús).
- **Fase 4 — Qualidade de vida:** alertas (baús perto de transbordar, level-up, novo estágio), gráficos de sessão, i18n PT/EN.
- **Fase 5 — Extras:** suporte Proton/Linux, marcos do Cubo, calibração de gasto de runas, exportação de dados.

## 5. Estrutura de docs

- `docs/TBHPEDIA.md` — base de conhecimento do jogo (dados).
- `docs/PLAN.md` — este plano.
- `docs/BACKLOG.md` — backlog focada nos pontos observáveis do save.
- Canvas `TBHpedia.canvas.tsx` — versão interativa da TBHPedia.
