# TBH-Tracker

Tracker **somente leitura** para **TBH: Task Bar Hero**. Lê o arquivo de save do jogo,
descriptografa, interpreta o progresso e mostra um dashboard — **sem nunca tocar no jogo,
na memória ou no save**.

> Leia `docs/PLAN.md` (plano), `docs/BACKLOG.md` (backlog) e `docs/TBHPEDIA.md` (base de
> conhecimento do jogo). A postura de segurança é inegociável: 100% passivo e externo.

## Stack

- **Electron** (processo principal em Node) + **Vite** + **React** + **TypeScript**.
- Build orquestrado por **electron-vite**.

## Pré-requisitos

- **Node.js 18+** com **npm** (não vem instalado por padrão nesta máquina — instale via
  [nodejs.org](https://nodejs.org/) ou `winget install OpenJS.NodeJS.LTS`).

## Como rodar

```bash
npm install
npm run dev      # app em modo desenvolvimento (hot reload)
```

Build de produção:

```bash
npm run build
npm run preview
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

   A chave é guardada localmente e **cifrada pelo sistema operacional** (`safeStorage`);
   nunca sai da máquina nem é commitada.
3. O dashboard começa a monitorar e re-lê o save automaticamente quando ele muda no disco.

> A chave ES3 **não** acompanha este repositório por questões legais e de segurança — você
> a fornece localmente.

## Arquitetura (Fase 1 — MVP de leitura)

```
src/
  main/          processo principal (Node): leitura passiva do save
    es3.ts       descriptografia Easy Save 3 (AES-128-CBC + PBKDF2-SHA1)
    locator.ts   localiza o SaveFile_Live.es3 (Windows/Proton)
    keyFinder.ts descobre a chave ES3 no resources.assets do jogo (passivo, com aviso)
    watcher.ts   file watcher com fingerprint (relê só quando muda)
    parser.ts    JSON do save -> snapshot tipado (busca defensiva)
    store.ts     config local (chave via safeStorage, override de caminho)
    tracker.ts   orquestra leitura + estado
    index.ts     janela, ciclo de vida e IPC
  preload/       ponte segura (contextBridge) -> window.tbh
  renderer/      UI React (dashboard, status, painel de chave)
  shared/        tipos + decodificação de estágio (DAPP)
```

### Detalhe do formato ES3

O `SaveFile_Live.es3` usa Easy Save 3 com AES-128-CBC. Os **16 primeiros bytes** são o IV,
que também serve de **salt** no PBKDF2-SHA1 (100 iterações, chave de 16 bytes). O restante é
o ciphertext PKCS7. O conteúdo descriptografado é JSON.

## Status

- **Fase 1 (MVP de leitura): em desenvolvimento.** Dashboard com ouro, estágio (DAPP),
  onda, estágio máximo, cubo, baús, heróis e tempo de jogo; estados de conexão
  (monitorando / sem chave / sem save / erro); visualizador de JSON bruto para calibrar o
  parser contra um save real.
- Próximas fases (farm analytics, aba TBHPedia, qualidade de vida): ver `docs/PLAN.md`.

## Solução de problemas

**`Error: Electron uninstall` ao rodar `npm run dev`** — o postinstall do Electron baixou o
binário mas a extração via `extract-zip` falhou silenciosamente (visto com Node 24 nesta
máquina). O zip fica em `%LOCALAPPDATA%\electron\Cache\...\electron-v*.zip`. Contorno:
extrair o zip manualmente para `node_modules/electron/dist` e criar o `path.txt`:

```powershell
$zip  = (Get-ChildItem "$env:LOCALAPPDATA\electron\Cache" -Recurse -Filter *.zip).FullName
$dist = "node_modules\electron\dist"
Expand-Archive -Path $zip -DestinationPath $dist -Force
Set-Content "node_modules\electron\path.txt" "electron.exe" -NoNewline
```

## Licença

MIT.
