import { SegmentRepository } from '../repositories/Repositories.js';
import type { AudioSegment } from '../../shared/types.js';

export const SegmentService = {
  listByTask(taskId: string): AudioSegment[] {
    return SegmentRepository.findByTaskId(taskId);
  },
};
