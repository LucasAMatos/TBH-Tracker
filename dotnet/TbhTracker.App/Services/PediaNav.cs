namespace TbhTracker.App.Services;

/// <summary>Navegacao interna da TBHPedia (W9): cross-links entre dominios do corpus.
/// Fornecido por TbhPedia via CascadingValue; os componentes de dominio chamam Go(...)
/// para abrir outra pagina (opcionalmente ja selecionando uma entrada por chave).</summary>
public sealed class PediaNav
{
    public Func<string, object?, Task> Go { get; init; } = (_, _) => Task.CompletedTask;
}
