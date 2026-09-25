# Building & Running the C++ Engine on Windows

The C++ Storage & Personnel Directory Engine supports native Microsoft Windows (x86_64).

---

## 1. Quick Build Options on Windows

### Option A: Using Microsoft Visual Studio (MSVC)
1. Open the **Developer Command Prompt for VS 2019 / 2022** (or *x64 Native Tools Command Prompt*).
2. Navigate to `cpp-backend`:
   ```cmd
   cd cpp-backend
   build_windows_msvc.bat
   ```
   *Or with NMAKE:*
   ```cmd
   nmake /f Makefile.win
   ```
3. The executable will be generated at `bin\proton_core_engine.exe`.

---

### Option B: Using MinGW-w64 (GCC for Windows)
If you have MinGW-w64 installed (`g++` in PATH):
```cmd
cd cpp-backend
build_windows_mingw.bat
```
*Or using the standard Makefile:*
```cmd
make
```

---

### Option C: Using PowerShell
From PowerShell in the project directory:
```powershell
.\cpp-backend\build_windows.ps1
```
This script auto-detects whether you have MSVC `cl.exe`, MinGW `g++`, or `clang++` and builds automatically.

---

### Option D: Using CMake (VS Studio Solution, Ninja, CLion)
```cmd
cd cpp-backend
mkdir build
cd build
cmake ..
cmake --build . --config Release
```

---

## 2. Windows-Specific Optimizations Implemented

1. **UTF-8 Console Output**:
   - Automatically sets Windows Console Codepage via `SetConsoleOutputCP(CP_UTF8)` and `SetConsoleCP(CP_UTF8)` so all JSON, formatted text, and timestamps display cleanly without garbled characters.
2. **Directory & Path Handling**:
   - Uses `_mkdir` from `<direct.h>` on Windows instead of POSIX `mkdir`.
   - Normalizes path delimiters (`\` and `/`).
3. **SQLite3 WAL Mode**:
   - Utilizes Windows file locking mechanisms seamlessly under SQLite's Write-Ahead Logging (`PRAGMA journal_mode = WAL;`).
4. **Line-Ending Agnostic (CRLF / LF)**:
   - Built-in `readWindowsStdinAll()` handles Windows `\r\n` carriage returns automatically when receiving piped JSON data from the Node.js / Express server.
5. **Node.js Integration**:
   - `server.ts` auto-detects `process.platform === 'win32'` and invokes `proton_core_engine.exe` from `bin\`.
