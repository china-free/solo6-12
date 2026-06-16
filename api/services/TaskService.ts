import { TaskRepository } from '../repositories/TaskRepository.js';
import { IssueRepository, UserRepository, SegmentRepository, HistoryRepository } from '../repositories/Repositories.js';
import { eventBus } from '../events/eventBus.js';
import type { Task, IssueMarker, HistoryRecord, AudioSegment, TaskQueryParams } from '../../shared/types.js';

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

  createTask(
    data: Parameters<typeof TaskRepository.create>[0],
    operatorId: string,
    operatorName: string,
  ): Task {
    const task = TaskRepository.create(data);

    eventBus.emit({
      type: 'task.created',
      taskId: task.id,
      operatorId,
      operatorName,
      remark: '创建复检任务',
    });

    return task;
  },

  updateTask(id: string, data: Partial<Task>): Task | null {
    return TaskRepository.update(id, data);
  },

  assignReviewer(
    taskId: string,
    reviewerId: string,
    operatorId: string,
    operatorName: string,
  ): Task | null {
    const user = UserRepository.findById(reviewerId);
    if (!user) return null;

    const updated = TaskRepository.update(taskId, {
      reviewerId: user.id,
      reviewerName: user.name,
      status: 'reviewing',
    });

    if (updated) {
      eventBus.emit({
        type: 'task.assigned',
        taskId,
        operatorId,
        operatorName,
        remark: `指派复检员: ${user.name}`,
        metadata: { reviewerId: user.id },
      });
    }

    return updated;
  },

  assignEditor(
    taskId: string,
    editorId: string,
    operatorId: string,
    operatorName: string,
  ): Task | null {
    const user = UserRepository.findById(editorId);
    if (!user) return null;

    const updated = TaskRepository.update(taskId, {
      editorId: user.id,
      editorName: user.name,
      status: 'reworking',
    });

    if (updated) {
      eventBus.emit({
        type: 'task.assigned',
        taskId,
        operatorId,
        operatorName,
        remark: `派工给后期: ${user.name}`,
        metadata: { editorId: user.id },
      });
    }

    return updated;
  },

  submitRework(
    taskId: string,
    operatorId: string,
    operatorName: string,
    remark?: string,
  ): Task | null {
    const updated = TaskRepository.update(taskId, { status: 'resubmitted' });

    if (updated) {
      eventBus.emit({
        type: 'task.submit_rework',
        taskId,
        operatorId,
        operatorName,
        remark: remark || '提交返工完成',
      });
    }

    return updated;
  },

  reviewPass(
    taskId: string,
    operatorId: string,
    operatorName: string,
    remark?: string,
  ): Task | null {
    const updated = TaskRepository.update(taskId, {
      status: 'passed',
      unresolvedCount: 0,
    });

    if (updated) {
      eventBus.emit({
        type: 'task.review_pass',
        taskId,
        operatorId,
        operatorName,
        remark: remark || '复检通过',
      });
    }

    return updated;
  },

  reviewReject(
    taskId: string,
    operatorId: string,
    operatorName: string,
    remark?: string,
  ): Task | null {
    const updated = TaskRepository.update(taskId, { status: 'reworking' });

    if (updated) {
      eventBus.emit({
        type: 'task.review_reject',
        taskId,
        operatorId,
        operatorName,
        remark: remark || '复检未通过，需继续返工',
      });
    }

    return updated;
  },

  archiveTask(
    taskId: string,
    operatorId: string,
    operatorName: string,
  ): Task | null {
    const updated = TaskRepository.update(taskId, { status: 'archived' });

    if (updated) {
      eventBus.emit({
        type: 'task.archived',
        taskId,
        operatorId,
        operatorName,
        remark: '任务归档',
      });
    }

    return updated;
  },
};
