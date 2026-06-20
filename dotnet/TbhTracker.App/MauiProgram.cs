using Microsoft.Extensions.Logging;
using TbhTracker.App.Services;

namespace TbhTracker.App;

public static class MauiProgram
{
	public static MauiApp CreateMauiApp()
	{
		var builder = MauiApp.CreateBuilder();
		builder
			.UseMauiApp<App>()
			.ConfigureFonts(fonts =>
			{
				fonts.AddFont("OpenSans-Regular.ttf", "OpenSansRegular");
			});

		builder.Services.AddMauiBlazorWebView();

#if DEBUG
		builder.Services.AddBlazorWebViewDeveloperTools();
		builder.Logging.AddDebug();
#endif

		var appData = FileSystem.AppDataDirectory;
		builder.Services.AddSingleton(new ConfigStore(appData));
		builder.Services.AddSingleton(new HistoryStore(appData));
		builder.Services.AddSingleton<Locator>();
		builder.Services.AddSingleton<KeyFinder>();
		builder.Services.AddSingleton(_ => new NewsService());
		builder.Services.AddSingleton<Tracker>();
		builder.Services.AddSingleton<TrackerApi>();

		return builder.Build();
	}
}
