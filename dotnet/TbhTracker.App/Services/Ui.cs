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
