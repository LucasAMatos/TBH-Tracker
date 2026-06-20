namespace TbhTracker.Core.Logic;

// Port de src/shared/cube.ts.

public sealed class CubeMilestone
{
    public int Level { get; init; }
    public string Name { get; init; } = "";
    public string Description { get; init; } = "";
}

public static class Cube
{
    public static readonly IReadOnlyList<CubeMilestone> Milestones = new[]
    {
        new CubeMilestone { Level = 4, Name = "Cubo desbloqueado", Description = "Synthesis + Alchemy (derrete gear em ouro + XP de Cubo)" },
        new CubeMilestone { Level = 5, Name = "Crafting", Description = "Cria gear/acessórios aleatórios a partir de materiais" },
        new CubeMilestone { Level = 8, Name = "Decoration", Description = "Gemas de 1 atributo em gear Rare+" },
        new CubeMilestone { Level = 10, Name = "Removal + Trade Ship", Description = "Remove sockets; libera envio ao inventário Steam" }
    };

    public static CubeMilestone? NextMilestone(int? level)
    {
        var lvl = level ?? 0;
        return Milestones.FirstOrDefault(m => m.Level > lvl);
    }

    public static bool IsMilestoneReached(CubeMilestone milestone, int? level) =>
        level != null && level >= milestone.Level;
}
