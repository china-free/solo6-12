import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, UserPlus, Archive, Send, Users, FileText } from 'lucide-react';
import type { Task, TaskStatus } from '../../shared/types.js';
import { TASK_STATUS_LABEL, USER_ROLE_LABEL } from '../../shared/types.js';
import { useTaskStore } from '../stores/taskStore.js';
import { formatDateTime, cn, formatDuration } from '../utils/index.js';
import HistoryTimeline from './HistoryTimeline.js';

interface DetailPanelProps {
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

export default function DetailPanel({ task }: DetailPanelProps) {
  const navigate = useNavigate();
  const { users, assignEditor, submitReview, archiveTask, fetchTaskDetail } = useTaskStore();
  const [selectedEditor, setSelectedEditor] = useState<string>('');
  const [remark, setRemark] = useState('');
  const [tab, setTab] = useState<'info' | 'history'>('info');

  const editors = users.filter(u => u.role === 'editor');
  const reviewers = users.filter(u => u.role === 'reviewer');

  function canAssignRework() {
    return ['pending', 'reviewing', 'resubmitted', 'reworking'].includes(task.status) && task.issues.length > 0;
  }
  function canPass() {
    return ['pending', 'reviewing', 'resubmitted'].includes(task.status);
  }
  function canReject() {
    return task.status === 'resubmitted';
  }
  function canArchive() {
    return task.status === 'passed';
  }

  async function handleAssign() {
    if (!selectedEditor) return;
    await assignEditor(task.id, selectedEditor);
    setSelectedEditor('');
  }

  async function handlePass() {
    if (!confirm('确认通过复检？通过后将进入已通过状态。')) return;
    await submitReview(task.id, true, remark || undefined);
    setRemark('');
  }

  async function handleReject() {
    if (!confirm('确认驳回？将打回返工状态。')) return;
    await submitReview(task.id, false, remark || undefined);
    setRemark('');
  }

  async function handleArchive() {
    if (!confirm('确认归档此任务？')) return;
    await archiveTask(task.id);
    navigate('/');
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-slate-900/60 border-l border-slate-700/50">
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

      <div className="flex border-b border-slate-700/50 bg-slate-800/30">
        {(['info', 'history'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'flex-1 py-2 text-xs font-semibold transition-all relative',
              tab === t ? 'text-indigo-300' : 'text-slate-400 hover:text-slate-300'
            )}
          >
            {t === 'info' ? '操作面板' : '处理记录'}
            {tab === t && (
              <span className="absolute bottom-0 left-4 right-4 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-t" />
            )}
          </button>
        ))}
      </div>

      {tab === 'info' ? (
        <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
          {(canAssignRework() || canPass() || canReject()) && (
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
          )}

          {canAssignRework() && (
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
          )}

          {task.reviewerName && reviewers.length > 0 && (
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
          )}

          {canArchive() && (
            <button
              onClick={handleArchive}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-700/60 border border-slate-600/50 text-slate-300 hover:text-white text-xs font-semibold transition-all"
            >
              <Archive size={13} /> 归档此任务
            </button>
          )}

          {!canAssignRework() && !canPass() && !canReject() && !canArchive() && task.status === 'archived' && (
            <div className="p-6 rounded-xl border border-slate-700/40 bg-slate-800/20 text-center">
              <Archive size={28} className="mx-auto text-slate-600 mb-2" />
              <p className="text-xs text-slate-500">任务已归档，可在「归档记录」中查阅</p>
            </div>
          )}

          {!canAssignRework() && !canPass() && !canReject() && !canArchive() && task.status === 'reworking' && (
            <div className="p-6 rounded-xl border border-amber-500/30 bg-amber-500/5 text-center">
              <Send size={28} className="mx-auto text-amber-400/70 mb-2" />
              <p className="text-xs text-amber-200/80">后期编辑正在返工修改中...</p>
              <button
                onClick={() => fetchTaskDetail(task.id)}
                className="mt-2 px-3 py-1 rounded-md bg-slate-700/60 text-[11px] text-slate-300 hover:bg-slate-700 transition-colors"
              >
                刷新状态
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 overflow-hidden">
          <HistoryTimeline task={task as any} />
        </div>
      )}
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

function MemberRow({ role, name, color }: { role: string; name: string | undefined; color: string }) {
  if (!name) return null;
  return (
    <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-slate-900/40 border border-slate-700/40">
      <span className="text-[10px] text-slate-500 w-12">{role}</span>
      <span className={cn('font-semibold text-xs', color)}>{name}</span>
    </div>
  );
}
