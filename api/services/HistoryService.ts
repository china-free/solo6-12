import { HistoryRepository } from '../repositories/Repositories.js';
import type { HistoryRecord } from '../../shared/types.js';

export const HistoryService = {
  listByTask(taskId: string): HistoryRecord[] {
    return HistoryRepository.findByTaskId(taskId);
  },
};
