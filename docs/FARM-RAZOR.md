# Componente `Farm.razor`

Aba de **Farm** do TBH-Tracker. Reúne, em uma única tela, as **medições de farm da
sessão** (ouro/h e XP/h por estágio), o **progresso por dificuldade** e o **ranking dos
melhores estágios** do catálogo, além de um **conselho de nível** para o estágio atual e
botões de **exportação/limpeza**.

- **Arquivo:** `dotnet/TbhTracker.App/Components/Tabs/Farm.razor`
- **Dependências de lógica:** `Stages` e `StageFarmTracker` (`TbhTracker.Core.Logic`),
  `Export` (`TbhTracker.Core.Logic.Export`), `TrackerApi` (`TbhTracker.App.Services`).

---

## Entrada

O componente é puramente orientado pelo `Snapshot` recebido como parâmetro — ele não lê o
save diretamente.

```48:49:dotnet/TbhTracker.App/Components/Tabs/Farm.razor
@code {
    [Parameter] public Snapshot? Snapshot { get; set; }
```

Campos do `Snapshot` consumidos:

| Campo | Uso |
|---|---|
| `Stage.Raw` | Estágio atual (destaque "atual" / "você está aqui" e conselho de nível). |
| `MaxCompletedStage.Raw` | Estágio máximo concluído → progresso e filtro de "melhores estágios". |
| `Heroes` (ativos) | Nível médio dos heróis ativos para o conselho de nível. |
| `StageFarm` | Medições acumuladas (`Entries`, `TotalSeconds`, `CurrentStageRaw`). |

Quando `Snapshot == null`, os botões de exportar/limpar ficam desabilitados.

---

## Estrutura da tela

A `render` principal é enxuta: uma barra de exportação seguida de quatro fragmentos.

```7:20:dotnet/TbhTracker.App/Components/Tabs/Farm.razor
<div class="farm">
    @* ExportBar *@
    <div class="farm-export">
        <span class="card__hint">Exportar:</span>
        <button class="btn btn--ghost btn--sm" @onclick="ExportJson" disabled="@(Snapshot == null)">Sessão (JSON)</button>
        <button class="btn btn--ghost btn--sm" @onclick="ExportCsv" disabled="@(Snapshot == null)">Farm (CSV)</button>
        <button class="btn btn--ghost btn--sm" @onclick="ClearData" disabled="@(Snapshot == null)">Limpar</button>
    </div>

    @RenderLevelAdvice()
    @RenderMeasurements()
    @RenderProgress(maxRaw)
    @RenderBestStages(currentRaw)
</div>
```

1. **Barra de exportação** — exporta sessão (JSON), farm (CSV) ou abre o modal de limpeza.
2. **`RenderLevelAdvice`** — banner de sub/over-level no estágio atual.
3. **`RenderMeasurements`** — tabela das medições reais da sessão.
4. **`RenderProgress`** — barras de conclusão por dificuldade/ato.
5. **`RenderBestStages`** — ranking do catálogo com filtros e ordenação.

---

## 1. Conselho de nível — `RenderLevelAdvice()`

Compara o **nível médio dos heróis ativos** com o **nível recomendado** do estágio atual
(via `Stages.ComputeLevelAdvice`) e mostra um banner colorido:

- **`under`** (`alert--warn`): ativos ~N níveis **abaixo** do recomendado → clear lento/arriscado.
- **`over`** (`alert--info`): ativos ~N níveis **acima** → **penalidade de XP por over-level**.
- **`ok`** (`alert--ok`): nível adequado.
- **`unknown`** ou sem nível recomendado → o banner não é renderizado.

As margens de classificação vêm de `Stages`: `under` quando o delta ≤ −3 e `over` quando
≥ +5 (`UnderLevelMargin` / `OverLevelMargin`).

---

## 2. Medições da sessão — `RenderMeasurements()`

Mostra as taxas **medidas de verdade** durante a sessão (não estimativas de catálogo).
Quando não há dados, exibe um aviso explicando que é preciso ao menos dois saves no mesmo
estágio.

Colunas da tabela `farmtable`:

