import React, { useState } from 'react';
import { LargeFileItem } from '../types';
import { formatBytes } from '../data/mockSystemData';
import { 
  HardDrive, 
  Trash2, 
  Copy, 
  Filter, 
  Search, 
  ArrowUpDown, 
  CheckCircle2, 
  Disc, 
  Database, 
  Film, 
  Archive, 
  Sparkles,
  ShieldCheck
} from 'lucide-react';

interface LargeFileAnalyzerProps {
  files: LargeFileItem[];
  onDeleteFile: (fileId: string) => void;
  selectedDrive: string;
}

export const LargeFileAnalyzer: React.FC<LargeFileAnalyzerProps> = ({
  files,
  onDeleteFile,
  selectedDrive,
}) => {
  const [minSizeMB, setMinSizeMB] = useState<number>(500);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'size' | 'date'>('size');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredFiles = files
    .filter((f) => {
      const sizeMB = f.sizeBytes / (1024 * 1024);
      const matchesSize = sizeMB >= minSizeMB;
      const matchesDrive = selectedDrive === 'ALL' || f.drive === selectedDrive;
      const matchesCat = categoryFilter === 'all' || f.category === categoryFilter;
      const matchesSearch =
        f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.path.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSize && matchesDrive && matchesCat && matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === 'size') {
        return b.sizeBytes - a.sizeBytes;
      }
      return new Date(b.modified).getTime() - new Date(a.modified).getTime();
    });

  const totalFilteredBytes = filteredFiles.reduce((acc, f) => acc + f.sizeBytes, 0);

  const handleCopyPath = (id: string, path: string) => {
    navigator.clipboard.writeText(path);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case 'iso_disk':
        return { label: '镜像与虚拟硬盘', icon: Disc, color: 'text-cyan-400 bg-cyan-950/40 border-cyan-800/40' };
      case 'database':
        return { label: '模型与数据库', icon: Database, color: 'text-emerald-400 bg-emerald-950/40 border-emerald-800/40' };
      case 'media':
        return { label: '高清媒体与工程', icon: Film, color: 'text-purple-400 bg-purple-950/40 border-purple-800/40' };
      case 'temp_cache':
        return { label: '暂存与刮擦盘', icon: HardDrive, color: 'text-amber-400 bg-amber-950/40 border-amber-800/40' };
      default:
        return { label: '大型压缩档案', icon: Archive, color: 'text-blue-400 bg-blue-950/40 border-blue-800/40' };
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Banner & Filters */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-white tracking-tight">大文件深度透视与空间占用分析</h2>
              <span className="flex items-center gap-1 text-[11px] font-mono text-cyan-400 bg-cyan-950/40 border border-cyan-800/40 px-2 py-0.5 rounded">
                <ShieldCheck className="w-3 h-3" />
                多线程目录递归遍历
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              扫描全盘大文件、过期虚拟机虚拟硬盘 (.vmdk / .vhdx)、大模型权重 (.gguf) 与大型解压临时包
            </p>
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-400">符合条件的大文件占用: </span>
            <span className="text-base font-bold font-mono text-cyan-300 tabular-nums">
              {formatBytes(totalFilteredBytes)}
            </span>
          </div>
        </div>

        {/* Filter controls */}
        <div className="mt-4 pt-3.5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
          {/* Threshold pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-slate-400 mr-1">大小阈值:</span>
            {[
              { label: '> 100 MB', val: 100 },
              { label: '> 500 MB', val: 500 },
              { label: '> 1 GB', val: 1024 },
              { label: '> 5 GB', val: 5120 },
            ].map((th) => (
              <button
                key={th.val}
                onClick={() => setMinSizeMB(th.val)}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
                  minSizeMB === th.val
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'text-slate-400 hover:text-slate-200 bg-slate-800/60'
                }`}
              >
                {th.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSortBy(sortBy === 'size' ? 'date' : 'size')}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>按{sortBy === 'size' ? '文件大小' : '修改日期'}排序</span>
            </button>

            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="搜索大文件名称或后缀..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-48 pl-8 pr-3 py-1.5 text-xs bg-slate-950/70 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Large File List */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="divide-y divide-slate-800/70">
          {filteredFiles.map((file, idx) => {
            const badge = getCategoryBadge(file.category);
            const Icon = badge.icon;

            return (
              <div
                key={file.id}
                className="p-3.5 hover:bg-slate-850/50 transition-colors flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-cyan-400" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-100 truncate">
                        {file.name}
                      </span>
                      <span className={`text-[10px] font-mono border px-1.5 py-0.2 rounded shrink-0 ${badge.color}`}>
                        {badge.label}
                      </span>
                    </div>

                    <div className="text-[11px] font-mono text-slate-500 truncate mt-0.5 max-w-xl">
                      {file.path}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right">
                    <div className="text-sm font-bold font-mono text-cyan-300 tabular-nums">
                      {formatBytes(file.sizeBytes)}
                    </div>
                    <div className="text-[11px] font-mono text-slate-500">
                      {file.modified}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleCopyPath(file.id, file.path)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 border border-transparent hover:border-slate-700 transition-colors"
                      title="复制完整路径"
                    >
                      {copiedId === file.id ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>

                    <button
                      onClick={() => onDeleteFile(file.id)}
                      className="p-1.5 rounded-lg text-rose-400 hover:text-rose-200 hover:bg-rose-950/60 border border-transparent hover:border-rose-800/60 transition-colors"
                      title="安全移至 Windows 回收站 (Win32 SHFileOperationW)"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
