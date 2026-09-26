param([string]$Exe, [string]$Zip)
# Checks that SAU.exe was produced and the embedded frontend is complete.
$ErrorActionPreference = 'Stop'
try {
    if (-not (Test-Path -LiteralPath $Exe)) { Write-Output "FAIL: $Exe not found"; exit 1 }
    $size = (Get-Item -LiteralPath $Exe).Length
    if ($size -lt 5MB) { Write-Output "FAIL: SAU.exe too small ($size bytes)"; exit 1 }

    Add-Type -AssemblyName System.IO.Compression.FileSystem
    $z = [IO.Compression.ZipFile]::OpenRead($Zip)
    try {
        $names = $z.Entries | ForEach-Object { $_.FullName.Replace('\', '/') }
        if (-not ($names -contains 'index.html')) { Write-Output 'FAIL: index.html missing in app.zip'; exit 1 }
        $js = @($names | Where-Object { $_ -like 'assets/*.js' })
        if ($js.Count -eq 0) { Write-Output 'FAIL: no JS bundle in app.zip'; exit 1 }
        $entry = $z.GetEntry('index.html')
        $reader = New-Object IO.StreamReader($entry.Open())
        $html = $reader.ReadToEnd()
        $reader.Close()
        if ($html -notmatch 'src="\./assets/') { Write-Output 'FAIL: index.html uses absolute paths (desktop config not applied)'; exit 1 }
    } finally {
        $z.Dispose()
    }
    Write-Output ("OK: SAU.exe " + [math]::Round($size / 1MB, 1) + " MB, frontend files: " + $names.Count)
    exit 0
} catch {
    Write-Output ('FAIL: ' + $_.Exception.Message)
    exit 1
}
