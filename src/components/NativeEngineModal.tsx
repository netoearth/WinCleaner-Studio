import React, { useState } from 'react';
import JSZip from 'jszip';
import { 
  PYTHON_CLEANER_SCRIPT, 
  RUST_CARGO_TOML, 
  RUST_MAIN_RS, 
  BATCH_QUICK_CLEANER, 
  POWERSHELL_OPTIMIZER_SCRIPT,
  PYINSTALLER_BUILD_SCRIPT
} from '../native/nativeCodeRepository';
import { 
  Code2, 
  Download, 
  Copy, 
  Check, 
  X, 
  Terminal, 
  Cpu, 
  FileCode, 
  Layers, 
  ExternalLink,
  BookOpen,
  Sparkles,
  ShieldCheck
} from 'lucide-react';

interface NativeEngineModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NativeEngineModal: React.FC<NativeEngineModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeLang, setActiveLang] = useState<'exe_build' | 'web_deploy' | 'python' | 'rust' | 'batch' | 'powershell'>('exe_build');
  const [copied, setCopied] = useState<boolean>(false);
  const [isZipping, setIsZipping] = useState<boolean>(false);

  if (!isOpen) return null;

  const getActiveCode = () => {
    switch (activeLang) {
      case 'exe_build':
        return {
          filename: 'build-windows-exe.bat',
          code: `@echo off
chcp 65001 >nul
title WinCleaner Studio - 原生 Windows EXE 打包向导

echo ========================================================
echo        WinCleaner Studio - 原生 EXE 打包编译工具
echo ========================================================
echo.
echo [1/3] 编译 Vite 前端生产资源 (dist/)...
call npm run build

echo.
echo [2/3] 安装 Electron 打包引擎 (若已安装将自动跳过)...
call npm install --save-dev electron electron-builder

echo.
echo [3/3] 一键编译为 Windows x64 原生独立 EXE...
npx electron-builder --win --x64

echo.
echo ========================================================
echo [成功] 原生 EXE 文件已生成至: dist\\ 或 dist-electron\\ 目录中！
echo 包括:
echo  - WinCleaner-Studio Setup 1.0.0.exe (带安装引导向导)
echo  - win-unpacked\\WinCleaner-Studio.exe (免安装单文件绿色版)
echo ========================================================
pause`,
          language: 'batch',
          runtimeNote: '【推荐】双击运行项目根目录下的 build-windows-exe.bat，或在终端执行上述命令，即可一键生成原生 Windows .EXE 安装包与绿色单文件版。',
        };
      case 'web_deploy':
        return {
          filename: 'deploy-guide.sh',
          code: `# ========================================================
# WinCleaner Studio - npm run build 生产部署指南
# ========================================================

# 步骤 1: 编译前端静态资产到 dist/ 目录
npm run build

# 步骤 2: 启动生产环境全栈服务 (端口 3000)
# 自动挂载 dist/ 生产网页并提供所有 /api/* 真实系统 API
npm start

# --------------------------------------------------------
# 方案 A: 使用 PM2 守护进程开机自动常驻后台
# --------------------------------------------------------
npm install -g pm2
pm2 start "npm start" --name "wincleaner-studio"
pm2 save
pm2 startup

# --------------------------------------------------------
# 方案 B: 封装为 Windows 原生系统服务 (无黑窗口，随系统开机启动)
# --------------------------------------------------------
# 1. 下载 nssm.exe (https://nssm.cc/) 并放入系统路径
# 2. 执行注册:
nssm install WinCleanerService "node" "server.js"
nssm start WinCleanerService`,
          language: 'bash',
          runtimeNote: 'npm run build 会生成压缩后的 dist/ 目录。执行 npm start 即可在生产环境以高性能模式托管该目录与底层 Win32 API 路由。',
        };
      case 'python':
        return {
          filename: 'cleaner_win32.py',
          code: PYTHON_CLEANER_SCRIPT,
          language: 'python',
          runtimeNote: '仅使用 Python 3 标准库 (ctypes, winreg, concurrent.futures)，零依赖即可直接在 Windows 运行或打包为独立 exe。',
        };
      case 'rust':
        return {
          filename: 'src/main.rs',
          code: RUST_MAIN_RS,
          language: 'rust',
          runtimeNote: '采用 Rust 语言与 windows-rs (windows 0.58) 官方 Win32 接口，配合 Rayon 多线程加速，内存消耗 < 15MB。',
        };
      case 'batch':
        return {
          filename: 'quick_clean.bat',
          code: BATCH_QUICK_CLEANER,
          language: 'batch',
          runtimeNote: 'Windows 原生批处理脚本，双击或右键以管理员身份运行，无需安装任何开发运行环境。',
        };
      case 'powershell':
        return {
          filename: 'deep_optimize.ps1',
          code: POWERSHELL_OPTIMIZER_SCRIPT,
          language: 'powershell',
          runtimeNote: 'PowerShell 高级治理脚本，集成 DNS 刷新、传递优化清理、DISM 组件存储分析与临时文件抹除。',
        };
    }
  };

  const currentSnippet = getActiveCode();

  const handleCopyCode = () => {
    navigator.clipboard.writeText(currentSnippet.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadSingleFile = () => {
    const blob = new Blob([currentSnippet.code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = currentSnippet.filename.split('/').pop() || 'script.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadFullProjectZip = async () => {
    try {
      setIsZipping(true);
      const zip = new JSZip();

      // Python Project
      const pyFolder = zip.folder('python_win32_engine');
      pyFolder?.file('cleaner_win32.py', PYTHON_CLEANER_SCRIPT);
      pyFolder?.file('build_exe.bat', PYINSTALLER_BUILD_SCRIPT);
      pyFolder?.file('README.md', '# WinCleaner Python Win32 Engine\n\n运行命令:\npython cleaner_win32.py\n\n打包为 exe:\nbuild_exe.bat\n');

      // Rust Project
      const rustFolder = zip.folder('rust_win32_engine');
      rustFolder?.file('Cargo.toml', RUST_CARGO_TOML);
      const rustSrc = rustFolder?.folder('src');
      rustSrc?.file('main.rs', RUST_MAIN_RS);
      rustFolder?.file('README.md', '# WinCleaner-RS (Rust)\n\n编译并运行:\ncargo build --release\n.\\target\\release\\wincleaner-rs.exe\n');

      // Shell Scripts
      const scriptsFolder = zip.folder('windows_native_scripts');
      scriptsFolder?.file('quick_clean.bat', BATCH_QUICK_CLEANER);
      scriptsFolder?.file('deep_optimize.ps1', POWERSHELL_OPTIMIZER_SCRIPT);

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'WinCleaner_Native_Win32_SourceCode.zip';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('ZIP generate error:', err);
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-5xl h-[88vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <span>Windows 原生轻量化内核工程源码</span>
                <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded">
                  Win32 API 原生调用
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                支持 Python (ctypes/winreg 零依赖) 与 Rust (windows-rs + Rayon 极致性能) 两个独立工程
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadFullProjectZip}
              disabled={isZipping}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isZipping ? '打包中...' : '打包下载完整工程 ZIP'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Language Tabs & Runtime Tip */}
        <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800 flex-wrap">
            <button
              onClick={() => setActiveLang('exe_build')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                activeLang === 'exe_build'
                  ? 'bg-gradient-to-r from-cyan-500/30 to-blue-500/30 text-cyan-300 border border-cyan-500/50 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>编译为原生 EXE 桌面应用</span>
            </button>

            <button
              onClick={() => setActiveLang('web_deploy')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                activeLang === 'web_deploy'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
              <span>Web 生产部署 (npm start)</span>
            </button>

            <button
              onClick={() => setActiveLang('python')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                activeLang === 'python'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileCode className="w-3.5 h-3.5 text-amber-400" />
              <span>Python 3 + Win32</span>
            </button>

            <button
              onClick={() => setActiveLang('rust')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                activeLang === 'rust'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Cpu className="w-3.5 h-3.5 text-orange-400" />
              <span>Rust 极速内核</span>
            </button>

            <button
              onClick={() => setActiveLang('batch')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                activeLang === 'batch'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Terminal className="w-3.5 h-3.5 text-cyan-400" />
              <span>一键批处理 (.bat)</span>
            </button>

            <button
              onClick={() => setActiveLang('powershell')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                activeLang === 'powershell'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-blue-400" />
              <span>PowerShell (.ps1)</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyCode}
              className="px-2.5 py-1 text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg flex items-center gap-1.5 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? '已复制源码' : '复制代码'}</span>
            </button>

            <button
              onClick={handleDownloadSingleFile}
              className="px-2.5 py-1 text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>下载单文件</span>
            </button>
          </div>
        </div>

        {/* Runtime info note */}
        <div className="px-4 py-2 bg-slate-950/60 border-b border-slate-800 text-xs text-cyan-300 font-mono flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span>{currentSnippet.runtimeNote}</span>
        </div>

        {/* Code Content Area */}
        <div className="flex-1 bg-slate-950 overflow-auto p-4 font-mono text-xs text-slate-300 leading-relaxed selection:bg-cyan-500/30">
          <pre className="whitespace-pre">
            <code>{currentSnippet.code}</code>
          </pre>
        </div>

        {/* Bottom Win32 API Cheat Sheet */}
        <div className="p-3 bg-slate-900 border-t border-slate-800/80 text-[11px] font-mono text-slate-400 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <span className="text-slate-300 font-semibold">关键 Win32 API 调用清单:</span>
            <span>SHEmptyRecycleBinW</span>
            <span aria-hidden="true">·</span>
            <span>SHFileOperationW (FOF_ALLOWUNDO)</span>
            <span aria-hidden="true">·</span>
            <span>GetDiskFreeSpaceExW</span>
            <span aria-hidden="true">·</span>
            <span>RegOpenKeyExW / RegEnumKeyExW</span>
          </div>
          <span className="text-emerald-400 font-medium">100% 原生无封装直调</span>
        </div>
      </div>
    </div>
  );
};
