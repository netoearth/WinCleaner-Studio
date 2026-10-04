import React, { useState } from 'react';
import { DriveInfo, DiskSpaceCategory } from '../types';
import { formatBytes } from '../data/mockSystemData';
import { 
  PieChart as PieIcon, 
  BarChart3, 
  HardDrive, 
  FolderGit2, 
  Package, 
  FileText, 
  Trash2, 
  CheckCircle2, 
  ShieldCheck,
  Sparkles
} from 'lucide-react';

interface DiskUsageChartPanelProps {
  currentDrive: DriveInfo;
  cacheBytesReclaimable: number;
  onNavigateToCleaner?: () => void;
}

export const DiskUsageChartPanel: React.FC<DiskUsageChartPanelProps> = ({
  currentDrive,
  cacheBytesReclaimable,
  onNavigateToCleaner,
}) => {
  const [chartType, setChartType] = useState<'donut' | 'bar'>('donut');
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // Compute realistic categorized breakdown for selected drive
  const isC = currentDrive.letter === 'C:';
  
  // Cache space dynamically reflects reclaimable bytes
  const cacheBytes = isC 
    ? Math.max(cacheBytesReclaimable, 2 * 1024 * 1024 * 1024) 
    : 8 * 1024 * 1024 * 1024;

  const totalBytes = currentDrive.totalBytes || 1;
  const freeBytes = currentDrive.freeBytes || 0;
  const usedNonCache = Math.max(0, currentDrive.usedBytes - cacheBytes);

  // Split non-cache used bytes into System, Apps, Personal Data
  const systemBytes = isC ? Math.round(usedNonCache * 0.18) : Math.round(usedNonCache * 0.05);
  const appsBytes = isC ? Math.round(usedNonCache * 0.46) : Math.round(usedNonCache * 0.44);
  const personalBytes = Math.max(0, usedNonCache - systemBytes - appsBytes);

  const categories: DiskSpaceCategory[] = [
    {
      id: 'system',
      name: 'Windows 系统核心',
      bytes: systemBytes,
      color: '#3B82F6', // Blue
      description: 'Windows 核心镜像、WinSxS 组件存储、页面虚拟内存与系统还原点',
      pathExamples: 'C:\\Windows, WinSxS, pagefile.sys',
    },
    {
      id: 'apps',
      name: '已装软件与大型应用',
      bytes: appsBytes,
      color: '#8B5CF6', // Purple
      description: '安装于 Program Files、游戏库与 IDE 开发环境的二进制执行体',
      pathExamples: 'Program Files, SteamApps, Epic Games',
    },
    {
      id: 'personal',
      name: '用户与个人数据',
      bytes: personalBytes,
      color: '#10B981', // Emerald
      description: '用户文档、视频工程、虚拟机硬盘、大模型权重与媒体备份',
      pathExamples: 'Users\\Admin, Downloads, Desktop, ISOs',
    },
    {
      id: 'cache',
      name: '系统垃圾与缓存空间',
      bytes: cacheBytes,
      color: '#F59E0B', // Amber
      description: '临时目录 (%TEMP%)、浏览器缓存、更新补丁下载残留及崩溃转储',
      pathExamples: '%TEMP%, Chrome Cache, SoftwareDistribution',
    },
    {
      id: 'free',
      name: '可用空闲空间',
      bytes: freeBytes,
      color: '#334155', // Slate
      description: 'NTFS 文件系统未被分配的可自由写入的物理磁盘扇区',
      pathExamples: '未分配物理簇与可用存储扇区',
    },
  ];

  // SVG Donut calculations
  const radius = 80;
  const strokeWidth = 26;
  const circumference = 2 * Math.PI * radius;
  let accumulatedAngle = 0;

  const donutSegments = categories.map((cat, idx) => {
    const fraction = Math.max(0, cat.bytes / totalBytes);
    const strokeDash = fraction * circumference;
    const strokeOffset = -accumulatedAngle;
    accumulatedAngle += strokeDash;
    const pct = (fraction * 100).toFixed(1);
    const gb = (cat.bytes / (1024 * 1024 * 1024)).toFixed(1);

    return {
      ...cat,
      fraction,
      strokeDash,
      strokeOffset,
      pct,
      gb,
      idx,
    };
  });

  const activeCategory = hoveredIdx !== null ? categories[hoveredIdx] : null;

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 mb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-white tracking-tight flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-cyan-400" />
              <span>当前驱动器空间使用分布 ({currentDrive.letter} {currentDrive.label})</span>
            </h2>
            <span className="flex items-center gap-1 text-[11px] font-mono text-cyan-400 bg-cyan-950/40 border border-cyan-800/40 px-2 py-0.5 rounded">
              <ShieldCheck className="w-3 h-3" />
              NTFS 类型聚类分析
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            精细分析系统核心、已装软件、用户个人文件与可清理缓存的物理空间占用分布
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1 p-1 bg-slate-950/80 border border-slate-800 rounded-xl">
          <button
            onClick={() => setChartType('donut')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
              chartType === 'donut'
                ? 'bg-slate-800 text-cyan-300 shadow-sm border border-slate-700/60 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <PieIcon className="w-3.5 h-3.5" />
            <span>圆环占比图</span>
          </button>

          <button
            onClick={() => setChartType('bar')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
              chartType === 'bar'
                ? 'bg-slate-800 text-cyan-300 shadow-sm border border-slate-700/60 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>分类柱状图</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Chart on Left, Breakdown List on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Chart View (5 Cols) */}
        <div className="lg:col-span-5 h-64 sm:h-72 w-full flex items-center justify-center relative">
          {chartType === 'donut' ? (
            <div className="relative w-64 h-64 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 220 220">
                {/* Background Ring Track */}
                <circle
                  cx="110"
                  cy="110"
                  r={radius}
                  fill="transparent"
                  stroke="#1e293b"
                  strokeWidth={strokeWidth}
                />

                {/* Data Segments */}
                {donutSegments.map((seg) => (
                  <circle
                    key={seg.id}
                    cx="110"
                    cy="110"
                    r={radius}
                    fill="transparent"
                    stroke={seg.color}
                    strokeWidth={hoveredIdx === seg.idx ? strokeWidth + 4 : strokeWidth}
                    strokeDasharray={`${seg.strokeDash} ${circumference - seg.strokeDash}`}
                    strokeDashoffset={seg.strokeOffset}
                    className="transition-all duration-200 cursor-pointer"
                    style={{
                      filter: hoveredIdx === seg.idx ? `drop-shadow(0 0 8px ${seg.color}80)` : 'none',
                    }}
                    onMouseEnter={() => setHoveredIdx(seg.idx)}
                    onMouseLeave={() => setHoveredIdx(null)}
                  />
                ))}
              </svg>

              {/* Donut Center Label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center p-4">
                {activeCategory ? (
                  <>
                    <span className="text-[11px] font-medium text-slate-300 truncate max-w-[120px]">
                      {activeCategory.name}
                    </span>
                    <span className="text-lg font-bold font-mono text-cyan-300 tabular-nums">
                      {formatBytes(activeCategory.bytes)}
                    </span>
                    <span className="text-[11px] text-amber-400 font-mono font-semibold">
                      {((activeCategory.bytes / totalBytes) * 100).toFixed(1)}%
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-xs text-slate-400 font-mono">总物理容量</span>
                    <span className="text-lg font-bold font-mono text-slate-100 tabular-nums">
                      {formatBytes(totalBytes)}
                    </span>
                    <span className="text-[11px] text-cyan-400 font-mono">
                      {currentDrive.letter} {currentDrive.fileSystem || 'NTFS'}
                    </span>
                  </>
                )}
              </div>
            </div>
          ) : (
            /* Bar Chart View */
            <div className="w-full h-full flex flex-col justify-center space-y-3 px-2">
              {donutSegments.map((seg) => (
                <div
                  key={seg.id}
                  className="space-y-1 cursor-pointer group"
                  onMouseEnter={() => setHoveredIdx(seg.idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                >
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-300 flex items-center gap-1.5 font-sans">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: seg.color }} />
                      {seg.name}
                    </span>
                    <span className="text-slate-400 tabular-nums">
                      <strong className="text-slate-200">{seg.gb} GB</strong> ({seg.pct}%)
                    </span>
                  </div>
                  <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800/80">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.max(2, parseFloat(seg.pct))}%`,
                        backgroundColor: seg.color,
                        boxShadow: hoveredIdx === seg.idx ? `0 0 10px ${seg.color}80` : 'none',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Breakdown Category Cards (7 Cols) */}
        <div className="lg:col-span-7 space-y-2.5">
          {categories.map((cat, idx) => {
            const pct = ((cat.bytes / totalBytes) * 100).toFixed(1);
            const isCache = cat.id === 'cache';
            const isHovered = hoveredIdx === idx;

            return (
              <div
                key={cat.id}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                className={`p-3 rounded-xl border transition-all cursor-pointer ${
                  isHovered
                    ? 'bg-slate-800/90 border-slate-600 shadow-lg'
                    : isCache
                    ? 'bg-amber-950/20 border-amber-800/40 hover:border-amber-700/60'
                    : 'bg-slate-950/50 border-slate-800/70 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                      style={{ backgroundColor: cat.color }}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-200 truncate">
                          {cat.name}
                        </span>
                        {isCache && (
                          <span className="text-[10px] font-mono text-amber-400 bg-amber-950/60 border border-amber-800/50 px-1.5 py-0.2 rounded font-medium flex items-center gap-1">
                            <Sparkles className="w-2.5 h-2.5" />
                            可释放优化
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        {cat.description}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-xs font-bold font-mono text-slate-100 tabular-nums">
                      {formatBytes(cat.bytes)}
                    </div>
                    <div className="text-[11px] font-mono text-slate-400 tabular-nums">
                      {pct}%
                    </div>
                  </div>
                </div>

                {/* Quick Action Button for Cache Item */}
                {isCache && onNavigateToCleaner && (
                  <div className="mt-2.5 pt-2 border-t border-amber-900/30 flex items-center justify-between text-[11px]">
                    <span className="text-amber-400/90 font-mono">
                      预计可释放: {formatBytes(cat.bytes)}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onNavigateToCleaner();
                      }}
                      className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg font-medium transition-colors flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>直达垃圾清理</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
