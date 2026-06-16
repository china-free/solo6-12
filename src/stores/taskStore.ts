import { create } from 'zustand';
import { apiClient } from '../api/client';
import type { Task, IssueMarker, StatsSummary, User, TaskQueryParams } from '../../shared/types.js';

interface TaskStore {
  tasks: Task[];
  currentTaskId: string | null;
  currentTask: (Task & { segments: any[]; issues: IssueMarker[]; history: any[] }) | null;
  stats: StatsSummary | null;
  users: User[];
  filters: TaskQueryParams;
  loading: boolean;
  error: string | null;

  setFilters: (f: Partial<TaskQueryParams>) => void;
  resetFilters: () => void;
  fetchTasks: () => Promise<void>;
  fetchStats: () => Promise<void>;
  fetchUsers: () => Promise<void>;
  fetchTaskDetail: (id: string) => Promise<void>;
  setCurrentTaskId: (id: string | null) => void;

  createIssue: (taskId: string, data: Partial<IssueMarker> & { timePoint: number; type: IssueMarker['type'] }) => Promise<void>;
  updateIssue: (taskId: string, issueId: string, data: Partial<IssueMarker>) => Promise<void>;
  deleteIssue: (taskId: string, issueId: string) => Promise<void>;

  assignEditor: (taskId: string, editorId: string) => Promise<void>;
  assignReviewer: (taskId: string, reviewerId: string) => Promise<void>;
  submitReview: (taskId: string, pass: boolean, remark?: string) => Promise<void>;
  submitRework: (taskId: string, remark?: string) => Promise<void>;
  archiveTask: (taskId: string) => Promise<void>;
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],
  currentTaskId: null,
  currentTask: null,
  stats: null,
  users: [],
  filters: {},
  loading: false,
  error: null,

  setFilters: (f) => {
    set(state => ({ filters: { ...state.filters, ...f } }));
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

  fetchUsers: async () => {
    try {
      const users = await apiClient.getUsers();
      set({ users });
    } catch (e: any) {
      console.warn('fetch users failed', e);
    }
  },

  fetchTaskDetail: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const task = await apiClient.getTaskDetail(id);
      set({ currentTask: task, currentTaskId: id, loading: false });
    } catch (e: any) {
      set({ error: e.message || '加载任务详情失败', loading: false });
    }
  },

  setCurrentTaskId: (id) => set({ currentTaskId: id }),

  createIssue: async (taskId, data) => {
    await apiClient.createIssue(taskId, { ...data, createdBy: 'u-002' });
    await Promise.all([get().fetchTasks(), get().fetchTaskDetail(taskId), get().fetchStats()]);
  },

  updateIssue: async (taskId, issueId, data) => {
    await apiClient.updateIssue(taskId, issueId, data);
    await Promise.all([get().fetchTasks(), get().fetchTaskDetail(taskId)]);
  },

  deleteIssue: async (taskId, issueId) => {
    await apiClient.deleteIssue(taskId, issueId);
    await Promise.all([get().fetchTasks(), get().fetchTaskDetail(taskId), get().fetchStats()]);
  },

  assignEditor: async (taskId, editorId) => {
    await apiClient.assignTask(taskId, { editorId });
    await Promise.all([get().fetchTasks(), get().fetchTaskDetail(taskId)]);
  },

  assignReviewer: async (taskId, reviewerId) => {
    await apiClient.assignTask(taskId, { reviewerId });
    await Promise.all([get().fetchTasks(), get().fetchTaskDetail(taskId)]);
  },

  submitReview: async (taskId, pass, remark) => {
    await apiClient.submitReview(taskId, { pass, remark });
    await Promise.all([get().fetchTasks(), get().fetchTaskDetail(taskId), get().fetchStats()]);
  },

  submitRework: async (taskId, remark) => {
    await apiClient.submitRework(taskId, remark);
    await Promise.all([get().fetchTasks(), get().fetchTaskDetail(taskId)]);
  },

  archiveTask: async (taskId) => {
    await apiClient.archiveTask(taskId);
    await Promise.all([get().fetchTasks(), get().fetchTaskDetail(taskId), get().fetchStats()]);
  },
}));
