import { useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, RefreshCw, Share2 } from 'lucide-react';
import StatsBar from '../components/StatsBar.js';
import TaskList from '../components/TaskList.js';
import WaveformDisplay from '../components/WaveformDisplay.js';
import PlaybackControls from '../components/PlaybackControls.js';
import SegmentPanel from '../components/SegmentPanel.js';
import IssuePanel from '../components/IssuePanel.js';
import DetailPanel from '../components/DetailPanel.js';
import { useTaskStore } from '../stores/taskStore.js';
import { usePlayerStore } from '../stores/playerStore.js';

export default function Workbench() {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const { currentTask, currentTaskId, fetchTaskDetail, fetchTasks, fetchUsers, loading } = useTaskStore();
  const resetPlayer = usePlayerStore(s => s.reset);

  useEffect(() => {
    void fetchTasks();
    void fetchUsers();
  }, [fetchTasks, fetchUsers]);

  useEffect(() => {
    if (taskId && taskId !== currentTaskId) {
      resetPlayer();
      void fetchTaskDetail(taskId);
    }
  }, [taskId, currentTaskId, fetchTaskDetail, resetPlayer]);

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-950 overflow-hidden">
      <StatsBar />
      <div className="flex-1 min-h-0 flex overflow-hidden">
        <div className="w-80 xl:w-96 flex-shrink-0 flex flex-col border-r border-slate-800/60 bg-slate-900/40">
          <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800/60 bg-slate-800/40">
            <Link to="/" className="flex items-center gap-1 text-xs font-semibold text-slate-300 hover:text-white transition-colors px-2 py-1 rounded-md hover:bg-slate-700/50">
              <ArrowLeft size={13} />
              返回看板
            </Link>
            <div className="flex gap-1">
              <button
                onClick={() => taskId && fetchTaskDetail(taskId)}
                className="p-1.5 rounded-md hover:bg-slate-700/50 text-slate-400 hover:text-white transition-colors"
                title="刷新"
              >
                <RefreshCw size={13} />
              </button>
              <button className="p-1.5 rounded-md hover:bg-slate-700/50 text-slate-400 hover:text-white transition-colors" title="分享">
                <Share2 size={13} />
              </button>
            </div>
          </div>
          <TaskList />
        </div>

        <div className="flex-1 min-w-0 flex flex-col bg-slate-950">
          {!currentTask || loading ? (
            <div className="flex-1 flex items-center justify-center text-slate-500">
              <div className="text-center space-y-3">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-800/60 flex items-center justify-center animate-pulse">
                  <RefreshCw size={28} className="text-slate-600 animate-spin" />
                </div>
                <p className="text-sm font-semibold text-slate-400">
                  {loading ? '加载任务详情...' : '请从左侧选择一个任务进入复检'}
                </p>
                {!loading && (
                  <button
                    onClick={() => navigate('/')}
                    className="px-4 py-2 rounded-lg bg-indigo-500/25 text-indigo-200 text-xs font-semibold hover:bg-indigo-500/40 border border-indigo-500/40 transition-colors"
                  >
                    浏览任务列表
                  </button>
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="px-5 pt-4 pb-2 border-b border-slate-800/40 bg-gradient-to-b from-slate-900/70 to-transparent">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <h2 className="text-lg font-bold text-white truncate leading-tight" style={{ fontFamily: '"Chakra Petch", system-ui, sans-serif' }}>
                      {currentTask.title}
                    </h2>
                    <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                      <span className="font-mono">任务ID: {currentTask.id}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex-1 min-h-0 flex flex-col px-5 pt-3 pb-0 space-y-3">
                <WaveformDisplay task={currentTask as any} />

                <div className="grid grid-cols-2 gap-3 flex-1 min-h-0 pb-0">
                  <div className="rounded-xl border border-slate-700/50 bg-slate-900/50 overflow-hidden flex flex-col shadow-md">
                    <SegmentPanel task={currentTask as any} />
                  </div>
                  <div className="rounded-xl border border-slate-700/50 bg-slate-900/50 overflow-hidden flex flex-col shadow-md">
                    <IssuePanel task={currentTask as any} />
                  </div>
                </div>

                <div className="-mx-5 -mt-0">
                  <PlaybackControls />
                </div>
              </div>
            </>
          )}
        </div>

        <div className="w-80 xl:w-96 flex-shrink-0">
          {currentTask ? (
            <DetailPanel task={currentTask as any} />
          ) : (
            <div className="h-full flex items-center justify-center text-slate-600 text-xs border-l border-slate-800/60">
              <div className="text-center">
                <div className="w-12 h-12 mx-auto rounded-xl border-2 border-dashed border-slate-700 flex items-center justify-center mb-2 opacity-50">
                  ?
                </div>
                选择任务后<br />在此查看详情与操作
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
