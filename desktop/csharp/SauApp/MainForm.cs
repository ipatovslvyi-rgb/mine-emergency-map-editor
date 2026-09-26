using System;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.IO.Compression;
using System.Net.Http;
using System.Reflection;
using System.Security.Cryptography;
using System.Text.Json;
using System.Threading.Tasks;
using System.Windows.Forms;
using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.WinForms;

namespace Sau;

public sealed class MainForm : Form
{
    private const string AppHost = "sau.app";
    private const string UpdateUrl = "https://functions.poehali.dev/cd1faf9e-5de7-4980-9f8c-876dc02534c0?action=check-update&version=";
    private const string WebView2DownloadUrl = "https://developer.microsoft.com/microsoft-edge/webview2/";
    private const string Caption = "САУ";

    private readonly WebView2 _web = new() { Dock = DockStyle.Fill };

    private static string AppVersion
    {
        get
        {
            var v = Assembly.GetExecutingAssembly().GetName().Version ?? new Version(1, 0, 0);
            return $"{v.Major}.{v.Minor}.{Math.Max(0, v.Build)}";
        }
    }

    private static string DataRoot =>
        Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "SAU");

    public MainForm()
    {
        Text = "САУ — Схема аварийного участка";
        Width = 1280;
        Height = 800;
        MinimumSize = new Size(800, 600);
        StartPosition = FormStartPosition.CenterScreen;
        BackColor = Color.FromArgb(13, 21, 32);
        try
        {
            var exe = Environment.ProcessPath;
            if (!string.IsNullOrEmpty(exe)) Icon = Icon.ExtractAssociatedIcon(exe);
        }
        catch { }

        Controls.Add(_web);
        Load += async (_, _) => await InitAsync();
    }

    private async Task InitAsync()
    {
        string? browserVersion = null;
        try { browserVersion = CoreWebView2Environment.GetAvailableBrowserVersionString(); } catch { }
        if (string.IsNullOrEmpty(browserVersion))
        {
            var r = MessageBox.Show(this,
                "Для работы программы нужен компонент Microsoft Edge WebView2 Runtime.\n\nОткрыть страницу загрузки?",
                Caption, MessageBoxButtons.YesNo, MessageBoxIcon.Warning);
            if (r == DialogResult.Yes) OpenExternal(WebView2DownloadUrl);
            Close();
            return;
        }

        string appDir;
        try
        {
            appDir = ExtractApp();
        }
        catch (Exception ex)
        {
            MessageBox.Show(this, "Не удалось подготовить файлы программы:\n" + ex.Message,
                Caption, MessageBoxButtons.OK, MessageBoxIcon.Error);
            Close();
            return;
        }

        try
        {
            var env = await CoreWebView2Environment.CreateAsync(null, Path.Combine(DataRoot, "WebView2"));
            await _web.EnsureCoreWebView2Async(env);
        }
        catch (Exception ex)
        {
            MessageBox.Show(this, "Не удалось запустить окно программы:\n" + ex.Message,
                Caption, MessageBoxButtons.OK, MessageBoxIcon.Error);
            Close();
            return;
        }

        var core = _web.CoreWebView2;
        core.SetVirtualHostNameToFolderMapping(AppHost, appDir, CoreWebView2HostResourceAccessKind.Allow);

        var s = core.Settings;
#if DEBUG
        s.AreDevToolsEnabled = true;
#else
        s.AreDevToolsEnabled = false;
#endif
        s.IsStatusBarEnabled = false;
        s.IsZoomControlEnabled = true;

        core.NewWindowRequested += (_, e) =>
        {
            e.Handled = true;
            OpenExternal(e.Uri);
        };
        core.NavigationStarting += (_, e) =>
        {
            if (Uri.TryCreate(e.Uri, UriKind.Absolute, out var u)
                && (u.Scheme == Uri.UriSchemeHttp || u.Scheme == Uri.UriSchemeHttps)
                && !u.Host.Equals(AppHost, StringComparison.OrdinalIgnoreCase))
            {
                e.Cancel = true;
                OpenExternal(e.Uri);
            }
        };

        _web.Source = new Uri($"https://{AppHost}/index.html");
        _ = CheckUpdatesAsync();
    }

    private static string ExtractApp()
    {
        using var res = Assembly.GetExecutingAssembly().GetManifestResourceStream("app.zip")
            ?? throw new InvalidOperationException("В сборке нет ресурса app.zip");
        using var ms = new MemoryStream();
        res.CopyTo(ms);

        var hash = Convert.ToHexString(SHA256.HashData(ms.ToArray())).Substring(0, 12);
        var root = Path.Combine(DataRoot, "app");
        var target = Path.Combine(root, hash);
        if (File.Exists(Path.Combine(target, "index.html"))) return target;

        Directory.CreateDirectory(root);
        var tmp = target + ".tmp";
        if (Directory.Exists(tmp)) Directory.Delete(tmp, true);

        ms.Position = 0;
        using (var zip = new ZipArchive(ms, ZipArchiveMode.Read, leaveOpen: true))
        {
            zip.ExtractToDirectory(tmp, overwriteFiles: true);
        }

        if (Directory.Exists(target)) Directory.Delete(target, true);
        Directory.Move(tmp, target);

        foreach (var dir in Directory.GetDirectories(root))
        {
            if (string.Equals(dir, target, StringComparison.OrdinalIgnoreCase)) continue;
            try { Directory.Delete(dir, true); } catch { }
        }

        return target;
    }

    private async Task CheckUpdatesAsync()
    {
        try
        {
            using var http = new HttpClient { Timeout = TimeSpan.FromSeconds(10) };
            var json = await http.GetStringAsync(UpdateUrl + Uri.EscapeDataString(AppVersion));
            using var doc = JsonDocument.Parse(json);
            var r = doc.RootElement;
            if (!r.TryGetProperty("has_update", out var hu) || hu.ValueKind != JsonValueKind.True) return;

            var ver = r.TryGetProperty("current_version", out var cv) ? cv.GetString() : "";
            var url = r.TryGetProperty("download_url", out var du) ? du.GetString() : "";

            var answer = MessageBox.Show(this,
                $"Вышла новая версия {ver} (у вас {AppVersion}).\n\nСкачать обновление?",
                "Доступно обновление", MessageBoxButtons.YesNo, MessageBoxIcon.Information);
            if (answer == DialogResult.Yes && !string.IsNullOrEmpty(url)) OpenExternal(url!);
        }
        catch { }
    }

    private static void OpenExternal(string url)
    {
        try { Process.Start(new ProcessStartInfo(url) { UseShellExecute = true }); } catch { }
    }
}
