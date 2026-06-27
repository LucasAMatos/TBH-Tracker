namespace TbhTracker.App.Services;

/// <summary>Abstracao do canal de alerta nativo (toast). Implementado no Windows via
/// AppNotificationManager; em outras plataformas vira no-op.</summary>
public interface INotifier
{
    /// <summary>Registra o app para notificacoes (idempotente). Em unpackaged cria o
    /// atalho/AppUserModelID necessario.</summary>
    void Initialize();

    void Notify(string title, string body);
}

/// <summary>Fallback sem efeito (plataformas nao-Windows / testes).</summary>
public sealed class NoOpNotifier : INotifier
{
    public void Initialize() { }
    public void Notify(string title, string body) { }
}
