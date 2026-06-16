import { TaskRepository } from '../repositories/TaskRepository.js';
import { IssueRepository, HistoryRepository, UserRepository, SegmentRepository } from '../repositories/Repositories.js';
import type { Task, IssueMarker, HistoryRecord, AudioSegment, TaskQueryParams, StatsSummary, User } from '../../shared/types.js';

export const TaskService = {
  listTasks(params: TaskQueryParams = {}): Task[] {
    return TaskRepository.findAll(params);
  },

  getTaskDetail(id: string): (Task & { segments: AudioSegment[]; issues: IssueMarker[]; history: HistoryRecord[] }) | null {
    const task = TaskRepository.findById(id);
    if (!task) return null;
    return {
      ...task,
      segments: SegmentRepository.findByTaskId(id),
      issues: IssueRepository.findByTaskId(id),
      history: HistoryRepository.findByTaskId(id),
    };
  },

  createTask(data: Parameters<typeof TaskRepository.create>[0], operatorId: string, operatorName: string): Task {
    const task = TaskRepository.create(data);
    HistoryRepository.create({
      taskId: task.id, action: 'create',
      operatorId, operatorName,
      remark: '创建复检任务',
    });
    return task;
  },

  updateTask(id: string, data: Partial<Task>): Task | null {
    return TaskRepository.update(id, data);
  },

  assignReviewer(taskId: string, reviewerId: string, operatorId: string, operatorName: string): Task | null {
    const user = UserRepository.findById(reviewerId);
    if (!user) return null;
    const updated = TaskRepository.update(taskId, { reviewerId: user.id, reviewerName: user.name, status: 'reviewing' });
    if (updated) {
      HistoryRepository.create({
        taskId, action: 'assign', operatorId, operatorName,
        remark: `指派复检员: ${user.name}`,
        metadata: { reviewerId: user.id },
      });
    }
    return updated;
  },

  assignEditor(taskId: string, editorId: string, operatorId: string, operatorName: string): Task | null {
    const user = UserRepository.findById(editorId);
    if (!user) return null;
    const updated = TaskRepository.update(taskId, { editorId: user.id, editorName: user.name, status: 'reworking' });
    if (updated) {
      HistoryRepository.create({
        taskId, action: 'assign', operatorId, operatorName,
        remark: `派工给后期: ${user.name}`,
        metadata: { editorId: user.id },
      });
    }
    return updated;
  },

  submitRework(taskId: string, operatorId: string, operatorName: string, remark?: string): Task | null {
    const updated = TaskRepository.update(taskId, { status: 'resubmitted' });
    if (updated) {
      HistoryRepository.create({
        taskId, action: 'submit_rework', operatorId, operatorName,
        remark: remark || '提交返工完成',
      });
    }
    return updated;
  },

  reviewPass(taskId: string, operatorId: string, operatorName: string, remark?: string): Task | null {
    const updated = TaskRepository.update(taskId, { status: 'passed', unresolvedCount: 0 });
    if (updated) {
      HistoryRepository.create({
        taskId, action: 'review_pass', operatorId, operatorName,
        remark: remark || '复检通过',
      });
    }
    return updated;
  },

  reviewReject(taskId: string, operatorId: string, operatorName: string, remark?: string): Task | null {
    const updated = TaskRepository.update(taskId, { status: 'reworking' });
    if (updated) {
      HistoryRepository.create({
        taskId, action: 'review_reject', operatorId, operatorName,
        remark: remark || '复检未通过，需继续返工',
      });
    }
    return updated;
  },

  archiveTask(taskId: string, operatorId: string, operatorName: string): Task | null {
    const updated = TaskRepository.update(taskId, { status: 'archived' });
    if (updated) {
      HistoryRepository.create({
        taskId, action: 'archive', operatorId, operatorName,
        remark: '任务归档',
      });
    }
    return updated;
  },
};

export const IssueService = {
  listByTask(taskId: string): IssueMarker[] {
    return IssueRepository.findByTaskId(taskId);
  },

  create(taskId: string, data: Omit<Parameters<typeof IssueRepository.create>[0], 'taskId'> & { taskId?: string }, operatorId: string, operatorName: string): IssueMarker | null {
    const issue = IssueRepository.create({ ...data, taskId });
    TaskRepository.updateIssueCounts(taskId);
    HistoryRepository.create({
      taskId, action: 'mark_issue', operatorId, operatorName,
      remark: `标记问题[${data.type}]: ${data.description || '未填写'}`,
      metadata: { issueId: issue.id, timePoint: issue.timePoint },
    });
    return issue;
  },

  update(id: string, data: Partial<IssueMarker>): IssueMarker | null {
    const issue = IssueRepository.update(id, data);
    if (issue) TaskRepository.updateIssueCounts(issue.taskId);
    return issue;
  },

  delete(id: string): boolean {
    const issue = IssueRepository.findById(id);
    const ok = IssueRepository.delete(id);
    if (ok && issue) TaskRepository.updateIssueCounts(issue.taskId);
    return ok;
  },
};

export const StatsService = {
  getSummary(): StatsSummary {
    const tasks = TaskRepository.findAll();
    const summary: StatsSummary = {
      totalTasks: tasks.length,
      pending: 0, reviewing: 0, reworking: 0, passed: 0, archived: 0,
      totalIssues: 0, unresolvedIssues: 0,
      byIssueType: { stutter: 0, wrong_word: 0, long_pause: 0, noise: 0, breath: 0, tone: 0, other: 0 },
    };
    for (const t of tasks) {
      if (t.status in summary) (summary as any)[t.status]++;
      summary.totalIssues += t.issueCount;
      summary.unresolvedIssues += t.unresolvedCount;
    }
    const issueRows = await_all_issues();
    for (const row of issueRows) {
      if (row.type in summary.byIssueType) summary.byIssueType[row.type as keyof StatsSummary['byIssueType']]++;
    }
    return summary;
  },
};

import db from '../db/database.js';
function await_all_issues() {
  return db.prepare('SELECT type FROM issues').all() as { type: string }[];
}

export const UserService = {
  listAll(): User[] {
    return UserRepository.findAll();
  },
};

export const SegmentService = {
  listByTask(taskId: string): AudioSegment[] {
    return SegmentRepository.findByTaskId(taskId);
  },
};

export const HistoryService = {
  listByTask(taskId: string): HistoryRecord[] {
    return HistoryRepository.findByTaskId(taskId);
  },
};
