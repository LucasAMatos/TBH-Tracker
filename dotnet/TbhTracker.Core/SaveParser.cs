using System.Text.Json;
using TbhTracker.Core.Logic;
using TbhTracker.Core.Models;
using static TbhTracker.Core.JsonNav;

namespace TbhTracker.Core;

/// <summary>Port de src/main/parser.ts. Constroi um Snapshot tipado a partir do JSON
/// ES3 ja descriptografado (o PlayerSaveData e duplamente codificado: string JSON dentro
/// de {__type, value}).</summary>
public static class SaveParser
{
    private const int GoldKey = 100001;

    /// <summary>Desembrulha e parseia o PlayerSaveData (string JSON dentro do wrapper ES3).</summary>
    public static JsonElement? ExtractPlayer(JsonElement root)
    {
        if (root.ValueKind != JsonValueKind.Object) return null;

        var pdRaw = Pick(root, "PlayerSaveData");
        var pd = UnwrapEs3(pdRaw);
        if (pd.HasValue && pd.Value.ValueKind == JsonValueKind.String)
        {
            var str = pd.Value.GetString();
            if (str != null)
            {
                try
                {
                    using var doc = JsonDocument.Parse(str);
                    pd = doc.RootElement.Clone();
                }
                catch
                {
                    // mantem como string (sera ignorado pelos parsers abaixo)
                }
            }
        }
        if (IsObj(pd)) return pd;
        if (HasProp(root, "commonSaveData") || HasProp(root, "CommonSaveData")) return root;
        return null;
    }

    private static double? ParseGold(JsonElement? player)
    {
        var list = Pick(player, "currenySaveDatas", "currencySaveDatas", "CurrencySaveDatas");
        foreach (var entry in AsArray(list))
        {
            if (!IsObj(entry)) continue;
            var key = ToNumber(Pick(entry, "Key", "key", "CurrencyKey", "Id", "id"));
            if (key == GoldKey)
            {
                var q = ToNumber(Pick(entry, "Quantity", "Value", "value", "Amount", "amount"));
                if (q != null) return q;
            }
        }
        return null;
    }

    private static double? ParseTotalKills(JsonElement? player)
    {
        var list = Pick(player, "aggregateSaveDatas", "AggregateSaveDatas");
        foreach (var entry in AsArray(list))
        {
            if (!IsObj(entry)) continue;
            var type = ToNumber(Pick(entry, "Type", "type"));
            var subKey = ToNumber(Pick(entry, "SubKey", "subKey"));
            if (type == 0 && subKey == 0)
                return ToNumber(Pick(entry, "Value", "value"));
        }
        return null;
    }

    private static List<BoxCount> ParseBoxesByType(JsonElement? player)
    {
        var boxData = Pick(player, "BoxData", "boxData");
        var typesRaw = Pick(boxData, "BoxTypes", "boxTypes");
        if (!IsArray(typesRaw)) return new List<BoxCount>();
        var qtyRaw = Pick(boxData, "BoxQuantity", "boxQuantity");
        var quantities = IsArray(qtyRaw) ? qtyRaw!.Value.EnumerateArray().ToList() : new List<JsonElement>();

        var sums = new Dictionary<string, double>();
        var types = typesRaw!.Value.EnumerateArray().ToList();
        for (var i = 0; i < types.Count; i++)
        {
            var tv = ToNumber(types[i]);
            if (tv == null) continue;
            var kind = Boxes.KindFromTypeValue((int)tv.Value);
            if (kind == null) continue;
            var qty = i < quantities.Count ? ToNumber(quantities[i]) ?? 0 : 0;
            sums[kind] = (sums.TryGetValue(kind, out var s) ? s : 0) + qty;
        }

        return Boxes.BoxTypes.Select(meta => new BoxCount
        {
            Kind = meta.Kind,
            Label = meta.Label,
            Quantity = (int)(sums.TryGetValue(meta.Kind, out var q) ? q : 0)
        }).ToList();
    }

