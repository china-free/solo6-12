import { useState } from 'react';
import { Play, ChevronRight, FileText } from 'lucide-react';
import type { Task, AudioSegment, IssueMarker } from '../../shared/types.js';
import { usePlayerStore } from '../stores/playerStore.js';
import { useUiStore } from '../stores/uiStore.js';
import { formatDuration, cn } from '../utils/index.js';

interface SegmentPanelProps {
  task: Task & { segments: AudioSegment[]; issues: IssueMarker[] };
}

export default function SegmentPanel({ task }: SegmentPanelProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const { seekTo, setPlaying } = usePlayerStore();
  const { selectedSegmentId, selectSegment } = useUiStore();

  const segs = [...task.segments].sort((a, b) => a.startTime - b.startTime);

  function toggle(id: string) {
    setExpanded(e => ({ ...e, [id]: !e[id] }));
  }

  function handleSegClick(seg: AudioSegment) {
    selectSegment(seg.id);
    seekTo(seg.startTime);
    setPlaying(true);
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-700/50 bg-slate-800/50">
        <div className="text-xs font-bold text-slate-200 tracking-wide uppercase flex items-center gap-1.5">
          <FileText size={13} className="text-indigo-400" />
          音频分段
          <span className="ml-1 px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-mono">{segs.length}</span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5 custom-scrollbar">
        {segs.map((seg, idx) => {
          const segIssues = task.issues.filter(i =>
            i.timePoint >= seg.startTime && i.timePoint < seg.endTime
          );
          const isActive = selectedSegmentId === seg.id;
          const isOpen = expanded[seg.id];
          return (
            <div
              key={seg.id}
              className={cn(
                'group rounded-lg border transition-all overflow-hidden',
                isActive
                  ? 'border-indigo-400/70 bg-indigo-500/10 shadow-md shadow-indigo-500/10'
                  : 'border-slate-700/60 bg-slate-800/40 hover:border-slate-600 hover:bg-slate-800/70'
              )}
            >
              <div
                className="flex items-center gap-2 p-2.5 cursor-pointer"
                onClick={() => handleSegClick(seg)}
              >
                <div className={cn(
                  'w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0 font-bold text-xs font-mono',
                  isActive ? 'bg-indigo-500 text-white' : 'bg-slate-700 text-slate-300 group-hover:bg-indigo-500/30'
                )}>
                  {String(idx + 1).padStart(2, '0')}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={cn('text-sm font-semibold truncate', isActive ? 'text-indigo-200' : 'text-slate-200')}>
                      {seg.label}
                    </span>
                    {segIssues.length > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-300 text-[10px] font-bold">
                        {segIssues.length}问题
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] font-mono text-slate-400 mt-0.5 tabular-nums">
                    {formatDuration(seg.startTime)} → {formatDuration(seg.endTime)}
                    <span className="mx-1 text-slate-600">·</span>
                    {formatDuration(seg.endTime - seg.startTime)}
                  </div>
                </div>
                <button
                  className="p-1.5 rounded-md opacity-0 group-hover:opacity-100 hover:bg-white/10 text-slate-400 hover:text-white transition-all"
                  onClick={(e) => { e.stopPropagation(); selectSegment(seg.id); seekTo(seg.startTime); setPlaying(true); }}
                  title="播放本段"
                >
                  <Play size={13} fill="currentColor" />
                </button>
                <button
                  className="p-1 rounded hover:bg-slate-700/60 text-slate-400 hover:text-white transition-all"
                  onClick={(e) => { e.stopPropagation(); toggle(seg.id); }}
                >
                  <ChevronRight size={14} className={cn('transition-transform', isOpen && 'rotate-90')} />
                </button>
              </div>
              {isOpen && seg.script && (
                <div className="px-2.5 pb-2.5 pt-0 text-xs text-slate-400 border-t border-slate-700/40 mt-0.5 pt-2 ml-12">
                  <div className="text-slate-500 mb-1 text-[10px] uppercase tracking-wide">参考文稿</div>
                  <p className="leading-relaxed">{seg.script}</p>
                </div>
              )}
              {isOpen && segIssues.length > 0 && (
                <div className="px-2.5 pb-2.5 pt-2 ml-12 space-y-1 border-t border-slate-700/40">
                  {segIssues.map(iss => (
                    <div key={iss.id} className="text-xs px-2 py-1.5 rounded bg-red-500/10 border border-red-500/20 text-red-200 font-mono">
                      ⚠ {formatDuration(iss.timePoint)} · {iss.description.slice(0, 20)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
