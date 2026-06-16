import { History, Plus, AlertTriangle, UserPlus, Redo2, CheckCircle2, XCircle, Archive } from 'lucide-react';
import type { HistoryRecord, Task } from '../../shared/types.js';
import { formatDateTime, cn } from '../utils/index.js';

const actionConfig: Record<HistoryRecord['action'], { icon: any; label: string; color: string; bg: string; border: string }> = {
  create: { icon: Plus, label: '任务创建', color: 'text-slate-300', bg: 'bg-slate-600/20', border: 'border-slate-500/40' },
  mark_issue: { icon: AlertTriangle, label: '标记问题', color: 'text-amber-300', bg: 'bg-amber-500/15', border: 'border-amber-500/40' },
  assign: { icon: UserPlus, label: '任务指派', color: 'text-indigo-300', bg: 'bg-indigo-500/15', border: 'border-indigo-500/40' },
  submit_rework: { icon: Redo2, label: '提交返工', color: 'text-cyan-300', bg: 'bg-cyan-500/15', border: 'border-cyan-500/40' },
  review_pass: { icon: CheckCircle2, label: '复检通过', color: 'text-emerald-300', bg: 'bg-emerald-500/15', border: 'border-emerald-500/40' },
  review_reject: { icon: XCircle, label: '复检驳回', color: 'text-red-300', bg: 'bg-red-500/15', border: 'border-red-500/40' },
  archive: { icon: Archive, label: '归档', color: 'text-slate-400', bg: 'bg-slate-600/20', border: 'border-slate-500/40' },
};

interface HistoryTimelineProps {
  task: Task & { history: HistoryRecord[] };
}

export default function HistoryTimeline({ task }: HistoryTimelineProps) {
  const sorted = [...task.history].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-3 py-2 border-b border-slate-700/50 bg-slate-800/50 flex items-center gap-1.5">
        <History size={13} className="text-emerald-400" />
        <span className="text-xs font-bold text-slate-200 tracking-wide uppercase">处理时间线</span>
        <span className="ml-1 px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-mono">{sorted.length}</span>
      </div>
      <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
        {sorted.length === 0 ? (
          <div className="p-6 text-center text-slate-500 text-xs">
            <History size={28} className="mx-auto opacity-30 mb-2" />
            暂无处理记录
          </div>
        ) : (
          <ol className="relative">
            <div className="absolute left-[13px] top-1 bottom-1 w-px bg-gradient-to-b from-slate-600 via-slate-700 to-slate-800" />
            {sorted.map((rec, idx) => {
              const cfg = actionConfig[rec.action] || actionConfig.create;
              const Icon = cfg.icon;
              return (
                <li key={rec.id} className="relative pl-9 pb-4 last:pb-0 group">
                  <div className={cn(
                    'absolute left-0 w-7 h-7 rounded-full flex items-center justify-center border-2 border-slate-900 z-10',
                    cfg.bg, cfg.border, 'shadow-md'
                  )}>
                    <Icon size={12} className={cfg.color} />
                  </div>
                  <div className={cn(
                    'rounded-lg border p-2.5 ml-1 transition-all',
                    'bg-slate-800/50 hover:bg-slate-800/80 border-slate-700/50 hover:border-slate-600/60'
                  )}>
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className={cn('text-xs font-bold', cfg.color)}>{cfg.label}</span>
                      <span className="text-[10px] text-slate-500 font-mono tabular-nums">{formatDateTime(rec.timestamp)}</span>
                    </div>
                    <div className="mt-1.5 text-xs text-slate-300 flex items-center gap-1">
                      <span className="text-slate-400">操作人:</span>
                      <span className="font-semibold text-slate-200">{rec.operatorName}</span>
                    </div>
                    {rec.remark && (
                      <p className="mt-1.5 text-xs text-slate-400 leading-relaxed pl-2 border-l-2 border-slate-700/60">
                        {rec.remark}
                      </p>
                    )}
                    {idx === sorted.length - 1 && (
                      <div className="mt-1.5 pt-1.5 border-t border-slate-700/40">
                        <span className="px-2 py-0.5 rounded text-[9px] bg-emerald-500/20 text-emerald-300 font-bold uppercase tracking-wide">
                          当前状态
                        </span>
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </div>
  );
}