    private static int? TotalBoxes(List<BoxCount> boxes)
    {
        if (boxes.Count == 0) return null;
        return boxes.Sum(b => b.Quantity);
    }

    private static List<RuneLevel> ParseRunes(JsonElement? player)
    {
        var list = Pick(player, "RuneSaveData", "runeSaveData", "RuneSaveDatas");
        var outList = new List<RuneLevel>();
        foreach (var entry in AsArray(list))
        {
            if (!IsObj(entry)) continue;
            var key = ToNumber(Pick(entry, "RuneKey", "runeKey", "Key", "key"));
            var level = ToNumber(Pick(entry, "Level", "level"));
            if (key == null || level == null || level <= 0) continue;
            outList.Add(new RuneLevel { Key = (int)key.Value, Level = (int)level.Value });
        }
        return outList;
    }

    private static List<HeroAttributeLevel> ParseHeroAttributes(JsonElement? player)
    {
        var list = Pick(player, "attributeSaveDatas", "AttributeSaveDatas", "attributeSaveData");
        var outList = new List<HeroAttributeLevel>();
        foreach (var entry in AsArray(list))
        {
            if (!IsObj(entry)) continue;
            var key = ToNumber(Pick(entry, "Key", "key", "AttributeKey", "attributeKey"));
            var level = ToNumber(Pick(entry, "Level", "level"));
            if (key == null || level == null || level <= 0) continue;
            outList.Add(new HeroAttributeLevel { Key = (int)key.Value, Level = (int)level.Value });
        }
        return outList;
    }

    private static List<string> ParseArrangedHeroKeys(JsonElement? common)
    {
        var arranged = Pick(common, "arrangedHeroKey", "ArrangedHeroKey", "ArrangedHeroKeys");
        var outList = new List<string>();
        if (IsArray(arranged))
        {
            foreach (var v in arranged!.Value.EnumerateArray())
            {
                var n = ToNumber(v);
                if (n != null && n > 0) outList.Add(((long)n.Value).ToString());
            }
            return outList;
        }
        var num = ToNumber(arranged);
        if (num != null && num > 0) outList.Add(((long)num.Value).ToString());
        return outList;
    }

    private static List<HeroSnapshot> ParseHeroes(JsonElement? player, List<string> activeKeys)
    {
        var list = Pick(player, "heroSaveDatas", "HeroSaveDatas");
        var activeSet = new HashSet<string>(activeKeys);
        var outList = new List<HeroSnapshot>();
        foreach (var entry in AsArray(list))
        {
            if (!IsObj(entry)) continue;
            var keyEl = Pick(entry, "heroKey", "HeroKey", "Key", "key", "Id");
            var key = AsString(keyEl) ?? "";
            var level = ToNumber(Pick(entry, "HeroLevel", "Level", "level"));
            var exp = ToNumber(Pick(entry, "HeroExp", "Exp", "exp"));
            outList.Add(new HeroSnapshot
            {
                Key = key,
                Name = Heroes.HeroName(key),
                Level = level != null ? (int)level.Value : null,
                Exp = exp,
                Unlocked = IsTrue(Pick(entry, "IsUnLock", "IsUnlock", "isUnlock")),
                Active = activeSet.Contains(key)
            });
        }
        return outList;
    }

