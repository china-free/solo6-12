export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(sec).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

export function formatTimePoint(seconds: number): string {
  return formatDuration(seconds);
}

export function formatDateTime(iso: string): string {
  try {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return iso;
  }
}

export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function generateMockWaveform(length = 600): number[] {
  const data: number[] = [];
  let envelope = 0.3;
  for (let i = 0; i < length; i++) {
    const t = i / length;
    envelope = 0.25 + Math.sin(t * Math.PI * 3) * 0.2 + Math.sin(t * Math.PI * 8.7) * 0.15;
    const noise = (Math.random() - 0.5) * 0.4;
    const base = Math.abs(Math.sin(i * 0.25 + Math.sin(i * 0.04) * 2)) * 0.6;
    let v = Math.max(0.04, Math.min(1, envelope + base * 0.5 + noise));
    if (Math.random() < 0.015) v *= 0.15;
    if (Math.random() < 0.008) v = Math.random() * 0.4 + 0.5;
    data.push(v);
  }
  return data;
}

export function groupIssuesBySegment(issues: { segmentId?: string; timePoint: number }[], segments: { id: string; startTime: number; endTime: number }[]) {
  const map = new Map<string, typeof issues>();
  issues.forEach(iss => {
    let sid = iss.segmentId || '';
    if (!sid) {
      const seg = segments.find(s => iss.timePoint >= s.startTime && iss.timePoint < s.endTime);
      sid = seg?.id || '__ungrouped__';
    }
    if (!map.has(sid)) map.set(sid, [] as any);
    map.get(sid)!.push(iss as any);
  });
  return map;
}
