import { Router } from 'express';
import { HistoryService } from '../services/HistoryService.js';

const router = Router();

router.get('/tasks/:taskId/history', (req, res) => {
  res.json(HistoryService.listByTask(req.params.taskId));
});

export default router;
