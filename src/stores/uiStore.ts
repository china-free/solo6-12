import { create } from 'zustand';

interface UiState {
  selectedIssueId: string | null;
  selectedSegmentId: string | null;
  hoverTime: number | null;
  scrollOffset: number;
  detailTab: 'info' | 'history';

  selectIssue: (id: string | null) => void;
  selectSegment: (id: string | null) => void;
  setHoverTime: (t: number | null) => void;
  setScrollOffset: (o: number) => void;
  setDetailTab: (tab: 'info' | 'history') => void;
}

export const useUiStore = create<UiState>((set) => ({
  selectedIssueId: null,
  selectedSegmentId: null,
  hoverTime: null,
  scrollOffset: 0,
  detailTab: 'info',

  selectIssue: (id) => set({ selectedIssueId: id, selectedSegmentId: null }),
  selectSegment: (id) => set({ selectedSegmentId: id, selectedIssueId: null }),
  setHoverTime: (t) => set({ hoverTime: t }),
  setScrollOffset: (o) => set({ scrollOffset: o }),
  setDetailTab: (tab) => set({ detailTab: tab }),
}));
