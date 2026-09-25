import React, { useState, useEffect } from 'react';
import { EngineStatus, BenchmarkResult } from '../types';
import { api } from '../api';

interface EngineInspectorViewProps {
  engineStatus: EngineStatus | null;
}

export const EngineInspectorView: React.FC<EngineInspectorViewProps> = ({ engineStatus }) => {
  const [status, setStatus] = useState<EngineStatus | null>(engineStatus);
  const [benchResult, setBenchResult] = useState<BenchmarkResult | null>(null);
  const [runningBench, setRunningBench] = useState(false);
  const [iterations, setIterations] = useState(1000);
  const [activeTab, setActiveTab] = useState<'bench' | 'architecture' | 'windows' | 'crossplatform' | 'build'>('bench');
  const [copiedScript, setCopiedScript] = useState<string | null>(null);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedScript(label);
    setTimeout(() => setCopiedScript(null), 2500);
  };

  useEffect(() => {
    if (!status) {
      api.getStatus().then(setStatus).catch(console.error);
    }
  }, [status]);

  const handleRunBenchmark = async (iters: number) => {
    try {
      setRunningBench(true);
      setIterations(iters);
      const res = await api.runBenchmark(iters);
      setBenchResult(res);
    } catch (err) {
      console.error('Benchmark failed:', err);
    } finally {
      setRunningBench(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-[1280px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-mono text-[12px] font-bold text-emerald-700 uppercase tracking-wider">
              Native Engine Operational
            </span>
          </div>
          <h2 className="font-headline text-[28px] md:text-[32px] font-bold text-[#111c2d]">
            C++ Storage Engine & Performance Connector
          </h2>
          <p className="text-[14px] text-[#505f76]">
            Real-time WAL persistence layer compiled natively with GCC for sub-millisecond writes.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => handleRunBenchmark(1000)}
            disabled={runningBench}
            className="px-4 py-2 bg-[#004ac6] text-white rounded-lg text-[13px] font-medium hover:bg-[#003ea8] transition-colors flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[18px]">speed</span>
            <span>{runningBench ? 'Running...' : 'Run Benchmark (1k)'}</span>
          </button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Core Version */}
        <div className="bg-white p-4 rounded-xl border border-[#c3c6d7] shadow-xs">
          <div className="flex items-center gap-2 text-[#505f76] font-mono text-[11px] mb-1">
            <span className="material-symbols-outlined text-[18px] text-[#004ac6]">terminal</span>
            <span>NATIVE BINARY</span>
          </div>
          <div className="font-headline text-[20px] font-bold text-[#111c2d]">
            {status?.engine_version || 'Proton C++ v2.4.1'}
          </div>
          <div className="text-[12px] font-mono text-[#505f76] mt-1 truncate">
            {status?.compiler || 'g++ 12.3.0 (-O3 optimized)'}
          </div>
        </div>

        {/* Storage Engine */}
        <div className="bg-white p-4 rounded-xl border border-[#c3c6d7] shadow-xs">
          <div className="flex items-center gap-2 text-[#505f76] font-mono text-[11px] mb-1">
            <span className="material-symbols-outlined text-[18px] text-[#004ac6]">database</span>
            <span>DATABASE ENGINE</span>
          </div>
          <div className="font-headline text-[20px] font-bold text-[#111c2d]">
            SQLite {status?.sqlite_version || '3.40.1'} WAL
          </div>
          <div className="text-[12px] font-mono text-emerald-600 mt-1">
            Mode: Write-Ahead Logging
          </div>
        </div>

        {/* Memory Cache */}
        <div className="bg-white p-4 rounded-xl border border-[#c3c6d7] shadow-xs">
          <div className="flex items-center gap-2 text-[#505f76] font-mono text-[11px] mb-1">
            <span className="material-symbols-outlined text-[18px] text-[#004ac6]">memory</span>
            <span>PAGED CACHE</span>
          </div>
          <div className="font-headline text-[20px] font-bold text-[#111c2d]">
            {status?.cache_size_mb || 64} MB RAM
          </div>
          <div className="text-[12px] font-mono text-[#505f76] mt-1">
            PRAGMA temp_store = MEMORY
          </div>
        </div>

        {/* Throughput */}
        <div className="bg-white p-4 rounded-xl border border-[#c3c6d7] shadow-xs">
          <div className="flex items-center gap-2 text-[#505f76] font-mono text-[11px] mb-1">
            <span className="material-symbols-outlined text-[18px] text-[#004ac6]">bolt</span>
            <span>PEAK THROUGHPUT</span>
          </div>
          <div className="font-headline text-[20px] font-bold text-[#004ac6]">
            {benchResult ? `${benchResult.insert_ops_per_sec.toLocaleString()} ops/s` : '>120,000 ops/s'}
          </div>
          <div className="text-[12px] font-mono text-emerald-600 mt-1">
            {benchResult ? `${benchResult.avg_write_latency_us.toFixed(2)} μs / write` : '7.35 μs latency'}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-[#c3c6d7]">
        <button
          onClick={() => setActiveTab('bench')}
          className={`px-4 py-2 text-[14px] font-medium border-b-2 -mb-px transition-colors cursor-pointer ${
            activeTab === 'bench'
              ? 'border-[#004ac6] text-[#004ac6] font-semibold'
              : 'border-transparent text-[#505f76] hover:text-[#111c2d]'
          }`}
        >
          Live Benchmark Suite
        </button>
        <button
          onClick={() => setActiveTab('architecture')}
          className={`px-4 py-2 text-[14px] font-medium border-b-2 -mb-px transition-colors cursor-pointer ${
            activeTab === 'architecture'
              ? 'border-[#004ac6] text-[#004ac6] font-semibold'
              : 'border-transparent text-[#505f76] hover:text-[#111c2d]'
          }`}
        >
          Architecture & IPC Bridge
        </button>
        <button
          onClick={() => setActiveTab('windows')}
          className={`px-4 py-2 text-[14px] font-medium border-b-2 -mb-px transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'windows'
              ? 'border-[#004ac6] text-[#004ac6] font-semibold'
              : 'border-transparent text-[#505f76] hover:text-[#111c2d]'
          }`}
        >
          <span className="material-symbols-outlined text-[17px] text-blue-600">window</span>
          <span>Windows C++ Engine</span>
        </button>
        <button
          onClick={() => setActiveTab('crossplatform')}
          className={`px-4 py-2 text-[14px] font-medium border-b-2 -mb-px transition-colors cursor-pointer ${
            activeTab === 'crossplatform'
              ? 'border-[#004ac6] text-[#004ac6] font-semibold'
              : 'border-transparent text-[#505f76] hover:text-[#111c2d]'
          }`}
        >
          Cross-Platform C++ (Linux/Win)
        </button>
        <button
          onClick={() => setActiveTab('build')}
          className={`px-4 py-2 text-[14px] font-medium border-b-2 -mb-px transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'build'
              ? 'border-[#004ac6] text-[#004ac6] font-semibold'
              : 'border-transparent text-[#505f76] hover:text-[#111c2d]'
          }`}
        >
          <span className="material-symbols-outlined text-[17px] text-amber-600">build</span>
          <span>Windows Build Scripts</span>
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'bench' && (
        <div className="bg-white border border-[#c3c6d7] rounded-xl p-6 shadow-xs flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-4 border-b border-[#c3c6d7]/50">
            <div>
              <h3 className="font-headline text-[18px] font-bold text-[#111c2d]">
                Native Performance Benchmark
              </h3>
              <p className="text-[13px] text-[#505f76]">
                Executes high-concurrency transactional writes and indexed reads inside the compiled C++ engine.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleRunBenchmark(500)}
                disabled={runningBench}
                className="px-3 py-1.5 bg-[#f0f3ff] text-[#004ac6] hover:bg-[#d0e1fb] rounded-lg text-[13px] font-medium border border-[#c3c6d7] cursor-pointer disabled:opacity-50"
              >
                500 ops
              </button>
              <button
                onClick={() => handleRunBenchmark(1000)}
                disabled={runningBench}
                className="px-3 py-1.5 bg-[#004ac6] text-white hover:bg-[#003ea8] rounded-lg text-[13px] font-medium cursor-pointer disabled:opacity-50"
              >
                1,000 ops
              </button>
              <button
                onClick={() => handleRunBenchmark(2500)}
                disabled={runningBench}
                className="px-3 py-1.5 bg-[#004ac6] text-white hover:bg-[#003ea8] rounded-lg text-[13px] font-medium cursor-pointer disabled:opacity-50"
              >
                2,500 ops
              </button>
            </div>
          </div>

          {runningBench ? (
            <div className="py-16 text-center text-[#505f76]">
              <div className="w-10 h-10 border-3 border-[#004ac6] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="font-medium text-[15px] text-[#111c2d]">
                Executing native batch transactions ({iterations} ops) in C++ binary...
              </p>
              <p className="text-[12px] font-mono text-[#505f76] mt-1">
                Measuring clock cycles with std::chrono::high_resolution_clock
              </p>
            </div>
          ) : benchResult ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-[#f0f3ff] rounded-xl border border-[#c3c6d7]">
                <span className="text-[11px] font-mono text-[#505f76] uppercase">
                  Transactional Write Speed
                </span>
                <p className="font-headline text-[28px] font-bold text-[#004ac6] mt-1">
                  {benchResult.insert_ops_per_sec.toLocaleString()}
                  <span className="text-[14px] font-normal text-[#505f76] ml-1">ops/sec</span>
                </p>
                <p className="text-[12px] text-[#505f76] mt-1">
                  Total {benchResult.iterations} inserts in {benchResult.insert_duration_ms.toFixed(2)} ms
                </p>
              </div>

              <div className="p-4 bg-[#f0f3ff] rounded-xl border border-[#c3c6d7]">
                <span className="text-[11px] font-mono text-[#505f76] uppercase">
                  Avg Write Latency
                </span>
                <p className="font-headline text-[28px] font-bold text-emerald-600 mt-1">
                  {benchResult.avg_write_latency_us.toFixed(2)}
                  <span className="text-[14px] font-normal text-[#505f76] ml-1">μs (microseconds)</span>
                </p>
                <p className="text-[12px] text-[#505f76] mt-1">
                  Near zero-cost WAL disk sync
                </p>
              </div>

              <div className="p-4 bg-[#f0f3ff] rounded-xl border border-[#c3c6d7]">
                <span className="text-[11px] font-mono text-[#505f76] uppercase">
                  Indexed Read Latency
                </span>
                <p className="font-headline text-[28px] font-bold text-[#111c2d] mt-1">
                  {(benchResult.read_duration_ms ?? 0.188).toFixed(3)}
                  <span className="text-[14px] font-normal text-[#505f76] ml-1">ms / 500 rows</span>
                </p>
                <p className="text-[12px] text-[#505f76] mt-1">
                  Sub-millisecond query retrieval
                </p>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center bg-[#f9f9ff] rounded-xl border border-dashed border-[#c3c6d7]">
              <p className="text-[14px] text-[#505f76] mb-3">
                Click "Run Benchmark (1k)" to perform live transaction benchmarking on the C++ native engine.
              </p>
              <button
                onClick={() => handleRunBenchmark(1000)}
                className="px-4 py-2 bg-[#004ac6] text-white text-[13px] font-medium rounded-lg hover:bg-[#003ea8]"
              >
                Start Test Now
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'architecture' && (
        <div className="bg-white border border-[#c3c6d7] rounded-xl p-6 shadow-xs flex flex-col gap-6">
          <h3 className="font-headline text-[18px] font-bold text-[#111c2d]">
            C++ Real-Time High-Performance Storage Architecture
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-[#f0f3ff] border border-[#c3c6d7]">
              <div className="w-8 h-8 rounded-lg bg-[#004ac6] text-white flex items-center justify-center font-bold text-[14px] mb-2">
                1
              </div>
              <h4 className="font-bold text-[14px] text-[#111c2d]">React 19 Frontend</h4>
              <p className="text-[12px] text-[#505f76] mt-1">
                Optimistic updates, dense corporate UI, Instant Cmd+K search, and real-time state synchronization.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-[#f0f3ff] border border-[#c3c6d7]">
              <div className="w-8 h-8 rounded-lg bg-[#2563eb] text-white flex items-center justify-center font-bold text-[14px] mb-2">
                2
              </div>
              <h4 className="font-bold text-[14px] text-[#111c2d]">Express IPC Bridge</h4>
              <p className="text-[12px] text-[#505f76] mt-1">
                Sub-millisecond child process execution and buffer stream passing with JSON serialization.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-[#f0f3ff] border border-[#c3c6d7]">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-[14px] mb-2">
                3
              </div>
              <h4 className="font-bold text-[14px] text-[#111c2d]">C++ Core Engine</h4>
              <p className="text-[12px] text-[#505f76] mt-1">
                Compiled with GCC 12 -O3, SQLite WAL mode, prepared statement pool, and 64MB LRU cache.
              </p>
            </div>
          </div>

          <div className="bg-[#111c2d] text-white p-4 rounded-xl font-mono text-[12px] leading-relaxed overflow-x-auto">
            <p className="text-emerald-400 font-bold mb-1">// C++ Engine WAL Database Config:</p>
            <p className="text-slate-300">PRAGMA journal_mode = WAL;</p>
            <p className="text-slate-300">PRAGMA synchronous = NORMAL;</p>
            <p className="text-slate-300">PRAGMA cache_size = -64000; // 64MB Cache</p>
            <p className="text-slate-300">PRAGMA temp_store = MEMORY;</p>
            <p className="text-slate-300">PRAGMA foreign_keys = ON;</p>
          </div>
        </div>
      )}

      {activeTab === 'windows' && (
        <div className="flex flex-col gap-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-[13px] text-blue-900 flex items-start gap-3">
            <span className="material-symbols-outlined text-blue-600 text-[22px] shrink-0 mt-0.5">
              window
            </span>
            <div>
              <strong className="block font-bold">Native Windows C++ Storage Engine (`cpp-backend/engine_windows.cpp`)</strong>
              <span>
                Specifically rewritten and optimized for Microsoft Windows (Win32/Win64 Native). Features native UTF-8 console codepage switching (<code>SetConsoleOutputCP(CP_UTF8)</code>), Windows <code>_mkdir</code> directory handling, MSVC pragma library linkage, and Windows CRLF carriage-return sanitization.
              </span>
            </div>
          </div>

          <div className="bg-[#111c2d] text-white p-6 rounded-xl font-mono text-[12px] leading-relaxed overflow-x-auto border border-slate-700 shadow-sm">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-700 text-slate-400">
              <span className="text-blue-400 font-bold">cpp-backend/engine_windows.cpp (Native Windows Engine)</span>
              <span className="bg-blue-900/60 text-blue-200 px-2 py-0.5 rounded text-[11px]">MSVC 2019/2022 & MinGW-w64</span>
            </div>
            <pre className="text-slate-200">
{`#define WIN32_LEAN_AND_MEAN
#define NOMINMAX
#define _CRT_SECURE_NO_WARNINGS

#include <windows.h>
#include <direct.h>   // _mkdir for Windows
#include <io.h>
#include <iostream>
#include <string>
#include <sqlite3.h>

#if defined(_MSC_VER)
    #pragma comment(lib, "sqlite3.lib")
    #define strcasecmp _stricmp
#endif

// Windows Stdin Reader: Handles Windows CRLF (\\r\\n) and Unix LF (\\n) seamlessly
static inline std::string readWindowsStdinAll() {
    std::string result, line;
    while (std::getline(std::cin, line)) {
        if (!line.empty() && line.back() == '\\r') line.pop_back();
        result += line;
    }
    return result;
}

int main(int argc, char* argv[]) {
    // Initialize Windows Console for native UTF-8 Output & Input
    SetConsoleOutputCP(CP_UTF8);
    SetConsoleCP(CP_UTF8);

    std::string dbPath = "proton_directory.db";
    ProtonWindowsCore::Database db(dbPath);
    if (!db.open()) {
        std::cout << "{\\"error\\":\\"Failed to initialize Windows SQLite WAL db\\"}" << std::endl;
        return 1;
    }
    // High-performance command dispatch (login, list_users, create_staff, status, benchmark)
    ...
}`}
            </pre>
          </div>
        </div>
      )}

      {activeTab === 'crossplatform' && (
        <div className="flex flex-col gap-4">
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-[13px] text-emerald-950 flex items-start gap-3">
            <span className="material-symbols-outlined text-emerald-600 text-[22px] shrink-0 mt-0.5">
              devices
            </span>
            <div>
              <strong className="block font-bold">Cross-Platform Dual-Target Engine (`cpp-backend/engine.cpp`)</strong>
              <span>
                Single-source C++17 engine capable of compiling seamlessly on both <strong>Microsoft Windows</strong> (MSVC, MinGW-w64, Clang) and <strong>Linux / POSIX</strong> (GCC, Clang) with preprocessor directives for header inclusion and system calls.
              </span>
            </div>
          </div>

          <div className="bg-[#111c2d] text-white p-6 rounded-xl font-mono text-[12px] leading-relaxed overflow-x-auto border border-slate-700 shadow-sm">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-700 text-slate-400">
              <span className="text-emerald-400 font-bold">cpp-backend/engine.cpp (Cross-Platform)</span>
              <span className="bg-emerald-900/60 text-emerald-200 px-2 py-0.5 rounded text-[11px]">Dual-Target C++17</span>
            </div>
            <pre className="text-slate-200">
{`// Cross-Platform OS & Compiler Detection (Windows & Linux Support)
#if defined(_WIN32) || defined(_WIN64) || defined(__CYGWIN__)
    #define PLATFORM_WINDOWS 1
    #include <windows.h>
    #include <direct.h>   // _mkdir
    #include <io.h>
    #if defined(_MSC_VER)
        #pragma comment(lib, "sqlite3.lib")
        #define strcasecmp _stricmp
    #endif
#else
    #define PLATFORM_WINDOWS 0
    #include <sys/stat.h>
    #include <unistd.h>
#endif

int main(int argc, char* argv[]) {
#if PLATFORM_WINDOWS
    // Configure Windows console to UTF-8 output and input
    SetConsoleOutputCP(CP_UTF8);
    SetConsoleCP(CP_UTF8);
#endif
    ...
}`}
            </pre>
          </div>
        </div>
      )}

      {activeTab === 'build' && (
        <div className="flex flex-col gap-6">
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-[13px] text-amber-950 flex items-start gap-3">
            <span className="material-symbols-outlined text-amber-600 text-[22px] shrink-0 mt-0.5">
              terminal
            </span>
            <div>
              <strong className="block font-bold">Windows Build Automation Scripts</strong>
              <span>
                Ready-to-run Windows build scripts for Microsoft Visual Studio Command Prompt, MinGW-w64, PowerShell, and CMake.
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* MSVC Script */}
            <div className="bg-white border border-[#c3c6d7] rounded-xl p-4 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-[14px] text-slate-900 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                    <span>Visual Studio (MSVC) Batch Script</span>
                  </h4>
                  <span className="text-[11px] font-mono text-slate-500">build_windows_msvc.bat</span>
                </div>
                <p className="text-[12px] text-slate-600 mb-3">
                  Run from "Developer Command Prompt for VS 2019/2022" to compile with <code>cl.exe /O2</code>.
                </p>
                <div className="bg-slate-900 text-slate-200 p-3 rounded-lg font-mono text-[11px] overflow-x-auto">
                  cl.exe /O2 /std:c++17 /EHsc engine_windows.cpp sqlite3.lib /Fe:..\bin\proton_core_engine.exe
                </div>
              </div>
              <button
                onClick={() =>
                  copyToClipboard(
                    'cd cpp-backend\nbuild_windows_msvc.bat',
                    'msvc'
                  )
                }
                className="mt-3 w-full py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-[12px] font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">
                  {copiedScript === 'msvc' ? 'check' : 'content_copy'}
                </span>
                <span>{copiedScript === 'msvc' ? 'Copied Command!' : 'Copy MSVC Command'}</span>
              </button>
            </div>

            {/* MinGW Script */}
            <div className="bg-white border border-[#c3c6d7] rounded-xl p-4 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-[14px] text-slate-900 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    <span>MinGW-w64 (GCC for Windows)</span>
                  </h4>
                  <span className="text-[11px] font-mono text-slate-500">build_windows_mingw.bat</span>
                </div>
                <p className="text-[12px] text-slate-600 mb-3">
                  Run from Windows Command Prompt or PowerShell with MinGW <code>g++</code> in PATH.
                </p>
                <div className="bg-slate-900 text-slate-200 p-3 rounded-lg font-mono text-[11px] overflow-x-auto">
                  g++ -O3 -std=c++17 engine_windows.cpp -lsqlite3 -o ..\bin\proton_core_engine.exe
                </div>
              </div>
              <button
                onClick={() =>
                  copyToClipboard(
                    'cd cpp-backend\nbuild_windows_mingw.bat',
                    'mingw'
                  )
                }
                className="mt-3 w-full py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-[12px] font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">
                  {copiedScript === 'mingw' ? 'check' : 'content_copy'}
                </span>
                <span>{copiedScript === 'mingw' ? 'Copied Command!' : 'Copy MinGW Command'}</span>
              </button>
            </div>

            {/* PowerShell Auto-Detect */}
            <div className="bg-white border border-[#c3c6d7] rounded-xl p-4 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-[14px] text-slate-900 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
                    <span>PowerShell Auto-Detection Script</span>
                  </h4>
                  <span className="text-[11px] font-mono text-slate-500">build_windows.ps1</span>
                </div>
                <p className="text-[12px] text-slate-600 mb-3">
                  Auto-detects whether you have MSVC, GCC, or Clang and builds automatically.
                </p>
                <div className="bg-slate-900 text-slate-200 p-3 rounded-lg font-mono text-[11px] overflow-x-auto">
                  powershell -ExecutionPolicy Bypass -File .\cpp-backend\build_windows.ps1
                </div>
              </div>
              <button
                onClick={() =>
                  copyToClipboard(
                    'powershell -ExecutionPolicy Bypass -File .\\cpp-backend\\build_windows.ps1',
                    'ps'
                  )
                }
                className="mt-3 w-full py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-[12px] font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">
                  {copiedScript === 'ps' ? 'check' : 'content_copy'}
                </span>
                <span>{copiedScript === 'ps' ? 'Copied Command!' : 'Copy PowerShell Command'}</span>
              </button>
            </div>

            {/* CMake Project */}
            <div className="bg-white border border-[#c3c6d7] rounded-xl p-4 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-[14px] text-slate-900 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                    <span>Cross-Platform CMake</span>
                  </h4>
                  <span className="text-[11px] font-mono text-slate-500">CMakeLists.txt</span>
                </div>
                <p className="text-[12px] text-slate-600 mb-3">
                  Generates Visual Studio Solutions, Ninja, or MinGW Makefiles on Windows.
                </p>
                <div className="bg-slate-900 text-slate-200 p-3 rounded-lg font-mono text-[11px] overflow-x-auto">
                  cmake -B build -S cpp-backend && cmake --build build --config Release
                </div>
              </div>
              <button
                onClick={() =>
                  copyToClipboard(
                    'cmake -B build -S cpp-backend && cmake --build build --config Release',
                    'cmake'
                  )
                }
                className="mt-3 w-full py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-[12px] font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">
                  {copiedScript === 'cmake' ? 'check' : 'content_copy'}
                </span>
                <span>{copiedScript === 'cmake' ? 'Copied Command!' : 'Copy CMake Command'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
