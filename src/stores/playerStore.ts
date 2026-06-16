import { create } from 'zustand';

interface PlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  playbackRate: number;
  selectedIssueId: string | null;
  selectedSegmentId: string | null;
  hoverTime: number | null;
  scrollOffset: number;

  setPlaying: (p: boolean) => void;
  setCurrentTime: (t: number) => void;
  setDuration: (d: number) => void;
  setVolume: (v: number) => void;
  setPlaybackRate: (r: number) => void;
  togglePlay: () => void;
  seekTo: (t: number) => void;
  selectIssue: (id: string | null) => void;
  selectSegment: (id: string | null) => void;
  setHoverTime: (t: number | null) => void;
  setScrollOffset: (o: number) => void;
  reset: () => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 0.8,
  playbackRate: 1,
  selectedIssueId: null,
  selectedSegmentId: null,
  hoverTime: null,
  scrollOffset: 0,

  setPlaying: (p) => set({ isPlaying: p }),
  setCurrentTime: (t) => set({ currentTime: t }),
  setDuration: (d) => set({ duration: d }),
  setVolume: (v) => set({ volume: Math.max(0, Math.min(1, v)) }),
  setPlaybackRate: (r) => set({ playbackRate: Math.max(0.5, Math.min(2, r)) }),
  togglePlay: () => set({ isPlaying: !get().isPlaying }),
  seekTo: (t) => {
    const d = get().duration;
    set({ currentTime: Math.max(0, Math.min(d || t, t)) });
  },
  selectIssue: (id) => set({ selectedIssueId: id, selectedSegmentId: null }),
  selectSegment: (id) => set({ selectedSegmentId: id, selectedIssueId: null }),
  setHoverTime: (t) => set({ hoverTime: t }),
  setScrollOffset: (o) => set({ scrollOffset: o }),
  reset: () => set({
    isPlaying: false, currentTime: 0, duration: 0,
    playbackRate: 1, selectedIssueId: null,
    selectedSegmentId: null, hoverTime: null, scrollOffset: 0,
  }),
}));
