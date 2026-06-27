namespace TbhTracker.Core.Logic;

// Operações de receita do Cubo (Hero-dric Cube). São 8, identificadas pela CubeKey base
// no save (cubeRecipeSaveDatas). Mapeamento/nomes/requisitos confirmados pela tabela
// "Cube Recipes" da wiki (taskbarhero.wiki/database/cube_recipes) + página do Cubo:
//   100001 Synthesis (padrão) · 200001 Alchemy (Nv1) · 600001 Crafting (Nv5) ·
//   300001 Decoration (Nv8) · 900001 Extraction (Nv10) · 400001 Engraving (Nv15) ·
//   700001 Offering (Nv20) · 500001 Inscription (Nv25).
// O save só expõe a CubeKey + MaxUnlockRecipeKey por linha; o detalhe (ingredientes→
// resultado) de cada receita não vem em nenhuma fonte pública, então listamos as operações
// com nome/descrição/requisito e cruzamos a disponibilidade com o nível do Cubo do save.

public sealed class CubeRecipeMeta
{
    public int CubeKey { get; init; }
    public string Type { get; init; } = "";       // SYNTHESIS, ALCHEMY, ...
    public string Name { get; init; } = "";        // rótulo PT
    public string Description { get; init; } = "";  // resumo PT do tooltip
    public int CubeLevelReq { get; init; }          // nível de Cubo para desbloquear (0 = padrão)
    public bool DefaultUnlocked { get; init; }
}

public static class CubeRecipes
{
    // Ordenadas por requisito de Cubo (== ordem de exibição).
    public static readonly IReadOnlyList<CubeRecipeMeta> All = new[]
    {
        new CubeRecipeMeta { CubeKey = 100001, Type = "SYNTHESIS",   Name = "Síntese",    CubeLevelReq = 0,  DefaultUnlocked = true,
            Description = "Combina 9 itens da mesma raridade em 1 da raridade acima (o nível do resultado vem de um seletor)." },
        new CubeRecipeMeta { CubeKey = 200001, Type = "ALCHEMY",     Name = "Alquimia",   CubeLevelReq = 1,  DefaultUnlocked = false,
            Description = "Converte itens em ouro (+ XP de Cubo). Principal fonte de ouro no início/meio do jogo." },
        new CubeRecipeMeta { CubeKey = 600001, Type = "CRAFTING",    Name = "Fabricação", CubeLevelReq = 5,  DefaultUnlocked = false,
            Description = "Cria gear/acessórios de um tipo escolhido a partir de materiais, dentro de uma faixa de nível." },
        new CubeRecipeMeta { CubeKey = 300001, Type = "DECORATION",  Name = "Decoração",  CubeLevelReq = 8,  DefaultUnlocked = false,
            Description = "Encaixa uma gema de 1 atributo em gear Rare+ (slot de Decoration). Material não retorna." },
        new CubeRecipeMeta { CubeKey = 900001, Type = "EXTRACTION",  Name = "Extração",   CubeLevelReq = 10, DefaultUnlocked = false,
            Description = "Remove atributos aplicados ao equipamento. Os materiais usados não são devolvidos." },
        new CubeRecipeMeta { CubeKey = 400001, Type = "ENGRAVING",   Name = "Gravação",   CubeLevelReq = 15, DefaultUnlocked = false,
            Description = "Encaixa material de monstro (2 atributos) em gear Immortal+ (slot de Engraving)." },
        new CubeRecipeMeta { CubeKey = 700001, Type = "OFFERING",    Name = "Oferenda",   CubeLevelReq = 20, DefaultUnlocked = false,
            Description = "Oferece moedas comemorativas por gear aleatório (gacha de fim de jogo)." },
        new CubeRecipeMeta { CubeKey = 500001, Type = "INSCRIPTION", Name = "Inscrição",  CubeLevelReq = 25, DefaultUnlocked = false,
            Description = "Adiciona 1 atributo aleatório (de um grande pool) em gear Arcana+ (slot de Inscription)." }
    };

    private static readonly Dictionary<int, CubeRecipeMeta> ByKey = All.ToDictionary(m => m.CubeKey);

    public static CubeRecipeMeta? ByCubeKey(int cubeKey) =>
        ByKey.TryGetValue(cubeKey, out var m) ? m : null;
}
