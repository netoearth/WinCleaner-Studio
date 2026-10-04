import React, { useState } from 'react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid 
} from 'recharts';
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
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  // Compute realistic categorized breakdown for selected drive
  const isC = currentDrive.letter === 'C:';
  
  // Cache space dynamically reflects reclaimable bytes
  const cacheBytes = isC 
    ? Math.max(cacheBytesReclaimable, 2 * 1024 * 1024 * 1024) 
    : 8 * 1024 * 1024 * 1024;

  const totalBytes = currentDrive.totalBytes;
  const freeBytes = currentDrive.freeBytes;
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

  // Chart data format
  const chartData = categories.map((cat) => ({
    name: cat.name,
    rawBytes: cat.bytes,
    gb: parseFloat((cat.bytes / (1024 * 1024 * 1024)).toFixed(1)),
    formatted: formatBytes(cat.bytes),
    percentage: ((cat.bytes / totalBytes) * 100).toFixed(1),
    color: cat.color,
    id: cat.id,
    description: cat.description,
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900/95 border border-slate-700/80 p-3 rounded-xl shadow-xl backdrop-blur-md text-xs font-mono">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: data.color }}
            />
            <span className="font-semibold text-slate-100 font-sans">{data.name}</span>
          </div>
          <div className="text-slate-300">
            占用容量: <strong className="text-cyan-300 tabular-nums">{data.formatted}</strong> ({data.gb} GB)
          </div>
          <div className="text-slate-400">
            总盘占比: <strong className="text-amber-400 tabular-nums">{data.percentage}%</strong>
          </div>
          <div className="text-[11px] text-slate-500 font-sans mt-1 max-w-xs border-t border-slate-800 pt-1">
            {data.description}
          </div>
        </div>
      );
    }
    return null;
  };

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
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'donut' ? (
              <PieChart>
                <Tooltip content={<CustomTooltip />} />
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius="58%"
                  outerRadius="88%"
                  paddingAngle={3}
                  dataKey="rawBytes"
                  onMouseEnter={(_, index) => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      stroke="#0f172a"
                      strokeWidth={2}
                      className="transition-all duration-200 cursor-pointer hover:opacity-85"
                    />
                  ))}
                </Pie>
              </PieChart>
            ) : (
              <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                <XAxis type="number" unit=" GB" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis
                  type="category"
                  dataKey="name"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  width={110}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="gb" radius={[0, 6, 6, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`bar-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            )}
          </ResponsiveContainer>

          {/* Donut Center Label */}
          {chartType === 'donut' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
              <span className="text-xs text-slate-400 font-mono">总物理容量</span>
              <span className="text-lg font-bold font-mono text-slate-100 tabular-nums">
                {formatBytes(totalBytes)}
              </span>
              <span className="text-[11px] text-cyan-400 font-mono">
                {currentDrive.letter} NTFS
              </span>
            </div>
          )}
        </div>

        {/* Breakdown Category Cards (7 Cols) */}
        <div className="lg:col-span-7 space-y-2.5">
          {categories.map((cat, idx) => {
            const pct = ((cat.bytes / totalBytes) * 100).toFixed(1);
            const isCache = cat.id === 'cache';

            return (
              <div
                key={cat.id}
                className={`p-3 rounded-xl border transition-all ${
                  isCache
                    ? 'bg-amber-950/20 border-amber-900/40 hover:border-amber-700/60'
                    : 'bg-slate-950/50 border-slate-800/80 hover:border-slate-700/80'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-md shrink-0 shadow-sm"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="text-xs font-semibold text-slate-200">
                      {cat.name}
                    </span>
                    {isCache && (
                      <span className="text-[10px] font-mono text-amber-400 bg-amber-950/50 border border-amber-800/40 px-1.5 py-0.2 rounded flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5" />
                        可立即释放
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold font-mono text-cyan-300 tabular-nums">
                      {formatBytes(cat.bytes)}
                    </span>
                    <span className="text-xs font-mono text-slate-400 tabular-nums w-12 text-right">
                      {pct}%
                    </span>
                  </div>
                </div>

                {/* Progress mini bar */}
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mb-1">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: cat.color,
                    }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 truncate">
                  <span className="truncate max-w-sm">{cat.description}</span>
                  <span className="truncate hidden sm:inline text-slate-600">例: {cat.pathExamples}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
