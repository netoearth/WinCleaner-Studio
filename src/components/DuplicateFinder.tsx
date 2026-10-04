import React, { useState } from 'react';
import { DuplicateGroup, DuplicateFileItem } from '../types';
import { formatBytes } from '../data/mockSystemData';
import { 
  Copy, 
  Trash2, 
  CheckSquare, 
  Square, 
  FolderOpen, 
  ShieldCheck, 
  Search, 
  FileCode, 
  Film, 
  Archive, 
  Disc, 
  FileCheck,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';

interface DuplicateFinderProps {
  groups: DuplicateGroup[];
  onToggleItem: (groupId: string, fileId: string) => void;
  onApplySmartRule: (rule: 'keep_oldest' | 'keep_newest' | 'select_all' | 'deselect_all') => void;
  onDeleteDuplicates: () => void;
  onScanPath?: (folder?: string) => void;
  isScanning?: boolean;
}

export const DuplicateFinder: React.FC<DuplicateFinderProps> = ({
  groups,
  onToggleItem,
  onApplySmartRule,
  onDeleteDuplicates,
  onScanPath,
  isScanning,
}) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [customPath, setCustomPath] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredGroups = groups.filter((g) => {
    const matchesType = filterType === 'all' || g.category === filterType;
    const matchesSearch =
      g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.files.some((f) => f.path.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesType && matchesSearch;
  });

  const selectedCount = groups.reduce(
    (acc, g) => acc + g.files.filter((f) => f.selected).length,
    0
  );

  const selectedBytes = groups.reduce((acc, g) => {
    const selInGroup = g.files.filter((f) => f.selected).length;
    return acc + selInGroup * g.sizeBytes;
  }, 0);

  const handleCopyPath = (id: string, path: string) => {
    navigator.clipboard.writeText(path);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'video':
        return <Film className="w-4 h-4 text-purple-400" />;
      case 'installer':
        return <Disc className="w-4 h-4 text-cyan-400" />;
      case 'archive':
        return <Archive className="w-4 h-4 text-amber-400" />;
      default:
        return <FileCode className="w-4 h-4 text-blue-400" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Controls & Banner */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-white tracking-tight">重复文件智能查重与深度清理</h2>
              <span className="flex items-center gap-1 text-[11px] font-mono text-cyan-400 bg-cyan-950/40 border border-cyan-800/40 px-2 py-0.5 rounded">
                <ShieldCheck className="w-3 h-3" />
                两级哈希 (4KB 块哈希 + SHA-256 校验)
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              通过两级分块哈希算法，零误判精确定位磁盘中散落的完全一致的重复安装包、视频与大型备份
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onDeleteDuplicates}
              disabled={selectedCount === 0}
              className={`px-4 py-2 text-xs font-semibold rounded-xl flex items-center gap-2 transition-all shadow-sm ${
                selectedCount > 0
                  ? 'bg-rose-500 hover:bg-rose-400 text-white font-bold active:scale-[0.98]'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>清理选中副本 ({formatBytes(selectedBytes)})</span>
            </button>
          </div>
        </div>

        {/* Filter Bar & Smart Select */}
        <div className="mt-4 pt-3.5 border-t border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Smart Select Options */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-slate-400 mr-1">智能规则:</span>
            <button
              onClick={() => onApplySmartRule('keep_oldest')}
              className="px-2.5 py-1 text-xs text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-lg border border-slate-700/60 transition-colors"
            >
              保留最早文件
            </button>
            <button
              onClick={() => onApplySmartRule('keep_newest')}
              className="px-2.5 py-1 text-xs text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-lg border border-slate-700/60 transition-colors"
            >
              保留最新文件
            </button>
            <button
              onClick={() => onApplySmartRule('select_all')}
              className="px-2.5 py-1 text-xs text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-lg border border-slate-700/60 transition-colors"
            >
              选择全部副本
            </button>
            <button
              onClick={() => onApplySmartRule('deselect_all')}
              className="px-2.5 py-1 text-xs text-slate-400 hover:text-slate-200 bg-slate-800/40 hover:bg-slate-700/60 rounded-lg border border-slate-700/60 transition-colors"
            >
              清空勾选
            </button>
          </div>

          {/* Search box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="搜索重复文件名或路径..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-64 pl-8 pr-3 py-1.5 text-xs bg-slate-950/70 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        {/* Custom Directory Input */}
        <div className="mt-3 pt-3 border-t border-slate-800/60 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-[280px]">
            <FolderOpen className="w-4 h-4 text-cyan-400 shrink-0" />
            <span className="text-xs text-slate-400 shrink-0">指定查重位置:</span>
            <input
              type="text"
              placeholder="输入本地盘符或目录 (例如 D:\ 或 G:\download，留空为默认常用目录)"
              value={customPath}
              onChange={(e) => setCustomPath(e.target.value)}
              className="flex-1 px-3 py-1.5 text-xs bg-slate-950/90 border border-slate-800 focus:border-cyan-500 rounded-lg text-slate-200 placeholder-slate-600 focus:outline-none"
            />
          </div>
          <button
            onClick={() => onScanPath?.(customPath.trim() || undefined)}
            disabled={isScanning}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center gap-1.5 transition-all shadow-sm active:scale-95 disabled:opacity-50"
          >
            <Search className="w-3.5 h-3.5" />
            <span>{isScanning ? '正在进行两级哈希查重...' : '扫描指定目录'}</span>
          </button>
        </div>
      </div>

      {/* Duplicate Groups List */}
      {filteredGroups.length === 0 ? (
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-slate-100">未检测到完全相同的重复冗余文件</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
            系统已对您本机的下载 (Downloads)、桌面 (Desktop) 与文档 (Documents) 目录执行了两级分块校验与 SHA-256 哈希比对，未发现冗余副本，您的磁盘井井有条！
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredGroups.map((group) => {
          const selectedInGroup = group.files.filter((f) => f.selected).length;
          const wastedHere = selectedInGroup * group.sizeBytes;

          return (
            <div
              key={group.id}
              className="bg-slate-900/60 border border-slate-800/90 rounded-xl overflow-hidden shadow-sm"
            >
              {/* Group Header */}
              <div className="p-3.5 bg-slate-900/90 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-slate-800 border border-slate-700/60">
                    {getCategoryIcon(group.category)}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                      <span>{group.name}</span>
                      <span className="text-[10px] font-mono font-medium text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                        {group.extension}
                      </span>
                    </h3>
                    <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                      SHA-256 校验码: {group.hash}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs">
                  <div className="text-slate-400">
                    单文件: <strong className="text-slate-200 font-mono tabular-nums">{formatBytes(group.sizeBytes)}</strong>
                  </div>
                  <div className="text-amber-400 font-mono">
                    冗余浪费: <strong className="font-bold tabular-nums">{formatBytes(group.totalWastedBytes)}</strong>
                  </div>
                </div>
              </div>

              {/* Group Files */}
              <div className="divide-y divide-slate-800/60">
                {group.files.map((file, idx) => (
                  <div
                    key={file.id}
                    className={`p-3 flex items-start gap-3 transition-colors ${
                      file.selected ? 'bg-cyan-950/20' : 'hover:bg-slate-850/40'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => onToggleItem(group.id, file.id)}
                      className="mt-0.5 text-cyan-400 hover:text-cyan-300 focus:outline-none"
                    >
                      {file.selected ? (
                        <CheckSquare className="w-4 h-4 fill-cyan-500/20 text-cyan-400" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-600 hover:text-slate-400" />
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <div className="flex items-center gap-2 truncate">
                          <span className="text-xs font-mono text-slate-300 truncate">
                            {file.path}
                          </span>
                          {idx === 0 && (
                            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/50 border border-emerald-800/40 px-1.5 py-0.2 rounded shrink-0">
                              原件路径推荐保留
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 shrink-0 text-xs font-mono text-slate-400">
                          <span>{file.modified}</span>
                          <button
                            onClick={() => handleCopyPath(file.id, file.path)}
                            className="p-1 hover:text-white rounded hover:bg-slate-800 transition-colors"
                            title="复制文件绝对物理路径"
                          >
                            {copiedId === file.id ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        </div>
      )}
    </div>
  );
};
