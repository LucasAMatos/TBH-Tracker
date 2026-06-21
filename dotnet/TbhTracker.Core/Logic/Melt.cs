using TbhTracker.Core.Models;

namespace TbhTracker.Core.Logic;

// Port de src/shared/melt.ts (D5). Nucleo puro da calculadora de derretimento/Alchemy:
// o parser monta os candidatos de gear e aqui aplicamos as regras de exclusao (equipado,
// Legendary+) e somamos ouro de venda + XP de Cubo do catalogo meltData.json.

/// <summary>Um item de gear candidato ao derretimento, com o que importa para a regra.</summary>
public sealed class MeltCandidate
{
    public int Key { get; init; }          // ItemKey (consulta no catalogo)
    public int GradeTier { get; init; }    // tier da raridade (indice em Items.Grades)
    public bool Marketable { get; init; }  // Legendary+ (vendavel no Market -> nao derrete)
    public bool Equipped { get; init; }    // equipado em algum heroi -> nao derrete
}

public static class Melt
{
    /// <summary>Ouro de venda + XP de Cubo de um ItemKey (null se fora do catalogo).</summary>
    public static (int Gold, int CubeXp)? MeltOf(int key)
    {
        if (Catalog.Melt.Items.TryGetValue(key.ToString(), out var v) && v.Length >= 2)
            return (v[0], v[1]);
        return null;
    }

    /// <summary>Soma o ouro de venda + XP de Cubo do gear derretivel, excluindo equipados e
    /// Legendary+. ByRarity traz so as raridades com itens, em ordem crescente de tier.</summary>
    public static MeltSummary Summarize(IEnumerable<MeltCandidate> items)
    {
        var byTier = new Dictionary<int, MeltRarityRow>();
        double totalGold = 0;
        double totalCubeXp = 0;
        var itemCount = 0;
        var excludedMarketable = 0;
        var excludedEquipped = 0;
        var noData = 0;

        foreach (var item in items)
        {
            if (item.Equipped) { excludedEquipped++; continue; }
            if (item.Marketable) { excludedMarketable++; continue; }

            var melt = MeltOf(item.Key);
            if (melt == null) { noData++; continue; }

            var (gold, cubeXp) = melt.Value;
            totalGold += gold;
            totalCubeXp += cubeXp;
            itemCount++;

            if (!byTier.TryGetValue(item.GradeTier, out var row))
            {
                row = new MeltRarityRow { Tier = item.GradeTier };
                byTier[item.GradeTier] = row;
            }
            row.Count++;
            row.Gold += gold;
            row.CubeXp += cubeXp;
        }

        return new MeltSummary
        {
            TotalGold = totalGold,
            TotalCubeXp = totalCubeXp,
            ItemCount = itemCount,
            ExcludedMarketable = excludedMarketable,
            ExcludedEquipped = excludedEquipped,
            NoData = noData,
            ByRarity = byTier.Values.OrderBy(r => r.Tier).ToList()
        };
    }
}
