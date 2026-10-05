# WinCleaner Studio 生产部署与原生 EXE 打包全指南

---

## 目录
1. [一、`npm run build` 产物解析与 Web 部署](#一npm-run-build-产物解析与-web-部署)
   - [1.1 产物目录结构](#11-产物目录结构)
   - [1.2 生产运行方式 (直接运行)](#12-生产运行方式-直接运行)
   - [1.3 Windows 开机自启常驻部署 (PM2)](#13-windows-开机自启常驻部署-pm2)
   - [1.4 Windows 原生系统服务部署 (NSSM)](#14-windows-原生系统服务部署-nssm)
   - [1.5 Docker 容器化部署](#15-docker-容器化部署)
2. [二、将 Web 界面编译为原生 Windows EXE 应用](#二将-web-界面编译为原生-windows-exe-应用)
   - [2.1 方案 A：Electron 打包 (最简易、零改动，自带完整运行环境)](#21-方案-aelectron-打包-最简易零改动自带完整运行环境)
   - [2.2 方案 B：Tauri 2.0 打包 (超轻量 ~12MB，Rust + WebView2)](#22-方案-btauri-20-打包-超轻量-12mb-rust--webview2)
   - [2.3 方案 C：直接运行本项目提供的原生 Python / Rust 内核](#23-方案-c直接运行本项目提供的原生-python--rust-内核)

---

## 一、`npm run build` 产物解析与 Web 部署

### 1.1 产物目录结构
运行 `npm run build` 后，Vite 会将所有的 React 界面、Tailwind CSS、图标与静态资源压缩打包输出到 `./dist` 目录：
```text
WinCleaner-Studio/
├── dist/                     # 前端生产静态资产
│   ├── index.html            # 页面 HTML 入口
│   └── assets/
│       ├── index-*.js        # 前端 React 逻辑单文件
│       └── index-*.css       # 样式文件
├── server.ts                 # Express 服务端 (处理所有 Win32 硬件与系统 API)
├── package.json
└── tsx                       # TypeScript 生产执行引擎
```

### 1.2 生产运行方式 (直接运行)
构建完成后，在项目根目录运行：
```powershell
# 1. 编译前端静态文件
npm run build

# 2. 启动生产服务器 (自动挂载 dist/ 静态网页与所有 /api/ 真实系统接口)
npm start
```
此时打开浏览器访问 `http://localhost:3000` 即可使用。

### 1.3 Windows 开机自启常驻部署 (PM2)
若希望在本地电脑或服务器上开机自动静默后台运行：
```powershell
# 全局安装 pm2
npm install -g pm2

# 启动服务并命名为 wincleaner
pm2 start "npm start" --name "wincleaner-studio"

# 保存当前进程列表，实现开机自动唤起
pm2 save
```

### 1.4 Windows 原生系统服务部署 (NSSM)
如果希望将本项目做成 Windows 的后台 Service（不依赖任何黑窗口 cmd）：
1. 下载 [NSSM (Non-Sucking Service Manager)](https://nssm.cc/)；
2. 运行命令注册服务：
   ```powershell
   nssm install WinCleanerService "C:\Program Files\nodejs\npm.cmd" "start"
   nssm set WinCleanerService AppDirectory "D:\path\to\WinCleaner-Studio"
   nssm start WinCleanerService
   ```

---

## 二、将 Web 界面编译为原生 Windows EXE 应用

本项目支持直接打包为独立的 Windows 桌面客户端 `.exe`，双击直接运行，拥有原生窗口边框、任务栏托盘和系统级交互。

### 2.1 方案 A：Electron 打包 (最简易、零改动，自带完整运行环境)

本项目已内置好 Electron 主进程脚本 `electron/main.cjs`。

#### 一键打包步骤：
1. 双击运行根目录下的 `build-windows-exe.bat` 脚本；
2. 或者在终端执行以下命令：
   ```powershell
   # 1. 编译前端
   npm run build

   # 2. 安装 electron 打包工具 (如未安装)
   npm install --save-dev electron electron-builder

   # 3. 一键编译为 Windows x64 EXE
   npx electron-builder --win --x64
   ```
3. 编译完成后，查看生成的 `dist/` 或 `dist-electron/` 目录：
   - `WinCleaner-Studio Setup 1.0.0.exe`（安装包向导）
   - `win-unpacked/WinCleaner-Studio.exe`（免安装绿色独立程序）

---

### 2.2 方案 B：Tauri 2.0 打包 (超轻量 ~12MB，Rust + WebView2)

如果希望生成的 EXE 体积只有 **10MB 左右**，且不额外消耗内存，可以使用 Tauri 2.0：

1. 安装 Tauri CLI：
   ```powershell
   npm install --save-dev @tauri-apps/cli
   ```
2. 初始化 Tauri 配置（使用默认配置即可）：
   ```powershell
   npx tauri init
   ```
   - App Name: `WinCleaner Studio`
   - Window Title: `WinCleaner Studio`
   - Web assets location: `../dist`
   - Dev Server URL: `http://localhost:3000`
3. 执行编译：
   ```powershell
   npm run build
   npx tauri build
   ```
4. 输出位置：`src-tauri/target/release/wincleaner-studio.exe`。

---

### 2.3 方案 C：直接运行本项目提供的原生 Python / Rust 内核

如果你希望纯粹在命令行/免安装环境下清理：
1. 点击软件右上角 **“导出原生源码”** 或进入 **“Win32 原生内核”** 页面；
2. 点击 **“下载工程 ZIP 压缩包”**，即可获得纯 Python 3 (`cleaner_win32.py`，零依赖直接运行) 与纯 Rust (`cargo build --release` 生成独立单文件可执行程序)。
