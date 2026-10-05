@echo off
chcp 65001 >nul
title WinCleaner Studio - 原生 Windows EXE 打包向导

echo ========================================================
echo        WinCleaner Studio - 原生 EXE 打包编译工具
echo ========================================================
echo.
echo [1/4] 检查 Node.js 环境...
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未检测到 Node.js，请先访问 https://nodejs.org 安装 Node.js 18 或更高版本。
    pause
    exit /b 1
)

echo [2/4] 编译 Vite 前端生产资源 (dist/)...
call npm run build
if %errorlevel% neq 0 (
    echo [错误] 前端编译失败，请检查报错日志。
    pause
    exit /b 1
)

echo.
echo [3/4] 请选择 EXE 打包方案:
echo   1. Electron 方案 (支持完整 Node.js 后端，一键生成 Setup.exe 安装包与绿色版，推荐首选)
echo   2. Tauri 2.0 方案 (轻量原生 Rust + WebView2，生成体积仅约 12MB 的超极速 exe)
echo   3. Node-SEA 原生单文件封装方案
echo.
set /p choice=请输入数字选择 (默认 1): 
if "%choice%"=="" set choice=1

if "%choice%"=="1" (
    echo.
    echo 正在安装 electron 与 electron-builder 依赖...
    call npm install --save-dev electron electron-builder
    echo 正在编译 Windows 原生 EXE...
    npx electron-builder --win --x64
    echo.
    echo ========================================================
    echo [完成] EXE 文件已输出至: dist-electron\ 或 dist\ 目录中！
    echo ========================================================
    pause
    exit /b 0
)

if "%choice%"=="2" (
    echo.
    echo [提示] 正在使用 Tauri 2.0 CLI 进行编译...
    npx @tauri-apps/cli build
    echo.
    echo [完成] Tauri 原生 EXE 已输出至: src-tauri\target\release\
    pause
    exit /b 0
)

pause
