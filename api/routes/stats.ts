import { Router } from 'express';
import { StatsService } from '../services/StatsService.js';

const router = Router();

router.get('/summary', (_req, res) => {
  res.json(StatsService.getSummary());
});

export default router;