    private static Dictionary<string, string> BuildItemLocationMap(JsonElement? player)
    {
        var map = new Dictionary<string, string>();
        void Set(JsonElement? uidEl, string loc)
        {
            var s = AsString(uidEl);
            if (string.IsNullOrEmpty(s) || s == "0" || s == "-1") return;
            map.TryAdd(s, loc);
        }

        foreach (var hero in AsArray(Pick(player, "heroSaveDatas", "HeroSaveDatas")))
        {
            var equipped = Pick(hero, "equippedItemIds", "EquippedItemIds");
            if (IsArray(equipped))
                foreach (var u in equipped!.Value.EnumerateArray()) Set(u, ItemLocation.Equipped);
        }

        void MarkRows(JsonElement? list, string loc)
        {
            foreach (var row in AsArray(list))
                Set(Pick(row, "ItemUniqueId", "itemUniqueId", "UniqueId", "uniqueId"), loc);
        }
        MarkRows(Pick(player, "stashSaveDatas", "StashSaveDatas"), ItemLocation.Stash);
        MarkRows(Pick(player, "inventorySaveDatas", "InventorySaveDatas"), ItemLocation.Inventory);
        MarkRows(Pick(player, "tradingStashSaveDatas", "TradingStashSaveDatas"), ItemLocation.Trading);

        return map;
    }

    private static InventorySummary? ParseInventory(JsonElement? player)
    {
        var items = AsArray(Pick(player, "itemSaveDatas", "ItemSaveDatas")).ToList();
        if (items.Count == 0) return null;

        var gradeCount = Items.Grades.Count;
        var locations = BuildItemLocationMap(player);

        var rowByType = new Dictionary<string, InventoryRow>();
        foreach (var meta in Items.GearTypes)
        {
            var byLoc = new Dictionary<string, int[]>();
            foreach (var loc in ItemLocation.All) byLoc[loc] = new int[gradeCount];
            rowByType[meta.Id] = new InventoryRow
            {
                GearType = meta.Id,
                Label = meta.NamePt,
                Category = meta.Category,
                ByLocation = byLoc,
                Counts = new int[gradeCount],
                Total = 0
            };
        }

        var locationTotals = ItemLocation.All.ToDictionary(loc => loc, _ => 0);

        var totalItems = 0;
        var gearCount = 0;
        var materialCount = 0;
        var boxCount = 0;
        var unknownCount = 0;
        var legendaryPlus = 0;

        foreach (var entry in items)
        {
            if (!IsObj(entry)) continue;
            totalItems++;
            var uid = AsString(Pick(entry, "UniqueId", "uniqueId", "Id", "id"));
            var loc = uid != null && locations.TryGetValue(uid, out var l) ? l : ItemLocation.Loose;
            locationTotals[loc]++;

            var key = AsString(Pick(entry, "ItemKey", "itemKey", "Key", "key"));
            var info = key == null ? null : Items.ClassifyItem(key);
            if (info == null) { unknownCount++; continue; }
            if (info.Type == "MATERIAL") { materialCount++; continue; }
            if (info.Type == "STAGEBOX") { boxCount++; continue; }

            gearCount++;
            if (info.Marketable) legendaryPlus++;
            var tier = info.GradeTier;
            if (info.GearType != null && rowByType.TryGetValue(info.GearType, out var row)
                && tier >= 0 && tier < gradeCount)
            {
                row.ByLocation[loc][tier]++;
                row.Counts[tier]++;
                row.Total++;
            }
        }

        return new InventorySummary
        {
            TotalItems = totalItems,
            GearCount = gearCount,
            MaterialCount = materialCount,
            BoxCount = boxCount,
            UnknownCount = unknownCount,
            LegendaryPlus = legendaryPlus,
            GradeCount = gradeCount,
            Rows = rowByType.Values.Where(r => r.Total > 0).ToList(),
            LocationTotals = locationTotals
        };
    }

