import { Play, Pause, SkipBack, SkipForward, Volume2, Gauge, Repeat } from 'lucide-react';
import { usePlayerStore } from '../stores/playerStore.js';
import { formatDuration } from '../utils/index.js';
import { useTaskStore } from '../stores/taskStore.js';
import type { AudioSegment } from '../../shared/types.js';

export default function PlaybackControls() {
  const { currentTime, duration, isPlaying, volume, playbackRate, togglePlay, seekTo, setVolume, setPlaybackRate } = usePlayerStore();
  const task = useTaskStore(s => s.currentTask);

  function jumpSeg(dir: -1 | 1) {
    if (!task) return;
    const segs = task.segments.sort((a, b) => a.startTime - b.startTime);
    let target: AudioSegment | undefined;
    if (dir === -1) {
      target = [...segs].reverse().find(s => s.endTime <= currentTime - 0.5) || segs[0];
    } else {
      target = segs.find(s => s.startTime >= currentTime + 0.5) || segs[segs.length - 1];
    }
    if (target) seekTo(target.startTime);
  }

  const rates = [0.5, 0.75, 1, 1.25, 1.5, 2];
  const rateIdx = rates.indexOf(playbackRate);
  const nextRate = () => setPlaybackRate(rates[(rateIdx + 1) % rates.length]);

  const totalDur = duration || task?.duration || 0;
  const progress = totalDur > 0 ? (currentTime / totalDur) * 100 : 0;

  function onScrub(e: React.ChangeEvent<HTMLInputElement>) {
    seekTo(parseFloat(e.target.value));
  }

  return (
    <div className="w-full bg-gradient-to-r from-slate-900/95 via-slate-800/95 to-slate-900/95 backdrop-blur border-t border-slate-700/50 px-4 py-3 rounded-b-xl">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-slate-300 font-mono text-xs">
          <span className="text-amber-400 font-bold tabular-nums min-w-[48px] text-right">{formatDuration(currentTime)}</span>
          <span className="text-slate-600">/</span>
          <span className="text-slate-400 tabular-nums min-w-[48px]">{formatDuration(totalDur)}</span>
        </div>

        <div className="flex-1 relative h-3 group">
          <div className="absolute inset-0 my-auto h-1.5 rounded-full bg-slate-700/70 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-amber-500 via-orange-400 to-red-400 rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
          <input
            type="range" min={0} max={Math.max(0.01, totalDur)} step={0.05}
            value={currentTime}
            onChange={onScrub}
            className="absolute inset-0 w-full opacity-0 cursor-pointer z-10"
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-amber-400 border-2 border-white shadow-lg pointer-events-none transition-all opacity-0 group-hover:opacity-100"
            style={{ left: `calc(${progress}% - 8px)` }}
          />
        </div>

        <div className="flex items-center gap-1">
          <button onClick={() => jumpSeg(-1)} className="p-2 rounded-lg hover:bg-slate-700/60 text-slate-300 hover:text-white transition-colors" title="上一段">
            <SkipBack size={16} />
          </button>
          <button
            onClick={togglePlay}
            className="p-3 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-slate-900 hover:brightness-110 shadow-lg hover:shadow-amber-500/30 transition-all hover:scale-105 active:scale-95"
            title={isPlaying ? '暂停' : '播放'}
          >
            {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-0.5" />}
          </button>
          <button onClick={() => jumpSeg(1)} className="p-2 rounded-lg hover:bg-slate-700/60 text-slate-300 hover:text-white transition-colors" title="下一段">
            <SkipForward size={16} />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={nextRate} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600/50 text-slate-200 text-xs font-mono transition-colors" title="切换倍速">
            <Gauge size={13} className="text-indigo-400" />
            <span className="font-bold tabular-nums">{playbackRate}x</span>
          </button>
          <div className="flex items-center gap-2 w-28 px-2 py-1.5 rounded-lg bg-slate-800 border border-slate-600/50">
            <Volume2 size={13} className="text-cyan-400 flex-shrink-0" />
            <input
              type="range" min={0} max={1} step={0.05}
              value={volume}
              onChange={e => setVolume(parseFloat(e.target.value))}
              className="flex-1 accent-cyan-400"
            />
          </div>
          <button className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600/50 text-slate-300 transition-colors" title="循环播放">
            <Repeat size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