| Coluna | Origem (`StageFarmEntry`) | Formato |
|---|---|---|
| Estágio | `StageRaw` → `Stages.StageDataForRaw` (`Label`/`Name`) | rótulo + nome; marca **atual** |
| Dificuldade | `Difficulty` → `Stages.DifficultyName` | texto |
| Tempo | `Seconds` | `FmtDuration` |
| Ouro/h | `GoldPerHour` | `FmtRate` |
| XP/h | `ExpPerHour` | `FmtRate` |
| Clears/h | `ClearsPerHour` | `FmtClearsRate` |
| Tempo/clear | `SecondsPerClear` | `FmtDuration(..., forceSeconds: true)` |
| Clears (est.) | `Clears` | `FmtNum` |

Cabeçalho mostra `FmtDuration(farm.TotalSeconds)` de farm observado e a contagem de estágios.
A linha do estágio corrente recebe a classe `farmtable__row--current`.

**Ordenação:** clicar em *Estágio*, *Ouro/h* ou *XP/h* chama `HandleMeasureSort`, que
alterna asc/desc (`_sortMeasureColumn` / `_sortMeasureAscending`, padrão `Stage` desc). O
valor de ordenação vem de `MeasureGetValueByColumn`.

### De onde vêm as medições (`StageFarmTracker`)

As entradas são produzidas pelo `StageFarmTracker` (`TbhTracker.Core.Logic`), que acumula
deltas entre leituras consecutivas do save **apenas enquanto o estágio fica estável**:

```69:99:dotnet/TbhTracker.Core/Logic/StageFarmTracker.cs
public StageFarm? Record(long at, string? stageRaw, double? gold, double? totalExp, double? totalKills)
{
    var canAttribute = _lastAt != null && _lastStageRaw != null
        && stageRaw != null && stageRaw == _lastStageRaw;

    if (canAttribute)
    {
        var dt = (at - _lastAt!.Value) / 1000.0;
        if (dt > 0 && dt <= MaxGapSeconds)
        {
            var bucket = Bucket(stageRaw!);
            bucket.Seconds += dt;
            bucket.Reads += 1;
            bucket.LastAt = at;
            if (gold != null && _lastGold != null)
                bucket.GoldGained += Math.Max(0, gold.Value - _lastGold.Value);
            if (totalExp != null && _lastExp != null)
                bucket.ExpGained += Math.Max(0, totalExp.Value - _lastExp.Value);
            if (totalKills != null && _lastKills != null)
                bucket.KillsGained += Math.Max(0, totalKills.Value - _lastKills.Value);
        }
    }
    ...
}
```

Regras-chave (anti-ruído):

- **`MaxGapSeconds = 180`** — intervalos maiores que 3 min (jogo parado/fechado) são
  descartados, evitando inflar o tempo.
- **Troca de estágio** entre leituras descarta o delta (só atribui se `stageRaw` é igual ao
  anterior).
- **Deltas negativos** (ex.: gasto de ouro) são zerados via `Math.Max(0, ...)`.
- **`MinSecondsForRate = 20`** — só calcula ouro/h e XP/h depois de acumular ≥ 20 s no
  estágio (`rateOk`).
- **Clears estimados** = `KillsGained ÷ inimigos por clear do catálogo`. O **tempo/clear** e
  ouro/XP por clear derivam dessa estimativa. Estágios fora do catálogo (ex.: boss de ato)
  não têm estimativa de clears.

Essas medições são **persistidas por save** entre sessões (via `Serialize`/`Restore`).

---

## 3. Progresso por dificuldade — `RenderProgress(maxRaw)`

Usa `Stages.StageProgress(maxRaw)` para calcular, por dificuldade (Normal → Torment), a
**% de fases concluídas** do catálogo (1–9 por ato, sem boss), com uma barra de progresso e
a quebra por ato. Atos 100% concluídos recebem a classe `progress__act--done`.

---

## 4. Melhores estágios — `RenderBestStages(currentRaw)`

Ranking teórico do **catálogo** (não da sessão) via `Stages.RankStages`:

