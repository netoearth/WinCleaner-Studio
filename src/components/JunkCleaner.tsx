import React, { useState } from 'react';
import { CleanerRule, CleanableFile, CleanerCategory } from '../types';
import { formatBytes } from '../data/mockSystemData';
import { 
  Trash2, 
  CheckSquare, 
  Square, 
  ChevronRight, 
  ChevronDown, 
  AlertCircle, 
  ShieldAlert, 
  FileText, 
  FolderOpen,
  Chrome,
  Terminal,
  Cpu,
  RefreshCw,
  Info
} from 'lucide-react';

interface JunkCleanerProps {
  rules: CleanerRule[];
  onToggleRule: (id: string) => void;
  onSelectAll: (select: boolean) => void;
  onCleanSelected: () => void;
  onRescan: () => void;
  isScanning: boolean;
}

export const JunkCleaner: React.FC<JunkCleanerProps> = ({
  rules,
  onToggleRule,
  onSelectAll,
  onCleanSelected,
  onRescan,
  isScanning,
}) => {
  const [activeCategory, setActiveCategory] = useState<'all' | CleanerCategory>('all');
  const [expandedRuleId, setExpandedRuleId] = useState<string | null>(null);

  const filteredRules = rules.filter(
    (r) => activeCategory === 'all' || r.category === activeCategory
  );

  const selectedCount = filteredRules.filter((r) => r.selected).length;
  const totalSelectedBytes = filteredRules
    .filter((r) => r.selected)
    .reduce((acc, r) => acc + r.sizeBytes, 0);

  const categories = [
    { id: 'all', label: '全部项目', count: rules.length },
    { id: 'windows', label: 'Windows 系统垃圾', count: rules.filter((r) => r.category === 'windows').length },
    { id: 'browser', label: '浏览器缓存', count: rules.filter((r) => r.category === 'browser').length },
    { id: 'system', label: '系统记录与日志', count: rules.filter((r) => r.category === 'system').length },
    { id: 'developer', label: '开发者与工具缓存', count: rules.filter((r) => r.category === 'developer').length },
  ];

  return (
    <div className="space-y-4">
      {/* Category selector & Control Header */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Segmented Category Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-950/70 border border-slate-800/80 rounded-xl">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id as any)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  activeCategory === cat.id
                    ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {cat.label} ({cat.count})
              </button>
            ))}
          </div>

          {/* Quick Select & Rescan */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onSelectAll(true)}
              className="px-2.5 py-1 text-xs text-slate-300 hover:text-white bg-slate-800/70 hover:bg-slate-700/70 rounded-lg border border-slate-700/60 transition-colors"
            >
              全选
            </button>
            <button
              onClick={() => onSelectAll(false)}
              className="px-2.5 py-1 text-xs text-slate-400 hover:text-slate-200 bg-slate-800/40 hover:bg-slate-700/50 rounded-lg border border-slate-700/60 transition-colors"
            >
              取消
            </button>
            <button
              onClick={onRescan}
              disabled={isScanning}
              className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors"
            >
              <RefreshCw className={`w-3 h-3 ${isScanning ? 'animate-spin text-cyan-400' : ''}`} />
              <span>刷新扫描</span>
            </button>
          </div>
        </div>

        {/* Selected Banner */}
        <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <span>当前已选中 <strong className="text-cyan-300 font-mono">{selectedCount}</strong> 项</span>
            <span aria-hidden="true">·</span>
            <span>预计释放空间: <strong className="text-cyan-400 font-mono text-sm tabular-nums">{formatBytes(totalSelectedBytes)}</strong></span>
          </div>

          <button
            onClick={onCleanSelected}
            disabled={selectedCount === 0 || isScanning}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-sm ${
              selectedCount > 0 && !isScanning
                ? 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-bold active:scale-[0.98]'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>执行清理 ({formatBytes(totalSelectedBytes)})</span>
          </button>
        </div>
      </div>

      {/* Rules List */}
      <div className="space-y-2.5">
        {filteredRules.map((rule) => {
          const isExpanded = expandedRuleId === rule.id;
          return (
            <div
              key={rule.id}
              className={`rounded-xl border transition-all ${
                rule.selected
                  ? 'bg-slate-900/80 border-slate-700 shadow-sm'
                  : 'bg-slate-950/40 border-slate-800/70 hover:border-slate-800'
              }`}
            >
              <div className="p-3.5 flex items-start gap-3">
                {/* Checkbox */}
                <button
                  type="button"
                  onClick={() => onToggleRule(rule.id)}
                  className="mt-0.5 text-cyan-400 hover:text-cyan-300 transition-colors focus:outline-none"
                >
                  {rule.selected ? (
                    <CheckSquare className="w-4 h-4 fill-cyan-500/20 text-cyan-400" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-600 hover:text-slate-400" />
                  )}
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-100">{rule.name}</span>
                      
                      {/* Safety Badges */}
                      {rule.risk === 'safe' && (
                        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-1.5 py-0.2 rounded">
                          可安全清理
                        </span>
                      )}
                      {rule.risk === 'notice' && (
                        <span className="text-[10px] font-mono text-amber-400 bg-amber-950/40 border border-amber-800/40 px-1.5 py-0.2 rounded">
                          注意保留
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono text-slate-400 tabular-nums">
                        {rule.fileCount} 个文件
                      </span>
                      <span className="text-sm font-bold font-mono text-cyan-300 tabular-nums">
                        {formatBytes(rule.sizeBytes)}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    {rule.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-[11px] font-mono text-slate-500">
                    <span className="text-slate-400 truncate max-w-md">
                      路径: {rule.pathPattern}
                    </span>
                    <span className="text-cyan-500/90 truncate">
                      {rule.win32ApiNote}
                    </span>
                  </div>
                </div>

                {/* Drilldown expander */}
                <button
                  onClick={() => setExpandedRuleId(isExpanded ? null : rule.id)}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors ml-1"
                  title="查看详细文件列表"
                >
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* Detailed Files Breakdown Drawer */}
              {isExpanded && (
                <div className="px-4 pb-3.5 pt-1 border-t border-slate-800/80 bg-slate-950/70 rounded-b-xl">
                  <div className="text-xs font-medium text-slate-300 mb-2 flex items-center justify-between">
                    <span>抽样检测到的文件及具体物理位置:</span>
                    <span className="text-[11px] font-mono text-slate-500">仅展示前 {rule.files.length} 个代表性文件</span>
                  </div>

                  <div className="space-y-1.5">
                    {rule.files.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800 text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <div className="truncate">
                            <span className="text-slate-200 font-medium">{file.name}</span>
                            <span className="text-slate-500 font-mono text-[11px] ml-2 truncate">
                              {file.path}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0 ml-3">
                          <span className="text-[11px] font-mono text-slate-400">{file.modified}</span>
                          <span className="text-xs font-mono font-semibold text-cyan-300 tabular-nums">
                            {formatBytes(file.sizeBytes)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
