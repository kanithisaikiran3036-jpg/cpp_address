@echo off
REM ===========================================================================
REM Build Script for Windows using Microsoft Visual C++ (MSVC cl.exe)
REM Run this from "Developer Command Prompt for VS 2019/2022" or "x64 Native Tools"
REM ===========================================================================

echo [Proton Windows Build] Compiling C++ Core Engine using MSVC...

set TARGET_DIR=..\bin
if not exist "%TARGET_DIR%" mkdir "%TARGET_DIR%"

cl.exe /nologo /O2 /std:c++17 /EHsc /W3 /DWIN32 /D_WINDOWS /D_CRT_SECURE_NO_WARNINGS ^
    engine_windows.cpp ^
    sqlite3.lib ^
    /Fe:"%TARGET_DIR%\proton_core_engine.exe" ^
    /Fo:"%TARGET_DIR%\engine_windows.obj"

if %ERRORLEVEL% EQU 0 (
    echo [Proton Windows Build] SUCCESS: Compiled to %TARGET_DIR%\proton_core_engine.exe
    del /Q "%TARGET_DIR%\engine_windows.obj" 2>nul
) else (
    echo [Proton Windows Build] ERROR: Compilation failed with code %ERRORLEVEL%
    exit /b %ERRORLEVEL%
)
