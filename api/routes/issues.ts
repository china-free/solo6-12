import { Router } from 'express';
import { IssueService } from '../services/IssueService.js';
import { getOperator } from '../middleware/operator.js';

const router = Router();

router.get('/tasks/:taskId/issues', (req, res) => {
  res.json(IssueService.listByTask(req.params.taskId));
});

router.post('/tasks/:taskId/issues', (req, res) => {
  const op = getOperator(req);
  const issue = IssueService.create(req.params.taskId, req.body, op.id, op.name);
  if (!issue) return res.status(400).json({ error: 'Failed to create issue' });
  res.status(201).json(issue);
});

router.put('/tasks/:taskId/issues/:issueId', (req, res) => {
  const issue = IssueService.update(req.params.issueId, req.body);
  if (!issue) return res.status(404).json({ error: 'Issue not found' });
  res.json(issue);
});

router.delete('/tasks/:taskId/issues/:issueId', (req, res) => {
  const op = getOperator(req);
  const ok = IssueService.delete(req.params.issueId, op.id, op.name);
  if (!ok) return res.status(404).json({ error: 'Issue not found' });
  res.json({ success: true });
});

export default router;
