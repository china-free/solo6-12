import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Archive } from 'lucide-react';
import type { Task } from '../../shared/types.js';
import { useTaskDetailStore } from '../stores/taskDetailStore.js';
import { useUserStore } from '../stores/userStore.js';
import { useUiStore } from '../stores/uiStore.js';
import { useTaskActions } from '../hooks/useTaskActions.js';
import { cn } from '../utils/index.js';
import HistoryTimeline from './HistoryTimeline.js';
import { TaskInfoHeader } from './detail/TaskInfoHeader.js';
import { ReviewActions } from './detail/ReviewActions.js';
import { AssignEditorPanel } from './detail/AssignEditorPanel.js';
import { TeamMembers } from './detail/TeamMembers.js';
import { TaskStatusMessages } from './detail/TaskStatusMessages.js';

interface DetailPanelProps {
  task: Task & { segments: any[]; issues: any[]; history: any[] };
}

export default function DetailPanel({ task }: DetailPanelProps) {
  const navigate = useNavigate();
  const { users } = useUserStore();
  const { fetchTaskDetail } = useTaskDetailStore();
  const { detailTab, setDetailTab } = useUiStore();
  const { submitReview, assignEditor, archiveTask } = useTaskActions();

  const editors = users.filter(u => u.role === 'editor');
  const reviewers = users.filter(u => u.role === 'reviewer');

  const handlePass = useCallback(async (remark?: string) => {
    await submitReview(task.id, true, remark);
  }, [task.id, submitReview]);

  const handleReject = useCallback(async (remark?: string) => {
    await submitReview(task.id, false, remark);
  }, [task.id, submitReview]);

  const handleAssignEditor = useCallback(async (editorId: string) => {
    await assignEditor(task.id, editorId);
  }, [task.id, assignEditor]);

  const handleArchive = useCallback(async () => {
    if (!confirm('确认归档此任务？')) return;
    await archiveTask(task.id);
    navigate('/');
  }, [task.id, archiveTask, navigate]);

  const handleRefresh = useCallback(() => {
    void fetchTaskDetail(task.id);
  }, [task.id, fetchTaskDetail]);

  const canArchive = task.status === 'passed';

  return (
    <div className="flex flex-col h-full overflow-hidden bg-slate-900/60 border-l border-slate-700/50">
      <TaskInfoHeader task={task} />

      <div className="flex border-b border-slate-700/50 bg-slate-800/30">
        {(['info', 'history'] as const).map(t => (
          <button
            key={t}
            onClick={() => setDetailTab(t)}
            className={cn(
              'flex-1 py-2 text-xs font-semibold transition-all relative',
              detailTab === t ? 'text-indigo-300' : 'text-slate-400 hover:text-slate-300'
            )}
          >
            {t === 'info' ? '操作面板' : '处理记录'}
            {detailTab === t && (
              <span className="absolute bottom-0 left-4 right-4 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-t" />
            )}
          </button>
        ))}
      </div>

      {detailTab === 'info' ? (
        <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
          <ReviewActions task={task} onPass={handlePass} onReject={handleReject} />
          <AssignEditorPanel task={task} editors={editors} onAssign={handleAssignEditor} />
          <TeamMembers task={task} reviewers={reviewers} />

          {canArchive && (
            <button
              onClick={handleArchive}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-700/60 border border-slate-600/50 text-slate-300 hover:text-white text-xs font-semibold transition-all"
            >
              <Archive size={13} /> 归档此任务
            </button>
          )}

          <TaskStatusMessages task={task} onRefresh={handleRefresh} />
        </div>
      ) : (
        <div className="flex-1 overflow-hidden">
          <HistoryTimeline task={task as any} />
        </div>
      )}
    </div>
  );
}
