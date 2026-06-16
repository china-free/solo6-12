import { create } from 'zustand';
import { apiClient } from '../api/client';
import type { Task, StatsSummary, TaskQueryParams } from '../../shared/types.js';

interface TaskStore {
  tasks: Task[];
  stats: StatsSummary | null;
  filters: TaskQueryParams;
  loading: boolean;
  error: string | null;

  setFilters: (f: Partial<TaskQueryParams>) => void;
  resetFilters: () => void;
  fetchTasks: () => Promise<void>;
  fetchStats: () => Promise<void>;
  refreshAll: () => Promise<void>;
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],
  stats: null,
  filters: {},
  loading: false,
  error: null,

  setFilters: (f) => {
    set((state) => ({ filters: { ...state.filters, ...f } }));
    void get().fetchTasks();
  },

  resetFilters: () => {
    set({ filters: {} });
    void get().fetchTasks();
  },

  fetchTasks: async () => {
    set({ loading: true, error: null });
    try {
      const tasks = await apiClient.listTasks(get().filters);
      set({ tasks, loading: false });
    } catch (e: any) {
      set({ error: e.message || '加载任务失败', loading: false });
    }
  },

  fetchStats: async () => {
    try {
      const stats = await apiClient.getStats();
      set({ stats });
    } catch (e: any) {
      console.warn('fetch stats failed', e);
    }
  },

  refreshAll: async () => {
    await Promise.all([get().fetchTasks(), get().fetchStats()]);
  },
}));
