# TBH-Tracker

Tracker **somente leitura** para **TBH: Task Bar Hero**. Lê o arquivo de save do jogo,
descriptografa, interpreta o progresso e mostra um dashboard — **sem nunca tocar no jogo,
na memória ou no save**.

> Leia `docs/PLAN.md` (plano), `docs/BACKLOG.md` (backlog) e `docs/TBHPEDIA.md` (base de
> conhecimento do jogo). A postura de segurança é inegociável: 100% passivo e externo.

## Stack

- **.NET 9** **MAUI Blazor Hybrid** (Windows): UI em **Razor/Blazor**, lógica em **C#**.
- Solução em `dotnet/` (`TbhTracker.sln`): `TbhTracker.Core` (lógica pura, sem deps de
  plataforma), `TbhTracker.App` (app MAUI) e `TbhTracker.Tests` (xUnit).

> A versão original em **Electron + Vite + React + TypeScript** vive em `src/` e foi migrada
> integralmente para C# (ver `CHANGELOG.md`, v2.0.0). Os geradores de catálogo/asset em
> `scripts/*.cjs` continuam como tooling Node de build.

## Pré-requisitos

- **.NET SDK 9** com o workload MAUI: `dotnet workload install maui`.

## Como rodar

```bash
cd dotnet
dotnet build TbhTracker.sln          # compila Core + App + Tests
dotnet run --project TbhTracker.App  # executa o app (Windows)
dotnet test TbhTracker.Tests         # roda a suíte xUnit
```

## Primeiro uso

1. Abra o app. Ele tenta localizar o save automaticamente em
   `%USERPROFILE%\AppData\LocalLow\TesseractStudio\TaskbarHero\SaveFile_Live.es3`.
   Se não achar, use **Escolher SaveFile_Live.es3**.
2. Informe a **chave de descriptografia ES3**, de uma de duas formas:
   - **Localizar automaticamente** (recomendado): clique em **Localizar chave**. Após um
     **aviso de consentimento**, o app lê (somente leitura) os arquivos de instalação do
     jogo — o `resources.assets`, onde o Easy Save 3 guarda a senha — e a valida contra o
     seu save. Não toca no processo/memória do jogo e não acessa a internet.
   - **Manual**: cole a chave no campo e clique em **Salvar**.

   A chave é guardada localmente e **cifrada pelo sistema operacional** (DPAPI /
   `ProtectedData`); nunca sai da máquina nem é commitada.
3. O dashboard começa a monitorar e re-lê o save automaticamente quando ele muda no disco.

> A chave ES3 **não** acompanha este repositório por questões legais e de segurança — você
> a fornece localmente.

## Arquitetura

```
dotnet/
  TbhTracker.Core/        class library (sem deps de plataforma)
    Es3Crypto             descriptografia Easy Save 3 (AES-128-CBC + PBKDF2-SHA1)
    SaveParser            JSON do save -> Snapshot tipado (busca defensiva)
    Logic/                runes, stage, stats, attributes, boxes, cube, export, heroes, items
                          + goldFlow, stageEvents, heroEvents, stageFarm, history
    Models/               records/DTOs (ex-types.ts) + catálogos JSON embutidos
  TbhTracker.App/         app MAUI Blazor Hybrid (Windows)
    Services/             Locator, KeyFinder, SaveWatcher, ConfigStore, HistoryStore,
                          NewsService, Tracker, TrackerApi (DI; substitui o IPC do Electron)
    Components/           shell + abas em Razor (Dashboard, Farm, Heroes, Attributes,
                          Inventory, TbhPedia, Updates, KeyPanel, StatusBar, RuneTree)
    wwwroot/              styles.css + assets (heroes/runes/attributes)
  TbhTracker.Tests/       suíte xUnit (regressão da lógica do Core)
```

> A árvore `src/` (Electron/React/TS original) é mantida como referência histórica.

### Detalhe do formato ES3

O `SaveFile_Live.es3` usa Easy Save 3 com AES-128-CBC. Os **16 primeiros bytes** são o IV,
que também serve de **salt** no PBKDF2-SHA1 (100 iterações, chave de 16 bytes). O restante é
o ciphertext PKCS7. O conteúdo descriptografado é JSON.

## Status

- **Migração para C# concluída (v2.0.0).** App MAUI Blazor Hybrid com paridade de
  funcionalidades: Dashboard (ouro, estágio DAPP, onda, estágio máximo, cubo, baús, heróis,
  tempo de jogo + widgets/customização), Farm, Heroes, Attributes, Inventory, TbhPedia,
  Updates, painel de chave e StatusBar; estados de conexão (monitorando / sem chave / sem
  save / erro). Cobertura de regressão via xUnit (73 testes).

## Licença

MIT.
