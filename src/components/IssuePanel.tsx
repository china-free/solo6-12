import { useState } from 'react';
import { Plus, AlertTriangle, Trash2, Edit3, Check, X, Clock, Target } from 'lucide-react';
import type { Task, IssueMarker, IssueType, Severity } from '../../shared/types.js';
import { ISSUE_TYPE_LABEL, ISSUE_TYPE_COLOR, SEVERITY_LABEL } from '../../shared/types.js';
import { usePlayerStore } from '../stores/playerStore.js';
import { useUiStore } from '../stores/uiStore.js';
import { useTaskActions } from '../hooks/useTaskActions.js';
import { formatDuration, cn } from '../utils/index.js';

interface IssuePanelProps {
  task: Task & { issues: IssueMarker[] };
}

const issueTypes: IssueType[] = ['stutter', 'wrong_word', 'long_pause', 'noise', 'breath', 'tone', 'other'];
const severities: Severity[] = ['low', 'medium', 'high'];

export default function IssuePanel({ task }: IssuePanelProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ timePoint: 0, type: 'stutter' as IssueType, severity: 'medium' as Severity, description: '' });

  const { seekTo, setPlaying, currentTime } = usePlayerStore();
  const { selectedIssueId, selectIssue } = useUiStore();
  const { createIssue, updateIssue, deleteIssue } = useTaskActions();

  const issues = [...task.issues].sort((a, b) => a.timePoint - b.timePoint);

  function openNewForm() {
    setForm({ timePoint: Number(currentTime.toFixed(2)), type: 'stutter', severity: 'medium', description: '' });
    setShowForm(true);
    setEditingId(null);
  }

  function openEditForm(issue: IssueMarker) {
    setEditingId(issue.id);
    setShowForm(false);
    setForm({
      timePoint: issue.timePoint,
      type: issue.type,
      severity: issue.severity,
      description: issue.description || '',
    });
  }

  async function handleSubmit() {
    if (editingId) {
      await updateIssue(task.id, editingId, form);
      setEditingId(null);
    } else if (showForm) {
      await createIssue(task.id, form);
      setShowForm(false);
    }
    setForm({ timePoint: 0, type: 'stutter', severity: 'medium', description: '' });
  }

  function cancelEdit() {
    setEditingId(null);
    setShowForm(false);
  }

  function handleIssueClick(issue: IssueMarker) {
    selectIssue(issue.id);
    seekTo(Math.max(0, issue.timePoint - 0.3));
    setPlaying(true);
  }

  const byType = (() => {
    const m: Record<string, number> = {};
    issues.forEach(i => { m[i.type] = (m[i.type] || 0) + 1; });
    return m;
  })();

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-3 py-2 border-b border-slate-700/50 bg-slate-800/50 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <AlertTriangle size={13} className="text-amber-400" />
          <span className="text-xs font-bold text-slate-200 tracking-wide uppercase">问题标记</span>
          <span className="ml-1 px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-mono">{issues.length}</span>
        </div>
        <button
          onClick={openNewForm}
          className="flex items-center gap-1 px-2 py-1 rounded-md bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold hover:brightness-110 active:scale-95 transition-all shadow-md"
        >
          <Plus size={12} />
          新增
        </button>
      </div>

      {Object.keys(byType).length > 0 && (
        <div className="px-3 py-2 border-b border-slate-700/30 flex flex-wrap gap-1.5 bg-slate-800/20">
          {Object.entries(byType).map(([t, n]) => (
            <div key={t} className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] border"
              style={{ borderColor: ISSUE_TYPE_COLOR[t as IssueType] + '60', background: ISSUE_TYPE_COLOR[t as IssueType] + '15', color: ISSUE_TYPE_COLOR[t as IssueType] }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: ISSUE_TYPE_COLOR[t as IssueType] }} />
              {ISSUE_TYPE_LABEL[t as IssueType]} · {n}
            </div>
          ))}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-2 space-y-1.5 custom-scrollbar">
        {(showForm || editingId) && (
          <div className="p-3 rounded-xl border-2 border-dashed border-amber-400/60 bg-gradient-to-br from-amber-500/10 to-orange-500/5 space-y-2.5 animate-[fadeIn_.2s_ease]">
            <div className="text-xs font-bold text-amber-200 flex items-center gap-1.5">
              <Target size={12} />
              {editingId ? '编辑问题标记' : '新增问题标记'}
            </div>
            <div className="flex items-center gap-2">
              <label className="text-[10px] text-slate-400 w-14 flex items-center gap-1">
                <Clock size={10} /> 时间点
              </label>
              <input
                type="number" step="0.1"
                value={form.timePoint}
                onChange={e => setForm(f => ({ ...f, timePoint: parseFloat(e.target.value) || 0 }))}
                className="flex-1 px-2 py-1.5 text-xs rounded-md bg-slate-900/80 border border-slate-600 text-slate-200 font-mono focus:border-amber-400 focus:outline-none tabular-nums"
              />
              <span className="text-[10px] text-slate-500 font-mono">= {formatDuration(form.timePoint)}</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-[10px] text-slate-400 w-14 mt-2">类型</span>
              <div className="flex-1 flex flex-wrap gap-1">
                {issueTypes.map(t => (
                  <button
                    key={t}
                    onClick={() => setForm(f => ({ ...f, type: t }))}
                    className={cn(
                      'px-2 py-1 rounded-md text-[11px] border transition-all',
                      form.type === t
                        ? 'border-transparent shadow-sm font-bold'
                        : 'border-slate-600/60 text-slate-300 hover:border-slate-500 bg-slate-800/40'
                    )}
                    style={form.type === t ? { background: ISSUE_TYPE_COLOR[t], color: '#0F172A' } : {}}
                  >
                    {ISSUE_TYPE_LABEL[t]}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-400 w-14">严重度</span>
              <div className="flex gap-1">
                {severities.map(s => (
                  <button
                    key={s}
                    onClick={() => setForm(f => ({ ...f, severity: s }))}
                    className={cn(
                      'px-2.5 py-1 rounded-md text-[11px] border transition-all',
                      form.severity === s
                        ? s === 'high' ? 'border-red-400 bg-red-500/30 text-red-100 font-bold'
                        : s === 'medium' ? 'border-amber-400 bg-amber-500/30 text-amber-100 font-bold'
                        : 'border-emerald-400 bg-emerald-500/30 text-emerald-100 font-bold'
                        : 'border-slate-600/60 text-slate-300 hover:border-slate-500 bg-slate-800/40'
                    )}
                  >
                    {SEVERITY_LABEL[s]}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-[10px] text-slate-400 w-14 mt-2">描述</span>
              <input
                type="text"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="具体说明问题位置和修改建议..."
                className="flex-1 px-2.5 py-1.5 text-xs rounded-md bg-slate-900/80 border border-slate-600 text-slate-200 focus:border-amber-400 focus:outline-none"
              />
            </div>
            <div className="flex justify-end gap-1.5 pt-1">
              <button onClick={cancelEdit} className="px-3 py-1.5 rounded-md text-xs bg-slate-700/60 hover:bg-slate-700 text-slate-300 flex items-center gap-1">
                <X size={12} /> 取消
              </button>
              <button onClick={handleSubmit} className="px-3 py-1.5 rounded-md text-xs bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold hover:brightness-110 flex items-center gap-1">
                <Check size={12} /> 确定
              </button>
            </div>
          </div>
        )}

        {issues.length === 0 && !showForm && (
          <div className="p-8 text-center text-slate-500 text-xs space-y-2">
            <AlertTriangle size={28} className="mx-auto opacity-40" />
            <p>暂无问题标记</p>
            <p className="text-slate-600">点击右上角「新增」按钮开始标记</p>
          </div>
        )}

        {issues.map((issue, idx) => {
          const isSel = selectedIssueId === issue.id;
          const isEditing = editingId === issue.id;
          if (isEditing) return null;
          return (
            <div
              key={issue.id}
              className={cn(
                'group rounded-lg border transition-all overflow-hidden cursor-pointer',
                isSel
                  ? 'border-amber-400/80 bg-amber-500/10 shadow-md shadow-amber-500/10'
                  : 'border-slate-700/60 bg-slate-800/40 hover:border-slate-600 hover:bg-slate-800/70'
              )}
              onClick={() => handleIssueClick(issue)}
            >
              <div className="flex items-start gap-2 p-2">
                <div
                  className="flex-shrink-0 w-7 h-7 rounded-md flex items-center justify-center text-[10px] font-bold font-mono mt-0.5"
                  style={{ background: ISSUE_TYPE_COLOR[issue.type] + '25', color: ISSUE_TYPE_COLOR[issue.type], border: `1px solid ${ISSUE_TYPE_COLOR[issue.type]}50` }}
                >
                  {String(idx + 1).padStart(2, '0')}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-xs" style={{ color: ISSUE_TYPE_COLOR[issue.type] }}>
                      {ISSUE_TYPE_LABEL[issue.type]}
                    </span>
                    <span className={cn(
                      'px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide',
                      issue.severity === 'high' ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                        : issue.severity === 'medium' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    )}>
                      {SEVERITY_LABEL[issue.severity]}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 tabular-nums bg-slate-900/50 px-1.5 py-0.5 rounded">
                      @{formatDuration(issue.timePoint)}
                    </span>
                    {issue.resolvedAt && (
                      <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-bold border border-emerald-500/30">
                        已修复
                      </span>
                    )}
                  </div>
                  {issue.description && (
                    <p className="mt-1 text-xs text-slate-300 leading-relaxed line-clamp-2">
                      {issue.description}
                    </p>
                  )}
                </div>
                <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => { e.stopPropagation(); openEditForm(issue); }}
                    className="p-1.5 rounded-md hover:bg-indigo-500/20 text-slate-400 hover:text-indigo-300"
                    title="编辑"
                  >
                    <Edit3 size={12} />
                  </button>
                  <button
                    onClick={async (e) => { e.stopPropagation(); if (confirm('确定删除此问题标记？')) await deleteIssue(task.id, issue.id); }}
                    className="p-1.5 rounded-md hover:bg-red-500/20 text-slate-400 hover:text-red-300"
                    title="删除"
                  >
                    <Trash2 size={12} />
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
