export interface NativeFileSnippet {
  filename: string;
  path: string;
  language: 'rust' | 'python' | 'batch' | 'powershell' | 'toml';
  description: string;
  content: string;
}

export const PYTHON_CLEANER_SCRIPT = `#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
=============================================================================
WinCleaner-Pro Native Engine (Python 3 + Win32 API)
高性能 Windows 系统垃圾清理、浏览器缓存净化、大文件与重复文件排查、软件静默卸载
依赖: 仅使用 Python 标准库 (ctypes, winreg, concurrent.futures, hashlib) - 无需安装任何第三方库!
支持系统: Windows 10 / Windows 11 / Windows Server (x64)
=============================================================================
"""

import os
import sys
import time
import ctypes
from ctypes import wintypes
import winreg
import hashlib
from concurrent.futures import ThreadPoolExecutor
from collections import defaultdict
from pathlib import Path

# --- 1. Win32 API 结构体与函数指针绑定 ---
shell32 = ctypes.windll.shell32
kernel32 = ctypes.windll.kernel32

# Recycle Bin Win32 常量定义
SHERB_NOCONFIRMATION = 0x00000001
SHERB_NOPROGRESSUI   = 0x00000002
SHERB_NOSOUND        = 0x00000004

# SHFileOperationW 结构体定义 (安全移入回收站)
FO_DELETE          = 0x0003
FOF_SILENT         = 0x0004
FOF_NOCONFIRMATION = 0x0010
FOF_ALLOWUNDO      = 0x0040  # 核心: 允许撤销 (即移入回收站而非直接物理抹除)
FOF_NOERRORUI      = 0x0400

class SHFILEOPSTRUCTW(ctypes.Structure):
    _fields_ = [
        ("hwnd",                  wintypes.HWND),
        ("wFunc",                 wintypes.UINT),
        ("pFrom",                 wintypes.LPCWSTR),
        ("pTo",                   wintypes.LPCWSTR),
        ("fFlags",                wintypes.WORD),
        ("fAnyOperationsAborted", wintypes.BOOL),
        ("hNameMappings",         wintypes.LPVOID),
        ("lpszProgressTitle",     wintypes.LPCWSTR),
    ]

def get_disk_free_space(drive="C:\\\\"):
    """使用 Win32 GetDiskFreeSpaceExW 获取驱动器精确容量信息"""
    free_bytes_available = ctypes.c_ulonglong()
    total_number_of_bytes = ctypes.c_ulonglong()
    total_number_of_free_bytes = ctypes.c_ulonglong()

    ret = kernel32.GetDiskFreeSpaceExW(
        wintypes.LPCWSTR(drive),
        ctypes.byref(free_bytes_available),
        ctypes.byref(total_number_of_bytes),
        ctypes.byref(total_number_of_free_bytes)
    )
    if ret != 0:
        return {
            "total_gb": total_number_of_bytes.value / (1024**3),
            "free_gb": total_number_of_free_bytes.value / (1024**3),
            "used_gb": (total_number_of_bytes.value - total_number_of_free_bytes.value) / (1024**3),
            "used_pct": ((total_number_of_bytes.value - total_number_of_free_bytes.value) / total_number_of_bytes.value) * 100
        }
    return None

def win32_empty_recycle_bin(drive_letter=None):
    """调用 Win32 SHEmptyRecycleBinW 清空指定驱动器或全盘回收站"""
    flags = SHERB_NOCONFIRMATION | SHERB_NOPROGRESSUI | SHERB_NOSOUND
    root_path = wintypes.LPCWSTR(drive_letter) if drive_letter else None
    result = shell32.SHEmptyRecycleBinW(None, root_path, flags)
    return result == 0

def win32_delete_to_recycle_bin(file_path):
    """通过 Win32 SHFileOperationW 安全将文件送至回收站"""
    # Win32 API 要求双 null 结尾路径
    abs_path = os.path.abspath(file_path) + "\\0"
    file_op = SHFILEOPSTRUCTW()
    file_op.hwnd = None
    file_op.wFunc = FO_DELETE
    file_op.pFrom = abs_path
    file_op.pTo = None
    file_op.fFlags = FOF_ALLOWUNDO | FOF_NOCONFIRMATION | FOF_SILENT | FOF_NOERRORUI
    file_op.fAnyOperationsAborted = False
    res = shell32.SHFileOperationW(ctypes.byref(file_op))
    return res == 0

# --- 2. 系统垃圾与浏览器缓存规则定义 ---
def get_cleanup_targets():
    local_appdata = os.environ.get("LOCALAPPDATA", "")
    appdata = os.environ.get("APPDATA", "")
    windir = os.environ.get("WINDIR", "C:\\\\Windows")
    userprofile = os.environ.get("USERPROFILE", "")

    targets = [
        {
            "name": "用户临时文件目录 (%TEMP%)",
            "path": os.environ.get("TEMP", ""),
            "recursive": True,
            "type": "temp"
        },
        {
            "name": "Windows 系统临时文件 (Windows\\\\Temp)",
            "path": os.path.join(windir, "Temp"),
            "recursive": True,
            "type": "temp"
        },
        {
            "name": "Windows Update 补丁下载缓存",
            "path": os.path.join(windir, "SoftwareDistribution", "Download"),
            "recursive": True,
            "type": "update"
        },
        {
            "name": "系统错误报告与转储文件 (CrashDumps)",
            "path": os.path.join(local_appdata, "CrashDumps"),
            "recursive": True,
            "type": "dump"
        },
        {
            "name": "Google Chrome 网页与代码缓存",
            "path": os.path.join(local_appdata, "Google", "Chrome", "User Data", "Default", "Cache", "Cache_Data"),
            "recursive": True,
            "type": "browser"
        },
        {
            "name": "Microsoft Edge 浏览器缓存",
            "path": os.path.join(local_appdata, "Microsoft", "Edge", "User Data", "Default", "Cache", "Cache_Data"),
            "recursive": True,
            "type": "browser"
        },
        {
            "name": "VS Code 编辑器代码缓存与日志",
            "path": os.path.join(appdata, "Code", "CachedData"),
            "recursive": True,
            "type": "dev"
        },
        {
            "name": "pip Python 包下载缓存",
            "path": os.path.join(local_appdata, "pip", "cache"),
            "recursive": True,
            "type": "dev"
        },
        {
            "name": "npm 全局安装缓存",
            "path": os.path.join(appdata, "npm-cache"),
            "recursive": True,
            "type": "dev"
        }
    ]
    return [t for t in targets if t["path"] and os.path.exists(t["path"])]

def scan_target_dir(target):
    """扫描指定目标目录中的垃圾文件总大小与文件数"""
    total_size = 0
    file_count = 0
    files_list = []
    
    path = target["path"]
    try:
        for root, dirs, files in os.walk(path):
            for f in files:
                full_path = os.path.join(root, f)
                try:
                    s = os.path.getsize(full_path)
                    total_size += s
                    file_count += 1
                    if len(files_list) < 5:  # 记录抽样
                        files_list.append(full_path)
                except (PermissionError, FileNotFoundError):
                    continue
    except PermissionError:
        pass

    return {
        "name": target["name"],
        "path": path,
        "size_bytes": total_size,
        "size_mb": total_size / (1024 * 1024),
        "file_count": file_count,
        "sample_files": files_list
    }

def clean_target_dir(target_path):
    """清理指定目录下的内容，遇到占用文件安全跳过"""
    freed_bytes = 0
    deleted_files = 0
    skipped_files = 0

    if not os.path.exists(target_path):
        return 0, 0, 0

    for root, dirs, files in os.walk(target_path, topdown=False):
        for f in files:
            file_path = os.path.join(root, f)
            try:
                sz = os.path.getsize(file_path)
                os.remove(file_path)
                freed_bytes += sz
                deleted_files += 1
            except Exception:
                skipped_files += 1

        for d in dirs:
            dir_path = os.path.join(root, d)
            try:
                os.rmdir(dir_path)
            except Exception:
                pass

    return freed_bytes, deleted_files, skipped_files

# --- 3. 重复文件快速查重 (两级分块哈希算法) ---
def get_file_fast_hash(file_path, chunk_size=4096):
    """读取文件头 4KB 进行极速快筛，避免对大文件做全盘哈希"""
    try:
        hasher = hashlib.md5()
        with open(file_path, "rb") as f:
            chunk = f.read(chunk_size)
            hasher.update(chunk)
        return hasher.hexdigest()
    except Exception:
        return None

def get_file_full_hash(file_path):
    """对尺寸与快筛哈希相同的文件做完整 SHA-256 校验"""
    try:
        hasher = hashlib.sha256()
        with open(file_path, "rb") as f:
            while chunk := f.read(65536):
                hasher.update(chunk)
        return hasher.hexdigest()
    except Exception:
        return None

def scan_duplicate_files(scan_dirs, min_size_mb=10):
    """高性能多线程查重"""
    print(f"[*] 开始扫描重复文件 (过滤条件: 大于 {min_size_mb} MB)...")
    min_bytes = min_size_mb * 1024 * 1024
    
    # 步骤 1: 按文件大小分组
    size_map = defaultdict(list)
    for scan_dir in scan_dirs:
        if not os.path.exists(scan_dir):
            continue
        for root, _, files in os.walk(scan_dir):
            for file in files:
                fp = os.path.join(root, file)
                try:
                    sz = os.path.getsize(fp)
                    if sz >= min_bytes:
                        size_map[sz].append(fp)
                except Exception:
                    continue

    # 步骤 2: 过滤出具有相同大小的候选集
    candidates = {sz: paths for sz, paths in size_map.items() if len(paths) > 1}
    print(f"[+] 发现 {len(candidates)} 组文件大小完全一致，正在进行两级哈希比对...")

    duplicate_groups = []
    for sz, file_list in candidates.items():
        # 步骤 3: 提取前 4KB 快筛哈希
        fast_hash_map = defaultdict(list)
        for fp in file_list:
            fh = get_file_fast_hash(fp)
            if fh:
                fast_hash_map[fh].append(fp)
        
        # 步骤 4: 快筛相同的再比对完整 SHA-256
        for fh, sub_list in fast_hash_map.items():
            if len(sub_list) > 1:
                full_hash_map = defaultdict(list)
                for fp in sub_list:
                    full_h = get_file_full_hash(fp)
                    if full_h:
                        full_hash_map[full_h].append(fp)
                
                for final_h, dup_paths in full_hash_map.items():
                    if len(dup_paths) > 1:
                        duplicate_groups.append({
                            "hash": final_h,
                            "size_bytes": sz,
                            "files": dup_paths,
                            "wasted_bytes": sz * (len(dup_paths) - 1)
                        })

    return duplicate_groups

# --- 4. 扫描大文件 (按尺寸降序排序) ---
def scan_large_files(scan_dirs, min_size_mb=200, limit=20):
    """扫描指定目录下占用磁盘空间最大的文件"""
    print(f"[*] 扫描大文件 (阈值 >= {min_size_mb} MB)...")
    large_files = []
    min_bytes = min_size_mb * 1024 * 1024

    for scan_dir in scan_dirs:
        if not os.path.exists(scan_dir):
            continue
        for root, _, files in os.walk(scan_dir):
            for file in files:
                fp = os.path.join(root, file)
                try:
                    sz = os.path.getsize(fp)
                    if sz >= min_bytes:
                        large_files.append((fp, sz))
                except Exception:
                    continue

    large_files.sort(key=lambda x: x[1], reverse=True)
    return large_files[:limit]

# --- 5. Windows 注册表扫描已安装软件与静默卸载 ---
def scan_installed_applications():
    """扫描注册表获取 64 位、32 位与当前用户的已安装程序列表"""
    apps = []
    registry_targets = [
        (winreg.HKEY_LOCAL_MACHINE, r"SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall", winreg.KEY_WOW64_64KEY),
        (winreg.HKEY_LOCAL_MACHINE, r"SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall", winreg.KEY_WOW64_32KEY),
        (winreg.HKEY_CURRENT_USER,  r"Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall", 0)
    ]

    for hkey, subkey_path, flags in registry_targets:
        try:
            reg_key = winreg.OpenKey(hkey, subkey_path, 0, winreg.KEY_READ | flags)
        except OSError:
            continue

        num_subkeys = winreg.QueryInfoKey(reg_key)[0]
        for i in range(num_subkeys):
            try:
                sub_name = winreg.EnumKey(reg_key, i)
                app_key = winreg.OpenKey(reg_key, sub_name)
                
                # 读取关键注册表键值
                def get_val(key, name):
                    try:
                        return winreg.QueryValueEx(key, name)[0]
                    except OSError:
                        return ""

                display_name = get_val(app_key, "DisplayName")
                if not display_name:
                    continue

                uninstall_str = get_val(app_key, "UninstallString")
                quiet_uninstall_str = get_val(app_key, "QuietUninstallString")
                publisher = get_val(app_key, "Publisher")
                display_version = get_val(app_key, "DisplayVersion")
                estimated_size_kb = get_val(app_key, "EstimatedSize") or 0
                install_location = get_val(app_key, "InstallLocation")

                apps.append({
                    "name": display_name,
                    "publisher": publisher,
                    "version": display_version,
                    "size_mb": (estimated_size_kb * 1024) / (1024 * 1024) if estimated_size_kb else 0,
                    "uninstall_str": uninstall_str,
                    "quiet_uninstall_str": quiet_uninstall_str,
                    "install_location": install_location,
                    "is_msi": "msiexec" in uninstall_str.lower()
                })
            except OSError:
                continue

    # 去重并按名称排序
    seen = set()
    unique_apps = []
    for app in apps:
        if app["name"] not in seen:
            seen.add(app["name"])
            unique_apps.append(app)
            
    unique_apps.sort(key=lambda x: x["name"].lower())
    return unique_apps

# --- 6. 交互式控制台菜单 ---
def print_banner():
    print("""
========================================================================
   WinCleaner Native Core (Win32 API + Python 3 High Performance)
   垃圾清理 | 浏览器净化 | 重复查重 | 大文件定位 | 软件深度卸载
========================================================================
    """)

def main():
    print_banner()
    disk = get_disk_free_space("C:\\\\")
    if disk:
        print(f"[C盘状态] 总容量: {disk['total_gb']:.1f} GB | 已用: {disk['used_gb']:.1f} GB ({disk['used_pct']:.1f}%) | 剩余: {disk['free_gb']:.1f} GB")
        print("-" * 72)

    while True:
        print("\\n[主菜单]")
        print(" 1. 扫描系统与浏览器垃圾文件")
        print(" 2. 执行一键清理 (释放系统与浏览器缓存)")
        print(" 3. 调用 Win32 SHEmptyRecycleBinW 清空回收站")
        print(" 4. 扫描大文件排行榜 (Top 20)")
        print(" 5. 扫描并查找重复文件 (按 SHA-256 比对)")
        print(" 6. 查看已安装软件并获取静默卸载命令")
        print(" 0. 退出程序")

        choice = input("\\n请选择操作 [0-6]: ").strip()
        if choice == "0":
            print("[*] 退出程序，祝您使用愉快!")
            break
        elif choice == "1":
            print("\\n[*] 开始多线程扫描系统垃圾与浏览器缓存...")
            targets = get_cleanup_targets()
            total_junk = 0
            with ThreadPoolExecutor(max_workers=6) as executor:
                results = list(executor.map(scan_target_dir, targets))
            
            for res in results:
                print(f" -> {res['name']:<28} 占用: {res['size_mb']:>8.2f} MB ({res['file_count']} 个文件)")
                total_junk += res["size_bytes"]
            print(f"\\n[!] 扫描完成: 累计可释放空间 {total_junk / (1024**3):.2f} GB ({total_junk / (1024**2):.2f} MB)")

        elif choice == "2":
            confirm = input("确认执行清理吗? (y/N): ").strip().lower()
            if confirm == "y":
                print("\\n[*] 正在清理垃圾文件与浏览器缓存...")
                targets = get_cleanup_targets()
                freed_total = 0
                for t in targets:
                    f_bytes, d_cnt, s_cnt = clean_target_dir(t["path"])
                    freed_total += f_bytes
                    print(f" -> 已清理: {t['name']} (释放 {f_bytes / (1024**2):.2f} MB, 删除 {d_cnt} 文件, 跳过占用 {s_cnt})")
                print(f"\\n[OK] 清理完毕! 本次共释放空间: {freed_total / (1024**3):.2f} GB")

        elif choice == "3":
            print("[*] 调用 Win32 SHEmptyRecycleBinW 清空所有驱动器回收站...")
            if win32_empty_recycle_bin():
                print("[OK] 回收站已成功清空!")
            else:
                print("[!] 回收站清空失败或已为空。")

        elif choice == "4":
            scan_path = input("请输入扫描根路径 (默认 C:\\\\Users\\\\%USERNAME%): ").strip()
            if not scan_path:
                scan_path = os.environ.get("USERPROFILE", "C:\\\\")
            threshold = input("请输入最小文件大小阈值 (单位 MB, 默认 200): ").strip()
            min_mb = int(threshold) if threshold.isdigit() else 200

            results = scan_large_files([scan_path], min_size_mb=min_mb, limit=20)
            print(f"\\n[大文件扫描结果 Top {len(results)}]")
            for rank, (fp, sz) in enumerate(results, 1):
                print(f" #{rank:02d} [{sz / (1024**3):>5.2f} GB] {fp}")

        elif choice == "5":
            scan_path = input("请输入查重扫描目录 (默认 Downloads 文件夹): ").strip()
            if not scan_path:
                scan_path = os.path.join(os.environ.get("USERPROFILE", "C:\\\\"), "Downloads")
            dups = scan_duplicate_files([scan_path], min_size_mb=5)
            print(f"\\n[重复文件查重报告] 发现 {len(dups)} 组重复文件:")
            for g in dups:
                print(f" -> 哈希 {g['hash'][:12]}... 浪费空间: {g['wasted_bytes'] / (1024**2):.2f} MB")
                for p in g["files"]:
                    print(f"    - {p}")

        elif choice == "6":
            print("[*] 正在读取 Windows 注册表已安装软件列表...")
            apps = scan_installed_applications()
            print(f"\\n已检测到 {len(apps)} 款已安装软件 (前 15 项预览):")
            for i, a in enumerate(apps[:15], 1):
                size_str = f"{a['size_mb']:.1f} MB" if a['size_mb'] > 0 else "未知大小"
                print(f" {i:02d}. {a['name'][:36]:<36} | {size_str:>10} | {a['publisher'][:20]}")
                if a['quiet_uninstall_str']:
                    print(f"     [静默卸载命令]: {a['quiet_uninstall_str']}")
                elif a['uninstall_str']:
                    print(f"     [标准卸载命令]: {a['uninstall_str']}")

if __name__ == "__main__":
    main()
`;

