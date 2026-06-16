import { Router } from 'express';
import { UserService } from '../services/UserService.js';

const router = Router();

router.get('/', (_req, res) => {
  res.json(UserService.listAll());
});

export default router;
