@echo off
REM Force a stable code page so this .bat is parsed identically on any PC.
REM (This file is pure ASCII - no national characters in commands/comments.)
chcp 65001 >nul 2>nul
setlocal enabledelayedexpansion

REM ============================================================
REM  SAU desktop build (SAU.exe)
REM  Run by double-click or from command line:
REM      desktop\csharp\build.bat
REM  Optional:  desktop\csharp\build.bat noobf   - build WITHOUT obfuscation
REM  Script finds project root by itself.
REM
REM  Result: ONE file desktop\csharp\dist\SAU.exe
REM    - C# window (WinForms + WebView2)
REM    - React frontend embedded inside the exe (app.zip resource)
REM    - backend (license) stays in the cloud, needs internet only
REM      for key activation and update check
REM ============================================================

REM Project root = two levels up from this bat (desktop\csharp\ -> root)
set "SCRIPT_DIR=%~dp0"
pushd "%SCRIPT_DIR%\..\.."
set "ROOT=%CD%"
popd

set "CS_DIR=%ROOT%\desktop\csharp"
set "APP_DIR=%CS_DIR%\SauApp"
set "VITE_CFG=%ROOT%\vite.config.desktop.ts"
set "FRONT_OUT=%ROOT%\dist-desktop"

REM ---------- Build mode ----------
set "OBFUSCATE=1"
if /i "%~1"=="noobf" set "OBFUSCATE=0"

REM ---------- Read app version (MANUAL) ----------
REM The app version is set MANUALLY in one place: the file desktop\APP_VERSION.
REM No auto-increment: the build takes the number from that file AS IS.
REM To release a new version write a new number (X.Y.Z) into that file.
REM IMPORTANT: it must be GREATER OR EQUAL to the published one, otherwise
REM on every start the app will offer to "update" to an older build.
set "APP_VERSION_FILE=%ROOT%\desktop\APP_VERSION"
if not exist "%APP_VERSION_FILE%" echo 1.0.0> "%APP_VERSION_FILE%"
for /f "usebackq tokens=* delims=" %%v in (`powershell -NoProfile -Command "$p='%APP_VERSION_FILE%'; $v=(Get-Content -Raw $p).Trim(); if($v -notmatch '^\d+\.\d+\.\d+$'){$v='1.0.0'}; Write-Output $v"`) do set "APP_VERSION=%%v"
echo     App version (from desktop\APP_VERSION): %APP_VERSION%

REM --- Guard: local version must not be LOWER than the published one ---
REM PowerShell lives in a separate .ps1 on purpose: inline PowerShell in a .bat
REM needs every > < ^ & | escaped, one miss and the window just blinks and closes.
set "VERCHECK_PS=%CS_DIR%\check_app_version.ps1"
set "VER_CMP="
if exist "%VERCHECK_PS%" (
    for /f "usebackq tokens=1,2 delims=|" %%a in (`powershell -NoProfile -ExecutionPolicy Bypass -File "%VERCHECK_PS%" "%APP_VERSION%"`) do (
        set "VER_CMP=%%a"
        set "PUBLISHED_VERSION=%%b"
    )
)
if /i "%VER_CMP%"=="LOW" (
    echo.
    echo ERROR: APP_VERSION ^(%APP_VERSION%^) is LOWER than the published one ^(%PUBLISHED_VERSION%^).
    echo        Users of this build would be asked to update on every start.
    echo        Fix: write %PUBLISHED_VERSION% or greater into desktop\APP_VERSION
    echo        and run the build again.
    goto :fail
)
if /i "%VER_CMP%"=="OK" echo     Version published in cloud: %PUBLISHED_VERSION% - OK
if "%VER_CMP%"=="" echo     Cloud version check skipped (no network) - continuing

REM Full build log so the reason stays if the window closes
set "BUILD_LOG=%CS_DIR%\build.log"
echo Build started %DATE% %TIME% > "%BUILD_LOG%"

echo.
echo ============================================================
echo   SAU - desktop build
echo   Project root: %ROOT%
echo   Log file: %BUILD_LOG%
echo ============================================================
echo.

REM ---------- Check environment (tools + versions) ----------
echo [0/5] Checking environment...
if "%OBFUSCATE%"=="0" echo     MODE: build WITHOUT obfuscation ^(noobf^)

