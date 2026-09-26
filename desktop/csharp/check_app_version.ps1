param([string]$Local)
# Prints "OK|<published>" or "LOW|<published>". Prints nothing if offline.
$ErrorActionPreference = 'Stop'
try {
    $url = 'https://functions.poehali.dev/cd1faf9e-5de7-4980-9f8c-876dc02534c0?action=check-update&version=' + $Local
    $r = Invoke-RestMethod -Uri $url -TimeoutSec 10
    $pub = [string]$r.current_version
    if ([string]::IsNullOrWhiteSpace($pub)) { exit 0 }
    if ([version]$Local -lt [version]$pub) {
        Write-Output ('LOW|' + $pub)
    } else {
        Write-Output ('OK|' + $pub)
    }
} catch {
    exit 0
}
