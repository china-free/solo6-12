import { FileText } from 'lucide-react';
import type { Task, TaskStatus } from '../../../shared/types.js';
import { TASK_STATUS_LABEL } from '../../../shared/types.js';
import { formatDateTime, cn, formatDuration } from '../../utils/index.js';

interface TaskInfoHeaderProps {
  task: Task & { segments: any[]; issues: any[]; history: any[] };
}

const statusBadgeClass: Record<TaskStatus, string> = {
  pending: 'bg-slate-500/25 text-slate-200 border-slate-500/40',
  reviewing: 'bg-indigo-500/25 text-indigo-200 border-indigo-500/40',
  reworking: 'bg-amber-500/25 text-amber-200 border-amber-500/40',
  resubmitted: 'bg-cyan-500/25 text-cyan-200 border-cyan-500/40',
  passed: 'bg-emerald-500/25 text-emerald-200 border-emerald-500/40',
  archived: 'bg-slate-600/25 text-slate-300 border-slate-600/40',
};

export function TaskInfoHeader({ task }: TaskInfoHeaderProps) {
  return (
    <div className="px-4 py-3 border-b border-slate-700/50 bg-slate-800/60 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <h2 className="text-sm font-bold text-white leading-snug flex-1 min-w-0 truncate">
          {task.title}
        </h2>
        {task.priority === 'urgent' && (
          <span className="flex-shrink-0 px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-500/30 text-red-200 border border-red-500/40 uppercase animate-pulse">
            紧急
          </span>
        )}
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <span className={cn('px-2 py-0.5 rounded-full border text-[10px] font-bold', statusBadgeClass[task.status])}>
          {TASK_STATUS_LABEL[task.status]}
        </span>
        <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
          <FileText size={10} />
          {formatDuration(task.duration)}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3 text-[11px] pt-1">
        <InfoRow label="制作人" value={task.producerName} />
        <InfoRow label="复检员" value={task.reviewerName || '—'} />
        <InfoRow label="后期" value={task.editorName || '—'} />
        <InfoRow label="创建时间" value={formatDateTime(task.createdAt).slice(5)} mono />
      </div>
      <div className="grid grid-cols-3 gap-2 pt-2">
        <StatMini label="分段" value={task.segments.length} color="text-indigo-300" />
        <StatMini label="问题数" value={task.issues.length} color="text-amber-300" />
        <StatMini label="未解决" value={task.unresolvedCount} color="text-red-300" danger={task.unresolvedCount > 0} />
      </div>
    </div>
  );
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="text-[9px] text-slate-500 uppercase tracking-wide mb-0.5">{label}</div>
      <div className={cn('text-slate-200 font-semibold truncate', mono && 'font-mono tabular-nums')}>{value}</div>
    </div>
  );
}

function StatMini({ label, value, color, danger }: { label: string; value: number; color: string; danger?: boolean }) {
  return (
    <div className={cn(
      'rounded-lg border px-2 py-1.5 text-center',
      danger ? 'border-red-500/30 bg-red-500/10 animate-pulse-slow' : 'border-slate-700/60 bg-slate-900/40'
    )}>
      <div className={cn('text-base font-bold tabular-nums', color)} style={{ fontFamily: '"Chakra Petch", monospace' }}>{value}</div>
      <div className="text-[9px] text-slate-500 uppercase tracking-wide -mt-0.5">{label}</div>
    </div>
  );
}