```281:286:dotnet/TbhTracker.App/Components/Tabs/Farm.razor
var maxRaw = Convert.ToInt32(Snapshot?.MaxCompletedStage?.Raw);
var rankedRaw = Stages.RankStages(_metric, _difficulty == 0 ? null : _difficulty, TopLimit, maxRaw);

var ranked = (_sortBestStageAscending
? rankedRaw.OrderBy(s => BestStageGetValueByColumn(s, _sortBestStageColumn))
: rankedRaw.OrderByDescending(s => BestStageGetValueByColumn(s, _sortBestStageColumn))).ToList();
```

- **Filtra apenas estágios habilitados:** `RankStages` recebe `MaxStage` =
  `MaxCompletedStage`, então só lista estágios com `Key <= MaxStage`.
- **`TopLimit = 12`** estágios.

**Filtros (chips):**

- **Métrica** (`_metric`): `gold` (Ouro/HP), `exp` (XP/HP) ou `combo` (ouro + XP
  equilibrados, normalizados pelo máximo de cada um).
- **Dificuldade** (`_difficulty`): `Todas` (0) ou 1–4.

**Colunas:** `#`, Estágio (rótulo/nome + dificuldade + nº de inimigos), Nível, Ouro/clear
(`ExpectedGold`), XP/clear (`ExpectedEXP`), Ouro/HP, XP/HP. Todas ordenáveis via
`HandleBestStageSort` (padrão `GoldPerHP` desc). O estágio atual é marcado com "você está aqui".

---

## Exportação e limpeza

```95:120:dotnet/TbhTracker.App/Components/Tabs/Farm.razor
private void ExportJson()
{
    if (Snapshot == null) return;
    _ = Api.SaveTextFileAsync($"tbh-sessao-{Export.ExportStamp()}.json", Export.BuildSessionJson(Snapshot));
}
private void ExportCsv()
{
    if (Snapshot == null) return;
    _ = Api.SaveTextFileAsync($"tbh-farm-{Export.ExportStamp()}.csv", Export.BuildFarmCsv(Snapshot));
}
private bool _showClearConfirm;

private void ClearData()
{
    if (Snapshot == null) return;
    _showClearConfirm = true;
}

private void CancelClear() => _showClearConfirm = false;

private void ConfirmClear()
{
    _showClearConfirm = false;
    Snapshot?.StageFarm?.Entries.Clear();
    Api.ClearStageFarmHistory();
}
```

- **Sessão (JSON):** `Export.BuildSessionJson` → arquivo `tbh-sessao-<stamp>.json`.
- **Farm (CSV):** `Export.BuildFarmCsv` → arquivo `tbh-farm-<stamp>.csv`.
- **Limpar:** abre um **modal de confirmação** (`_showClearConfirm`). Ao confirmar, limpa as
  entradas em memória **e** apaga o histórico persistido via `Api.ClearStageFarmHistory()`
  (ação irreversível).

---

## Helpers de formatação

| Helper | Função |
|---|---|
| `Pad4(int)` | Normaliza a chave de estágio para 4 dígitos (`0001`). |
| `FmtNum(double?)` | Número arredondado com separador de milhar (pt-BR); `—` se nulo. |
| `FmtRate(double?)` | `FmtNum` + sufixo `/h`. |
| `FmtClearsRate(double?)` | Como `FmtRate`, mas com 1 casa decimal quando < 10. |
| `FmtDuration(double, forceSeconds)` | Duração legível: `s` (< 60 s ou forçado), senão `min`/`h`/`h min`. |

---

## Estado interno (resumo)

| Campo | Padrão | Papel |
|---|---|---|
| `_metric` | `"gold"` | Métrica do ranking (gold/exp/combo). |
| `_difficulty` | `0` | Filtro de dificuldade do ranking (0 = todas). |
| `_sortBestStageColumn` / `_sortBestStageAscending` | `GoldPerHP` / desc | Ordenação do ranking. |
| `_sortMeasureColumn` / `_sortMeasureAscending` | `Stage` / desc | Ordenação das medições. |
| `_showClearConfirm` | `false` | Visibilidade do modal de limpeza. |
| `TopLimit` | `12` | Itens no ranking. |
