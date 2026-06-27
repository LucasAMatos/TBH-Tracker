using System.Diagnostics;
using System.Runtime.InteropServices;
using Microsoft.UI;
using Microsoft.UI.Dispatching;
using Microsoft.UI.Windowing;
using Windows.Graphics;

namespace TbhTracker.App.Services;

/// <summary>A3 — icone na bandeja (Shell_NotifyIcon, sem dependencia externa) + "fechar =
/// minimizar para a bandeja". Mantem uma janela de mensagens oculta para receber os cliques
/// do icone e tambem aplica/persiste o WindowState. Tudo na thread de UI do WinUI.</summary>
public sealed class TrayManager
{
    private const uint WM_APP = 0x8000;
    private const uint TrayCallbackMsg = WM_APP + 1;
    private const uint WM_COMMAND = 0x0111;
    private const int WM_LBUTTONDBLCLK = 0x0203;
    private const int WM_RBUTTONUP = 0x0205;

    private const int NIM_ADD = 0x0;
    private const int NIM_MODIFY = 0x1;
    private const int NIM_DELETE = 0x2;
    private const int NIF_MESSAGE = 0x1;
    private const int NIF_ICON = 0x2;
    private const int NIF_TIP = 0x4;

    private const uint MF_STRING = 0x0;
    private const uint TPM_RIGHTBUTTON = 0x0002;
    private const uint TPM_RETURNCMD = 0x0100;

    private const int CmdOpen = 1;
    private const int CmdExit = 2;
    private const int TrayIconId = 1;

    private readonly ConfigStore _store;

    private Microsoft.UI.Xaml.Window? _window;
    private AppWindow? _appWindow;
    private DispatcherQueue? _dispatcher;

    private WndProcDelegate? _wndProc; // mantido vivo p/ nao ser coletado
    private IntPtr _msgHwnd;
    private IntPtr _hIcon;
    private bool _iconAdded;
    private bool _exiting;
    private string _className = "TbhTrackerTrayWnd";

    public TrayManager(ConfigStore store)
    {
        _store = store;
    }

    public void Attach(Microsoft.UI.Xaml.Window window)
    {
        _window = window;
        _dispatcher = window.DispatcherQueue;

        var hwnd = WinRT.Interop.WindowNative.GetWindowHandle(window);
        var id = Win32Interop.GetWindowIdFromWindow(hwnd);
        _appWindow = AppWindow.GetFromWindowId(id);

        ApplyWindowState();

        if (_appWindow != null)
            _appWindow.Closing += OnClosing;

        CreateMessageWindow();
        AddTrayIcon();
    }

    private void OnClosing(AppWindow sender, AppWindowClosingEventArgs args)
    {
        SaveWindowState();
        if (!_exiting && _store.GetMinimizeToTray())
        {
            args.Cancel = true;
            sender.Hide();
        }
    }

    public void ShowMainWindow()
    {
        Dispatch(() =>
        {
            _appWindow?.Show();
            if (_appWindow?.Presenter is OverlappedPresenter presenter)
                presenter.Restore();
            _window?.Activate();
        });
    }

    public void ExitApp()
    {
        _exiting = true;
        SaveWindowState();
        RemoveTrayIcon();
        Dispatch(() =>
        {
            try { Microsoft.UI.Xaml.Application.Current.Exit(); }
            catch { Process.GetCurrentProcess().Kill(); }
        });
    }

    private void Dispatch(Action action)
    {
        if (_dispatcher != null) _dispatcher.TryEnqueue(() => action());
        else action();
    }

    private void ApplyWindowState()
    {
        var ws = _store.GetWindowState();
        if (ws == null || _appWindow == null) return;
        try
        {
            _appWindow.MoveAndResize(new RectInt32(
                (int)(ws.X ?? 100), (int)(ws.Y ?? 100),
                (int)ws.Width, (int)ws.Height));
            if (ws.Maximized && _appWindow.Presenter is OverlappedPresenter p)
                p.Maximize();
        }
        catch { /* tamanho invalido; ignora */ }
    }

