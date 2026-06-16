import db from '../db/database.js';
import { v4 as uuid } from 'uuid';
import type { Task, TaskQueryParams, TaskStatus } from '../../shared/types.js';

interface TaskRow {
  id: string;
  title: string;
  audio_url: string;
  duration: number;
  status: TaskStatus;
  priority: 'normal' | 'urgent';
  producer_id: string;
  producer_name: string;
  reviewer_id?: string;
  reviewer_name?: string;
  editor_id?: string;
  editor_name?: string;
  issue_count: number;
  unresolved_count: number;
  created_at: string;
  deadline?: string;
}

function rowToTask(row: TaskRow): Task {
  return {
    id: row.id,
    title: row.title,
    audioUrl: row.audio_url,
    duration: row.duration,
    status: row.status,
    priority: row.priority,
    producerId: row.producer_id,
    producerName: row.producer_name,
    reviewerId: row.reviewer_id,
    reviewerName: row.reviewer_name,
    editorId: row.editor_id,
    editorName: row.editor_name,
    issueCount: row.issue_count,
    unresolvedCount: row.unresolved_count,
    createdAt: row.created_at,
    deadline: row.deadline,
  };
}

export const TaskRepository = {
  findAll(params: TaskQueryParams = {}): Task[] {
    let sql = 'SELECT * FROM tasks WHERE 1=1';
    const args: unknown[] = [];

    if (params.status) { sql += ' AND status = ?'; args.push(params.status); }
    if (params.priority) { sql += ' AND priority = ?'; args.push(params.priority); }
    if (params.reviewerId) { sql += ' AND reviewer_id = ?'; args.push(params.reviewerId); }
    if (params.editorId) { sql += ' AND editor_id = ?'; args.push(params.editorId); }
    if (params.producerId) { sql += ' AND producer_id = ?'; args.push(params.producerId); }
    if (params.keyword) { sql += ' AND title LIKE ?'; args.push(`%${params.keyword}%`); }

    const sortBy = params.sortBy || 'createdAt';
    const sortOrder = params.sortOrder || 'desc';
    const colMap: Record<string, string> = { createdAt: 'created_at', deadline: 'deadline', priority: 'priority' };
    sql += ` ORDER BY priority = 'urgent' DESC, ${colMap[sortBy] || 'created_at'} ${sortOrder.toUpperCase()}`;

    const rows = db.prepare(sql).all(...args) as TaskRow[];
    return rows.map(rowToTask);
  },

  findById(id: string): Task | null {
    const row = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as TaskRow | undefined;
    return row ? rowToTask(row) : null;
  },

  create(data: Partial<Task> & { title: string; audioUrl: string; duration: number; producerId: string; producerName: string }): Task {
    const id = data.id || uuid();
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO tasks (id, title, audio_url, duration, status, priority, producer_id, producer_name, reviewer_id, reviewer_name, editor_id, editor_name, issue_count, unresolved_count, created_at, deadline)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, data.title, data.audioUrl, data.duration,
      data.status || 'pending', data.priority || 'normal',
      data.producerId, data.producerName,
      data.reviewerId || null, data.reviewerName || null,
      data.editorId || null, data.editorName || null,
      0, 0, data.createdAt || now, data.deadline || null
    );
    return TaskRepository.findById(id)!;
  },

  update(id: string, data: Partial<Task>): Task | null {
    const existing = TaskRepository.findById(id);
    if (!existing) return null;
    const merged = { ...existing, ...data };
    db.prepare(`
      UPDATE tasks SET
        title = COALESCE(?, title),
        status = COALESCE(?, status),
        priority = COALESCE(?, priority),
        reviewer_id = ?, reviewer_name = ?,
        editor_id = ?, editor_name = ?,
        issue_count = COALESCE(?, issue_count),
        unresolved_count = COALESCE(?, unresolved_count),
        deadline = ?
      WHERE id = ?
    `).run(
      data.title ?? null, data.status ?? null, data.priority ?? null,
      data.reviewerId !== undefined ? (data.reviewerId || null) : undefined as unknown as null,
      data.reviewerName !== undefined ? (data.reviewerName || null) : undefined as unknown as null,
      data.editorId !== undefined ? (data.editorId || null) : undefined as unknown as null,
      data.editorName !== undefined ? (data.editorName || null) : undefined as unknown as null,
      data.issueCount ?? null, data.unresolvedCount ?? null,
      data.deadline !== undefined ? (data.deadline || null) : undefined as unknown as null,
      id
    );
    return TaskRepository.findById(id);
  },

  updateIssueCounts(id: string): void {
    const result = db.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN resolved_at IS NULL THEN 1 ELSE 0 END) as unresolved
      FROM issues WHERE task_id = ?
    `).get(id) as { total: number; unresolved: number } | undefined;
    db.prepare('UPDATE tasks SET issue_count = ?, unresolved_count = ? WHERE id = ?')
      .run(result?.total || 0, result?.unresolved || 0, id);
  },
};
