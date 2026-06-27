using Microsoft.Windows.AppNotifications;
using Microsoft.Windows.AppNotifications.Builder;

namespace TbhTracker.App.Services;

/// <summary>A3 — toasts nativos via Windows App SDK. Como o app e unpackaged
/// (WindowsPackageType=None), Register() cria o atalho/AppUserModelID necessario para o
/// Action Center exibir os toasts. Clicar no toast traz a janela de volta.</summary>
public sealed class WindowsNotifier : INotifier
{
    private readonly TrayManager _tray;
    private bool _registered;

    public WindowsNotifier(TrayManager tray)
    {
        _tray = tray;
    }

    public void Initialize()
    {
        if (_registered) return;
        var manager = AppNotificationManager.Default;
        manager.NotificationInvoked += OnNotificationInvoked;
        manager.Register();
        _registered = true;
    }

    private void OnNotificationInvoked(AppNotificationManager sender, AppNotificationActivatedEventArgs args)
    {
        _tray.ShowMainWindow();
    }

    public void Notify(string title, string body)
    {
        if (!_registered)
        {
            try { Initialize(); } catch { return; }
        }

        var notification = new AppNotificationBuilder()
            .AddText(title)
            .AddText(body)
            .BuildNotification();

        AppNotificationManager.Default.Show(notification);
    }
}
