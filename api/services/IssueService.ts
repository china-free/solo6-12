import { IssueRepository } from '../repositories/Repositories.js';
import { TaskRepository } from '../repositories/TaskRepository.js';
import { eventBus } from '../events/eventBus.js';
import type { IssueMarker } from '../../shared/types.js';

export const IssueService = {
  listByTask(taskId: string): IssueMarker[] {
    return IssueRepository.findByTaskId(taskId);
  },

  create(
    taskId: string,
    data: Omit<Parameters<typeof IssueRepository.create>[0], 'taskId'> & { taskId?: string },
    operatorId: string,
    operatorName: string,
  ): IssueMarker | null {
    const issue = IssueRepository.create({ ...data, taskId });
    TaskRepository.updateIssueCounts(taskId);

    eventBus.emit({
      type: 'issue.created',
      taskId,
      operatorId,
      operatorName,
      remark: `标记问题[${data.type}]: ${data.description || '未填写'}`,
      metadata: { issueId: issue.id, timePoint: issue.timePoint },
    });

    return issue;
  },

  update(id: string, data: Partial<IssueMarker>): IssueMarker | null {
    const issue = IssueRepository.update(id, data);
    if (issue) {
      TaskRepository.updateIssueCounts(issue.taskId);
    }
    return issue;
  },

  delete(id: string, operatorId: string, operatorName: string): boolean {
    const issue = IssueRepository.findById(id);
    const ok = IssueRepository.delete(id);
    if (ok && issue) {
      TaskRepository.updateIssueCounts(issue.taskId);

      eventBus.emit({
        type: 'issue.deleted',
        taskId: issue.taskId,
        operatorId,
        operatorName,
        remark: `删除问题[${issue.type}]: ${issue.description || '未填写'}`,
        metadata: { issueId: issue.id, timePoint: issue.timePoint },
      });
    }
    return ok;
  },
};
