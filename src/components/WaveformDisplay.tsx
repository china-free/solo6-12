import { useEffect, useRef } from 'react';
import type { Task, IssueMarker, AudioSegment } from '../../shared/types.js';
import { usePlayerStore } from '../stores/playerStore.js';
import { formatDuration, generateMockWaveform } from '../utils/index.js';
import { ISSUE_TYPE_COLOR } from '../../shared/types.js';

interface WaveformDisplayProps {
  task: Task & { segments: AudioSegment[]; issues: IssueMarker[] };
}

export default function WaveformDisplay({ task }: WaveformDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafId = useRef<number>();
  const fallbackWaveform = useRef<number[]>(generateMockWaveform(Math.max(600, Math.floor(task.duration * 3))));

  const {
    currentTime, duration, isPlaying,
    selectedIssueId, selectedSegmentId, hoverTime,
    waveformData, seekTo, setHoverTime, setPlaying,
  } = usePlayerStore();

  useEffect(() => {
    fallbackWaveform.current = generateMockWaveform(Math.max(600, Math.floor(task.duration * 3)));
  }, [task.id, task.duration]);

  useEffect(() => {
    let animId: number;
    function loop() {
      draw();
      animId = requestAnimationFrame(loop);
    }
    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [task.id, waveformData, currentTime, duration, selectedIssueId, selectedSegmentId, hoverTime]);

  function getWaveformBars(): number[] {
    if (waveformData && waveformData.length > 0) {
      const bars: number[] = [];
      for (let i = 0; i < waveformData.length; i++) {
        bars.push(waveformData[i]);
      }
      return bars;
    }
    return fallbackWaveform.current;
  }

  function draw() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const W = rect.width;
    const H = rect.height;
    if (canvas.width !== W * dpr || canvas.height !== H * dpr) {
      canvas.width = W * dpr;
      canvas.height = H * dpr;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, '#0B1220');
    bgGrad.addColorStop(1, '#111C33');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = 'rgba(71,85,105,0.18)';
    ctx.lineWidth = 1;
    for (let gx = 0; gx < W; gx += 48) {
      ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke();
    }
    for (let gy = 0; gy < H; gy += 24) {
      ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(71,85,105,0.35)';
    ctx.beginPath(); ctx.moveTo(0, H / 2); ctx.lineTo(W, H / 2); ctx.stroke();

    const dur = duration || task.duration || 1;
    const mid = H / 2;

    task.segments.forEach(seg => {
      const x1 = (seg.startTime / dur) * W;
      const x2 = (seg.endTime / dur) * W;
      const isActive = selectedSegmentId === seg.id;
      ctx.fillStyle = isActive ? 'rgba(99,102,241,0.15)' : 'rgba(148,163,184,0.06)';
      ctx.fillRect(x1, 4, x2 - x1, H - 8);
      ctx.fillStyle = isActive ? '#818CF8' : 'rgba(148,163,184,0.35)';
      ctx.font = '10px "Chakra Petch", system-ui';
      ctx.fillText(seg.label, x1 + 6, 16);
    });

    const data = getWaveformBars();
    const dataLen = data.length;
    const barW = Math.max(1.5, W / dataLen);
    const playX = (currentTime / dur) * W;

    const isReal = waveformData && waveformData.length > 0;
    for (let i = 0; i < dataLen; i++) {
      const x = i * barW;
      if (x > W) break;
      const rawV = data[i];
      const v = isReal ? Math.max(0.02, Math.min(1, rawV * 4)) : rawV;
      const bh = v * (H - 20) * 0.85;
      const played = x < playX;
      const grad = ctx.createLinearGradient(0, mid - bh / 2, 0, mid + bh / 2);
      if (played) {
        grad.addColorStop(0, '#22D3EE');
        grad.addColorStop(0.5, '#0891B2');
        grad.addColorStop(1, '#22D3EE');
      } else {
        grad.addColorStop(0, '#475569');
        grad.addColorStop(0.5, '#334155');
        grad.addColorStop(1, '#475569');
      }
      ctx.fillStyle = grad;
      const bw = Math.max(1, barW - 1.2);
      ctx.fillRect(x, mid - bh / 2, bw, bh);
    }

    task.issues.forEach(iss => {
      const ix = (iss.timePoint / dur) * W;
      const color = ISSUE_TYPE_COLOR[iss.type];
      const isSel = selectedIssueId === iss.id;
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = isSel ? 3 : 1.8;
      ctx.setLineDash(isSel ? [] : [4, 3]);
      ctx.beginPath(); ctx.moveTo(ix, 8); ctx.lineTo(ix, H - 8); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = color;
      const rh = isSel ? 10 : 7;
      ctx.beginPath(); ctx.arc(ix, 10, rh / 2, 0, Math.PI * 2); ctx.fill();
      if (isSel) {
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.18;
        ctx.fillRect(Math.max(0, ix - 24), 0, 48, H);
        ctx.globalAlpha = 1;
      }
      ctx.restore();
    });

    ctx.save();
    ctx.strokeStyle = '#F59E0B';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#F59E0B';
    ctx.shadowBlur = 10;
    ctx.beginPath(); ctx.moveTo(playX, 2); ctx.lineTo(playX, H - 2); ctx.stroke();
    ctx.restore();
    ctx.fillStyle = '#F59E0B';
    ctx.beginPath(); ctx.moveTo(playX - 6, 0); ctx.lineTo(playX + 6, 0); ctx.lineTo(playX, 8); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(playX - 6, H); ctx.lineTo(playX + 6, H); ctx.lineTo(playX, H - 8); ctx.closePath(); ctx.fill();

    if (hoverTime !== null && hoverTime !== undefined) {
      const hx = (hoverTime / dur) * W;
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.moveTo(hx, 0); ctx.lineTo(hx, H); ctx.stroke();
      ctx.setLineDash([]);
      const label = formatDuration(hoverTime);
      ctx.font = 'bold 11px "Chakra Petch", monospace';
      const tw = ctx.measureText(label).width + 14;
      const lx = Math.min(W - tw - 4, Math.max(4, hx - tw / 2));
      ctx.fillStyle = 'rgba(15,23,42,0.92)';
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.roundRect(lx, H - 26, tw, 20, 4); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#E2E8F0';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, lx + 7, H - 16);
    }

    if (isReal) {
      ctx.fillStyle = 'rgba(34,211,238,0.5)';
      ctx.font = '9px "Chakra Petch", system-ui';
      ctx.textBaseline = 'top';
      ctx.fillText('◉ 真实音频波形', 8, H - 18);
    } else {
      ctx.fillStyle = 'rgba(148,163,184,0.4)';
      ctx.font = '9px "Chakra Petch", system-ui';
      ctx.textBaseline = 'top';
      ctx.fillText('◉ 模拟波形 (音频加载中...)', 8, H - 18);
    }
  }

  function getTimeFromClientX(clientX: number) {
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = clientX - rect.left;
    const dur = duration || task.duration || 1;
    return (x / rect.width) * dur;
  }

  function handleClick(e: React.MouseEvent) {
    seekTo(getTimeFromClientX(e.clientX));
  }

  function handleMouseMove(e: React.MouseEvent) {
    setHoverTime(getTimeFromClientX(e.clientX));
  }

  function handleDoubleClick(e: React.MouseEvent) {
    seekTo(getTimeFromClientX(e.clientX));
    setPlaying(true);
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full select-none rounded-lg overflow-hidden border border-slate-700/60 shadow-xl"
      onMouseLeave={() => setHoverTime(null)}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-crosshair"
        style={{ height: '220px' }}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        onDoubleClick={handleDoubleClick}
      />
      <div className="pointer-events-none absolute top-2 left-1/2 -translate-x-1/2 text-[10px] font-mono text-slate-400 tracking-wider">
        双击播放 · 单击定位 · 问题点点击右栏详情
      </div>
    </div>
  );
}
