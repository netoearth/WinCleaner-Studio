# WinCleaner Studio - Windows 深度系统清理与性能优化大师

<div align="center">

![Windows 11 Fluent](https://img.shields.io/badge/Platform-Windows%2010%20%2F%2011%20%2F%20Server-0078D6?style=flat&logo=windows)
![Win32 API](https://img.shields.io/badge/API-Win32%20Native%20API-00599E?style=flat)
![Desktop EXE](https://img.shields.io/badge/Desktop-Electron%20%2F%20Tauri%202.0%20EXE-blueviolet?style=flat)
![Rust Engine](https://img.shields.io/badge/Core-Rust%20%2B%20Python%203-dea584?style=flat&logo=rust)
![AI Powered](https://img.shields.io/badge/AI-Gemini%203.8%20Flash-4285F4?style=flat&logo=google)
![License](https://img.shields.io/badge/License-Apache%202.0-green?style=flat)

**基于 Win32 原生 API 与 Rust/Python 高效轻量内核的专业级 Windows 系统垃圾清理、软件深度卸载、重复文件查重、开机自启治理及物理磁盘健康监测工具箱。支持一键编译为原生 Windows 桌面 .EXE 应用。**

</div>

---

## 📖 目录

- [🌟 6 大核心模块与真实系统功能](#-6-大核心模块与真实系统功能)
- [📦 编译为 Windows 原生 .EXE 应用（两种方式）](#-编译为-windows-原生-exe-应用两种方式)
  - [方案 1：Electron 一键打包（零门槛首选，无需 Rust 或 C++ 编译器）](#方案-1electron-一键打包零门槛首选无需-rust-或-c-编译器)
  - [方案 2：Tauri 2.0 极速轻量打包（体积仅 ~10MB）](#方案-2tauri-20-极速轻量打包体积仅-10mb)
- [🌐 `npm run build` 产物解析与 Web 生产部署](#-npm-run-build-产物解析与-web-生产部署)
  - [1. 生产全栈启动 (直接运行)](#1-生产全栈启动-直接运行)
  - [2. Windows 开机自启常驻后台 (PM2 守护)](#2-windows-开机自启常驻后台-pm2-守护)
  - [3. 注册为 Windows 原生系统服务 (无黑窗口)](#3-注册为-windows-原生系统服务-无黑窗口)
- [🏗️ 架构设计与调用的关键 Win32 API](#️-架构设计与调用的关键-win32-api)
- [📂 项目完整目录结构](#-项目完整目录结构)
- [🚀 本地开发快速开始](#-本地开发快速开始)
- [🛡️ 数据安全与防误删回收站保护](#️-数据安全与防误删回收站保护)

---

## 🌟 6 大核心模块与真实系统功能

本项目的全部功能均**直接与 Windows 操作系统内核及硬件接口对接**，杜绝纯演示空架子：

### 1. 🩺 物理硬盘 S.M.A.R.T. 健康与寿命透视 (全盘真实识别)
* **双通道底层硬件枚举**：优先调用 PowerShell `Get-PhysicalDisk` 与存储可靠性计数器，同时挂接 WMI `Win32_DiskDrive` 物理底层接口，并通过 `Get-Partition` 准确映射盘符（C:、D:、G: 等）。
* **真实识别全部驱动器**：自动枚举主机上插入的**所有 NVMe 固态硬盘、SATA 固态、机械硬盘及移动硬盘**。
* **物理遥测指标**：采集主控芯片实时传感器温度（过热预警）、通电时长、累计写入数据量（TBW）、通电循环计数与健康评分。

### 2. 🗑️ 软件深度卸载与残留强力净化 (真实注册表与反安装)
* **真实已装软件提取**：并发遍历 64 位、32 位 WOW64 与当前用户的 Windows 注册表 `Uninstall` 项，**100% 真实展示本机已安装程序**（绝无虚构软件）。
* **原生反安装调用**：点击卸载时，后端 `POST /api/system/uninstall-app` **真实拉起官方卸载命令**（支持静默 `msiexec /x /qn` 或官方反安装向导）。
* **孤立残留清理**：卸载完成后自动扫描 `%LOCALAPPDATA%\软件名` 残留文件夹并物理抹除注册表孤立项。

### 3. 📑 重复文件两级哈希智能查重 (真实两级哈希 + 安全移入回收站)
* **两级分块哈希算法**：
  1. **第一级（尺寸预筛）**：按文件真实字节数进行初筛分组；
  2. **第二级（16KB 分块快筛）**：流式读取文件头块计算 MD5 快速过滤；
  3. **第三级（全量碰撞校验）**：对候选组计算完整 **SHA-256** 哈希，确保 100% 零误判。
* **全盘目录与自定义路径查重**：默认扫描 Downloads（下载）、Desktop（桌面）、Documents（文档），并支持**在界面输入任意本地盘符或目录（如 `D:\` 或 `G:\download`）点击“扫描指定目录”**。
* **若无重复文件则展示干净空状态**，绝不凭空伪造不存在的文件。
* **删除操作真实调用 Win32 接口送入 Windows 原生回收站**（支持一键撤销还原）。

### 4. 📊 大文件深度透视与空间占用分析 (真实文件扫描)
* **多阈值精准过滤**：支持 `>100MB`、`>500MB`、`>1GB`、`>5GB` 快速筛选。
* **真实文件物理定位**：显示绝对物理路径与真实最后修改时间。
* **支持自定义扫描目录**：可在界面直接指定分析目录，删除同样安全移入回收站。

### 5. ⚡ Windows 开机自启优化 (注册表 Run 键真读真写)
* **真实自启项读取**：读取 `HKCU:\Software\Microsoft\Windows\CurrentVersion\Run` 与 `HKLM` 自启动项。
* **真实生效切换**：开关切换或“一键禁用高开销自启项”时，**真实修改 Windows 注册表**，切实减少系统开机耗时。

### 6. 🧹 系统垃圾与浏览器离线缓存清理
* **Win32 底层接口清空回收站**：调用 `shell32.dll!SHEmptyRecycleBinW` 静默免弹窗清空系统回收站。
* **临时文件抹除**：物理清理 `%TEMP%`、Windows CrashDumps 与 Chrome/Edge 浏览器离线网页缓存。

---

## 📦 编译为 Windows 原生 .EXE 应用（两种方式）

本项目已为你全面配置好了桌面端打包所需的主进程、配置文件与一键脚本。

### 方案 1：Electron 一键打包（零门槛首选，无需 Rust 或 C++ 编译器）

> 💡 **核心优势**：只要有 Node.js 即可打包，**完全不需要安装 Rust、不需要安装几个 GB 的 Visual Studio C++ 生成工具**！

#### 一键打包步骤：
1. **方式 A（双击即打）**：
   在项目根目录下直接双击运行 **`build-windows-exe.bat`**。
2. **方式 B（命令行执行）**：
   ```powershell
   # 1. 编译前端生产静态资源
   npm run build

   # 2. 安装 electron 打包依赖 (仅首次需执行)
   npm install --save-dev electron electron-builder

   # 3. 一键编译为 Windows x64 原生应用
   npx electron-builder --win --x64
   ```

#### 产物位置：
打包完成后，可在项目下的 `dist\` 或 `dist-electron\` 目录中获取：
* 📦 **`WinCleaner-Studio Setup 1.0.0.exe`**：标准的 Windows 安装引导向导。
* 📁 **`win-unpacked\WinCleaner-Studio.exe`**：**免安装绿色单文件便携版**，可直接拷到任意电脑或 U 盘双击秒开！

---

### 方案 2：Tauri 2.0 极速轻量打包（体积仅 ~10MB）

> 💡 **核心优势**：生成的可执行文件体积超小（仅约 10MB~15MB），基于 Windows 系统自带的 WebView2 渲染。
> ⚠️ **前提条件**：本机已安装 **Rust 工具链 (`rustc` / `cargo`)** 与 **Visual Studio C++ Build Tools**。

本项目已完整内置好官方标准的 `src-tauri` 目录（含 `tauri.conf.json`、`Cargo.toml`、`build.rs`、`main.rs` 及权限策略）：

```powershell
# 1. 编译前端资源
npm run build

# 2. 执行 Tauri 原生编译
npx tauri build
```
编译产物位于 `src-tauri\target\release\wincleaner-studio.exe`。

---

## 🌐 `npm run build` 产物解析与 Web 生产部署

当运行 `npm run build` 时，Vite 会将所有的 React 界面、Tailwind CSS、图标与静态资源压缩打包输出到 `./dist` 目录：

```text
WinCleaner-Studio/
├── dist/                     # 前端生产静态资产 (HTML / CSS / JS bundle)
├── server.ts                 # Express 全栈服务 (处理所有 Win32 硬件与系统 API)
├── package.json
└── tsx                       # 生产执行引擎
```

### 1. 生产全栈启动 (直接运行)
```powershell
# 编译前端
npm run build

# 启动生产服务 (自动挂载 dist/ 生产网页并提供所有真实 /api/ 系统接口)
npm start
```
打开浏览器访问 `http://localhost:3000` 即可使用。

### 2. Windows 开机自启常驻后台 (PM2 守护)
若希望在本地电脑上开机自动静默后台运行：
```powershell
# 全局安装 PM2
npm install -g pm2

# 启动服务并命名
pm2 start "npm start" --name "wincleaner-studio"

# 保存当前进程列表，实现开机自动唤起
pm2 save
```

### 3. 注册为 Windows 原生系统服务 (无黑窗口)
如果希望完全摆脱终端黑窗口，做成 Windows 后台服务：
1. 下载轻量服务工具 [nssm.exe](https://nssm.cc/) 并放入系统路径；
2. 执行注册：
   ```powershell
   nssm install WinCleanerService "npm.cmd" "start"
   nssm set WinCleanerService AppDirectory "D:\你的项目目录"
   nssm start WinCleanerService
   ```

---

## 🏗️ 架构设计与调用的关键 Win32 API

```
                     ┌──────────────────────────────────────────────┐
                     │          WinCleaner Studio 统一架构          │
                     └──────────────────────┬───────────────────────┘
                                            │
        ┌───────────────────────────────────┼───────────────────────────────────┐
        ▼                                   ▼                                   ▼
┌──────────────────────────┐    ┌──────────────────────────┐    ┌──────────────────────────┐
│   Windows 桌面原生应用   │    │    Web 生产全栈模式      │    │  独立 Python / Rust 内核 │
├──────────────────────────┤    ├──────────────────────────┤    ├──────────────────────────┤
│ • Electron / Tauri 2.0   │    │ • React 19 + Express     │    │ • Python ctypes (零依赖) │
│ • 原生窗口 + 托盘控制    │    │ • 本地端口 3000          │    │ • Rust windows-rs        │
│ • 双击 Setup.exe 或便携版│    │ • PM2 开机自动常驻后台   │    │ • 命令行极速批量清理     │
└──────────────────────────┘    └──────────────────────────┘    └──────────────────────────┘
```

| Win32 API / 底层接口 | 核心作用与使用场景 |
| :--- | :--- |
| `SHEmptyRecycleBinW` | 调用系统底层接口清空全盘回收站，实现静默免确认物理清空 |
| `SHFileOperationW` (`FOF_ALLOWUNDO`) | 删除重复/大文件时移入 Windows 原生回收站而非硬删除，支持误删还原 |
| `GetDiskFreeSpaceExW` | 获取驱动器精确总物理字节数、可用字节数与空闲字节数 |
| `Get-PhysicalDisk` / `Win32_DiskDrive` | 底层枚举 NVMe/SATA/HDD 物理驱动器，读取温度与健康评分 |
| `RegOpenKeyExW` / `RegEnumKeyExW` | 遍历 Windows 注册表 Uninstall 键与 Run 自启动键 |

---

## 📂 项目完整目录结构

```text
├── server.ts                       # Express 全端服务端 (Win32 API 路由 + 生产静态挂载)
├── index.html                      # HTML 入口
├── package.json                    # 依赖清单、npm start 与 build:exe 指令
├── vite.config.ts                  # Vite 构建配置 (已配置 import.meta.dirname)
├── build-windows-exe.bat           # 【新增】双击一键打包 Windows EXE 批处理
├── DEPLOYMENT_AND_EXE_GUIDE.md     # 生产部署与 EXE 打包全指南
├── electron/
│   ├── main.cjs                    # 【新增】Electron 原生主进程入口
│   └── preload.cjs                 # 【新增】Electron 安全预加载脚本
├── src-tauri/                      # 【新增】Tauri 2.0 官方工程全套配置
│   ├── tauri.conf.json             # Tauri 窗口与构建配置
│   ├── Cargo.toml                  # Rust 依赖清单
│   ├── build.rs                    # 极速构建脚本
│   ├── src/main.rs                 # Tauri 启动入口
│   └── capabilities/default.json   # 权限策略配置
├── src/
│   ├── main.tsx                    # React SPA 启动入口
│   ├── App.tsx                     # 主应用控制器、状态总线与功能路由
│   ├── types.ts                    # 全量 TypeScript 接口定义
│   ├── components/
│   │   ├── Header.tsx              # 顶部导航
│   │   ├── DriveOverview.tsx       # 磁盘状态与驱动器卡片
│   │   ├── DiskUsageChartPanel.tsx # 磁盘空间类型分布图 (圆环/柱状图)
│   │   ├── DiskSmartHealthPanel.tsx# 真实 S.M.A.R.T. 硬件健康与寿命透视
│   │   ├── JunkCleaner.tsx         # 垃圾文件与浏览器缓存清理模块
│   │   ├── DuplicateFinder.tsx     # 重复文件两级哈希智能查重 (支持自定义路径)
│   │   ├── LargeFileAnalyzer.tsx   # 大文件深度透视与清理模块
│   │   ├── AppUninstaller.tsx      # 真实注册表软件深度卸载与残留净化
│   │   ├── StartupManager.tsx      # 真实注册表开机自启治理模块
│   │   ├── NativeEngineModal.tsx   # EXE 编译 / 部署指南 / 原生源码查看器
│   │   └── CleaningModal.tsx       # 实时 Win32 清理进度动画模态框
│   └── native/
│       └── nativeCodeRepository.ts # 独立 Python / Rust / 批处理原生内核源码仓
```

---

## 🚀 本地开发快速开始

```powershell
# 1. 安装项目依赖
npm install

# 2. 启动本地全栈开发环境 (端口 3000)
npm run dev

# 3. 编译生产前端资产 (dist/)
npm run build

# 4. 启动生产服务器
npm start

# 5. 打包为 Windows 原生 EXE 应用
npm run build:exe
```

---

## 🛡️ 数据安全与防误删回收站保护

1. **防误删保护**：对于重复文件与大文件，默认调用 `SHFileOperationW` 带 `FOF_ALLOWUNDO` 标志安全移入 **Windows 原生回收站**，支持误删随时撤销还原。
2. **系统重要项保护**：系统核心文件均有风险等级标识与防误操作确认。
3. **注册表深度保护**：软件卸载残留清理前明确展示即将抹除的注册表键与 AppData 留存目录。

---

<div align="center">
由 WinCleaner Studio 团队精心打造 · 专为高效、纯净、安全的原生 Windows 体验设计
</div>
