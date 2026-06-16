import { useState } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
import type { Task } from '../../../shared/types.js';

interface ReviewActionsProps {
  task: Task;
  onPass: (remark?: string) => Promise<void>;
  onReject: (remark?: string) => Promise<void>;
}

export function ReviewActions({ task, onPass, onReject }: ReviewActionsProps) {
  const [remark, setRemark] = useState('');

  function canPass() {
    return ['pending', 'reviewing', 'resubmitted'].includes(task.status);
  }
  function canReject() {
    return task.status === 'resubmitted';
  }
  function shouldShow() {
    return canPass() || canReject();
  }

  if (!shouldShow()) return null;

  async function handlePass() {
    if (!confirm('确认通过复检？通过后将进入已通过状态。')) return;
    await onPass(remark || undefined);
    setRemark('');
  }

  async function handleReject() {
    if (!confirm('确认驳回？将打回返工状态。')) return;
    await onReject(remark || undefined);
    setRemark('');
  }

  return (
    <div className="p-3 rounded-xl border border-slate-700/60 bg-slate-800/50 space-y-2.5">
      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">复检结论</div>
      <textarea
        value={remark}
        onChange={e => setRemark(e.target.value)}
        placeholder="填写结论或修改建议（可选）..."
        rows={2}
        className="w-full px-2.5 py-2 text-xs rounded-lg bg-slate-900/70 border border-slate-700 text-slate-200 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none resize-none"
      />
      <div className="grid grid-cols-2 gap-2">
        {canPass() && (
          <button
            onClick={handlePass}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-bold hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-emerald-500/20"
          >
            <CheckCircle size={13} /> 通过复检
          </button>
        )}
        {canReject() && (
          <button
            onClick={handleReject}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-gradient-to-r from-red-500 to-rose-500 text-white text-xs font-bold hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-red-500/20"
          >
            <XCircle size={13} /> 驳回返工
          </button>
        )}
      </div>
    </div>
  );
}
