import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Workflow, ListChecks, FileArchive } from 'lucide-react';
import StatsBar from '../components/StatsBar.js';
import TaskList from '../components/TaskList.js';
import { useTaskStore } from '../stores/taskStore.js';
import { cn } from '../utils/index.js';

export default function Dashboard() {
  const navigate = useNavigate();
  const { fetchTasks, fetchUsers, currentTaskId, tasks } = useTaskStore();

  useEffect(() => {
    void fetchTasks();
    void fetchUsers();
  }, [fetchTasks, fetchUsers]);

  useEffect(() => {
    if (currentTaskId && tasks.length > 0) {
      navigate(`/workbench/${currentTaskId}`);
    }
  }, [currentTaskId, tasks.length, navigate]);

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-950 overflow-hidden">
      <StatsBar />
      <div className="flex-1 min-h-0 flex overflow-hidden">
        <div className="w-full h-full flex flex-col">
          <div className="flex items-center gap-2 px-4 py-2 border-b border-slate-800/60 bg-slate-900/40">
            <TabButton active={true} icon={Workflow} label="任务看板" count={tasks.length} />
            <TabButton active={false} icon={ListChecks} label="待处理" onClick={() => useTaskStore.getState().setFilters({ status: 'pending' })} />
            <TabButton active={false} icon={FileArchive} label="归档记录" onClick={() => useTaskStore.getState().setFilters({ status: 'archived' })} />
            <div className="flex-1" />
            <div className="text-[11px] text-slate-500 flex items-center gap-3">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                实时同步
              </span>
              <span className="text-slate-700">|</span>
              <span className="font-mono tabular-nums">共 {tasks.length} 条任务</span>
            </div>
          </div>
          <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 overflow-y-auto custom-scrollbar">
            <div className="contents">
              <TaskListWrapper />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TaskListWrapper() {
  return <TaskList />;
}

function TabButton({
  active, icon: Icon, label, count, onClick,
}: { active?: boolean; icon: any; label: string; count?: number; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
        active
          ? 'bg-indigo-500/25 text-indigo-200 border border-indigo-500/40 shadow-sm shadow-indigo-500/10'
          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
      )}
    >
      <Icon size={13} />
      {label}
      {count !== undefined && (
        <span className={cn(
          'px-1.5 py-0.5 rounded-full text-[9px] font-bold tabular-nums',
          active ? 'bg-indigo-500/40 text-indigo-50' : 'bg-slate-700/70 text-slate-300'
        )}>
          {count}
        </span>
      )}
    </button>
  );
}
