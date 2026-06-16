import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FolderClosed as ArchiveIcon, FileSearch } from 'lucide-react';
import StatsBar from '../components/StatsBar.js';
import TaskList from '../components/TaskList.js';
import { useTaskStore } from '../stores/taskStore.js';

export default function Archive() {
  const navigate = useNavigate();
  const { fetchTasks, fetchUsers, setFilters, filters } = useTaskStore();

  useEffect(() => {
    void fetchUsers();
    setFilters({ ...filters, status: 'archived' });
    void fetchTasks();
  }, []);

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-950 overflow-hidden">
      <StatsBar />
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-2.5 border-b border-slate-800/60 bg-slate-900/40">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-700/60 text-slate-300 hover:text-white text-xs font-semibold transition-colors border border-slate-700/50"
          >
            <ArrowLeft size={13} />
            返回看板
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center shadow-md">
              <ArchiveIcon size={16} className="text-slate-200" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white leading-tight" style={{ fontFamily: '"Chakra Petch", system-ui, sans-serif' }}>
                归档记录中心
              </h1>
              <p className="text-[10px] text-slate-500 leading-tight">Archived Tasks · 历史复检任务查询</p>
            </div>
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <FileSearch size={12} />
            筛选条件: 仅显示归档状态任务
          </div>
        </div>
        <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 overflow-hidden">
          <TaskList />
        </div>
      </div>
    </div>
  );
}
