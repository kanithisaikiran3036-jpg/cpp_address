@echo off
REM ===========================================================================
REM Build Script for Windows using MinGW-w64 (g++ on Windows)
REM ===========================================================================

echo [Proton Windows Build] Compiling C++ Core Engine using MinGW-w64 g++...

set TARGET_DIR=..\bin
if not exist "%TARGET_DIR%" mkdir "%TARGET_DIR%"

g++ -O3 -std=c++17 -Wall -Wextra ^
    engine_windows.cpp ^
    -lsqlite3 ^
    -o "%TARGET_DIR%\proton_core_engine.exe"

if %ERRORLEVEL% EQU 0 (
    echo [Proton Windows Build] SUCCESS: Compiled to %TARGET_DIR%\proton_core_engine.exe
) else (
    echo [Proton Windows Build] ERROR: MinGW compilation failed with code %ERRORLEVEL%
    exit /b %ERRORLEVEL%
)
