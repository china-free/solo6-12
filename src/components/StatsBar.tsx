import { useEffect } from 'react';
import { useTaskStore } from '../stores/taskStore.js';
import { Clock, CheckCircle2, AlertTriangle, RefreshCw, Archive, FolderCheck, TrendingUp } from 'lucide-react';
import { cn } from '../utils/index.js';

export default function StatsBar() {
  const { stats, fetchStats } = useTaskStore();

  useEffect(() => {
    void fetchStats();
  }, [fetchStats]);

  const cards = stats ? [
    { label: '待复检', value: stats.pending, icon: Clock, color: 'from-slate-500 to-slate-600', text: 'text-slate-200' },
    { label: '复检中', value: stats.reviewing, icon: AlertTriangle, color: 'from-indigo-500 to-violet-600', text: 'text-indigo-200' },
    { label: '返工中', value: stats.reworking, icon: RefreshCw, color: 'from-amber-500 to-orange-600', text: 'text-amber-200' },
    { label: '已通过', value: stats.passed, icon: CheckCircle2, color: 'from-emerald-500 to-teal-600', text: 'text-emerald-200' },
    { label: '已归档', value: stats.archived, icon: Archive, color: 'from-slate-600 to-slate-700', text: 'text-slate-300' },
    { label: '未解决问题', value: stats.unresolvedIssues, icon: FolderCheck, color: 'from-rose-500 to-red-600', text: 'text-rose-200', badge: 'danger' },
  ] : [];

  return (
    <div className="w-full bg-gradient-to-br from-slate-900/90 via-slate-800/80 to-slate-900/90 border-b border-slate-700/50 backdrop-blur-sm px-5 py-3">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 pr-4 border-r border-slate-700/60">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <TrendingUp size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight leading-tight" style={{ fontFamily: '"Chakra Petch", system-ui, sans-serif' }}>
              口播瑕疵复检台
            </h1>
            <p className="text-[10px] text-slate-400 leading-tight">Audio Review Workstation · 实时总览</p>
          </div>
        </div>

        <div className="flex-1 grid grid-cols-6 gap-2.5">
          {cards.map((c, i) => (
            <div
              key={c.label}
              className={cn(
                'group relative overflow-hidden rounded-xl border border-slate-700/60 bg-slate-800/40 hover:bg-slate-800/80 p-2.5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl',
                c.badge === 'danger' && 'animate-pulse-slow'
              )}
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className={`absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r ${c.color} opacity-60 group-hover:opacity-100 transition-opacity`} />
              <div className="flex items-center gap-2">
                <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br', c.color, 'shadow-md opacity-90 group-hover:scale-105 transition-transform')}>
                  <c.icon size={14} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] text-slate-400 leading-none mb-1 uppercase tracking-wide">{c.label}</div>
                  <div className={cn('text-xl font-bold leading-none tabular-nums', c.text)} style={{ fontFamily: '"Chakra Petch", monospace' }}>
                    {c.value ?? '--'}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
