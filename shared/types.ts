export type TaskStatus = 'pending' | 'reviewing' | 'reworking' | 'resubmitted' | 'passed' | 'archived';

export type IssueType = 'stutter' | 'wrong_word' | 'long_pause' | 'noise' | 'breath' | 'tone' | 'other';

export type UserRole = 'producer' | 'reviewer' | 'editor';

export type Severity = 'low' | 'medium' | 'high';

export type HistoryAction = 'create' | 'mark_issue' | 'assign' | 'submit_rework' | 'review_pass' | 'review_reject' | 'archive';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatar?: string;
}

export interface AudioSegment {
  id: string;
  taskId: string;
  startTime: number;
  endTime: number;
  label: string;
  script?: string;
}

export interface IssueMarker {
  id: string;
  taskId: string;
  segmentId?: string;
  timePoint: number;
  duration?: number;
  type: IssueType;
  severity: Severity;
  description: string;
  createdAt: string;
  createdBy: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

export interface HistoryRecord {
  id: string;
  taskId: string;
  action: HistoryAction;
  operatorId: string;
  operatorName: string;
  timestamp: string;
  remark?: string;
  metadata?: Record<string, unknown>;
}

export interface Task {
  id: string;
  title: string;
  audioUrl: string;
  duration: number;
  status: TaskStatus;
  priority: 'normal' | 'urgent';
  producerId: string;
  producerName: string;
  reviewerId?: string;
  reviewerName?: string;
  editorId?: string;
  editorName?: string;
  issueCount: number;
  unresolvedCount: number;
  createdAt: string;
  deadline?: string;
  segments?: AudioSegment[];
  issues?: IssueMarker[];
  history?: HistoryRecord[];
}

export interface TaskQueryParams {
  status?: TaskStatus;
  priority?: 'normal' | 'urgent';
  reviewerId?: string;
  editorId?: string;
  producerId?: string;
  keyword?: string;
  sortBy?: 'createdAt' | 'deadline' | 'priority';
  sortOrder?: 'asc' | 'desc';
}

export interface StatsSummary {
  totalTasks: number;
  pending: number;
  reviewing: number;
  reworking: number;
  passed: number;
  archived: number;
  totalIssues: number;
  unresolvedIssues: number;
  byIssueType: Record<IssueType, number>;
}

export const TASK_STATUS_LABEL: Record<TaskStatus, string> = {
  pending: '待复检',
  reviewing: '复检中',
  reworking: '返工中',
  resubmitted: '待复核',
  passed: '已通过',
  archived: '已归档',
};

export const ISSUE_TYPE_LABEL: Record<IssueType, string> = {
  stutter: '卡顿重复',
  wrong_word: '读错字',
  long_pause: '停顿过长',
  noise: '背景杂音',
  breath: '呼吸声',
  tone: '语调问题',
  other: '其他',
};

export const ISSUE_TYPE_COLOR: Record<IssueType, string> = {
  stutter: '#F59E0B',
  wrong_word: '#EF4444',
  long_pause: '#8B5CF6',
  noise: '#EC4899',
  breath: '#06B6D4',
  tone: '#3B82F6',
  other: '#6B7280',
};

export const USER_ROLE_LABEL: Record<UserRole, string> = {
  producer: '制作人',
  reviewer: '复检员',
  editor: '后期编辑',
};

export const SEVERITY_LABEL: Record<Severity, string> = {
  low: '轻微',
  medium: '中等',
  high: '严重',
};
