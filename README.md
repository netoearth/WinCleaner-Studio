# WinCleaner Studio - Windows 系统清理与性能优化大师

<div align="center">

![Windows 11 Fluent](https://img.shields.io/badge/Platform-Windows%2010%20%2F%2011%20%2F%20Server-0078D6?style=flat&logo=windows)
![Win32 API](https://img.shields.io/badge/API-Win32%20Native%20API-00599E?style=flat)
![Rust Engine](https://img.shields.io/badge/Core-Rust%20%2B%20Python%203-dea584?style=flat&logo=rust)
![AI Powered](https://img.shields.io/badge/AI-Gemini%203.8%20Flash-4285F4?style=flat&logo=google)
![License](https://img.shields.io/badge/License-Apache%202.0-green?style=flat)

**基于 Win32 API 与 Rust/Python 高效轻量内核的专业级 Windows 系统垃圾清理、浏览器缓存净化、大文件与重复文件查重及软件一键卸载工具。**

</div>

---

## 📖 目录

- [🌟 核心功能特性](#-核心功能特性)
- [🏗️ 双核心原生技术架构](#️-双核心原生技术架构)
- [🔬 调用的关键 Win32 API 说明](#-调用的关键-win32-api-说明)
- [📦 项目工程结构](#-项目工程结构)
- [🚀 快速开始与编译指南](#-快速开始与编译指南)
  - [1. 启动 Web 交互工作台](#1-启动-web-交互工作台)
  - [2. 独立运行 Python 原生单文件引擎](#2-独立运行-python-原生单文件引擎)
  - [3. 编译 Rust 高性能原生引擎](#3-编译-rust-高性能原生引擎)
  - [4. 执行 Windows 原生批处理 / PowerShell 脚本](#4-执行-windows-原生批处理--powershell-脚本)
- [🛡️ 数据安全与撤销保护设计](#️-数据安全与撤销保护设计)

---

## 🌟 核心功能特性

### 1. 🧹 系统垃圾与浏览器缓存深度净化 (Junk & Cache Cleaner)
* **Windows 系统核心垃圾**：
  * `%TEMP%` 及 `C:\Windows\Temp` 用户与系统运行临时文件。
  * `C:\$Recycle.Bin` 回收站深度清空（底层调用 Win32 `SHEmptyRecycleBinW` 静默免确认清空）。
  * `SoftwareDistribution\Download` Windows Update 补丁缓存与累积更新包。
  * `CrashDumps`、`Minidump` 与 `MEMORY.DMP` 应用程序与系统蓝屏转储日志。
  * `IconCache.db` 与 `thumbcache_*.db` 资源管理器缩略图与图标数据库。
* **浏览器与开发应用缓存**：
  * **Google Chrome**：`Cache_Data` 离线静态网页资源、Media Cache 与 V8 `Code Cache`。
  * **Microsoft Edge**：网页网络缓存、GPU 着色器渲染缓存与 SmartScreen 暂存。
  * **Mozilla Firefox**：Profiles 目录下 `cache2` 结构。
  * **高频开发工具**：VS Code 编辑器工作区缓存、Python pip wheel 暂存包、npm 全局依赖缓存。
* **物理位置下钻**：支持点击每项规则展开抽样查看实际物理路径、文件大小与修改时间。

### 2. 🔍 重复文件两级哈希智能查重 (Duplicate File Finder)
* **两级分块哈希算法**：
  1. **第一级 (尺寸预筛)**：按文件物理字节数做初级分组，过滤出尺寸相同的候选集；
  2. **第二级 (分块快筛)**：读取文件头 `4KB` 分块计算轻量 MD5 极速快筛，避免直接全盘做高耗时大文件哈希；
  3. **第三级 (全量校验)**：快筛哈希相同的候选文件并发比对完整 **SHA-256**，保证 100% 零误判。
* **智能规则选择**：支持一键“保留最早原件”、“保留最新文件”、“选择所有副本”与多维度分类（安装包、视频工程、压缩归档、代码文档）。
* **回收站撤销保护**：调用 Win32 `SHFileOperationW`（`FOF_ALLOWUNDO`），删除默认移入回收站而非直接物理抹除。

### 3. 📊 大文件深度透视与磁盘存储空间分布 (Large File Analyzer & Disk Space Visualizer)
* **多阈值过滤**：支持 `>100MB`、`>500MB`、`>1GB`、`>5GB` 快速筛选。
* **全景存储分布图**：基于 **Recharts** 打造的双重视图（**圆环占比图 Donut Chart** 与 **分类柱状图 Bar Chart**），细分剖析：
  * Windows 系统核心（`C:\Windows`, WinSxS, `pagefile.sys`）
  * 已安装软件与游戏（`Program Files`, Steam, Epic）
  * 用户个人数据（文档、下载、桌面大文件）
  * 垃圾与缓存空间（可立即释放的暂存）
  * 可用物理空闲空间
* 自动识别虚拟机虚拟硬盘（`.vmdk` / `.vhdx`）、深度学习大模型权重（`.gguf`）、剪辑暂存刮擦盘（`.pek`）与系统镜像（`.iso`）。

### 4. 🗑️ 软件深度卸载与残留强力清除 (Software Uninstaller)
* **注册表全量枚举**：同时读取 64 位注册表、WOW6432Node 及当前用户 `Uninstall` 项。
* **静默无弹窗卸载命令**：自动提取 `QuietUninstallString` 或 MSI 产品代码（`msiexec /x {GUID} /qn /norestart`），实现一键免点击静默卸载。
* **强力残留扫描与抹除**：卸载完成后自动扫描留在 `AppData\Local`、`AppData\Roaming`、`ProgramData` 中的孤立文件夹，并定位 `HKLM\SOFTWARE` 残留注册表键。

### 5. ⚡ 开机自启优化与驻留服务治理 (Startup Manager)
* 监控 `HKCU\Run`、`HKLM\Run` 及 Windows 计划任务中的启动项。
* 评估启动对开机时间的物理影响（高、中、轻微），支持一键禁用高开销后台启动项。

### 6. 🩺 硬盘 S.M.A.R.T. 健康度与寿命透视 (Disk S.M.A.R.T. Telemetry)
* **三大核心度量**：
  * **综合健康状态 (Health %)**：综合备用扇区与 ECC 校验状态，展示 PASSED 自检状态；
  * **实时物理工作温度 (°C)**：传感器温度区间监视与过热告警；
  * **预估剩余寿命 (% / 年限)**：基于闪存磨损消耗比与总主机写入量（TBW）推算；
* **工况指标**：累计通电时间（小时）、通电循环次数、异常掉电保护计数与重分配扇区数。
* **原生短自检 (Self-Test)**：支持一键触发底层 S.M.A.R.T. 固件自检例程。

### 7. 🤖 AI 智能清理建议 (AI Storage Optimization Engine)
* 基于服务端 **Gemini 3.8 Flash** 智能分析，结合当前全盘分析数据给出：
  * 预估最大可释放潜力（GB）
  * 释放收益最高且无破坏性的首选类别
  * 各大类别详细深度分析理由及直接执行按钮
  * **一键执行推荐大扫除 (Master Action)**：一键联动释放垃圾文件与重复冗余。

---

## 🏗️ 双核心原生技术架构

根据轻量化、运行高效、配合 Win32 API 开发的需求，项目提供了两套独立且可直接运行的原生代码：

```
                ┌──────────────────────────────────────────────┐
                │        WinCleaner Studio 统一架构             │
                └──────────────────────┬───────────────────────┘
                                       │
         ┌─────────────────────────────┴─────────────────────────────┐
         ▼                                                           ▼
┌─────────────────────────────────┐         ┌─────────────────────────────────┐
│     Rust 原生极速引擎 (RS)      │         │     Python 3 原生轻量引擎 (PY)   │
├─────────────────────────────────┤         ├─────────────────────────────────┤
│ • 基于 windows-rs (windows 0.58)│         │ • 纯标准库 (ctypes + winreg)    │
│ • Rayon 细粒度并行多线程数据管线│         │ • 0 外部依赖，开箱即运行        │
│ • 并发 SHA-256 流式哈希校验     │         │ • ThreadPoolExecutor 多线程扫描 │
│ • 内存占用 < 15MB               │         │ • PyInstaller 可编译为 <10MB Exe│
└─────────────────────────────────┘         └─────────────────────────────────┘
```

---

## 🔬 调用的关键 Win32 API 说明

| Win32 API 函数 | 头文件 / 动态库 | 核心应用场景与作用 |
| :--- | :--- | :--- |
| `SHEmptyRecycleBinW` | `shell32.dll` | 调用系统底层接口清空指定驱动器或全盘回收站，配合 `SHERB_NOCONFIRMATION \| SHERB_NOPROGRESSUI` 实现无弹窗静默清空 |
| `SHFileOperationW` | `shell32.dll` | 结构化文件操作，使用 `FO_DELETE` 配合 `FOF_ALLOWUNDO` 标志，将文件安全送至回收站而非直接抹除，提供误删撤销能力 |
| `GetDiskFreeSpaceExW` | `kernel32.dll` | 获取驱动器精确总物理字节数、可用字节数与空闲字节数，不受 FAT32/NTFS 簇大小统计偏差影响 |
| `GetTempPathW` | `kernel32.dll` | 获取系统与当前用户标准的临时文件夹物理路径 |
| `RegOpenKeyExW` / `RegEnumKeyExW` | `advapi32.dll` | 枚举 `SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall`，深度遍历已装软件与静默卸载命令 |
| `DeviceIoControl` | `kernel32.dll` | 发送 `IOCTL_STORAGE_QUERY_PROPERTY` 或 `SMART_RCV_DRIVE_DATA` 控制码，直接与磁盘驱动程序通信读取 S.M.A.R.T. 寄存器 |

---

## 📦 项目工程结构

```
├── server.ts                       # Express 全端服务端 (Gemini 3.8 Flash API 路由 + Vite 中间件)
├── index.html                      # HTML 入口
├── package.json                    # 依赖清单与启动脚本
├── vite.config.ts                  # Vite 构建配置
├── src/
│   ├── main.tsx                    # React SPA 启动入口
│   ├── App.tsx                     # 主应用控制器与状态总线
│   ├── types.ts                    # 全量 TypeScript 接口定义
│   ├── index.css                   # 全局样式与自定义排版
│   ├── components/
│   │   ├── Header.tsx              # 顶部导航契约
│   │   ├── DriveOverview.tsx       # 磁盘状态与驱动器卡片
│   │   ├── DiskUsageChartPanel.tsx # 基于 Recharts 的空间类型分布面板 (圆环/柱状图)
│   │   ├── DiskSmartHealthPanel.tsx# 硬盘 S.M.A.R.T. 健康与寿命透视面板
│   │   ├── AiSmartAdvisor.tsx      # AI 智能清理决策与潜力分析区域
│   │   ├── JunkCleaner.tsx         # 垃圾文件与浏览器缓存清理模块
│   │   ├── DuplicateFinder.tsx     # 重复文件两级哈希智能查重模块
│   │   ├── LargeFileAnalyzer.tsx   # 大文件深度透视与空间占用分析模块
│   │   ├── AppUninstaller.tsx      # 软件一键卸载与残留强力净化模块
│   │   ├── StartupManager.tsx      # 开机自启优化与服务治理模块
│   │   ├── NativeEngineModal.tsx   # 原生代码查看器与 1-Click ZIP 打包下载中心
│   │   └── CleaningModal.tsx       # 实时 Win32 API 清理动画与控制台终端模态框
│   ├── data/
│   │   └── mockSystemData.ts       # 真实 Windows 路径仿真数据集与格式化工具
│   └── native/
│       └── nativeCodeRepository.ts # Python、Rust、Batch、PowerShell 全套原生源码仓
```

---

## 🚀 快速开始与编译指南

### 1. 启动 Web 交互工作台

项目基于 React 19、Tailwind CSS 与 Vite，已配置好全端 Express 服务：

```bash
# 安装依赖
npm install

# 启动全栈开发服务 (端口 3000)
npm run dev

# 编译生产包
npm run build
```

---

### 2. 独立运行 Python 原生单文件引擎

进入应用后点击右上角 **“导出原生源码”** -> **“下载当前单文件”** 获取 `cleaner_win32.py`：

```bash
# 直接运行 (无需安装任何第三方库，纯 Python 3 原生标准库)
python cleaner_win32.py
```

若需打包为独立单个可执行文件（无环境依赖）：

```bash
pip install pyinstaller
pyinstaller --onefile --windowed --name="WinCleanerPro" cleaner_win32.py
# 生成的可执行文件位于: dist\WinCleanerPro.exe (< 10MB)
```

---

### 3. 编译 Rust 高性能原生引擎

点击 **“打包下载完整工程 ZIP”**，解压 `rust_win32_engine` 目录：

```bash
cd rust_win32_engine

# Debug 测试运行
cargo run

# Release 生产级优化编译 (体积小、极速性能)
cargo build --release

# 编译产物位于: target\release\wincleaner-rs.exe
```

---

### 4. 执行 Windows 原生批处理 / PowerShell 脚本

在导出的 ZIP 包中，包含开箱即用的原生脚本：
* `quick_clean.bat`：右键选择 **【以管理员身份运行】**，自动清理临时目录、更新补丁、崩溃日志并清空回收站。
* `deep_optimize.ps1`：PowerShell 高级优化脚本，支持刷新 DNS 缓存、传递优化清理与 DISM 组件冗余分析。

---

## 🛡️ 数据安全与撤销保护设计

* **防误删保护**：对于重复文件与大文件，默认调用 `SHFileOperationW` 带 `FOF_ALLOWUNDO` 标志移入 Windows 原生回收站，支持随时还原。
* **系统关键项免干扰**：系统级重要规则预置风险等级标识，预读取日志（Prefetch）与系统更新缓存提供明确风险提示与服务重启保护。
* **注册表与目录双重备份**：软件卸载残留深度清理前明确展示即将抹除的注册表键与 AppData 残留路径。

---

<div align="center">
由 WinCleaner Studio 团队精心打造 · 专为高效纯净的 Windows 体验设计
</div>
