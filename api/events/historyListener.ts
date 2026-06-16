import { eventBus, type DomainEvent } from './eventBus.js';
import { HistoryRepository } from '../repositories/Repositories.js';

const ACTION_MAP: Record<string, string> = {
  'task.created': 'create',
  'task.assigned': 'assign',
  'task.review_pass': 'review_pass',
  'task.review_reject': 'review_reject',
  'task.submit_rework': 'submit_rework',
  'task.archived': 'archive',
  'issue.created': 'mark_issue',
  'issue.updated': 'update_issue',
  'issue.deleted': 'delete_issue',
};

export function setupHistoryListener(): void {
  eventBus.onAll((event: DomainEvent) => {
    const action = ACTION_MAP[event.type];
    if (!action) return;

    HistoryRepository.create({
      taskId: event.taskId,
      action: action as any,
      operatorId: event.operatorId,
      operatorName: event.operatorName,
      timestamp: event.timestamp,
      remark: event.remark,
      metadata: event.metadata,
    });
  });
}
