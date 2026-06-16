import { create } from 'zustand';
import { apiClient } from '../api/client';
import type { Task, IssueMarker, AudioSegment, HistoryRecord } from '../../shared/types.js';

type TaskDetail = (Task & { segments: AudioSegment[]; issues: IssueMarker[]; history: HistoryRecord[] }) | null;

interface TaskDetailStore {
  currentTaskId: string | null;
  currentTask: TaskDetail;
  loading: boolean;
  error: string | null;

  setCurrentTaskId: (id: string | null) => void;
  fetchTaskDetail: (id: string) => Promise<void>;
  clearCurrentTask: () => void;

  createIssue: (taskId: string, data: Partial<IssueMarker> & { timePoint: number; type: IssueMarker['type'] }) => Promise<void>;
  updateIssue: (taskId: string, issueId: string, data: Partial<IssueMarker>) => Promise<void>;
  deleteIssue: (taskId: string, issueId: string) => Promise<void>;

  assignEditor: (taskId: string, editorId: string) => Promise<void>;
  assignReviewer: (taskId: string, reviewerId: string) => Promise<void>;
  submitReview: (taskId: string, pass: boolean, remark?: string) => Promise<void>;
  submitRework: (taskId: string, remark?: string) => Promise<void>;
  archiveTask: (taskId: string) => Promise<void>;
}

export const useTaskDetailStore = create<TaskDetailStore>((set, get) => ({
  currentTaskId: null,
  currentTask: null,
  loading: false,
  error: null,

  setCurrentTaskId: (id) => set({ currentTaskId: id }),

  fetchTaskDetail: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const task = await apiClient.getTaskDetail(id);
      set({ currentTask: task, currentTaskId: id, loading: false });
    } catch (e: any) {
      set({ error: e.message || '加载任务详情失败', loading: false });
    }
  },

  clearCurrentTask: () => {
    set({ currentTask: null, currentTaskId: null, loading: false, error: null });
  },

  createIssue: async (taskId, data) => {
    await apiClient.createIssue(taskId, { ...data, createdBy: 'u-002' });
    const currentId = get().currentTaskId;
    if (currentId === taskId) {
      await get().fetchTaskDetail(taskId);
    }
  },

  updateIssue: async (taskId, issueId, data) => {
    await apiClient.updateIssue(taskId, issueId, data);
    const currentId = get().currentTaskId;
    if (currentId === taskId) {
      await get().fetchTaskDetail(taskId);
    }
  },

  deleteIssue: async (taskId, issueId) => {
    await apiClient.deleteIssue(taskId, issueId);
    const currentId = get().currentTaskId;
    if (currentId === taskId) {
      await get().fetchTaskDetail(taskId);
    }
  },

  assignEditor: async (taskId, editorId) => {
    await apiClient.assignTask(taskId, { editorId });
    const currentId = get().currentTaskId;
    if (currentId === taskId) {
      await get().fetchTaskDetail(taskId);
    }
  },

  assignReviewer: async (taskId, reviewerId) => {
    await apiClient.assignTask(taskId, { reviewerId });
    const currentId = get().currentTaskId;
    if (currentId === taskId) {
      await get().fetchTaskDetail(taskId);
    }
  },

  submitReview: async (taskId, pass, remark) => {
    await apiClient.submitReview(taskId, { pass, remark });
    const currentId = get().currentTaskId;
    if (currentId === taskId) {
      await get().fetchTaskDetail(taskId);
    }
  },

  submitRework: async (taskId, remark) => {
    await apiClient.submitRework(taskId, remark);
    const currentId = get().currentTaskId;
    if (currentId === taskId) {
      await get().fetchTaskDetail(taskId);
    }
  },

  archiveTask: async (taskId) => {
    await apiClient.archiveTask(taskId);
    const currentId = get().currentTaskId;
    if (currentId === taskId) {
      await get().fetchTaskDetail(taskId);
    }
  },
}));