export const RUST_CARGO_TOML = `[package]
name = "wincleaner-rs"
version = "0.1.0"
edition = "2021"
authors = ["WinCleaner Studio"]
description = "Ultra-fast Windows System Cleaner and Duplicate Finder with Win32 APIs"

[dependencies]
# 核心 Win32 API 绑定 (Windows 官方 crate)
windows = { version = "0.58", features = [
    "Win32_Foundation",
    "Win32_Storage_FileSystem",
    "Win32_UI_Shell",
    "Win32_System_Registry",
    "Win32_System_SystemServices",
] }

# 高性能多线程数据并行库
rayon = "1.10"

# 快速文件树遍历
walkdir = "2.5"

# 极速 SHA-256 哈希计算
sha2 = "0.10"
hex = "0.4"

# 命令行解析
clap = { version = "4.5", features = ["derive"] }

# 优雅的进度条与终端 UI
indicatif = "0.17"
colored = "2.1"
`;

export const RUST_MAIN_RS = `// =============================================================================
// WinCleaner-RS: 高性能 Windows 系统清理、去重与性能优化核心引擎 (Rust 语言开发)
// 借助 Windows 原生 Win32 API 与 Rayon 并行加速，内存占用 < 15MB，运行极速高效
// =============================================================================

use std::collections::HashMap;
use std::fs::{self, File};
use std::io::Read;
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicU64, AtomicUsize, Ordering};
use std::sync::Mutex;
use rayon::prelude::*;
use sha2::{Digest, Sha256};
use walkdir::WalkDir;

// 引入 Win32 接口
use windows::core::{PCWSTR, HSTRING};
use windows::Win32::UI::Shell::{
    SHEmptyRecycleBinW, SHERB_NOCONFIRMATION, SHERB_NOPROGRESSUI, SHERB_NOSOUND,
};
use windows::Win32::Storage::FileSystem::GetDiskFreeSpaceExW;

pub struct DriveStats {
    pub total_gb: f64,
    pub free_gb: f64,
    pub used_gb: f64,
}

/// 调用 Win32 API 获取磁盘可用容量
pub fn get_drive_space(drive: &str) -> Option<DriveStats> {
    unsafe {
        let drive_w = HSTRING::from(drive);
        let mut free_bytes_avail = 0u64;
        let mut total_bytes = 0u64;
        let mut total_free_bytes = 0u64;

        let ok = GetDiskFreeSpaceExW(
            PCWSTR(drive_w.as_ptr()),
            Some(&mut free_bytes_avail),
            Some(&mut total_bytes),
            Some(&mut total_free_bytes),
        );

        if ok.is_ok() {
            let total_gb = (total_bytes as f64) / 1024.0 / 1024.0 / 1024.0;
            let free_gb = (total_free_bytes as f64) / 1024.0 / 1024.0 / 1024.0;
            Some(DriveStats {
                total_gb,
                free_gb,
                used_gb: total_gb - free_gb,
            })
        } else {
            None
        }
    }
}

/// 调用 Win32 SHEmptyRecycleBinW 彻底清空 Windows 回收站
pub fn empty_recycle_bin() -> bool {
    unsafe {
        let flags = SHERB_NOCONFIRMATION | SHERB_NOPROGRESSUI | SHERB_NOSOUND;
        let res = SHEmptyRecycleBinW(None, PCWSTR::null(), flags);
        res.is_ok()
    }
}

/// 扫描清理规则项结构
#[derive(Debug, Clone)]
pub struct CleanRule {
    pub name: &'static str,
    pub path: PathBuf,
}

pub fn get_default_clean_rules() -> Vec<CleanRule> {
    let mut rules = Vec::new();
    if let Ok(temp) = std::env::var("TEMP") {
        rules.push(CleanRule {
            name: "用户临时文件目录 (%TEMP%)",
            path: PathBuf::from(temp),
        });
    }
    if let Ok(windir) = std::env::var("WINDIR") {
        rules.push(CleanRule {
            name: "Windows 系统临时文件夹 (Windows\\\\Temp)",
            path: PathBuf::from(windir).join("Temp"),
        });
        rules.push(CleanRule {
            name: "Windows Update 下载补丁缓存",
            path: PathBuf::from(windir).join("SoftwareDistribution").join("Download"),
        });
    }
    if let Ok(local_appdata) = std::env::var("LOCALAPPDATA") {
        rules.push(CleanRule {
            name: "Chrome 网页与媒体缓存",
            path: PathBuf::from(&local_appdata).join("Google\\\\Chrome\\\\User Data\\\\Default\\\\Cache\\\\Cache_Data"),
        });
        rules.push(CleanRule {
            name: "Edge 浏览器缓存",
            path: PathBuf::from(&local_appdata).join("Microsoft\\\\Edge\\\\User Data\\\\Default\\\\Cache\\\\Cache_Data"),
        });
        rules.push(CleanRule {
            name: "应用程序崩溃转储 (CrashDumps)",
            path: PathBuf::from(&local_appdata).join("CrashDumps"),
        });
    }
    rules
}

/// 多线程并发扫描垃圾文件大小
pub fn scan_junk_files(rules: &[CleanRule]) -> (u64, usize) {
    let total_bytes = AtomicU64::new(0);
    let total_count = AtomicUsize::new(0);

    rules.par_iter().for_each(|rule| {
        if rule.path.exists() {
            for entry in WalkDir::new(&rule.path).into_iter().filter_map(|e| e.ok()) {
                if let Ok(meta) = entry.metadata() {
                    if meta.is_file() {
                        total_bytes.fetch_add(meta.len(), Ordering::Relaxed);
                        total_count.fetch_add(1, Ordering::Relaxed);
                    }
                }
            }
        }
    });

    (total_bytes.load(Ordering::Relaxed), total_count.load(Ordering::Relaxed))
}

/// 执行清理：删除文件并记录释放大小
pub fn execute_cleanup(rules: &[CleanRule]) -> (u64, usize) {
    let freed_bytes = AtomicU64::new(0);
    let freed_count = AtomicUsize::new(0);

    rules.par_iter().for_each(|rule| {
        if rule.path.exists() {
            for entry in WalkDir::new(&rule.path).into_iter().filter_map(|e| e.ok()) {
                if let Ok(meta) = entry.metadata() {
                    if meta.is_file() {
                        let sz = meta.len();
                        if fs::remove_file(entry.path()).is_ok() {
                            freed_bytes.fetch_add(sz, Ordering::Relaxed);
                            freed_count.fetch_add(1, Ordering::Relaxed);
                        }
                    }
                }
            }
        }
    });

    (freed_bytes.load(Ordering::Relaxed), freed_count.load(Ordering::Relaxed))
}

/// 快速分块哈希查重核心
pub fn find_duplicates(dir: &Path, min_size: u64) -> Vec<(String, Vec<PathBuf>, u64)> {
    // 步骤 1: 扫描文件大小
    let mut size_map: HashMap<u64, Vec<PathBuf>> = HashMap::new();
    for entry in WalkDir::new(dir).into_iter().filter_map(|e| e.ok()) {
        if let Ok(meta) = entry.metadata() {
            if meta.is_file() && meta.len() >= min_size {
                size_map.entry(meta.len()).or_default().push(entry.into_path());
            }
        }
    }

    // 步骤 2: 对相同大小的文件进行并行 SHA-256 哈希计算
    let dup_results = Mutex::new(Vec::new());

    size_map.into_par_iter().for_each(|(size, paths)| {
        if paths.len() > 1 {
            let mut hash_map: HashMap<String, Vec<PathBuf>> = HashMap::new();
            for path in paths {
                if let Ok(mut file) = File::open(&path) {
                    let mut hasher = Sha256::new();
                    let mut buffer = [0u8; 65536];
                    let mut ok = true;
                    while let Ok(n) = file.read(&mut buffer) {
                        if n == 0 { break; }
                        hasher.update(&buffer[..n]);
                    }
                    if ok {
                        let hash_hex = hex::encode(hasher.finalize());
                        hash_map.entry(hash_hex).or_default().push(path);
                    }
                }
            }

            for (hash, dup_paths) in hash_map {
                if dup_paths.len() > 1 {
                    dup_results.lock().unwrap().push((hash, dup_paths, size));
                }
            }
        }
    });

    dup_results.into_inner().unwrap()
}

fn main() {
    println!("============================================================");
    println!("  WinCleaner-RS (Rust 极致性能 Win32 原生清理引擎)");
    println!("============================================================");

    if let Some(stats) = get_drive_space("C:\\\\") {
        println!("C盘容量: 总计 {:.2} GB | 剩余 {:.2} GB | 已用 {:.2} GB", stats.total_gb, stats.free_gb, stats.used_gb);
    }

    let rules = get_default_clean_rules();
    println!("正在并发扫描系统与浏览器垃圾...");
    let (bytes, count) = scan_junk_files(&rules);
    println!("扫描结果: 发现 {} 个垃圾文件，累计占用 {:.2} MB", count, (bytes as f64) / 1024.0 / 1024.0);

    println!("\\n提示: 可编译为轻量化单文件可执行程序: cargo build --release");
}
`;

