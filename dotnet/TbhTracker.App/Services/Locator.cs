namespace TbhTracker.App.Services;

/// <summary>Port de src/main/locator.ts. Localiza o save do TBH.
/// Windows: %USERPROFILE%\AppData\LocalLow\TesseractStudio\TaskbarHero\SaveFile_Live.es3.</summary>
public sealed class Locator
{
    private const string SaveFilename = "SaveFile_Live.es3";

    public List<string> CandidateSavePaths()
    {
        var home = Environment.GetFolderPath(Environment.SpecialFolder.UserProfile);
        var paths = new List<string>
        {
            Path.Combine(home, "AppData", "LocalLow", "TesseractStudio", "TaskbarHero", SaveFilename)
        };

        // Proton (Steam) no Linux — suporte futuro.
        const string steamApp = "3678970";
        paths.Add(Path.Combine(home, ".steam", "steam", "steamapps", "compatdata", steamApp,
            "pfx", "drive_c", "users", "steamuser", "AppData", "LocalLow",
            "TesseractStudio", "TaskbarHero", SaveFilename));

        return paths;
    }

    public string? LocateSave()
    {
        foreach (var p in CandidateSavePaths())
            if (File.Exists(p)) return p;
        return null;
    }
}
