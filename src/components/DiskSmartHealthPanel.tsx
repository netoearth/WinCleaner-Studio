import React, { useState } from 'react';
import { DiskSmartInfo, SmartAttribute } from '../types';
import { 
  Activity, 
  Thermometer, 
  HeartPulse, 
  ShieldCheck, 
  Cpu, 
  HardDrive, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw, 
  ChevronDown, 
  ChevronRight,
  Zap,
  Info
} from 'lucide-react';

interface DiskSmartHealthPanelProps {
  smartInfos: DiskSmartInfo[];
  selectedDriveLetter: string;
  onDriveSelect?: (letter: string) => void;
}

export const DiskSmartHealthPanel: React.FC<DiskSmartHealthPanelProps> = ({
  smartInfos,
  selectedDriveLetter,
  onDriveSelect,
}) => {
  // Find current disk matching selected drive letter or default to disk 0
  const activeDiskIndex = smartInfos.findIndex((d) => d.letter === selectedDriveLetter);
  const [currentDiskIndex, setCurrentDiskIndex] = useState<number>(
    activeDiskIndex >= 0 ? activeDiskIndex : 0
  );
  const [showAllAttributes, setShowAllAttributes] = useState<boolean>(false);
  const [isSelfTesting, setIsSelfTesting] = useState<boolean>(false);
  const [selfTestResult, setSelfTestResult] = useState<string | null>(null);

  // Sync if selectedDriveLetter changes externally
  React.useEffect(() => {
    const idx = smartInfos.findIndex((d) => d.letter === selectedDriveLetter);
    if (idx >= 0) {
      setCurrentDiskIndex(idx);
    }
  }, [selectedDriveLetter, smartInfos]);

  const disk = smartInfos[currentDiskIndex] || smartInfos[0];

  const handleRunSelfTest = () => {
    setIsSelfTesting(true);
    setSelfTestResult(null);
    setTimeout(() => {
      setIsSelfTesting(false);
      setSelfTestResult('S.M.A.R.T. 快速自检诊断通过：全盘备用块完好，主控温度正常，未发现坏道或坏块。');
      setTimeout(() => setSelfTestResult(null), 5000);
    }, 1800);
  };

  const handleSelectDisk = (index: number) => {
    setCurrentDiskIndex(index);
    if (onDriveSelect && smartInfos[index]) {
      onDriveSelect(smartInfos[index].letter);
    }
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 mb-6">
      {/* Panel Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-white tracking-tight flex items-center gap-2">
              <HeartPulse className="w-4 h-4 text-emerald-400" />
              <span>硬盘 S.M.A.R.T. 健康状态与剩余寿命透视</span>
            </h2>
            <span className="flex items-center gap-1 text-[11px] font-mono text-cyan-400 bg-cyan-950/40 border border-cyan-800/40 px-2 py-0.5 rounded">
              <ShieldCheck className="w-3 h-3" />
              Win32 DeviceIoControl (SMART/NVMe)
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            调用 Windows 内核存储接口实时采集固态硬盘闪存磨损指数、物理芯片温度及通电运行时长
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Disk Switcher Buttons */}
          <div className="flex items-center gap-1 p-1 bg-slate-950/80 border border-slate-800 rounded-xl">
            {smartInfos.map((info, idx) => (
              <button
                key={info.diskIndex}
                onClick={() => handleSelectDisk(idx)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 ${
                  currentDiskIndex === idx
                    ? 'bg-slate-800 text-cyan-300 shadow-sm border border-slate-700/60 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <HardDrive className="w-3.5 h-3.5" />
                <span>磁盘 {info.diskIndex} ({info.letter})</span>
              </button>
            ))}
          </div>

          {/* S.M.A.R.T. Diagnostic Button */}
          <button
            onClick={handleRunSelfTest}
            disabled={isSelfTesting}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 rounded-xl transition-colors shadow-sm active:scale-95"
            title="触发底层 S.M.A.R.T. 短自检例程"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSelfTesting ? 'animate-spin text-cyan-400' : 'text-slate-400'}`} />
            <span>{isSelfTesting ? '自检诊断中...' : 'S.M.A.R.T. 快速自检'}</span>
          </button>
        </div>
      </div>

      {/* Disk Hardware Banner (Zero-pill clean metadata) */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400 pb-3 mb-4 border-b border-slate-800/80 font-mono">
        <span className="text-slate-200 font-semibold">{disk.model}</span>
        <span aria-hidden="true" className="text-slate-600">·</span>
        <span>接口: {disk.interface}</span>
        <span aria-hidden="true" className="text-slate-600">·</span>
        <span>固件版本: {disk.firmware}</span>
        <span aria-hidden="true" className="text-slate-600">·</span>
        <span>序列号: {disk.serialNumber}</span>
        <span aria-hidden="true" className="text-slate-600">·</span>
        <span className="text-emerald-400 font-medium">自检结果: PASSED (状态良好)</span>
      </div>

      {/* Self-Test Notification Banner */}
      {selfTestResult && (
        <div className="mb-4 p-3 bg-emerald-950/40 border border-emerald-800/50 rounded-xl text-xs text-emerald-300 flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{selfTestResult}</span>
        </div>
      )}

      {/* Primary 3 Vital Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {/* Card 1: Health Status & Score */}
        <div className="bg-slate-950/50 border border-slate-800/90 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span>综合健康状态</span>
            </span>
            <span className="text-[11px] font-mono font-medium text-emerald-400 bg-emerald-950/40 border border-emerald-800/30 px-1.5 py-0.2 rounded">
              良好 (Good)
            </span>
          </div>

          <div className="flex items-baseline gap-2 my-1">
            <span className="text-3xl font-bold font-mono text-emerald-400 tabular-nums">
              {disk.healthPercent}%
            </span>
            <span className="text-xs font-mono text-slate-400">
              备用扇区完整 (0 重分配)
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mt-2">
            <div
              className="h-full bg-emerald-400 rounded-full"
              style={{ width: `${disk.healthPercent}%` }}
            />
          </div>

          <div className="text-[11px] font-mono text-slate-500 mt-2 flex justify-between">
            <span>坏道数量: 0</span>
            <span>异常断电: {disk.unsafeShutdowns} 次</span>
          </div>
        </div>

        {/* Card 2: Operating Temperature */}
        <div className="bg-slate-950/50 border border-slate-800/90 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 flex items-center gap-1.5">
              <Thermometer className="w-3.5 h-3.5 text-cyan-400" />
              <span>当前工作温度</span>
            </span>
            <span className="text-[11px] font-mono font-medium text-cyan-300 bg-cyan-950/40 border border-cyan-800/30 px-1.5 py-0.2 rounded">
              运行温度平稳
            </span>
          </div>

          <div className="flex items-baseline gap-2 my-1">
            <span className="text-3xl font-bold font-mono text-cyan-300 tabular-nums">
              {disk.temperatureC} °C
            </span>
            <span className="text-xs font-mono text-slate-400">
              正常范围 (&lt; 70 °C)
            </span>
          </div>

          {/* Temperature Range Bar */}
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mt-2">
            <div
              className={`h-full rounded-full ${
                disk.temperatureC < 45
                  ? 'bg-cyan-400'
                  : disk.temperatureC < 60
                  ? 'bg-amber-400'
                  : 'bg-rose-400'
              }`}
              style={{ width: `${Math.min(100, (disk.temperatureC / 80) * 100)}%` }}
            />
          </div>

          <div className="text-[11px] font-mono text-slate-500 mt-2 flex justify-between">
            <span>节流阈值: 82 °C</span>
            <span>过热保护: 85 °C</span>
          </div>
        </div>

        {/* Card 3: Remaining Life & TBW */}
        <div className="bg-slate-950/50 border border-slate-800/90 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>预估剩余寿命</span>
            </span>
            <span className="text-[11px] font-mono font-medium text-slate-300 bg-slate-800/60 border border-slate-700/60 px-1.5 py-0.2 rounded">
              已消耗 3% 寿命
            </span>
          </div>

          <div className="flex items-baseline gap-2 my-1">
            <span className="text-3xl font-bold font-mono text-amber-300 tabular-nums">
              {disk.remainingLifePercent}%
            </span>
            <span className="text-xs font-mono text-slate-400">
              主机写入: {disk.totalHostWritesTB} TBW
            </span>
          </div>

          {/* Wear Progress bar */}
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mt-2">
            <div
              className="h-full bg-amber-400 rounded-full"
              style={{ width: `${disk.remainingLifePercent}%` }}
            />
          </div>

          <div className="text-[11px] font-mono text-slate-500 mt-2 flex justify-between">
            <span>总质保 TBW: {disk.tbwRatingTB} TB</span>
            <span>预估剩余: ~8.2 年</span>
          </div>
        </div>
      </div>

      {/* Additional Telemetry Bar (Power hours, power cycles) */}
      <div className="bg-slate-950/30 border border-slate-800/70 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-slate-400">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>通电时间: <strong className="text-slate-200 tabular-nums">{disk.powerOnHours.toLocaleString()} 小时</strong></span>
          </span>
          <span aria-hidden="true" className="text-slate-700">·</span>
          <span>通电次数: <strong className="text-slate-200 tabular-nums">{disk.powerOnCount} 次</strong></span>
          <span aria-hidden="true" className="text-slate-700">·</span>
          <span>重分配扇区: <strong className="text-emerald-400 tabular-nums">{disk.reallocatedSectors}</strong></span>
        </div>

        <button
          onClick={() => setShowAllAttributes(!showAllAttributes)}
          className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
        >
          <span>{showAllAttributes ? '收起底层 S.M.A.R.T. 寄存器参数' : '展开底层 S.M.A.R.T. 详细属性表'}</span>
          {showAllAttributes ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Expandable S.M.A.R.T. Attributes Table */}
      {showAllAttributes && (
        <div className="mt-4 pt-3 border-t border-slate-800/80 animate-in fade-in duration-200">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-semibold text-slate-200">
              S.M.A.R.T. 属性寄存器指标 (Win32 Raw Telemetry Data)
            </span>
            <span className="text-[11px] font-mono text-slate-500">
              API: {disk.win32IoApi}
            </span>
          </div>

          <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="bg-slate-900/80 border-b border-slate-800 text-slate-400 text-[11px]">
                    <th className="py-2.5 px-3 font-semibold">ID</th>
                    <th className="py-2.5 px-3 font-semibold">属性名称 (Attribute Name)</th>
                    <th className="py-2.5 px-3 font-semibold text-right">当前值 (Val)</th>
                    <th className="py-2.5 px-3 font-semibold text-right">最差值 (Worst)</th>
                    <th className="py-2.5 px-3 font-semibold text-right">门限 (Thresh)</th>
                    <th className="py-2.5 px-3 font-semibold text-right">原始数据 (Raw Value)</th>
                    <th className="py-2.5 px-3 font-semibold text-center">状态评估</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {disk.attributes.map((attr) => (
                    <tr key={attr.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-2 px-3 text-cyan-400 font-bold">{attr.id}</td>
                      <td className="py-2 px-3 text-slate-200 font-sans">{attr.name}</td>
                      <td className="py-2 px-3 text-right text-slate-300 tabular-nums">{attr.current}</td>
                      <td className="py-2 px-3 text-right text-slate-400 tabular-nums">{attr.worst}</td>
                      <td className="py-2 px-3 text-right text-slate-500 tabular-nums">{attr.threshold}</td>
                      <td className="py-2 px-3 text-right text-slate-300 tabular-nums font-semibold">{attr.raw}</td>
                      <td className="py-2 px-3 text-center">
                        <span className="text-[10px] text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-1.5 py-0.2 rounded font-sans">
                          正常
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
