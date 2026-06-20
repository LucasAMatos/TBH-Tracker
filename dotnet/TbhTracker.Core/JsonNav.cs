using System.Globalization;
using System.Text.Json;

namespace TbhTracker.Core;

/// <summary>Helpers de navegacao tolerante sobre o JSON do save (port das funcoes
/// isObj/pick/toNumber/asArray/unwrapEs3 do parser TS). O save mistura casing/typos,
/// entao tudo aqui e defensivo.</summary>
public static class JsonNav
{
    public static bool IsObj(JsonElement? e) =>
        e.HasValue && e.Value.ValueKind == JsonValueKind.Object;

    public static bool IsArray(JsonElement? e) =>
        e.HasValue && e.Value.ValueKind == JsonValueKind.Array;

    /// <summary>Primeiro campo presente dentre varios nomes (case-sensitive, como o TS).</summary>
    public static JsonElement? Pick(JsonElement? obj, params string[] names)
    {
        if (!IsObj(obj)) return null;
        foreach (var n in names)
            if (obj!.Value.TryGetProperty(n, out var v))
                return v;
        return null;
    }

    /// <summary>Converte para numero: numero direto, string numerica ou objeto com
    /// value/Value/Quantity/amount/Amount.</summary>
    public static double? ToNumber(JsonElement? v)
    {
        if (!v.HasValue) return null;
        var e = v.Value;
        switch (e.ValueKind)
        {
            case JsonValueKind.Number:
                return e.TryGetDouble(out var d) ? d : null;
            case JsonValueKind.String:
                var s = e.GetString();
                if (!string.IsNullOrWhiteSpace(s) &&
                    double.TryParse(s, NumberStyles.Any, CultureInfo.InvariantCulture, out var ds))
                    return ds;
                return null;
            case JsonValueKind.Object:
                foreach (var key in new[] { "value", "Value", "Quantity", "amount", "Amount" })
                {
                    if (e.TryGetProperty(key, out var inner))
                    {
                        var n = ToNumber(inner);
                        if (n != null) return n;
                    }
                }
                return null;
            default:
                return null;
        }
    }

    /// <summary>Normaliza listas que vem como array ou objeto indexado.</summary>
    public static IEnumerable<JsonElement> AsArray(JsonElement? v)
    {
        if (!v.HasValue) yield break;
        var e = v.Value;
        if (e.ValueKind == JsonValueKind.Array)
        {
            foreach (var item in e.EnumerateArray()) yield return item;
        }
        else if (e.ValueKind == JsonValueKind.Object)
        {
            foreach (var prop in e.EnumerateObject()) yield return prop.Value;
        }
    }

    /// <summary>Desembrulha o wrapper ES3 {__type, value}.</summary>
    public static JsonElement? UnwrapEs3(JsonElement? node)
    {
        if (IsObj(node) &&
            node!.Value.TryGetProperty("__type", out _) &&
            node.Value.TryGetProperty("value", out var value))
            return value;
        return node;
    }

    public static bool HasProp(JsonElement? obj, string name) =>
        IsObj(obj) && obj!.Value.TryGetProperty(name, out _);

    /// <summary>Texto bruto de um elemento (para chaves number|string), sem aspas.</summary>
    public static string? AsString(JsonElement? v)
    {
        if (!v.HasValue) return null;
        var e = v.Value;
        return e.ValueKind switch
        {
            JsonValueKind.String => e.GetString(),
            JsonValueKind.Number => e.GetRawText(),
            _ => null
        };
    }

    public static bool IsTrue(JsonElement? v) =>
        v.HasValue && v.Value.ValueKind == JsonValueKind.True;
}
