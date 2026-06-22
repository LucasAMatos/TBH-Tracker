using System.Globalization;

namespace TbhTracker.App.Services;

/// <summary>Helpers de formatacao para a UI (equivalente aos fmtNum/Intl.NumberFormat do React).</summary>
public static class Ui
{
    private static readonly CultureInfo PtBr = CultureInfo.GetCultureInfo("pt-BR");

    /// <summary>Numero pt-BR, ou "—" quando nulo.</summary>
    public static string FmtNum(double? n)
    {
        if (n == null) return "—";
        var v = n.Value;
        var isInt = v == Math.Floor(v);
        return v.ToString(isInt ? "#,##0" : "#,##0.##", PtBr);
    }

    public static string FmtNum(int? n) => n == null ? "—" : n.Value.ToString("#,##0", PtBr);

    /// <summary>Converte horas decimais para string "Xd Xh Ym".</summary>
    public static string FmtTime(double? totalHours)
    {
        if (totalHours == null) return "—";

        double total = totalHours.Value;

        // Calcula os dias, horas e minutos
        int days = (int)(total / 24);
        int remainingHours = (int)(total % 24);
        int minutes = (int)((total - (int)total) * 60);

        // Constrói a string apenas com os componentes que existem
        var parts = new List<string>();

        if (days > 0) parts.Add($"{days}d");
        if (remainingHours > 0) parts.Add($"{remainingHours}h");
        if (minutes > 0) parts.Add($"{minutes}m");

        return parts.Count > 0 ? string.Join(" ", parts) : "0m";
    }

    public static string Fmt(double n)
    {
        var isInt = n == Math.Floor(n);
        return n.ToString(isInt ? "#,##0" : "#,##0.##", PtBr);
    }

    /// <summary>Trim de % (sem casas se inteiro).</summary>
    public static string Trim(double v) =>
        v == Math.Floor(v) ? ((long)v).ToString(CultureInfo.InvariantCulture)
                           : v.ToString(CultureInfo.InvariantCulture);
}
