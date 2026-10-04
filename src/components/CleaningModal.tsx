import React, { useEffect, useState } from 'react';
import { formatBytes } from '../data/mockSystemData';
import { 
  Sparkles, 
  Trash2, 
  CheckCircle2, 
  Terminal, 
  ShieldCheck, 
  HardDrive 
} from 'lucide-react';

interface CleaningModalProps {
  isOpen: boolean;
  totalBytesToClean: number;
  onFinish: () => void;
  title?: string;
  customLogs?: string[];
}

export const CleaningModal: React.FC<CleaningModalProps> = ({
  isOpen,
  totalBytesToClean,
  onFinish,
  title = '正在执行 Windows 深度清理与磁盘优化...',
  customLogs,
}) => {
  const [progress, setProgress] = useState<number>(0);
  const [currentStep, setCurrentStep] = useState<string>('正在准备执行环境...');
  const [logs, setLogs] = useState<string[]>([]);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) {
      setProgress(0);
      setLogs([]);
      setIsCompleted(false);
      return;
    }

    const defaultLogSequence = [
      '[Win32] 获取管理员权限与 SeBackupPrivilege 特权令牌... 成功',
      '[Win32] 调用 GetTempPathW 读取用户与系统临时文件夹路径...',
      '[Win32] 执行 SHFileOperationW(FO_DELETE, FOF_NOCONFIRMATION) 遍历 %TEMP%...',
      '[Browser] 扫描 Google Chrome 缓存目录 Cache_Data 并清理过时索引...',
      '[Browser] 清理 Microsoft Edge 浏览器 GPU 渲染缓存与媒体缓冲...',
      '[System] 停止 Windows Update 服务 (wuauserv)，清理 SoftwareDistribution\\Download...',
      '[System] 重启 Windows Update 服务完毕',
      '[System] 清理 CrashDumps 崩溃转储与系统错误日志...',
      '[Win32] 调用 SHEmptyRecycleBinW(NULL, NULL, SHERB_NOCONFIRMATION) 彻底清空回收站...',
      '[Disk] 调用 GetDiskFreeSpaceExW 重新计算磁盘可用扇区与簇容量...',
      '[Done] 优化清理任务圆满完成!',
    ];

    const sequence = customLogs && customLogs.length > 0 ? customLogs : defaultLogSequence;

    let stepIndex = 0;
    const interval = setInterval(() => {
      if (stepIndex < sequence.length) {
        const nextLog = sequence[stepIndex];
        setLogs((prev) => [...prev, nextLog]);
        setCurrentStep(nextLog);
        setProgress(Math.round(((stepIndex + 1) / sequence.length) * 100));
        stepIndex++;
      } else {
        clearInterval(interval);
        setIsCompleted(true);
      }
    }, 280);

    return () => clearInterval(interval);
  }, [isOpen, customLogs]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-2.5 rounded-xl border ${
            isCompleted
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
          }`}>
            {isCompleted ? <CheckCircle2 className="w-6 h-6" /> : <Trash2 className="w-6 h-6 animate-pulse" />}
          </div>
          <div>
            <h3 className="text-base font-bold text-white">
              {isCompleted ? 'Windows 系统优化与清理已完成!' : title}
            </h3>
            <p className="text-xs text-slate-400 font-mono">
              {isCompleted ? `累计成功释放磁盘空间: ${formatBytes(totalBytesToClean)}` : currentStep}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden mb-4 border border-slate-700/50">
          <div
            className={`h-full transition-all duration-300 rounded-full ${
              isCompleted
                ? 'bg-emerald-400'
                : 'bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-400'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Live Win32 Terminal Output */}
        <div className="bg-slate-950 rounded-xl p-3 border border-slate-800 font-mono text-[11px] text-slate-300 h-44 overflow-y-auto space-y-1 mb-5 scrollbar-thin">
          <div className="text-slate-500 flex items-center gap-1.5 pb-1 border-b border-slate-900">
            <Terminal className="w-3 h-3 text-cyan-500" />
            <span>Win32 Native API Execution Stream:</span>
          </div>
          {logs.map((log, i) => (
            <div
              key={i}
              className={`leading-relaxed ${
                log.includes('完成') || log.includes('Done')
                  ? 'text-emerald-400 font-semibold'
                  : log.includes('Win32')
                  ? 'text-cyan-300'
                  : 'text-slate-400'
              }`}
            >
              {log}
            </div>
          ))}
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-end gap-3">
          {isCompleted && (
            <button
              onClick={onFinish}
              className="px-5 py-2 text-xs font-semibold rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-bold transition-all shadow-md shadow-cyan-500/20 active:scale-95"
            >
              确定并查看优化成果
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
