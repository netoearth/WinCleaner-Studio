import React from 'react';
import { StartupItem } from '../types';
import { Zap, CheckCircle2, ShieldCheck, Power, AlertTriangle, Shield } from 'lucide-react';

interface StartupManagerProps {
  items: StartupItem[];
  onToggleItem: (id: string) => void;
  onOptimizeAll: () => void;
}

export const StartupManager: React.FC<StartupManagerProps> = ({
  items,
  onToggleItem,
  onOptimizeAll,
}) => {
  const enabledCount = items.filter((i) => i.enabled).length;
  const highImpactCount = items.filter((i) => i.enabled && i.impact === 'High').length;

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-white tracking-tight">Windows 开机启动项与驻留服务优化</h2>
              <span className="flex items-center gap-1 text-[11px] font-mono text-cyan-400 bg-cyan-950/40 border border-cyan-800/40 px-2 py-0.5 rounded">
                <ShieldCheck className="w-3 h-3" />
                注册表 Run 键与计划任务分析
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              禁止流氓软件和高开销后台客户端开机静默启动，显著提升 Windows 开机自启速度与内存可用率
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-xs text-slate-400">当前自启项 / 高负载项</div>
              <div className="text-sm font-bold font-mono text-slate-200">
                <span className="text-cyan-400 tabular-nums">{enabledCount}</span> 个启用中 ·{' '}
                <span className="text-amber-400 tabular-nums">{highImpactCount}</span> 个高开销
              </div>
            </div>

            <button
              onClick={onOptimizeAll}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-bold flex items-center gap-2 transition-all shadow-sm active:scale-[0.98]"
            >
              <Zap className="w-3.5 h-3.5 text-slate-950" />
              <span>一键禁用高负载自启</span>
            </button>
          </div>
        </div>
      </div>

      {/* Startup Items List */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="divide-y divide-slate-800/80">
          {items.map((item) => {
            return (
              <div
                key={item.id}
                className="p-3.5 hover:bg-slate-850/50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className={`p-2 rounded-xl border mt-0.5 shrink-0 ${
                    item.enabled
                      ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
                      : 'bg-slate-800 border-slate-700 text-slate-500'
                  }`}>
                    <Power className="w-4 h-4" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-slate-100">{item.name}</span>
                      
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-800/80 border border-slate-700/60 px-1.5 py-0.2 rounded">
                        {item.location}
                      </span>

                      {item.impact === 'High' && (
                        <span className="text-[10px] font-mono text-rose-300 bg-rose-950/50 border border-rose-800/40 px-1.5 py-0.2 rounded flex items-center gap-1">
                          <AlertTriangle className="w-2.5 h-2.5" />
                          高启动开销
                        </span>
                      )}
                      {item.impact === 'Medium' && (
                        <span className="text-[10px] font-mono text-amber-300 bg-amber-950/40 border border-amber-800/40 px-1.5 py-0.2 rounded">
                          中度开销
                        </span>
                      )}
                      {item.impact === 'Low' && (
                        <span className="text-[10px] font-mono text-emerald-300 bg-emerald-950/40 border border-emerald-800/40 px-1.5 py-0.2 rounded">
                          轻微影响
                        </span>
                      )}
                    </div>

                    <div className="text-[11px] font-mono text-slate-400 mt-1 truncate max-w-xl">
                      {item.command}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5 font-mono">
                      <span>发行商: {item.publisher}</span>
                      <span aria-hidden="true">·</span>
                      <span>预估驻留内存: {item.fileSizeEstimate}</span>
                    </div>
                  </div>
                </div>

                {/* Toggle switch */}
                <div className="flex items-center gap-3 self-end sm:self-center">
                  <span className={`text-xs font-mono font-medium ${item.enabled ? 'text-cyan-400' : 'text-slate-500'}`}>
                    {item.enabled ? '已启用自启' : '已禁止自启'}
                  </span>

                  <button
                    onClick={() => onToggleItem(item.id)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      item.enabled ? 'bg-cyan-500' : 'bg-slate-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        item.enabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
