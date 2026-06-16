import { Users } from 'lucide-react';
import type { Task, User } from '../../../shared/types.js';
import { USER_ROLE_LABEL } from '../../../shared/types.js';
import { cn } from '../../utils/index.js';

interface TeamMembersProps {
  task: Task;
  reviewers: User[];
}

export function TeamMembers({ task, reviewers }: TeamMembersProps) {
  if (!task.reviewerName || reviewers.length === 0) return null;

  return (
    <div className="p-3 rounded-xl border border-slate-700/60 bg-slate-800/50 space-y-2">
      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1">
        <Users size={11} className="text-cyan-400" />
        团队成员
      </div>
      <div className="space-y-1.5">
        <MemberRow role={USER_ROLE_LABEL.producer} name={task.producerName} color="text-violet-300" />
        <MemberRow role={USER_ROLE_LABEL.reviewer} name={task.reviewerName} color="text-cyan-300" />
        <MemberRow role={USER_ROLE_LABEL.editor} name={task.editorName} color="text-amber-300" />
      </div>
    </div>
  );
}

function MemberRow({ role, name, color }: { role: string; name: string | undefined; color: string }) {
  if (!name) return null;
  return (
    <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-slate-900/40 border border-slate-700/40">
      <span className="text-[10px] text-slate-500 w-12">{role}</span>
      <span className={cn('font-semibold text-xs', color)}>{name}</span>
    </div>
  );
}