where node >nul 2>nul
if errorlevel 1 (
    echo ERROR: Node.js not found - install LTS from https://nodejs.org
    goto :fail
)
for /f "delims=" %%v in ('node --version 2^>nul') do set "NODE_VER=%%v"
echo     Node.js: %NODE_VER%
echo %NODE_VER% | findstr /r "^v1[89]\. ^v[2-9][0-9]\." >nul
if errorlevel 1 (
    echo ERROR: Node.js %NODE_VER% is too old. Install Node.js 18 or newer ^(LTS^).
    goto :fail
)

where dotnet >nul 2>nul
if errorlevel 1 (
    echo ERROR: .NET SDK not found - install .NET 8 SDK from
    echo        https://dotnet.microsoft.com/download/dotnet/8.0
    goto :fail
)
dotnet --list-sdks 2>nul | findstr /r "^8\." >nul
if errorlevel 1 (
    echo ERROR: .NET 8 SDK not found. Installed SDKs:
    dotnet --list-sdks
    echo        Install the .NET 8 SDK ^(not just Runtime^) from
    echo        https://dotnet.microsoft.com/download/dotnet/8.0
    goto :fail
)
echo     .NET 8 SDK: OK
echo.

REM ---------- Check project is copied whole ----------
echo [0/5] Checking project files...
if not exist "%ROOT%\package.json" (
    echo ERROR: package.json not found at %ROOT%
    echo        Copy the WHOLE project ^(webapp root + desktop folder^) to this PC,
    echo        not just the desktop folder.
    goto :fail
)
if not exist "%VITE_CFG%" (
    echo ERROR: vite.config.desktop.ts not found at %VITE_CFG%
    echo        Copy the WHOLE project to this PC, not just the desktop folder.
    goto :fail
)
if not exist "%APP_DIR%\SauApp.csproj" (
    echo ERROR: C# project missing: %APP_DIR%\SauApp.csproj
    goto :fail
)
echo     OK
echo.

REM ---------- Step 1: frontend ----------
echo [1/5] Building frontend (desktop mode)...
cd /d "%ROOT%"
call npm install >> "%BUILD_LOG%" 2>&1
if errorlevel 1 (
    echo ERROR: npm install failed - see %BUILD_LOG%
    goto :fail
)
REM Run vite via npx so it finds the local binary regardless of launcher name.
REM --mode desktop disables the web service worker inside the desktop app.
call npx --no-install vite build --config "%VITE_CFG%" --mode desktop || goto :fail

if not exist "%FRONT_OUT%\index.html" (
    echo ERROR: frontend build failed - no index.html
    goto :fail
)
echo     OK
echo.

REM ---------- Step 2: pack frontend into app.zip ----------
echo [2/5] Packing frontend into the exe resource (app.zip)...
if exist "%APP_DIR%\app.zip" del /Q "%APP_DIR%\app.zip"
REM Web-only files are not needed inside the desktop app.
if exist "%FRONT_OUT%\sw.js" del /Q "%FRONT_OUT%\sw.js"
if exist "%FRONT_OUT%\downloads" rmdir /S /Q "%FRONT_OUT%\downloads"
powershell -NoProfile -Command "Add-Type -AssemblyName System.IO.Compression.FileSystem; [IO.Compression.ZipFile]::CreateFromDirectory('%FRONT_OUT%', '%APP_DIR%\app.zip', [IO.Compression.CompressionLevel]::Optimal, $false)" || goto :fail
if not exist "%APP_DIR%\app.zip" (
    echo ERROR: app.zip was not created
    goto :fail
)
echo     OK
echo.

REM ---------- Step 3: icon ----------
echo [3/5] Application icon (sau.ico)...
if exist "%APP_DIR%\sau.ico" (
    echo     OK - sau.ico ready
) else (
    echo     WARNING: sau.ico missing - building with default icon
)
echo.

