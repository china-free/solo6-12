import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, AlertCircle, User, Calendar, CheckCircle2, AlertTriangle, Archive, RefreshCcw, Search as SearchIcon } from 'lucide-react';
import type { Task, TaskStatus, TaskQueryParams } from '../../shared/types.js';
import { TASK_STATUS_LABEL } from '../../shared/types.js';
import { useTaskStore } from '../stores/taskStore.js';
import { formatDuration, formatDateTime, cn, generateMockWaveform } from '../utils/index.js';
import { usePlayerStore } from '../stores/playerStore.js';

const statusColors: Record<TaskStatus, string> = {
  pending: 'bg-slate-500/20 text-slate-300 border-slate-500/40',
  reviewing: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
  reworking: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  resubmitted: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
  passed: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  archived: 'bg-slate-600/20 text-slate-400 border-slate-600/40',
};

const statusDots: Record<TaskStatus, string> = {
  pending: 'bg-slate-400',
  reviewing: 'bg-indigo-400',
  reworking: 'bg-amber-400',
  resubmitted: 'bg-cyan-400',
  passed: 'bg-emerald-400',
  archived: 'bg-slate-500',
};

const statusIcons: Record<TaskStatus, any> = {
  pending: Clock, reviewing: AlertCircle, reworking: RefreshCcw,
  resubmitted: AlertTriangle, passed: CheckCircle2, archived: Archive,
};

