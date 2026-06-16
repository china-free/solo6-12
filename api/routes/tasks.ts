import { Router } from 'express';
import { TaskService, IssueService, StatsService, UserService, SegmentService, HistoryService } from '../services/Services.js';
import type { TaskQueryParams } from '../../shared/types.js';

const router = Router();

const DEFAULT_OPERATOR = { id: 'u-002', name: '王芳' };

function getOperator(req: any) {
  const rawName = req.headers['x-operator-name'] as string || DEFAULT_OPERATOR.name;
  return {
    id: req.headers['x-operator-id'] as string || DEFAULT_OPERATOR.id,
    name: decodeURIComponent(rawName),
  };
}

router.get('/stats/summary', (_req, res) => {
  res.json(StatsService.getSummary());
});

router.get('/users', (_req, res) => {
  res.json(UserService.listAll());
});

router.get('/tasks', (req, res) => {
  const params: TaskQueryParams = {};
  const q = req.query;
  if (q.status) params.status = q.status as any;
  if (q.priority) params.priority = q.priority as any;
  if (q.reviewerId) params.reviewerId = q.reviewerId as string;
  if (q.editorId) params.editorId = q.editorId as string;
  if (q.producerId) params.producerId = q.producerId as string;
  if (q.keyword) params.keyword = q.keyword as string;
  if (q.sortBy) params.sortBy = q.sortBy as any;
  if (q.sortOrder) params.sortOrder = q.sortOrder as any;
  res.json(TaskService.listTasks(params));
});

router.get('/tasks/:id', (req, res) => {
  const task = TaskService.getTaskDetail(req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  res.json(task);
});

router.post('/tasks', (req, res) => {
  const op = getOperator(req);
  const task = TaskService.createTask(req.body, op.id, op.name);
  res.status(201).json(task);
});

router.patch('/tasks/:id', (req, res) => {
  const task = TaskService.updateTask(req.params.id, req.body);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  res.json(task);
});

router.get('/tasks/:id/segments', (req, res) => {
  res.json(SegmentService.listByTask(req.params.id));
});

router.get('/tasks/:id/issues', (req, res) => {
  res.json(IssueService.listByTask(req.params.id));
});

router.post('/tasks/:id/issues', (req, res) => {
  const op = getOperator(req);
  const issue = IssueService.create(req.params.id, req.body, op.id, op.name);
  if (!issue) return res.status(400).json({ error: 'Failed to create issue' });
  res.status(201).json(issue);
});

router.put('/tasks/:id/issues/:issueId', (req, res) => {
  const issue = IssueService.update(req.params.issueId, req.body);
  if (!issue) return res.status(404).json({ error: 'Issue not found' });
  res.json(issue);
});

router.delete('/tasks/:id/issues/:issueId', (req, res) => {
  const ok = IssueService.delete(req.params.issueId);
  if (!ok) return res.status(404).json({ error: 'Issue not found' });
  res.json({ success: true });
});

router.post('/tasks/:id/assign', (req, res) => {
  const op = getOperator(req);
  const { reviewerId, editorId } = req.body;
  let task;
  if (editorId) {
    task = TaskService.assignEditor(req.params.id, editorId, op.id, op.name);
  } else if (reviewerId) {
    task = TaskService.assignReviewer(req.params.id, reviewerId, op.id, op.name);
  } else {
    return res.status(400).json({ error: 'reviewerId or editorId required' });
  }
  if (!task) return res.status(404).json({ error: 'Task not found or user invalid' });
  res.json(task);
});

router.post('/tasks/:id/review', (req, res) => {
  const op = getOperator(req);
  const { pass, remark } = req.body;
  let task;
  if (pass) {
    task = TaskService.reviewPass(req.params.id, op.id, op.name, remark);
  } else {
    task = TaskService.reviewReject(req.params.id, op.id, op.name, remark);
  }
  if (!task) return res.status(404).json({ error: 'Task not found' });
  res.json(task);
});

router.post('/tasks/:id/submit-rework', (req, res) => {
  const op = getOperator(req);
  const task = TaskService.submitRework(req.params.id, op.id, op.name, req.body?.remark);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  res.json(task);
});

router.post('/tasks/:id/archive', (req, res) => {
  const op = getOperator(req);
  const task = TaskService.archiveTask(req.params.id, op.id, op.name);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  res.json(task);
});

router.get('/tasks/:id/history', (req, res) => {
  res.json(HistoryService.listByTask(req.params.id));
});

export default router;