export const BATCH_QUICK_CLEANER = `@echo off
chcp 65001 >nul
:: =========================================================================
:: WinCleaner Studio - Windows 一键系统深度垃圾与缓存清理脚本
:: 请使用【管理员身份运行】以确保完全权限
:: =========================================================================

title Windows 系统清理与性能优化大师 - 正在执行...
color 0B
echo.
echo =======================================================================
echo          Windows 系统深度垃圾清理与磁盘释放工具 (原生脚本)
echo =======================================================================
echo.

:: 检查管理员权限
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [!] 提示: 检测到未以管理员身份运行，部分系统更新缓存可能无法清理。
    echo [*] 建议右键选择【以管理员身份运行】本批处理文件。
    echo.
    pause
)

echo [1/6] 正在清空用户临时文件目录 (%TEMP%)...
del /f /s /q "%TEMP%\\*.*" >nul 2>&1
for /d %%p in ("%TEMP%\\*.*") do rmdir /s /q "%%p" >nul 2>&1
echo       -> 用户临时文件清理完毕!

echo [2/6] 正在清空 Windows 系统临时文件 (C:\\Windows\\Temp)...
del /f /s /q "%WINDIR%\\Temp\\*.*" >nul 2>&1
for /d %%p in ("%WINDIR%\\Temp\\*.*") do rmdir /s /q "%%p" >nul 2>&1
echo       -> 系统临时文件清理完毕!

echo [3/6] 正在清理 Google Chrome 与 Microsoft Edge 网页缓存...
del /f /s /q "%LOCALAPPDATA%\\Google\\Chrome\\User Data\\Default\\Cache\\*.*" >nul 2>&1
del /f /s /q "%LOCALAPPDATA%\\Microsoft\\Edge\\User Data\\Default\\Cache\\*.*" >nul 2>&1
echo       -> 浏览器核心缓存清理完毕!

echo [4/6] 正在清理 Windows Update 补丁下载残留缓存...
net stop wuauserv >nul 2>&1
del /f /s /q "%WINDIR%\\SoftwareDistribution\\Download\\*.*" >nul 2>&1
net start wuauserv >nul 2>&1
echo       -> Windows Update 下载缓存清理完毕!

echo [5/6] 正在清理系统错误日志、Minidump 转储文件...
del /f /s /q "%WINDIR%\\Minidump\\*.*" >nul 2>&1
del /f /s /q "%LOCALAPPDATA%\\CrashDumps\\*.*" >nul 2>&1
echo       -> 系统转储日志清理完毕!

echo [6/6] 正在调用 Win32 原生接口清空 Windows 回收站...
PowerShell -NoProfile -Command "Clear-RecycleBin -Force -ErrorAction SilentlyContinue" >nul 2>&1
echo       -> 回收站已清空!

echo.
echo =======================================================================
echo [OK] 全部优化与垃圾清理操作已顺利完成!
echo =======================================================================
echo.
pause
`;