    private void SaveWindowState()
    {
        if (_appWindow == null) return;
        try
        {
            var maximized = _appWindow.Presenter is OverlappedPresenter p
                && p.State == OverlappedPresenterState.Maximized;
            _store.SetWindowState(new WindowState
            {
                Width = _appWindow.Size.Width,
                Height = _appWindow.Size.Height,
                X = _appWindow.Position.X,
                Y = _appWindow.Position.Y,
                Maximized = maximized
            });
        }
        catch { /* ignora */ }
    }

    // ---- Tray icon (Win32) ----

    private void CreateMessageWindow()
    {
        _wndProc = WndProc;
        var hInstance = GetModuleHandle(null);

        var wc = new WNDCLASS
        {
            lpfnWndProc = Marshal.GetFunctionPointerForDelegate(_wndProc),
            hInstance = hInstance,
            lpszClassName = _className
        };
        RegisterClass(ref wc);

        _msgHwnd = CreateWindowEx(0, _className, "TbhTrackerTray", 0,
            0, 0, 0, 0, HWND_MESSAGE, IntPtr.Zero, hInstance, IntPtr.Zero);
    }

    private void AddTrayIcon()
    {
        if (_msgHwnd == IntPtr.Zero) return;
        _hIcon = LoadAppIcon();

        var data = new NOTIFYICONDATA
        {
            cbSize = Marshal.SizeOf<NOTIFYICONDATA>(),
            hWnd = _msgHwnd,
            uID = TrayIconId,
            uFlags = NIF_MESSAGE | NIF_ICON | NIF_TIP,
            uCallbackMessage = (int)TrayCallbackMsg,
            hIcon = _hIcon,
            szTip = "TBH-Tracker"
        };
        Shell_NotifyIcon(NIM_ADD, ref data);
        _iconAdded = true;
    }

    private void RemoveTrayIcon()
    {
        if (!_iconAdded || _msgHwnd == IntPtr.Zero) return;
        var data = new NOTIFYICONDATA
        {
            cbSize = Marshal.SizeOf<NOTIFYICONDATA>(),
            hWnd = _msgHwnd,
            uID = TrayIconId
        };
        Shell_NotifyIcon(NIM_DELETE, ref data);
        _iconAdded = false;
    }

    private IntPtr LoadAppIcon()
    {
        try
        {
            var exe = Process.GetCurrentProcess().MainModule?.FileName;
            if (!string.IsNullOrEmpty(exe)
                && ExtractIconEx(exe, 0, out var large, out var small, 1) > 0)
            {
                if (small != IntPtr.Zero) return small;
                if (large != IntPtr.Zero) return large;
            }
        }
        catch { /* cai no icone padrao */ }
        return LoadIcon(IntPtr.Zero, (IntPtr)32512 /* IDI_APPLICATION */);
    }

    private IntPtr WndProc(IntPtr hWnd, uint msg, IntPtr wParam, IntPtr lParam)
    {
        if (msg == TrayCallbackMsg)
        {
            var mouse = (int)(lParam.ToInt64() & 0xFFFF);
            if (mouse == WM_LBUTTONDBLCLK) ShowMainWindow();
            else if (mouse == WM_RBUTTONUP) ShowContextMenu();
            return IntPtr.Zero;
        }
        if (msg == WM_COMMAND)
        {
            var cmd = (int)(wParam.ToInt64() & 0xFFFF);
            if (cmd == CmdOpen) ShowMainWindow();
            else if (cmd == CmdExit) ExitApp();
            return IntPtr.Zero;
        }
        return DefWindowProc(hWnd, msg, wParam, lParam);
    }

    private void ShowContextMenu()
    {
        var menu = CreatePopupMenu();
        AppendMenu(menu, MF_STRING, CmdOpen, "Abrir");
        AppendMenu(menu, MF_STRING, CmdExit, "Sair");

        GetCursorPos(out var pt);
        SetForegroundWindow(_msgHwnd);
        var cmd = TrackPopupMenuEx(menu, TPM_RIGHTBUTTON | TPM_RETURNCMD, pt.X, pt.Y, _msgHwnd, IntPtr.Zero);
        DestroyMenu(menu);

        if (cmd == CmdOpen) ShowMainWindow();
        else if (cmd == CmdExit) ExitApp();
    }