    private static List<PetSnapshot> ParsePets(JsonElement? player, JsonElement? common)
    {
        var list = Pick(player, "PetSaveData", "petSaveData", "PetSaveDatas", "petSaveDatas");
        var outList = new List<PetSnapshot>();

        // Deteccao tolerante do pet ativo/equipado (BUG-PET-ATIVO): o campo exato no save
        // ainda nao foi confirmado, entao tentamos nomes provaveis no player e no common.
        var activeKey =
            ToNumber(Pick(player, "equippedPetKey", "EquippedPetKey", "arrangedPetKey",
                "ArrangedPetKey", "currentPetKey", "CurrentPetKey", "selectedPetKey", "SelectedPetKey"))
            ?? ToNumber(Pick(common, "equippedPetKey", "EquippedPetKey", "arrangedPetKey",
                "ArrangedPetKey", "currentPetKey", "CurrentPetKey", "selectedPetKey", "SelectedPetKey"));

        foreach (var entry in AsArray(list))
        {
            if (!IsObj(entry)) continue;
            var key = ToNumber(Pick(entry, "PetKey", "petKey", "Key", "key"));
            if (key == null) continue;
            var unlocked = IsTrue(Pick(entry, "IsUnlock", "IsUnLock", "isUnlock"));
            var active = (activeKey != null && (int)activeKey.Value == (int)key.Value)
                || IsTrue(Pick(entry, "IsEquip", "isEquip", "Equipped", "equipped", "IsActive", "isActive"));
            outList.Add(new PetSnapshot { Key = (int)key.Value, Unlocked = unlocked, Active = active });
        }
        return outList;
    }

    private static MeltSummary? ParseMelt(JsonElement? player)
    {
        var items = AsArray(Pick(player, "itemSaveDatas", "ItemSaveDatas")).ToList();
        if (items.Count == 0) return null;

        var locations = BuildItemLocationMap(player);
        var candidates = new List<MeltCandidate>();
        foreach (var entry in items)
        {
            if (!IsObj(entry)) continue;
            var key = AsString(Pick(entry, "ItemKey", "itemKey", "Key", "key"));
            var info = key == null ? null : Items.ClassifyItem(key);
            if (info == null || info.Type != "GEAR") continue; // so gear e derretido

            var uid = AsString(Pick(entry, "UniqueId", "uniqueId", "Id", "id"));
            var equipped = uid != null && locations.TryGetValue(uid, out var l) && l == ItemLocation.Equipped;
            candidates.Add(new MeltCandidate
            {
                Key = info.Key,
                GradeTier = info.GradeTier,
                Marketable = info.Marketable,
                Equipped = equipped
            });
        }
        return Logic.Melt.Summarize(candidates);
    }

    public static Snapshot ParseSnapshot(JsonElement root, bool includeRaw = false)
    {
        var player = ExtractPlayer(root);
        var common = Pick(player, "commonSaveData", "CommonSaveData") ?? player;

        var arrangedHeroKeys = ParseArrangedHeroKeys(common);
        var cube = Pick(player, "cubeSaveLevelData", "CubeSaveLevelData");
        var playTime = ToNumber(Pick(common, "playTime", "PlayTime"));
        var boxes = ParseBoxesByType(player);

        var cubeLevel = ToNumber(Pick(cube, "Level", "level"));

        return new Snapshot
        {
            CapturedAt = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
            PlayTimeSeconds = playTime != null ? (int)Math.Floor(playTime.Value) : null,
            Gold = ParseGold(player),
            TotalKills = ParseTotalKills(player),
            Stage = Stages.DecodeStage(AsString(Pick(common, "currentStageKey", "CurrentStageKey"))),
            CurrentWave = ToNumber(Pick(common, "currentStageWave", "CurrentStageWave")) is { } w ? (int)w : null,
            MaxCompletedStage = Stages.DecodeStage(AsString(Pick(common, "maxCompletedStage", "MaxCompletedStage"))),
            CubeLevel = cubeLevel != null ? (int)cubeLevel.Value : null,
            CubeExp = ToNumber(Pick(cube, "Exp", "exp")),
            BoxQuantity = "zero",
            Boxes = boxes,
            Heroes = ParseHeroes(player, arrangedHeroKeys),
            ArrangedHeroKeys = arrangedHeroKeys,
            Runes = ParseRunes(player),
            HeroAttributes = ParseHeroAttributes(player),
            Pets = ParsePets(player, common),
            Inventory = ParseInventory(player),
            Melt = ParseMelt(player),
            Raw = includeRaw && player.HasValue ? player.Value.Clone() : null
        };
    }
}
