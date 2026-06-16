import { useState } from 'react';
import { UserPlus, Send } from 'lucide-react';
import type { Task, User } from '../../../shared/types.js';
import { USER_ROLE_LABEL } from '../../../shared/types.js';
import { cn } from '../../utils/index.js';

interface AssignEditorPanelProps {
  task: Task & { issues: any[] };
  editors: User[];
  onAssign: (editorId: string) => Promise<void>;
}

export function AssignEditorPanel({ task, editors, onAssign }: AssignEditorPanelProps) {
  const [selectedEditor, setSelectedEditor] = useState<string>('');

  function canAssignRework() {
    return ['pending', 'reviewing', 'resubmitted', 'reworking'].includes(task.status) && task.issues.length > 0;
  }

  if (!canAssignRework()) return null;

  async function handleAssign() {
    if (!selectedEditor) return;
    await onAssign(selectedEditor);
    setSelectedEditor('');
  }

  return (
    <div className="p-3 rounded-xl border border-slate-700/60 bg-slate-800/50 space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1">
          <UserPlus size={11} className="text-indigo-400" />
          指派返工
        </div>
        {editors.length === 0 && (
          <span className="text-[10px] text-slate-500 animate-pulse">加载人员...</span>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2">
        {editors.map(e => (
          <button
            key={e.id}
            onClick={() => setSelectedEditor(e.id)}
            className={cn(
              'flex items-center gap-2 p-2 rounded-lg border text-xs transition-all text-left',
              selectedEditor === e.id
                ? 'border-indigo-400/70 bg-indigo-500/15 shadow-md shadow-indigo-500/10'
                : 'border-slate-700 bg-slate-900/40 hover:border-slate-600 hover:bg-slate-900/70'
            )}
          >
            <div className={cn(
              'w-7 h-7 rounded-full flex items-center justify-center font-bold text-[10px] flex-shrink-0',
              selectedEditor === e.id ? 'bg-indigo-500 text-white' : 'bg-slate-700 text-slate-300'
            )}>
              {e.name.slice(0, 1)}
            </div>
            <div className="flex-1 min-w-0">
              <div className={cn('font-semibold truncate', selectedEditor === e.id ? 'text-indigo-100' : 'text-slate-200')}>
                {e.name}
              </div>
              <div className="text-[9px] text-slate-500">{USER_ROLE_LABEL[e.role]}</div>
            </div>
          </button>
        ))}
      </div>
      <button
        onClick={handleAssign}
        disabled={!selectedEditor}
        className={cn(
          'w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all',
          selectedEditor
            ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:brightness-110 active:scale-95 shadow-lg shadow-indigo-500/20'
            : 'bg-slate-700/50 text-slate-500 cursor-not-allowed'
        )}
      >
        <Send size={12} />
        指派给选中的后期
      </button>
    </div>
  );
}
