import React from 'react';
import { DriveInfo } from '../types';
import { formatBytes } from '../data/mockSystemData';
import { HardDrive, AlertTriangle, CheckCircle2, ShieldCheck, Sparkles, Terminal } from 'lucide-react';

interface DriveOverviewProps {
  drives: DriveInfo[];
  selectedDrive: string;
  setSelectedDrive: (letter: string) => void;
  totalReclaimableBytes: number;
  onScanAll: () => void;
  isScanning: boolean;
}

export const DriveOverview: React.FC<DriveOverviewProps> = ({
  drives,
  selectedDrive,
  setSelectedDrive,
  totalReclaimableBytes,
  onScanAll,
  isScanning,
}) => {
  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-white tracking-tight">Windows 磁盘与存储空间状态</h2>
            <span className="flex items-center gap-1 text-[11px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded">
              <ShieldCheck className="w-3 h-3" />
              Win32 GetDiskFreeSpaceExW
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            实时监测 Windows 系统盘与附加数据分区的物理占用、临时缓存及冗余文件
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs text-slate-400">预计可释放空间</div>
            <div className="text-lg font-bold font-mono text-cyan-400 tabular-nums">
              {formatBytes(totalReclaimableBytes)}
            </div>
          </div>

          <button
            onClick={onScanAll}
            disabled={isScanning}
            className={`px-4 py-2 text-xs font-semibold rounded-xl flex items-center gap-2 transition-all shadow-sm ${
              isScanning
                ? 'bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700'
                : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold active:scale-[0.98]'
            }`}
          >
            <Sparkles className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
            <span>{isScanning ? '全盘扫描中...' : '重新全盘深度分析'}</span>
          </button>
        </div>
      </div>

      {/* Drive Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {drives.map((drive) => {
          const usedPct = Math.round((drive.usedBytes / drive.totalBytes) * 100);
          const isWarning = usedPct > 80;
          const isSelected = selectedDrive === drive.letter;

          return (
            <div
              key={drive.letter}
              onClick={() => setSelectedDrive(drive.letter)}
              className={`p-4 rounded-xl border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-slate-800/80 border-cyan-500/60 shadow-md shadow-cyan-950/40 ring-1 ring-cyan-500/30'
                  : 'bg-slate-950/40 border-slate-800/80 hover:border-slate-700/80 hover:bg-slate-900/40'
              }`}
            >
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-lg ${drive.isSystemDrive ? 'bg-cyan-500/10 text-cyan-400' : 'bg-slate-800 text-slate-300'}`}>
                    <HardDrive className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-100">{drive.label} ({drive.letter})</span>
                      {drive.isSystemDrive && (
                        <span className="text-[10px] font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30 px-1.5 py-0.2 rounded">
                          系统盘
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] font-mono text-slate-500">
                      文件系统: {drive.fileSystem} · 原生物理驱动器
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className={`text-xs font-bold font-mono tabular-nums ${isWarning ? 'text-amber-400' : 'text-slate-300'}`}>
                    {usedPct}% 已用
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden mb-2.5">
                <div
                  className={`h-full transition-all duration-700 rounded-full ${
                    isWarning
                      ? 'bg-gradient-to-r from-amber-500 to-rose-500'
                      : 'bg-gradient-to-r from-cyan-500 to-blue-500'
                  }`}
                  style={{ width: `${usedPct}%` }}
                />
              </div>

              {/* Stats footer */}
              <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                <span>空闲: <strong className="text-slate-200 tabular-nums">{formatBytes(drive.freeBytes)}</strong></span>
                <span>总容量: <span className="tabular-nums">{formatBytes(drive.totalBytes)}</span></span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
