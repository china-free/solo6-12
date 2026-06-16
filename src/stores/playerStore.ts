import { create } from 'zustand';

type SeekFn = ((time: number) => void) | null;

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
  audioLoading: boolean;
  audioError: string | null;
  waveformData: Float32Array | null;

  _seekFn: SeekFn;

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
  setAudioLoading: (l: boolean) => void;
  setAudioError: (e: string | null) => void;
  setWaveformData: (d: Float32Array | null) => void;
  registerSeekFn: (fn: SeekFn) => void;
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
  audioLoading: false,
  audioError: null,
  waveformData: null,
  _seekFn: null,

  setPlaying: (p) => set({ isPlaying: p }),
  setCurrentTime: (t) => set({ currentTime: t }),
  setDuration: (d) => set({ duration: d }),
  setVolume: (v) => set({ volume: Math.max(0, Math.min(1, v)) }),
  setPlaybackRate: (r) => set({ playbackRate: Math.max(0.5, Math.min(2, r)) }),
  togglePlay: () => set({ isPlaying: !get().isPlaying }),
  seekTo: (t) => {
    const fn = get()._seekFn;
    if (fn) {
      fn(t);
    } else {
      const d = get().duration;
      set({ currentTime: Math.max(0, Math.min(d || t, t)) });
    }
  },
  selectIssue: (id) => set({ selectedIssueId: id, selectedSegmentId: null }),
  selectSegment: (id) => set({ selectedSegmentId: id, selectedIssueId: null }),
  setHoverTime: (t) => set({ hoverTime: t }),
  setScrollOffset: (o) => set({ scrollOffset: o }),
  setAudioLoading: (l) => set({ audioLoading: l }),
  setAudioError: (e) => set({ audioError: e }),
  setWaveformData: (d) => set({ waveformData: d }),
  registerSeekFn: (fn) => set({ _seekFn: fn }),
  reset: () => set({
    isPlaying: false, currentTime: 0, duration: 0,
    playbackRate: 1, selectedIssueId: null,
    selectedSegmentId: null, hoverTime: null, scrollOffset: 0,
    audioLoading: false, audioError: null, waveformData: null, _seekFn: null,
  }),
}));
