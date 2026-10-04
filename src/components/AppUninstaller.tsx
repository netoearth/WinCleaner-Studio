import React, { useState } from 'react';
import { InstalledApp } from '../types';
import { formatBytes } from '../data/mockSystemData';
import { 
  PackageX, 
  Trash2, 
  ShieldAlert, 
  AlertTriangle, 
  Search, 
  CheckCircle2, 
  ExternalLink, 
  FolderX, 
  Terminal, 
  Copy,
  Sparkles,
  ShieldCheck,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

interface AppUninstallerProps {
  apps: InstalledApp[];
  onUninstallApp: (app: InstalledApp, cleanResiduals: boolean) => void;
}

export const AppUninstaller: React.FC<AppUninstallerProps> = ({
  apps,
  onUninstallApp,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'bloatware' | 'large'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedApp, setSelectedApp] = useState<InstalledApp | null>(null);
  const [copiedCmd, setCopiedCmd] = useState<boolean>(false);
  const [expandedAppId, setExpandedAppId] = useState<string | null>(null);

  const filteredApps = apps.filter((app) => {
    const matchesFilter =
      filterType === 'all' ||
      (filterType === 'bloatware' && app.isBloatware) ||
      (filterType === 'large' && app.sizeBytes > 1024 * 1024 * 1024);

    const matchesSearch =
      app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.publisher.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const handleCopyCmd = (cmd: string) => {
    navigator.clipboard.writeText(cmd);
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 1800);
  };

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-white tracking-tight">软件一键卸载与残留垃圾深度强力净化</h2>
              <span className="flex items-center gap-1 text-[11px] font-mono text-cyan-400 bg-cyan-950/40 border border-cyan-800/40 px-2 py-0.5 rounded">
                <ShieldCheck className="w-3 h-3" />
                Win32 注册表枚举 (HKLM/HKCU Uninstall)
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              直接读取 Windows 注册表已安装软件清单，支持无弹窗静默卸载并强力清扫遗留的注册表键与 AppData 缓存
            </p>
          </div>

          {/* Quick Filter Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-950/70 border border-slate-800/80 rounded-xl">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                filterType === 'all'
                  ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              全部已装软件 ({apps.length})
            </button>
            <button
              onClick={() => setFilterType('bloatware')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                filterType === 'bloatware'
                  ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              捆绑/推荐卸载 ({apps.filter((a) => a.isBloatware).length})
            </button>
            <button
              onClick={() => setFilterType('large')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                filterType === 'large'
                  ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              超大体积 (&gt; 1GB)
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="搜索软件名称、发行厂商..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-950/70 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>
          <span className="text-xs text-slate-400 hidden sm:inline">
            共计匹配 <strong className="text-slate-200 font-mono">{filteredApps.length}</strong> 款程序
          </span>
        </div>
      </div>

      {/* App List */}
      {filteredApps.length === 0 ? (
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mx-auto">
            <PackageX className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-slate-100">未发现匹配的已安装软件</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
            正在读取 Windows 注册表 Uninstall 清单，或当前分类筛选下暂无应用程序。
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredApps.map((app) => {
          const isExpanded = expandedAppId === app.id;

          return (
            <div
              key={app.id}
              className={`rounded-xl border transition-all ${
                app.isBloatware
                  ? 'bg-slate-900/70 border-amber-900/40 hover:border-amber-700/60'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700/80 flex items-center justify-center shrink-0 text-cyan-400">
                    <PackageX className="w-5 h-5" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-slate-100">{app.name}</span>
                      {app.isBloatware && (
                        <span className="text-[10px] font-mono text-amber-300 bg-amber-950/50 border border-amber-800/40 px-1.5 py-0.2 rounded flex items-center gap-1">
                          <AlertTriangle className="w-2.5 h-2.5" />
                          建议卸载
                        </span>
                      )}
                      {app.isMsi && (
                        <span className="text-[10px] font-mono text-blue-300 bg-blue-950/40 border border-blue-800/40 px-1.5 py-0.2 rounded">
                          MSI Installer
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400 mt-1 font-mono">
                      <span>发行商: {app.publisher}</span>
                      <span aria-hidden="true">·</span>
                      <span>版本: {app.version}</span>
                      <span aria-hidden="true">·</span>
                      <span>安装日期: {app.installDate}</span>
                    </div>
                  </div>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                  <div className="text-right">
                    <div className="text-sm font-bold font-mono text-cyan-300 tabular-nums">
                      {formatBytes(app.sizeBytes)}
                    </div>
                    <button
                      onClick={() => setExpandedAppId(isExpanded ? null : app.id)}
                      className="text-[11px] text-cyan-400 hover:underline flex items-center gap-0.5 justify-end"
                    >
                      <span>残留分析</span>
                      {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                    </button>
                  </div>

                  <button
                    onClick={() => onUninstallApp(app, true)}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-500/90 hover:bg-rose-500 text-white flex items-center gap-1.5 transition-colors shadow-sm active:scale-95"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>一键深度卸载</span>
                  </button>
                </div>
              </div>

              {/* Residual Inspector Drawer */}
              {isExpanded && (
                <div className="p-4 border-t border-slate-800/80 bg-slate-950/80 rounded-b-xl space-y-3 text-xs">
                  <div>
                    <span className="text-slate-400 font-medium">注册表项: </span>
                    <span className="font-mono text-slate-300 break-all select-all">{app.registryKey}</span>
                  </div>

                  {app.quietUninstallString && (
                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-emerald-400 font-mono font-medium block">
                          [推荐] Win32 无弹窗静默卸载命令:
                        </span>
                        <code className="text-slate-300 font-mono text-[11px] break-all">
                          {app.quietUninstallString}
                        </code>
                      </div>
                      <button
                        onClick={() => handleCopyCmd(app.quietUninstallString!)}
                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] font-mono shrink-0 transition-colors"
                      >
                        {copiedCmd ? '已复制' : '复制命令'}
                      </button>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    <div className="p-3 bg-slate-900/60 border border-slate-800/80 rounded-lg">
                      <span className="font-semibold text-slate-200 block mb-1">
                        预计卸载后留存的磁盘残留目录 ({app.leftoverFolders.length} 处):
                      </span>
                      <ul className="space-y-1 font-mono text-[11px] text-slate-400">
                        {app.leftoverFolders.map((dir, i) => (
                          <li key={i} className="flex items-center gap-1.5 text-amber-400/90 truncate">
                            <FolderX className="w-3 h-3 shrink-0" />
                            <span className="truncate">{dir}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-3 bg-slate-900/60 border border-slate-800/80 rounded-lg">
                      <span className="font-semibold text-slate-200 block mb-1">
                        预计留存的注册表残留键值 ({app.leftoverRegistryKeys.length} 处):
                      </span>
                      <ul className="space-y-1 font-mono text-[11px] text-slate-400">
                        {app.leftoverRegistryKeys.map((reg, i) => (
                          <li key={i} className="flex items-center gap-1.5 text-cyan-400/90 truncate">
                            <Terminal className="w-3 h-3 shrink-0" />
                            <span className="truncate">{reg}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        </div>
      )}
    </div>
  );
};
