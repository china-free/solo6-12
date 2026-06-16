import { Archive, Send } from 'lucide-react';
import type { Task } from '../../../shared/types.js';

interface TaskStatusMessagesProps {
  task: Task;
  onRefresh?: () => void;
}

export function TaskStatusMessages({ task, onRefresh }: TaskStatusMessagesProps) {
  const isArchived = task.status === 'archived';
  const isReworking = task.status === 'reworking';
  const hasActions = ['pending', 'reviewing', 'resubmitted', 'reworking', 'passed'].includes(task.status);

  if (hasActions && !isArchived && !isReworking) return null;

  return (
    <>
      {isArchived && (
        <div className="p-6 rounded-xl border border-slate-700/40 bg-slate-800/20 text-center">
          <Archive size={28} className="mx-auto text-slate-600 mb-2" />
          <p className="text-xs text-slate-500">任务已归档，可在「归档记录」中查阅</p>
        </div>
      )}

      {isReworking && (
        <div className="p-6 rounded-xl border border-amber-500/30 bg-amber-500/5 text-center">
          <Send size={28} className="mx-auto text-amber-400/70 mb-2" />
          <p className="text-xs text-amber-200/80">后期编辑正在返工修改中...</p>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="mt-2 px-3 py-1 rounded-md bg-slate-700/60 text-[11px] text-slate-300 hover:bg-slate-700 transition-colors"
            >
              刷新状态
            </button>
          )}
        </div>
      )}
    </>
  );
}