export default function TaskList() {
  const { tasks, filters, setFilters, currentTaskId, setCurrentTaskId, loading } = useTaskStore();
  const navigate = useNavigate();
  const resetPlayer = usePlayerStore(s => s.reset);
  const [hoverMini, setHoverMini] = useState<Record<string, number[]>>({});

  function ensureWaveform(id: string) {
    if (!hoverMini[id]) setHoverMini(h => ({ ...h, [id]: generateMockWaveform(120) }));
    return hoverMini[id];
  }

  function openTask(id: string) {
    setCurrentTaskId(id);
    resetPlayer();
    navigate(`/workbench/${id}`);
  }

  function statusFilter(status: TaskStatus | null) {
    setFilters({ ...filters, status: status || undefined });
  }

  const statusFilterOptions: Array<{ label: string; value: TaskStatus | null; dot: string }> = [
    { label: '全部', value: null, dot: 'bg-white' },
    { label: '待复检', value: 'pending', dot: statusDots.pending },
    { label: '复检中', value: 'reviewing', dot: statusDots.reviewing },
    { label: '返工中', value: 'reworking', dot: statusDots.reworking },
    { label: '待复核', value: 'resubmitted', dot: statusDots.resubmitted },
    { label: '已通过', value: 'passed', dot: statusDots.passed },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-700/50 bg-slate-800/50 space-y-3">
        <div className="relative">
          <SearchIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={filters.keyword || ''}
            onChange={e => setFilters({ ...filters, keyword: e.target.value } as TaskQueryParams)}
            placeholder="搜索任务标题..."
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-slate-900/70 border border-slate-700 text-slate-200 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/40 transition-all"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {statusFilterOptions.map(opt => {
            const active = filters.status === opt.value;
            return (
              <button
                key={opt.label}
                onClick={() => statusFilter(opt.value)}
                className={cn(
                  'flex items-center gap-1 px-2.5 py-1 rounded-full text-xs border transition-all',
                  active
                    ? 'bg-indigo-500/25 border-indigo-500/50 text-indigo-200 shadow-sm shadow-indigo-500/10'
                    : 'bg-slate-800/50 border-slate-700/60 text-slate-400 hover:border-slate-600 hover:text-slate-300'
                )}
              >
                <span className={cn('w-1.5 h-1.5 rounded-full', opt.dot)} />
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
        {loading && tasks.length === 0 && (
          <div className="p-8 text-center text-slate-500 text-sm animate-pulse">加载任务中...</div>
        )}
        {!loading && tasks.length === 0 && (
          <div className="p-8 text-center text-slate-500 text-sm">
            <Archive size={36} className="mx-auto opacity-30 mb-2" />
            没有匹配的任务
          </div>
        )}
        {tasks.map(task => {
          const active = currentTaskId === task.id;
          const wf = ensureWaveform(task.id);
          const StatusIcon = statusIcons[task.status];
          return (
            <div
              key={task.id}
              onClick={() => openTask(task.id)}
              className={cn(
                'group cursor-pointer rounded-xl border transition-all overflow-hidden',
                active
                  ? 'border-indigo-400/70 bg-indigo-500/10 shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-400/30'
                  : 'border-slate-700/60 bg-slate-800/40 hover:border-slate-600 hover:bg-slate-800/70 hover:shadow-lg hover:shadow-black/20 hover:-translate-y-0.5'
              )}
            >
              <div className="p-3 space-y-2.5">
                <div className="flex items-start gap-2">
                  <div className={cn(
                    'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                    task.priority === 'urgent'
                      ? 'bg-gradient-to-br from-red-500/30 to-orange-500/20 border border-red-500/30'
                      : 'bg-slate-700/60 border border-slate-600/50'
                  )}>
                    <StatusIcon size={18} className={task.priority === 'urgent' ? 'text-red-300' : 'text-slate-300'} />
                    {task.priority === 'urgent' && (
                      <span className="absolute w-2 h-2 rounded-full bg-red-500 -mt-7 -mr-5 animate-ping" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className={cn(
                        'font-semibold text-sm leading-snug truncate',
                        active ? 'text-indigo-100' : 'text-slate-200 group-hover:text-white'
                      )}>
                        {task.title}
                      </h3>
                      {task.priority === 'urgent' && (
                        <span className="flex-shrink-0 px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-500/25 text-red-200 border border-red-500/40 uppercase tracking-wide">
                          紧急
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 mt-1 flex-wrap">
                      <span className={cn(
                        'px-1.5 py-0.5 rounded-md border text-[10px] font-semibold inline-flex items-center gap-1',
                        statusColors[task.status]
                      )}>
                        <span className={cn('w-1.5 h-1.5 rounded-full', statusDots[task.status])} />
                        {TASK_STATUS_LABEL[task.status]}
                      </span>
                      <span className="flex items-center gap-1 text-[10px] text-slate-400 font-mono">
                        <Clock size={10} />
                        {formatDuration(task.duration)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="h-8 rounded-md bg-slate-900/60 border border-slate-700/50 overflow-hidden p-1 flex items-center gap-[1.5px] group-hover:border-indigo-500/30 transition-colors">
                  {wf.map((v, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-full"
                      style={{
                        height: `${Math.max(8, v * 88)}%`,
                        background: task.unresolvedCount > 0
                          ? `linear-gradient(to top, #F59E0B80, #F8717180)`
                          : task.status === 'passed'
                            ? `linear-gradient(to top, #10B98170, #34D39990)`
                            : `linear-gradient(to top, #475569, #64748B)`,
                      }}
                    />
                  ))}
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5">
                  <div className="flex items-center gap-2">
                    {task.unresolvedCount > 0 && (
                      <span className="flex items-center gap-0.5 text-amber-400 font-semibold">
                        <AlertCircle size={10} />
                        {task.unresolvedCount} / {task.issueCount} 待处理
                      </span>
                    )}
                    {task.unresolvedCount === 0 && task.issueCount > 0 && (
                      <span className="flex items-center gap-0.5 text-emerald-400 font-semibold">
                        <CheckCircle2 size={10} />
                        {task.issueCount} 问题已修复
                      </span>
                    )}
                    {task.issueCount === 0 && (
                      <span className="text-slate-500">暂无问题</span>
                    )}
                  </div>
                  <div className="flex items-center gap-0.5">
                    {task.editorName && (
                      <span className="flex items-center gap-0.5" title={`后期: ${task.editorName}`}>
                        <User size={10} />
                        {task.editorName}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-700/40">
                  <span className="text-[10px] text-slate-500 flex items-center gap-1">
                    <Calendar size={10} />
                    {formatDateTime(task.createdAt)}
                  </span>
                  <button className={cn(
                    'text-[10px] font-semibold px-2 py-0.5 rounded-md transition-all',
                    active
                      ? 'bg-indigo-500/30 text-indigo-200 border border-indigo-400/40'
                      : 'bg-slate-700/50 text-slate-300 group-hover:bg-indigo-500/20 group-hover:text-indigo-300 border border-transparent group-hover:border-indigo-500/30'
                  )}>
                    进入复检 →
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
