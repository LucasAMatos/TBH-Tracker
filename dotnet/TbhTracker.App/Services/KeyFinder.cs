using System.Diagnostics;
using System.Text;
using System.Text.RegularExpressions;
using TbhTracker.Core;
using TbhTracker.Core.Models;

namespace TbhTracker.App.Services;

/// <summary>Port de src/main/keyFinder.ts. Descobre a chave ES3 lendo os arquivos do jogo
/// (resources.assets, ancora ES3Defaults) e validando contra o save. 100% passivo: so le
/// arquivos em disco — nao toca no processo/memoria do jogo.</summary>
public sealed class KeyFinder
{
    private const string AppId = "3678970";
    private const string Es3Anchor = "ES3Defaults";
    private const int MinLen = 8;
    private const int MaxLen = 48;

    private static List<string> SteamRoots()
    {
        var roots = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        if (OperatingSystem.IsWindows())
        {
            try
            {
                var psi = new ProcessStartInfo("reg",
                    "query \"HKCU\\Software\\Valve\\Steam\" /v SteamPath")
                {
                    RedirectStandardOutput = true,
                    UseShellExecute = false,
                    CreateNoWindow = true
                };
                using var proc = Process.Start(psi);
                if (proc != null)
                {
                    var outText = proc.StandardOutput.ReadToEnd();
                    proc.WaitForExit(4000);
                    var m = Regex.Match(outText, @"SteamPath\s+REG_SZ\s+(.+)", RegexOptions.IgnoreCase);
                    if (m.Success) roots.Add(m.Groups[1].Value.Trim().Replace('/', '\\'));
                }
            }
            catch
            {
                // sem registro: cai nos padroes
            }
            roots.Add(@"C:\Program Files (x86)\Steam");
            roots.Add(@"C:\Program Files\Steam");
        }
        else
        {
            var home = Environment.GetFolderPath(Environment.SpecialFolder.UserProfile);
            roots.Add(Path.Combine(home, ".steam", "steam"));
            roots.Add(Path.Combine(home, ".local", "share", "Steam"));
        }
        return roots.Where(Directory.Exists).ToList();
    }

    private static List<string> SteamLibraries(string root)
    {
        var libs = new HashSet<string>(StringComparer.OrdinalIgnoreCase) { root };
        try
        {
            var vdf = File.ReadAllText(Path.Combine(root, "steamapps", "libraryfolders.vdf"));
            foreach (Match m in Regex.Matches(vdf, "\"path\"\\s+\"([^\"]+)\""))
                libs.Add(m.Groups[1].Value.Replace("\\\\", "\\"));
        }
        catch
        {
            // sem vdf: usa so a raiz
        }
        return libs.ToList();
    }

    private static string? FindGameDir()
    {
        foreach (var root in SteamRoots())
        foreach (var lib in SteamLibraries(root))
        {
            var acf = Path.Combine(lib, "steamapps", $"appmanifest_{AppId}.acf");
            if (!File.Exists(acf)) continue;
            var installdir = "TaskbarHero";
            try
            {
                var m = Regex.Match(File.ReadAllText(acf), "\"installdir\"\\s+\"([^\"]+)\"");
                if (m.Success) installdir = m.Groups[1].Value;
            }
            catch { /* usa default */ }
            var dir = Path.Combine(lib, "steamapps", "common", installdir);
            if (Directory.Exists(dir)) return dir;
        }
        return null;
    }

    private static string? FindResourcesAssets(string gameDir)
    {
        try
        {
            foreach (var sub in Directory.GetDirectories(gameDir))
            {
                if (Path.GetFileName(sub).EndsWith("_Data", StringComparison.Ordinal))
                {
                    var p = Path.Combine(sub, "resources.assets");
                    if (File.Exists(p)) return p;
                }
            }
        }
        catch { /* ignora */ }
        return null;
    }

    private static string? ScanRuns(ReadOnlySpan<byte> buf, byte[] saveBuf, Func<byte[], string, bool> validate)
    {
        var seen = new HashSet<string>();
        var start = -1;
        for (var i = 0; i <= buf.Length; i++)
        {
            var b = i < buf.Length ? buf[i] : (byte)0;
            var printable = b >= 0x20 && b <= 0x7e;
            if (printable)
            {
                if (start == -1) start = i;
            }
            else if (start != -1)
            {
                var len = i - start;
                if (len >= MinLen && len <= MaxLen)
                {
                    var s = Encoding.Latin1.GetString(buf.Slice(start, len));
                    if (seen.Add(s) && validate(saveBuf, s)) return s;
                }
                start = -1;
            }
        }
        return null;
    }

    private static bool Validate(byte[] saveBuf, string pw) =>
        Es3Crypto.QuickFirstBlockIsBrace(saveBuf, pw) && Es3Crypto.Validate(saveBuf, pw);

    private static string? ExtractKey(byte[] assetsBuf, byte[] saveBuf)
    {
        var anchorBytes = Encoding.ASCII.GetBytes(Es3Anchor);
        var anchor = IndexOf(assetsBuf, anchorBytes);
        if (anchor != -1)
        {
            var end = Math.Min(assetsBuf.Length, anchor + 8192);
            var hit = ScanRuns(assetsBuf.AsSpan(anchor, end - anchor), saveBuf, Validate);
            if (hit != null) return hit;
        }
        return ScanRuns(assetsBuf, saveBuf, Validate);
    }

    private static int IndexOf(byte[] haystack, byte[] needle)
    {
        for (var i = 0; i <= haystack.Length - needle.Length; i++)
        {
            var match = true;
            for (var j = 0; j < needle.Length; j++)
                if (haystack[i + j] != needle[j]) { match = false; break; }
            if (match) return i;
        }
        return -1;
    }

    public KeyFindResult FindEs3Key(string? savePath)
    {
        if (string.IsNullOrEmpty(savePath) || !File.Exists(savePath))
            return new KeyFindResult { Status = KeyFindStatus.NoSave };

        var gameDir = FindGameDir();
        if (gameDir == null)
            return new KeyFindResult { Status = KeyFindStatus.NoGame };

        var assetsPath = FindResourcesAssets(gameDir);
        if (assetsPath == null)
            return new KeyFindResult { Status = KeyFindStatus.NoGame, GamePath = gameDir };

        try
        {
            var saveBuf = File.ReadAllBytes(savePath);
            var assetsBuf = File.ReadAllBytes(assetsPath);
            var key = ExtractKey(assetsBuf, saveBuf);
            if (key != null)
                return new KeyFindResult { Status = KeyFindStatus.Found, GamePath = assetsPath, Key = key };
            return new KeyFindResult { Status = KeyFindStatus.NotFound, GamePath = assetsPath };
        }
        catch (Exception err)
        {
            return new KeyFindResult
            {
                Status = KeyFindStatus.Error,
                GamePath = assetsPath,
                Message = err.Message
            };
        }
    }
}
