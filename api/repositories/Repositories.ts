import db from '../db/database.js';
import { v4 as uuid } from 'uuid';
import type { AudioSegment, IssueMarker, HistoryRecord, User } from '../../shared/types.js';

export const SegmentRepository = {
  findByTaskId(taskId: string): AudioSegment[] {
    const rows = db.prepare('SELECT * FROM segments WHERE task_id = ? ORDER BY start_time ASC').all(taskId) as any[];
    return rows.map(r => ({
      id: r.id, taskId: r.task_id,
      startTime: r.start_time, endTime: r.end_time,
      label: r.label, script: r.script,
    }));
  },
};

export const IssueRepository = {
  findByTaskId(taskId: string): IssueMarker[] {
    const rows = db.prepare('SELECT * FROM issues WHERE task_id = ? ORDER BY time_point ASC').all(taskId) as any[];
    return rows.map(r => ({
      id: r.id, taskId: r.task_id, segmentId: r.segment_id || undefined,
      timePoint: r.time_point, duration: r.duration || undefined,
      type: r.type, severity: r.severity, description: r.description,
      createdAt: r.created_at, createdBy: r.created_by,
      resolvedAt: r.resolved_at || undefined, resolvedBy: r.resolved_by || undefined,
    }));
  },

  findById(id: string): IssueMarker | null {
    const r = db.prepare('SELECT * FROM issues WHERE id = ?').get(id) as any;
    if (!r) return null;
    return {
      id: r.id, taskId: r.task_id, segmentId: r.segment_id || undefined,
      timePoint: r.time_point, duration: r.duration || undefined,
      type: r.type, severity: r.severity, description: r.description,
      createdAt: r.created_at, createdBy: r.created_by,
      resolvedAt: r.resolved_at || undefined, resolvedBy: r.resolved_by || undefined,
    };
  },

  create(data: Partial<IssueMarker> & { taskId: string; timePoint: number; type: IssueMarker['type']; createdBy: string }): IssueMarker {
    const id = data.id || uuid();
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO issues (id, task_id, segment_id, time_point, duration, type, severity, description, created_by, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, data.taskId, data.segmentId || null,
      data.timePoint, data.duration || null,
      data.type, data.severity || 'medium',
      data.description || '', data.createdBy, now
    );
    return IssueRepository.findById(id)!;
  },

  update(id: string, data: Partial<IssueMarker>): IssueMarker | null {
    const r = IssueRepository.findById(id);
    if (!r) return null;
    db.prepare(`
      UPDATE issues SET
        segment_id = ?, time_point = COALESCE(?, time_point),
        duration = ?, type = COALESCE(?, type), severity = COALESCE(?, severity),
        description = COALESCE(?, description), resolved_by = ?, resolved_at = ?
      WHERE id = ?
    `).run(
      data.segmentId !== undefined ? (data.segmentId || null) : undefined as unknown as null,
      data.timePoint ?? null,
      data.duration !== undefined ? (data.duration || null) : undefined as unknown as null,
      data.type ?? null, data.severity ?? null, data.description ?? null,
      data.resolvedBy !== undefined ? (data.resolvedBy || null) : undefined as unknown as null,
      data.resolvedAt !== undefined ? (data.resolvedAt || null) : undefined as unknown as null,
      id
    );
    return IssueRepository.findById(id);
  },

  delete(id: string): boolean {
    const info = db.prepare('DELETE FROM issues WHERE id = ?').run(id);
    return info.changes > 0;
  },
};

export const HistoryRepository = {
  findByTaskId(taskId: string): HistoryRecord[] {
    const rows = db.prepare('SELECT * FROM history_records WHERE task_id = ? ORDER BY timestamp ASC').all(taskId) as any[];
    return rows.map(r => ({
      id: r.id, taskId: r.task_id, action: r.action,
      operatorId: r.operator_id, operatorName: r.operator_name,
      timestamp: r.timestamp, remark: r.remark || undefined,
      metadata: r.metadata ? JSON.parse(r.metadata) : undefined,
    }));
  },

  create(data: Partial<HistoryRecord> & { taskId: string; action: HistoryRecord['action']; operatorId: string; operatorName: string }): HistoryRecord {
    const id = data.id || uuid();
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO history_records (id, task_id, action, operator_id, operator_name, timestamp, remark, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, data.taskId, data.action, data.operatorId, data.operatorName,
      data.timestamp || now, data.remark || null,
      data.metadata ? JSON.stringify(data.metadata) : null
    );
    return {
      id, taskId: data.taskId, action: data.action,
      operatorId: data.operatorId, operatorName: data.operatorName,
      timestamp: data.timestamp || now, remark: data.remark, metadata: data.metadata,
    };
  },
};

export const UserRepository = {
  findAll(): User[] {
    const rows = db.prepare('SELECT * FROM users ORDER BY role, name').all() as any[];
    return rows.map(r => ({ id: r.id, name: r.name, role: r.role, avatar: r.avatar || undefined }));
  },
  findById(id: string): User | null {
    const r = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as any;
    return r ? { id: r.id, name: r.name, role: r.role, avatar: r.avatar || undefined } : null;
  },
};
