import React from 'react';
import { ActiveTab } from '../types';
import { 
  Sparkles, 
  Trash2, 
  Copy, 
  HardDrive, 
  PackageX, 
  Zap, 
  Code2, 
  DownloadCloud
} from 'lucide-react';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenCodeEngine: () => void;
  onQuickCleanAll: () => void;
  totalReclaimableBytes: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenCodeEngine,
  onQuickCleanAll,
  totalReclaimableBytes,
}) => {
  const navItems = [
    { id: 'cleaner' as ActiveTab, label: '系统清理', icon: Trash2 },
    { id: 'duplicates' as ActiveTab, label: '重复查重', icon: Copy },
    { id: 'large_files' as ActiveTab, label: '大文件透视', icon: HardDrive },
    { id: 'uninstaller' as ActiveTab, label: '软件卸载', icon: PackageX },
    { id: 'startup' as ActiveTab, label: '开机优化', icon: Zap },
    { id: 'health' as ActiveTab, label: '硬盘健康', icon: Sparkles },
    { id: 'code_engine' as ActiveTab, label: '原生内核', icon: Code2 },
  ];

  return (
    <header className="sticky top-0 z-30 flex flex-wrap md:flex-nowrap items-center justify-between px-4 sm:px-6 py-2.5 sm:py-3.5 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 gap-3">
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center text-white shadow-sm shadow-cyan-500/20">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <span className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
          WinCleaner Studio
          <span className="text-[11px] font-mono font-medium text-cyan-400 bg-cyan-950/60 border border-cyan-800/40 px-1.5 py-0.5 rounded hidden sm:inline">
            Win32 / Rust & Python
          </span>
        </span>
      </div>

      {/* Zone 2: Navigation Links (Scrollable on small screens) */}
      <nav className="flex items-center gap-1 bg-slate-950/70 p-1 rounded-xl border border-slate-800/80 overflow-x-auto max-w-full order-3 md:order-2 w-full md:w-auto scrollbar-none">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap shrink-0 ${
                isActive
                  ? 'bg-slate-800 text-cyan-300 shadow-sm border border-slate-700/60 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Zone 3: Primary actions */}
      <div className="flex items-center gap-2 shrink-0 order-2 md:order-3">
        <button
          onClick={onOpenCodeEngine}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/70 rounded-lg transition-colors whitespace-nowrap"
          title="查看并下载 Python / Rust Win32 原生源码"
        >
          <Code2 className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden sm:inline">导出原生源码</span>
        </button>

        <button
          onClick={onQuickCleanAll}
          className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-gradient-to-r from-cyan-400 to-blue-400 hover:from-cyan-300 hover:to-blue-300 rounded-lg shadow-sm shadow-cyan-500/20 transition-all whitespace-nowrap active:scale-[0.98]"
        >
          <Trash2 className="w-3.5 h-3.5 text-slate-950" />
          <span>一键极速清理</span>
        </button>
      </div>
    </header>
  );
};
