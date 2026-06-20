namespace TbhTracker.App.Services;

/// <summary>Salvar arquivo de texto via dialogo nativo. Implementado para Windows;
/// fallback grava em AppDataDirectory.</summary>
public static class PlatformFile
{
    public static async Task<string?> SaveTextAsync(string defaultName, string content)
    {
#if WINDOWS
        try
        {
            var picker = new Windows.Storage.Pickers.FileSavePicker
            {
                SuggestedStartLocation = Windows.Storage.Pickers.PickerLocationId.DocumentsLibrary,
                SuggestedFileName = string.IsNullOrEmpty(defaultName) ? "export" : defaultName
            };

            var ext = Path.GetExtension(defaultName);
            if (string.IsNullOrEmpty(ext)) ext = ".txt";
            picker.FileTypeChoices.Add("Arquivo", new List<string> { ext });

            var window = Application.Current?.Windows.FirstOrDefault()?.Handler?.PlatformView
                as Microsoft.UI.Xaml.Window;
            if (window != null)
            {
                var hwnd = WinRT.Interop.WindowNative.GetWindowHandle(window);
                WinRT.Interop.InitializeWithWindow.Initialize(picker, hwnd);
            }

            var file = await picker.PickSaveFileAsync();
            if (file == null) return null;
            await Windows.Storage.FileIO.WriteTextAsync(file, content);
            return file.Path;
        }
        catch
        {
            return null;
        }
#else
        try
        {
            var path = Path.Combine(FileSystem.AppDataDirectory,
                string.IsNullOrEmpty(defaultName) ? "export.txt" : defaultName);
            await File.WriteAllTextAsync(path, content);
            return path;
        }
        catch
        {
            return null;
        }
#endif
    }
}
