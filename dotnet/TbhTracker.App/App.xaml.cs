namespace TbhTracker.App;

public partial class App : Application
{
	public App()
	{
		InitializeComponent();
	}

	protected override Window CreateWindow(IActivationState? activationState)
	{
		var window = new Window(new MainPage()) { Title = "TBH-Tracker" };

#if WINDOWS
		window.Created += (_, _) =>
		{
			if (window.Handler?.PlatformView is Microsoft.UI.Xaml.Window native)
			{
				var tray = IPlatformApplication.Current?.Services?
					.GetService(typeof(Services.TrayManager)) as Services.TrayManager;
				tray?.Attach(native);
			}
		};
#endif

		return window;
	}
}