REM ---------- Step 4: SAU.exe (build -> obfuscate -> publish) ----------
if "%OBFUSCATE%"=="1" (
    echo [4/5] Building SAU.exe ^(C#^) with obfuscation...
) else (
    echo [4/5] Building SAU.exe ^(C#^) WITHOUT obfuscation ^(noobf mode^)...
)
cd /d "%APP_DIR%"

REM Kill a running SAU.exe, otherwise publish cannot overwrite the locked file.
taskkill /F /IM SAU.exe >nul 2>nul
timeout /t 1 /nobreak >nul

set "OBF_OUTDIR=bin\Release\net8.0-windows\win-x64"
set "VER_PROPS=-p:Version=%APP_VERSION% -p:FileVersion=%APP_VERSION%.0 -p:AssemblyVersion=%APP_VERSION%.0"

REM 4.1 - compile. Keep PublishSingleFile=true HERE too, so the SDK prepares
REM singlefilehost.exe in obj\ - step 4.3 runs publish with --no-build.
echo     Compiling...
call dotnet build -c Release -r win-x64 --self-contained true -p:PublishSingleFile=true %VER_PROPS% -o "%OBF_OUTDIR%" || goto :fail

if "%OBFUSCATE%"=="0" goto :publish

REM 4.2 - install Obfuscar tool locally (idempotent) and obfuscate SAU.dll
echo     Installing Obfuscar tool...
call dotnet tool install --tool-path "%CS_DIR%\.tools" Obfuscar.GlobalTool
set "OBFUSCAR=%CS_DIR%\.tools\obfuscar.console.exe"
if not exist "%OBFUSCAR%" (
    echo     ERROR: Obfuscar tool did not install.
    echo            Likely no internet / blocked nuget.org / proxy on this PC.
    echo            Fix network access, or run WITHOUT obfuscation:
    echo                desktop\csharp\build.bat noobf
    goto :fail
)

echo     Obfuscating SAU.dll...
set "OBF_IN=%APP_DIR%\%OBF_OUTDIR%"
set "OBF_OUT=%APP_DIR%\%OBF_OUTDIR%\obf"
powershell -NoProfile -Command "(Get-Content -Raw -LiteralPath '%APP_DIR%\obfuscar.xml').Replace('@@INPATH@@', $env:OBF_IN).Replace('@@OUTPATH@@', $env:OBF_OUT) | Set-Content -Encoding UTF8 -LiteralPath '%APP_DIR%\obfuscar.gen.xml'" || goto :fail
"%OBFUSCAR%" "%APP_DIR%\obfuscar.gen.xml" || goto :fail

copy /Y "%OBF_OUT%\SAU.dll" "%APP_DIR%\%OBF_OUTDIR%\SAU.dll" || goto :fail

:publish
REM 4.3 - publish WITHOUT recompiling, so the (obfuscated) dll is packed as-is
echo     Packing single-file SAU.exe...
if exist "%CS_DIR%\dist" rmdir /S /Q "%CS_DIR%\dist"
call dotnet publish -c Release -r win-x64 --self-contained true --no-build -p:PublishSingleFile=true -p:IncludeNativeLibrariesForSelfExtract=true %VER_PROPS% -o "%CS_DIR%\dist" || goto :fail
if "%OBFUSCATE%"=="1" ( echo     OK ^(obfuscated^) ) else ( echo     OK ^(NOT obfuscated^) )
echo.

REM ---------- Step 5: smoke test ----------
echo [5/5] Smoke test - checking SAU.exe and embedded frontend...
powershell -NoProfile -ExecutionPolicy Bypass -File "%CS_DIR%\smoke_test.ps1" "%CS_DIR%\dist\SAU.exe" "%APP_DIR%\app.zip"
if errorlevel 1 (
    echo ERROR: smoke test failed - do not publish this build.
    goto :fail
)
echo.

echo Done!
echo.
echo ============================================================
echo   Build finished successfully.
echo   User file: %CS_DIR%\dist\SAU.exe   (version %APP_VERSION%)
echo   Run: SAU.exe
echo   Requirement on user PC: Windows 10/11 with Microsoft Edge
echo   WebView2 Runtime ^(preinstalled on Windows 11 and updated Win10^).
echo ------------------------------------------------------------
echo   TO DELIVER THIS UPDATE TO USERS:
echo     1) Upload  dist\SAU.exe  to poehali.dev storage
echo     2) In the license function set CURRENT_VERSION = %APP_VERSION%
echo        and DOWNLOAD_URL = link to the uploaded SAU.exe
echo   (Without this step clients are not offered the update.)
echo ============================================================
echo.
pause
exit /b 0

:fail
echo.
echo ============================================================
echo   BUILD ABORTED - error on one of the steps.
echo   Read the message above and fix the cause.
echo ============================================================
echo.
pause
exit /b 1