    // ---- P/Invoke ----

    private delegate IntPtr WndProcDelegate(IntPtr hWnd, uint msg, IntPtr wParam, IntPtr lParam);

    private static readonly IntPtr HWND_MESSAGE = new(-3);

    [StructLayout(LayoutKind.Sequential)]
    private struct WNDCLASS
    {
        public uint style;
        public IntPtr lpfnWndProc;
        public int cbClsExtra;
        public int cbWndExtra;
        public IntPtr hInstance;
        public IntPtr hIcon;
        public IntPtr hCursor;
        public IntPtr hbrBackground;
        [MarshalAs(UnmanagedType.LPWStr)] public string? lpszMenuName;
        [MarshalAs(UnmanagedType.LPWStr)] public string lpszClassName;
    }

    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
    private struct NOTIFYICONDATA
    {
        public int cbSize;
        public IntPtr hWnd;
        public int uID;
        public int uFlags;
        public int uCallbackMessage;
        public IntPtr hIcon;
        [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 128)] public string szTip;
        public int dwState;
        public int dwStateMask;
        [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 256)] public string szInfo;
        public int uTimeoutOrVersion;
        [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 64)] public string szInfoTitle;
        public int dwInfoFlags;
        public Guid guidItem;
        public IntPtr hBalloonIcon;
    }

    [StructLayout(LayoutKind.Sequential)]
    private struct POINT
    {
        public int X;
        public int Y;
    }

    [DllImport("user32.dll", SetLastError = true, CharSet = CharSet.Unicode)]
    private static extern ushort RegisterClass(ref WNDCLASS lpWndClass);

    [DllImport("user32.dll", SetLastError = true, CharSet = CharSet.Unicode)]
    private static extern IntPtr CreateWindowEx(int dwExStyle, string lpClassName, string lpWindowName,
        int dwStyle, int x, int y, int nWidth, int nHeight, IntPtr hWndParent, IntPtr hMenu,
        IntPtr hInstance, IntPtr lpParam);

    [DllImport("user32.dll")]
    private static extern IntPtr DefWindowProc(IntPtr hWnd, uint msg, IntPtr wParam, IntPtr lParam);

    [DllImport("kernel32.dll", CharSet = CharSet.Unicode)]
    private static extern IntPtr GetModuleHandle(string? lpModuleName);

    [DllImport("shell32.dll", CharSet = CharSet.Unicode)]
    private static extern bool Shell_NotifyIcon(int dwMessage, ref NOTIFYICONDATA lpData);

    [DllImport("user32.dll")]
    private static extern IntPtr LoadIcon(IntPtr hInstance, IntPtr lpIconName);

    [DllImport("shell32.dll", CharSet = CharSet.Unicode)]
    private static extern int ExtractIconEx(string lpszFile, int nIconIndex, out IntPtr phiconLarge,
        out IntPtr phiconSmall, int nIcons);

    [DllImport("user32.dll")]
    private static extern IntPtr CreatePopupMenu();

    [DllImport("user32.dll", CharSet = CharSet.Unicode)]
    private static extern bool AppendMenu(IntPtr hMenu, uint uFlags, int uIDNewItem, string lpNewItem);

    [DllImport("user32.dll")]
    private static extern bool DestroyMenu(IntPtr hMenu);

    [DllImport("user32.dll")]
    private static extern bool GetCursorPos(out POINT lpPoint);

    [DllImport("user32.dll")]
    private static extern bool SetForegroundWindow(IntPtr hWnd);

    [DllImport("user32.dll")]
    private static extern int TrackPopupMenuEx(IntPtr hMenu, uint uFlags, int x, int y, IntPtr hWnd, IntPtr lptpm);
}
