# PowerShell Build Script for Proton C++ Engine on Windows
# Auto-detects installed Windows C++ compiler (MSVC cl.exe, MinGW g++, or Clang)

$TargetDir = Join-Path $PSScriptRoot "..\bin"
if (-not (Test-Path $TargetDir)) {
    New-Item -ItemType Directory -Path $TargetDir | Out-Null
}

$ExeTarget = Join-Path $TargetDir "proton_core_engine.exe"

Write-Host ">>> Detecting C++ compiler on Windows..." -ForegroundColor Cyan

if (Get-Command cl.exe -ErrorAction SilentlyContinue) {
    Write-Host ">>> Using Microsoft Visual C++ (cl.exe)..." -ForegroundColor Green
    & cl.exe /nologo /O2 /std:c++17 /EHsc /W3 /DWIN32 /D_WINDOWS /D_CRT_SECURE_NO_WARNINGS `
        (Join-Path $PSScriptRoot "engine_windows.cpp") `
        sqlite3.lib `
        /Fe:$ExeTarget
} elseif (Get-Command g++ -ErrorAction SilentlyContinue) {
    Write-Host ">>> Using MinGW-w64 (g++)..." -ForegroundColor Green
    & g++ -O3 -std=c++17 -Wall -Wextra `
        (Join-Path $PSScriptRoot "engine_windows.cpp") `
        -lsqlite3 `
        -o $ExeTarget
} elseif (Get-Command clang++.exe -ErrorAction SilentlyContinue) {
    Write-Host ">>> Using Clang/LLVM for Windows..." -ForegroundColor Green
    & clang++.exe -O3 -std=c++17 `
        (Join-Path $PSScriptRoot "engine_windows.cpp") `
        -lsqlite3 `
        -o $ExeTarget
} else {
    Write-Error "No Windows C++ compiler found (cl.exe, g++, or clang++). Please install Visual Studio Build Tools or MinGW-w64."
    exit 1
}

if ($LASTEXITCODE -eq 0 -and (Test-Path $ExeTarget)) {
    Write-Host ">>> Proton C++ Engine built successfully at: $ExeTarget" -ForegroundColor Green
} else {
    Write-Error ">>> Build failed with exit code $LASTEXITCODE"
}
