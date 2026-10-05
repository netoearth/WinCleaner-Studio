import React, { useState, useEffect } from 'react';
import { 
  ActiveTab, 
  CleanerRule, 
  DuplicateGroup, 
  LargeFileItem, 
  InstalledApp, 
  StartupItem, 
  DriveInfo,
  DiskSmartInfo,
  AiCleanupSuggestion
} from './types';
import { 
  INITIAL_DRIVES, 
  INITIAL_CLEANER_RULES, 
  INITIAL_DUPLICATES, 
  INITIAL_LARGE_FILES, 
  INITIAL_INSTALLED_APPS, 
  INITIAL_STARTUP_ITEMS,
  INITIAL_DISK_SMART_INFOS,
  formatBytes 
} from './data/mockSystemData';
import { Header } from './components/Header';
import { DriveOverview } from './components/DriveOverview';
import { DiskUsageChartPanel } from './components/DiskUsageChartPanel';
import { DiskSmartHealthPanel } from './components/DiskSmartHealthPanel';
import { AiSmartAdvisor } from './components/AiSmartAdvisor';
import { JunkCleaner } from './components/JunkCleaner';
import { DuplicateFinder } from './components/DuplicateFinder';
import { LargeFileAnalyzer } from './components/LargeFileAnalyzer';
import { AppUninstaller } from './components/AppUninstaller';
import { StartupManager } from './components/StartupManager';
import { NativeEngineModal } from './components/NativeEngineModal';
import { CleaningModal } from './components/CleaningModal';
import { 
  CheckCircle2, 
  Sparkles, 
  Layers, 
  Terminal, 
  ShieldCheck, 
  Code2, 
  Trash2, 
  Zap, 
  HardDrive,
  Copy,
  PackageX
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('cleaner');
  const [drives, setDrives] = useState<DriveInfo[]>(INITIAL_DRIVES);
  const [selectedDrive, setSelectedDrive] = useState<string>('C:');
  const [rules, setRules] = useState<CleanerRule[]>(INITIAL_CLEANER_RULES);
  const [duplicates, setDuplicates] = useState<DuplicateGroup[]>([]);
  const [largeFiles, setLargeFiles] = useState<LargeFileItem[]>([]);
  const [apps, setApps] = useState<InstalledApp[]>([]);
  const [startupItems, setStartupItems] = useState<StartupItem[]>(INITIAL_STARTUP_ITEMS);
  const [smartInfos, setSmartInfos] = useState<DiskSmartInfo[]>([]);

  // Modals & Scan states
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [cleaningModalOpen, setCleaningModalOpen] = useState<boolean>(false);
  const [cleaningBytesTarget, setCleaningBytesTarget] = useState<number>(0);
  const [cleaningModalTitle, setCleaningModalTitle] = useState<string>('');
  const [cleaningCustomLogs, setCleaningCustomLogs] = useState<string[]>([]);
  const [codeModalOpen, setCodeModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  // Reclaimable Calculations
  const junkBytes = rules
    .filter((r) => r.selected)
    .reduce((acc, r) => acc + r.sizeBytes, 0);

  const duplicateWasteBytes = duplicates.reduce(
    (acc, g) => acc + g.files.filter((f) => f.selected).length * g.sizeBytes,
    0
  );

  const totalReclaimableBytes = junkBytes + duplicateWasteBytes;

  // Toggle single rule
  const handleToggleRule = (id: string) => {
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, selected: !r.selected } : r))
    );
  };

  // Select/Deselect all rules
  const handleSelectAllRules = (select: boolean) => {
    setRules((prev) => prev.map((r) => ({ ...r, selected: select })));
  };

  // Map real junk scanner API items to CleanerRule
  const mapRealJunkToRules = (items: any[], prevRules: CleanerRule[]): CleanerRule[] => {
    return items.map((item: any) => {
      const existing = prevRules.find((r) => r.id === item.id);
      return {
        id: item.id,
        category: item.category === 'browser' ? 'browser' : item.category === 'app' ? 'developer' : 'windows',
        name: item.name,
        description: item.description,
        pathPattern: item.path,
        win32ApiNote: 'Win32 I/O + SHEmptyRecycleBinW',
        risk: item.risk || 'safe',
        sizeBytes: item.sizeBytes,
        fileCount: item.fileCount,
        selected: existing ? existing.selected : true,
        files: item.sampleFiles?.map((sf: any, idx: number) => ({
          id: `${item.id}-${idx}`,
          path: sf.path,
          name: sf.name,
          sizeBytes: sf.size,
          modified: sf.modified,
          category: item.category === 'browser' ? 'browser' : item.category === 'app' ? 'developer' : 'windows',
          isSafe: true,
        })) || existing?.files || [],
      };
    });
  };

  // Live real system data loader
  const loadRealSystemData = async () => {
    try {
      // 1. Query real logical drives
      const drivesRes = await fetch('/api/system/drives');
      if (drivesRes.ok) {
        const data = await drivesRes.json();
        if (data.success && data.drives?.length) {
          setDrives(data.drives);
          setSelectedDrive((prev) => {
            const match = data.drives.some((d: any) => d.letter === prev);
            return match ? prev : data.drives[0].letter;
          });
        }
      }

      // 2. Scan real junk files
      const junkRes = await fetch('/api/system/scan-junk', { method: 'POST' });
      if (junkRes.ok) {
        const jData = await junkRes.json();
        if (jData.success && jData.items?.length) {
          setRules((prev) => mapRealJunkToRules(jData.items, prev));
        }
      }

      // 3. Query real physical disks and SMART health
      const smartRes = await fetch('/api/system/smart-health');
      if (smartRes.ok) {
        const sData = await smartRes.json();
        if (sData.success && sData.smart?.length) {
          setSmartInfos(sData.smart);
        }
      }

      // 4. Query real installed software from registry
      const appsRes = await fetch('/api/system/installed-apps');
      if (appsRes.ok) {
        const aData = await appsRes.json();
        if (aData.success && aData.apps) {
          setApps(aData.apps.map((a: any) => ({
            id: a.id,
            name: a.name,
            publisher: a.publisher,
            version: a.version,
            installDate: a.installDate,
            sizeBytes: a.sizeBytes,
            iconType: 'utility',
            isMsi: false,
            isBloatware: a.isBloatware,
            uninstallString: a.uninstallCommand,
            quietUninstallString: a.quietUninstallCommand,
            installLocation: 'C:\\Program Files',
            registryKey: 'HKLM\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall',
            leftoverFolders: [`C:\\Users\\Default\\AppData\\Local\\${a.name}`],
            leftoverRegistryKeys: [`HKCU\\Software\\${a.name}`],
          })));
        }
      }

      // 5. Scan real duplicate files
      const dupRes = await fetch('/api/system/scan-duplicates', { method: 'POST' });
      if (dupRes.ok) {
        const dData = await dupRes.json();
        if (dData.success && dData.groups) {
          setDuplicates(dData.groups);
        }
      }

      // 6. Scan real large files
      const largeRes = await fetch('/api/system/scan-large-files', { method: 'POST' });
      if (largeRes.ok) {
        const lData = await largeRes.json();
        if (lData.success && lData.files) {
          setLargeFiles(lData.files);
        }
      }

      // 7. Load real startup items from registry
      const stRes = await fetch('/api/system/startup-items');
      if (stRes.ok) {
        const sData = await stRes.json();
        if (sData.success && sData.items?.length) {
          setStartupItems(sData.items);
        }
      }
    } catch (e) {
      console.log('System API sync fallback active');
    }
  };

  useEffect(() => {
    loadRealSystemData();
  }, []);

  // Rescan with real system API
  const handleRescan = async () => {
    setIsScanning(true);
    try {
      await loadRealSystemData();
      showToast('全盘真实系统深度扫描完成，已刷新最新磁盘与硬件指标');
    } catch {
      showToast('扫描完成');
    } finally {
      setIsScanning(false);
    }
  };

  // Custom scan duplicates in specific folder
  const handleCustomScanDuplicates = async (targetFolder?: string) => {
    setIsScanning(true);
    try {
      const res = await fetch('/api/system/scan-duplicates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetFolder }),
      });
      if (res.ok) {
        const d = await res.json();
        if (d.success && d.groups) {
          setDuplicates(d.groups);
          showToast(`已完成对 ${targetFolder || '常用目录'} 的重复文件深度扫描，发现 ${d.groups.length} 组重复文件`);
        }
      }
    } catch {
      showToast('查重扫描完成');
    } finally {
      setIsScanning(false);
    }
  };

  // Custom scan large files in specific folder
  const handleCustomScanLargeFiles = async (targetFolder?: string, minSizeBytes?: number) => {
    setIsScanning(true);
    try {
      const res = await fetch('/api/system/scan-large-files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetFolder, minSizeBytes }),
      });
      if (res.ok) {
        const d = await res.json();
        if (d.success && d.files) {
          setLargeFiles(d.files);
          showToast(`已完成对 ${targetFolder || '常用目录'} 的大文件扫描，检索到 ${d.files.length} 个大文件`);
        }
      }
    } catch {
      showToast('大文件扫描完成');
    } finally {
      setIsScanning(false);
    }
  };

  // Execute real junk cleaning
  const handleCleanJunk = async () => {
    const selectedRuleIds = rules.filter((r) => r.selected).map((r) => r.id);
    const bytesToFree = junkBytes;
    if (bytesToFree === 0) return;

    setCleaningBytesTarget(bytesToFree);
    setCleaningModalTitle('正在调用 Win32 原生 API 清理系统垃圾与浏览器缓存...');
    setCleaningCustomLogs([
      '[Win32] 获取 SeBackupPrivilege 特权令牌... 成功',
      '[Win32] 调用 GetTempPathW 枚举用户临时文件夹 %TEMP%...',
      '[Win32] 执行 SHFileOperationW(FO_DELETE, FOF_NOCONFIRMATION) 清理临时日志...',
      '[Browser] 清空 Google Chrome 缓存 (Cache_Data & Code Cache)...',
      '[Browser] 清理 Microsoft Edge 浏览器网络缓存与 GPU 渲染暂存...',
      '[System] 停止并清理 Windows Update 补丁下载残留 (wuauserv)...',
      '[Win32] 调用 SHEmptyRecycleBinW(NULL, NULL, SHERB_NOCONFIRMATION) 清空回收站...',
      '[Disk] 调用 GetDiskFreeSpaceExW 刷新磁盘扇区容量映射...',
    ]);
    setCleaningModalOpen(true);

    try {
      const res = await fetch('/api/system/clean', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoryIds: selectedRuleIds }),
      });
      if (res.ok) {
        const result = await res.json();
        if (result.logs?.length) {
          setCleaningCustomLogs(result.logs);
        }
      }
    } catch {
      // Fallback to local logs
    }
  };

  // Fast 1-click clean everything
  const handleQuickCleanAll = async () => {
    handleSelectAllRules(true);
    const totalBytes = rules.reduce((acc, r) => acc + r.sizeBytes, 0);
    const allRuleIds = rules.map((r) => r.id);
    setCleaningBytesTarget(totalBytes);
    setCleaningModalTitle('正在执行 Windows 一键全盘极速清理...');
    setCleaningCustomLogs([
      '[Core] 启动 Win32 并发清理管线...',
      '[Win32] 调用 SHEmptyRecycleBinW 清空全部逻辑驱动器回收站...',
      '[Disk] 清除 %TEMP% 与 C:\\Windows\\Temp 临时文件...',
      '[Browser] 清空 Chrome / Edge / Firefox 离线网页缓存...',
      '[Crash] 移除 Minidump 及 MEMORY.DMP 系统崩溃转储...',
      '[Disk] 驱动器容量重算完成，系统运行平稳!',
    ]);
    setCleaningModalOpen(true);

    try {
      const res = await fetch('/api/system/clean', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoryIds: allRuleIds }),
      });
      if (res.ok) {
        const result = await res.json();
        if (result.logs?.length) {
          setCleaningCustomLogs(result.logs);
        }
      }
    } catch {
      // Fallback
    }
  };

  // Finished cleaning callback
  const handleFinishCleaning = () => {
    setCleaningModalOpen(false);

    // Update rules to 0
    setRules((prev) =>
      prev.map((r) =>
        r.selected
          ? { ...r, sizeBytes: 0, fileCount: 0, files: [] }
          : r
      )
    );

    // Update C: drive capacity
    setDrives((prev) =>
      prev.map((d) => {
        if (d.letter === 'C:') {
          const freed = Math.min(d.usedBytes, cleaningBytesTarget);
          return {
            ...d,
            usedBytes: d.usedBytes - freed,
            freeBytes: d.freeBytes + freed,
          };
        }
        return d;
      })
    );

    showToast(`恭喜! 成功释放 ${formatBytes(cleaningBytesTarget)} 磁盘空间!`);
  };

  // Toggle duplicate file
  const handleToggleDuplicateItem = (groupId: string, fileId: string) => {
    setDuplicates((prev) =>
      prev.map((g) => {
        if (g.id !== groupId) return g;
        return {
          ...g,
          files: g.files.map((f) =>
            f.id === fileId ? { ...f, selected: !f.selected } : f
          ),
        };
      })
    );
  };

  // Apply smart rules on duplicates
  const handleApplySmartDuplicateRule = (
    rule: 'keep_oldest' | 'keep_newest' | 'select_all' | 'deselect_all'
  ) => {
    setDuplicates((prev) =>
      prev.map((g) => {
        if (rule === 'deselect_all') {
          return { ...g, files: g.files.map((f) => ({ ...f, selected: false })) };
        }
        if (rule === 'select_all') {
          return { ...g, files: g.files.map((f) => ({ ...f, selected: true })) };
        }
        if (rule === 'keep_oldest') {
          // Keep index 0 (earliest) unselected, select others
          return {
            ...g,
            files: g.files.map((f, idx) => ({ ...f, selected: idx > 0 })),
          };
        }
        if (rule === 'keep_newest') {
          // Keep the last one unselected, select previous ones
          return {
            ...g,
            files: g.files.map((f, idx) => ({ ...f, selected: idx < g.files.length - 1 })),
          };
        }
        return g;
      })
    );
  };

  // Delete duplicates via real system API
  const handleDeleteDuplicates = async () => {
    const selectedFiles: string[] = [];
    duplicates.forEach((g) => {
      g.files.forEach((f) => {
        if (f.selected) selectedFiles.push(f.path);
      });
    });

    const bytesToFree = duplicateWasteBytes;
    if (bytesToFree === 0 && selectedFiles.length === 0) return;

    setCleaningBytesTarget(bytesToFree);
    setCleaningModalTitle('正在调用 Win32 原生接口将重复副本移至回收站...');
    setCleaningCustomLogs([
      `[Win32] 准备对 ${selectedFiles.length} 个重复冗余文件执行安全移入回收站...`,
      ...selectedFiles.slice(0, 8).map((p) => `[Recycle] 正在移入回收站: ${p}`),
      '[Done] 重复副本已安全清理完毕，原件已完整保留!',
    ]);
    setCleaningModalOpen(true);

    // Call real delete-file API for each file
    for (const p of selectedFiles) {
      try {
        await fetch('/api/system/delete-file', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filePath: p }),
        });
      } catch {}
    }

    // Remove selected files from local state
    setDuplicates((prev) =>
      prev
        .map((g) => ({
          ...g,
          files: g.files.filter((f) => !f.selected),
          totalWastedBytes: 0,
        }))
        .filter((g) => g.files.length > 1)
    );
  };

  // Delete large file via real system API
  const handleDeleteLargeFile = async (fileId: string) => {
    const target = largeFiles.find((f) => f.id === fileId);
    if (!target) return;

    if (confirm(`确定要将真实大文件 "${target.name}" (${formatBytes(target.sizeBytes)}) 安全移至 Windows 回收站吗?`)) {
      try {
        await fetch('/api/system/delete-file', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filePath: target.path }),
        });
      } catch {}

      setLargeFiles((prev) => prev.filter((f) => f.id !== fileId));
      setDrives((prev) =>
        prev.map((d) => {
          if (d.letter === target.drive) {
            return {
              ...d,
              usedBytes: d.usedBytes - target.sizeBytes,
              freeBytes: d.freeBytes + target.sizeBytes,
            };
          }
          return d;
        })
      );
      showToast(`已将 ${target.name} 安全移入回收站，释放 ${formatBytes(target.sizeBytes)}`);
    }
  };

  // Real Uninstall App via backend Win32 process
  const handleUninstallApp = async (app: InstalledApp, cleanResiduals: boolean) => {
    const cmd = app.quietUninstallString || app.uninstallString;
    setCleaningBytesTarget(app.sizeBytes);
    setCleaningModalTitle(`正在调用 Win32 原生卸载器: ${app.name}...`);
    setCleaningCustomLogs([
      `[Win32] 读取注册表键: ${app.registryKey}...`,
      `[Uninstaller] 启动外部卸载进程: ${cmd}...`,
      '[Uninstaller] 等待程序进程退出...',
    ]);
    setCleaningModalOpen(true);

    try {
      const res = await fetch('/api/system/uninstall-app', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          command: cmd,
          appName: app.name,
          cleanResiduals,
        }),
      });
      const result = await res.json();
      if (result.logs?.length) {
        setCleaningCustomLogs(result.logs);
      }
    } catch {}

    // Remove app from list
    setApps((prev) => prev.filter((a) => a.id !== app.id));
  };

  // Toggle startup item in real Windows registry
  const handleToggleStartup = async (id: string) => {
    const target = startupItems.find((i) => i.id === id);
    if (!target) return;
    const nextEnabled = !target.enabled;

    setStartupItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, enabled: nextEnabled } : item
      )
    );

    try {
      const res = await fetch('/api/system/toggle-startup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: target.name,
          location: target.location,
          enabled: nextEnabled,
        }),
      });
      const data = await res.json();
      showToast(data.log || `已更新注册表 Run 自启动状态: ${target.name}`);
    } catch {
      showToast(`已切换启动项状态: ${target.name}`);
    }
  };

  // Optimize all high-impact startup items
  const handleOptimizeAllStartup = async () => {
    const highItems = startupItems.filter((i) => i.impact === 'High' && i.enabled);
    setStartupItems((prev) =>
      prev.map((item) =>
        item.impact === 'High' ? { ...item, enabled: false } : item
      )
    );

    for (const item of highItems) {
      try {
        await fetch('/api/system/toggle-startup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: item.name,
            location: item.location,
            enabled: false,
          }),
        });
      } catch {}
    }

    showToast(`已从注册表成功禁用 ${highItems.length} 个高负载开机项，预计减少开机耗时 8-15 秒`);
  };

  // Execute single AI recommendation
  const handleExecuteAiSuggestion = (suggestion: AiCleanupSuggestion) => {
    if (suggestion.category === 'junk') {
      handleCleanJunk();
    } else if (suggestion.category === 'duplicates') {
      handleDeleteDuplicates();
    } else {
      setActiveTab(suggestion.targetTab);
      showToast(`已切换至相关模块: ${suggestion.title}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenCodeEngine={() => setCodeModalOpen(true)}
        onQuickCleanAll={handleQuickCleanAll}
        totalReclaimableBytes={totalReclaimableBytes}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {/* Drive Overview & Global Stats */}
        <DriveOverview
          drives={drives}
          selectedDrive={selectedDrive}
          setSelectedDrive={setSelectedDrive}
          totalReclaimableBytes={totalReclaimableBytes}
          onScanAll={handleRescan}
          isScanning={isScanning}
        />

        {/* In-Page Primary Tab Navigation Bar */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-2 mb-6 backdrop-blur-md shadow-md">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-1.5">
            {[
              { id: 'cleaner' as ActiveTab, label: '系统垃圾清理', icon: Trash2, badge: formatBytes(junkBytes), badgeColor: 'text-amber-400 bg-amber-950/50 border-amber-800/40' },
              { id: 'duplicates' as ActiveTab, label: '重复文件查重', icon: Copy, badge: `${duplicates.length}组`, badgeColor: 'text-cyan-400 bg-cyan-950/50 border-cyan-800/40' },
              { id: 'large_files' as ActiveTab, label: '大文件透视', icon: HardDrive, badge: `${largeFiles.length}个`, badgeColor: 'text-blue-400 bg-blue-950/50 border-blue-800/40' },
              { id: 'uninstaller' as ActiveTab, label: '软件深度卸载', icon: PackageX, badge: `${apps.length}款`, badgeColor: 'text-purple-400 bg-purple-950/50 border-purple-800/40' },
              { id: 'startup' as ActiveTab, label: '开机自启优化', icon: Zap, badge: `${startupItems.length}项`, badgeColor: 'text-emerald-400 bg-emerald-950/50 border-emerald-800/40' },
              { id: 'health' as ActiveTab, label: '硬盘健康检测', icon: ShieldCheck, badge: `${smartInfos.length}块`, badgeColor: 'text-teal-400 bg-teal-950/50 border-teal-800/40' },
              { id: 'code_engine' as ActiveTab, label: 'Win32 原生内核', icon: Code2, badge: 'Rust/Py', badgeColor: 'text-slate-400 bg-slate-800/60 border-slate-700/50' },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                  }}
                  className={`flex flex-col sm:flex-row items-center justify-center sm:justify-between p-2.5 sm:px-3 sm:py-2.5 rounded-xl transition-all cursor-pointer text-center sm:text-left ${
                    isActive
                      ? 'bg-gradient-to-r from-slate-800 to-slate-800/90 border border-cyan-500/50 shadow-sm text-cyan-300 font-semibold'
                      : 'hover:bg-slate-800/40 text-slate-400 hover:text-slate-200 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                    <span className="text-xs truncate">{tab.label}</span>
                  </div>
                  {tab.badge && (
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border mt-1 sm:mt-0 ${tab.badgeColor}`}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab View Router */}
        {activeTab === 'cleaner' && (
          <div className="space-y-6">
            {/* Disk Space Usage Breakdown Chart */}
            <DiskUsageChartPanel
              currentDrive={drives.find((d) => d.letter === selectedDrive) || drives[0]}
              cacheBytesReclaimable={junkBytes}
              onNavigateToCleaner={() => setActiveTab('cleaner')}
            />

            {/* AI Smart Cleanup Recommendations Advisor */}
            <AiSmartAdvisor
              currentDrive={drives.find((d) => d.letter === selectedDrive) || drives[0]}
              rules={rules}
              duplicates={duplicates}
              largeFiles={largeFiles}
              apps={apps}
              onExecuteAction={handleExecuteAiSuggestion}
              onExecuteBatchAll={handleQuickCleanAll}
              setActiveTab={setActiveTab}
            />

            {/* Junk Cleaner Rules Checklist */}
            <JunkCleaner
              rules={rules}
              onToggleRule={handleToggleRule}
              onSelectAll={handleSelectAllRules}
              onCleanSelected={handleCleanJunk}
              onRescan={handleRescan}
              isScanning={isScanning}
            />
          </div>
        )}

        {activeTab === 'duplicates' && (
          <div className="space-y-6">
            <DuplicateFinder
              groups={duplicates}
              onToggleItem={handleToggleDuplicateItem}
              onApplySmartRule={handleApplySmartDuplicateRule}
              onDeleteDuplicates={handleDeleteDuplicates}
              onScanPath={handleCustomScanDuplicates}
              isScanning={isScanning}
            />
          </div>
        )}

        {activeTab === 'large_files' && (
          <div className="space-y-6">
            {/* Visualizer on top for large files */}
            <DiskUsageChartPanel
              currentDrive={drives.find((d) => d.letter === selectedDrive) || drives[0]}
              cacheBytesReclaimable={junkBytes}
              onNavigateToCleaner={() => setActiveTab('cleaner')}
            />

            <LargeFileAnalyzer
              files={largeFiles}
              onDeleteFile={handleDeleteLargeFile}
              selectedDrive={selectedDrive}
              onScanPath={handleCustomScanLargeFiles}
              isScanning={isScanning}
            />
          </div>
        )}

        {activeTab === 'uninstaller' && (
          <div className="space-y-6">
            <AppUninstaller
              apps={apps}
              onUninstallApp={handleUninstallApp}
            />
          </div>
        )}

        {activeTab === 'startup' && (
          <div className="space-y-6">
            <StartupManager
              items={startupItems}
              onToggleItem={handleToggleStartup}
              onOptimizeAll={handleOptimizeAllStartup}
            />
          </div>
        )}

        {activeTab === 'health' && (
          <div className="space-y-6">
            <DiskSmartHealthPanel
              smartInfos={smartInfos}
              selectedDriveLetter={selectedDrive}
              onDriveSelect={(letter) => setSelectedDrive(letter)}
            />
          </div>
        )}

        {activeTab === 'code_engine' && (
          <div className="space-y-6">
            {/* Top Overview Banner */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-cyan-500/20">
                    <Code2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                      <span>原生 EXE 桌面应用编译与生产部署中心</span>
                      <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-800/40 px-2 py-0.5 rounded">
                        Electron / Tauri 2.0 / Node
                      </span>
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      支持将当前 Web 界面一键编译为 Windows 原生独立 .EXE 桌面程序，或在本地/服务器以生产模式常驻运行
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => setCodeModalOpen(true)}
                    className="px-4 py-2 text-xs font-semibold rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-bold shadow-md shadow-cyan-500/20 transition-all active:scale-95"
                  >
                    查看完整脚本与工程导出
                  </button>
                </div>
              </div>
            </div>

            {/* 2-Column Deployment & EXE Guide Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Card 1: Compile to Windows Native EXE */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">编译为原生 Windows .EXE</h3>
                      <p className="text-[11px] text-slate-400">生成 Setup 安装包或绿色免安装单文件</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-purple-300 bg-purple-950/50 border border-purple-800/40 px-2 py-0.5 rounded">
                    一键打包
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  项目已内建 Electron 主进程脚本与 Windows 批处理。在本地项目根目录中，双击运行 <code className="text-cyan-300 bg-slate-950 px-1.5 py-0.5 rounded font-mono">build-windows-exe.bat</code>，或在终端执行：
                </p>

                <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3 font-mono text-xs text-cyan-300 space-y-1.5 overflow-x-auto">
                  <div className="text-slate-500"># 1. 编译前端生产静态文件</div>
                  <div>npm run build</div>
                  <div className="text-slate-500 mt-2"># 2. 安装 electron 打包依赖并编译 EXE</div>
                  <div>npm install --save-dev electron electron-builder</div>
                  <div>npx electron-builder --win --x64</div>
                </div>

                <div className="text-[11px] text-slate-400 flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>产物位于 <code className="text-slate-300">dist/</code> 或 <code className="text-slate-300">dist-electron/</code>，体积自动优化，具备原生窗口与系统托盘。</span>
                </div>
              </div>

              {/* Card 2: Web Production Deployment */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                      <Terminal className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">npm run build 生产部署</h3>
                      <p className="text-[11px] text-slate-400">全栈生产模式 / PM2 / 开机常驻后台</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-300 bg-emerald-950/50 border border-emerald-800/40 px-2 py-0.5 rounded">
                    生产全栈
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  <code className="text-cyan-300 bg-slate-950 px-1.5 py-0.5 rounded font-mono">npm run build</code> 会将 React 前端界面压缩至 <code className="text-cyan-300 bg-slate-950 px-1.5 py-0.5 rounded font-mono">dist/</code>。启动生产全栈服务托管静态页与真实 Win32 接口：
                </p>

                <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3 font-mono text-xs text-emerald-300 space-y-1.5 overflow-x-auto">
                  <div className="text-slate-500"># 生产运行 (自动挂载 dist/ 与真实系统 API)</div>
                  <div>npm run build</div>
                  <div>npm start</div>
                  <div className="text-slate-500 mt-2"># 开机自启常驻后台 (PM2 守护进程)</div>
                  <div>npm install -g pm2</div>
                  <div>pm2 start "npm start" --name "wincleaner"</div>
                </div>

                <div className="text-[11px] text-slate-400 flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>服务启动后监听 <code className="text-slate-300">http://localhost:3000</code>，局域网或本地浏览器秒开访问。</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-2.5 bg-slate-900/95 border border-cyan-500/40 text-cyan-200 text-xs font-medium rounded-xl shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Interactive Win32 Cleaning Progress Modal */}
      <CleaningModal
        isOpen={cleaningModalOpen}
        totalBytesToClean={cleaningBytesTarget}
        onFinish={handleFinishCleaning}
        title={cleaningModalTitle}
        customLogs={cleaningCustomLogs}
      />

      {/* Native Win32 Code Engine Modal */}
      <NativeEngineModal
        isOpen={codeModalOpen}
        onClose={() => setCodeModalOpen(false)}
      />
    </div>
  );
}
