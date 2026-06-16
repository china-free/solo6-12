import type { Task, IssueMarker, AudioSegment, HistoryRecord, StatsSummary, User, TaskQueryParams } from '../../shared/types.js';

const BASE_URL = '/api';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(BASE_URL + path, {
    headers: {
      'Content-Type': 'application/json',
      'X-Operator-Id': 'u-002',
      'X-Operator-Name': '王芳',
      ...(options.headers || {}),
    },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export const apiClient = {
  getStats: () => request<StatsSummary>('/stats/summary'),
  getUsers: () => request<User[]>('/users'),

  listTasks: (params: TaskQueryParams = {}) => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') q.append(k, String(v));
    });
    const qs = q.toString();
    return request<Task[]>(`/tasks${qs ? '?' + qs : ''}`);
  },

  getTaskDetail: (id: string) => request<Task & { segments: AudioSegment[]; issues: IssueMarker[]; history: HistoryRecord[] }>(`/tasks/${id}`),

  createTask: (data: Partial<Task>) => request<Task>('/tasks', { method: 'POST', body: JSON.stringify(data) }),

  updateTask: (id: string, data: Partial<Task>) => request<Task>(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  listSegments: (taskId: string) => request<AudioSegment[]>(`/tasks/${taskId}/segments`),
  listIssues: (taskId: string) => request<IssueMarker[]>(`/tasks/${taskId}/issues`),

  createIssue: (taskId: string, data: Partial<IssueMarker> & { timePoint: number; type: IssueMarker['type']; createdBy: string }) =>
    request<IssueMarker>(`/tasks/${taskId}/issues`, { method: 'POST', body: JSON.stringify(data) }),

  updateIssue: (taskId: string, issueId: string, data: Partial<IssueMarker>) =>
    request<IssueMarker>(`/tasks/${taskId}/issues/${issueId}`, { method: 'PUT', body: JSON.stringify(data) }),

  deleteIssue: (taskId: string, issueId: string) =>
    request<{ success: boolean }>(`/tasks/${taskId}/issues/${issueId}`, { method: 'DELETE' }),

  assignTask: (taskId: string, data: { reviewerId?: string; editorId?: string }) =>
    request<Task>(`/tasks/${taskId}/assign`, { method: 'POST', body: JSON.stringify(data) }),

  submitReview: (taskId: string, data: { pass: boolean; remark?: string }) =>
    request<Task>(`/tasks/${taskId}/review`, { method: 'POST', body: JSON.stringify(data) }),

  submitRework: (taskId: string, remark?: string) =>
    request<Task>(`/tasks/${taskId}/submit-rework`, { method: 'POST', body: JSON.stringify({ remark }) }),

  archiveTask: (taskId: string) =>
    request<Task>(`/tasks/${taskId}/archive`, { method: 'POST' }),

  listHistory: (taskId: string) =>
    request<HistoryRecord[]>(`/tasks/${taskId}/history`),
};