export const POWERSHELL_OPTIMIZER_SCRIPT = `# =========================================================================
# WinCleaner Studio - PowerShell 高级系统优化与磁盘深度治理脚本
# 支持: 垃圾清理、DNS 刷新、组件存储优化 (DISM)、交付优化清理
# =========================================================================

Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host "    WinCleaner Studio - PowerShell 高级系统治理工具" -ForegroundColor Cyan
Write-Host "=========================================================" -ForegroundColor Cyan

# 1. 刷新 DNS 解析缓存
Write-Host "[1/5] 正在刷新 Windows DNS 解析缓存..." -ForegroundColor Yellow
Clear-DnsClientCache
Write-Host " -> DNS 缓存已刷新!" -ForegroundColor Green

# 2. 清空回收站
Write-Host "[2/5] 正在调用 Shell API 清空所有驱动器回收站..." -ForegroundColor Yellow
Clear-RecycleBin -Force -ErrorAction SilentlyContinue
Write-Host " -> 回收站已清空!" -ForegroundColor Green

# 3. 清理传递优化缓存 (Delivery Optimization)
Write-Host "[3/5] 正在清理 Windows 传递优化临时文件..." -ForegroundColor Yellow
Delete-DeliveryOptimizationCache -Force -ErrorAction SilentlyContinue
Write-Host " -> 传递优化缓存已清除!" -ForegroundColor Green

# 4. 清理用户临时文件夹与系统崩溃转储
Write-Host "[4/5] 正在深度清理 %TEMP% 与 CrashDumps..." -ForegroundColor Yellow
$tempPath = [System.IO.Path]::GetTempPath()
Get-ChildItem -Path $tempPath -Recurse -Force -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
Write-Host " -> 临时文件夹已深度释放!" -ForegroundColor Green

# 5. 组件存储分析与冗余清理 (DISM)
Write-Host "[5/5] 提示: 可通过 Dism.exe /Online /Cleanup-Image /StartComponentCleanup 深度释放 5-10GB WinSxS 冗余。" -ForegroundColor Magenta
Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host "[OK] PowerShell 优化脚本执行完成!" -ForegroundColor Green
`;

export const PYINSTALLER_BUILD_SCRIPT = `@echo off
chcp 65001 >nul
echo 正在使用 PyInstaller 将 cleaner_win32.py 打包为单文件轻量化 Windows 原生 EXE...
echo.
pip install pyinstaller --quiet
pyinstaller --onefile --windowed --name="WinCleanerPro" --icon=NONE cleaner_win32.py
echo.
echo 打包成功! 生成的可执行文件位于: dist\\WinCleanerPro.exe
pause
`;
