import db from './database.js';
import { v4 as uuidv4 } from 'uuid';
import type { User, Task, AudioSegment, IssueMarker, HistoryRecord, TaskStatus, IssueType } from '../../shared/types.js';

const USERS: User[] = [
  { id: 'u-001', name: '李明', role: 'producer' },
  { id: 'u-002', name: '王芳', role: 'reviewer' },
  { id: 'u-003', name: '张伟', role: 'reviewer' },
  { id: 'u-004', name: '刘静', role: 'editor' },
  { id: 'u-005', name: '陈昊', role: 'editor' },
];

const TASK_TEMPLATES: Array<{ title: string; duration: number; status: TaskStatus; priority: 'normal' | 'urgent' }> = [
  { title: '618促销口播-产品A-主播小雨', duration: 186, status: 'pending', priority: 'urgent' },
  { title: '新品发布会开场-主播阿杰', duration: 243, status: 'reviewing', priority: 'urgent' },
  { title: '品牌故事系列第3期', duration: 312, status: 'reworking', priority: 'normal' },
  { title: '双11预热视频配音', duration: 128, status: 'resubmitted', priority: 'urgent' },
  { title: '课程介绍-商务英语', duration: 428, status: 'passed', priority: 'normal' },
  { title: '年度总结会议录音', duration: 856, status: 'archived', priority: 'normal' },
  { title: '小红书种草-美妆类', duration: 95, status: 'pending', priority: 'normal' },
  { title: '企业宣传片旁白', duration: 267, status: 'reviewing', priority: 'normal' },
  { title: '有声书-第一章', duration: 1245, status: 'pending', priority: 'normal' },
  { title: '直播回放剪辑-精华版', duration: 389, status: 'reworking', priority: 'urgent' },
  { title: '播客访谈节目EP12', duration: 2156, status: 'passed', priority: 'normal' },
  { title: '产品使用教程视频', duration: 534, status: 'reviewing', priority: 'normal' },
  { title: '公司年报解读', duration: 612, status: 'pending', priority: 'urgent' },
  { title: '方言版-地方特色美食', duration: 178, status: 'resubmitted', priority: 'normal' },
  { title: '儿童故事-睡前系列', duration: 287, status: 'archived', priority: 'normal' },
];

const SEGMENT_LABELS = [
  '开场问候', '产品介绍', '核心卖点', '使用场景', '优惠信息', '号召行动',
  '结尾祝福', '品牌slogan', '嘉宾介绍', '话题引入', '故事背景', '总结回顾',
];

const ISSUE_TEMPLATES: Array<{ type: IssueType; desc: string }> = [
  { type: 'stutter', desc: '此处重复说了两遍非常' },
  { type: 'wrong_word', desc: '角色读成了角涩' },
  { type: 'long_pause', desc: '停顿超过3秒，建议剪短' },
  { type: 'noise', desc: '有键盘敲击声' },
  { type: 'breath', desc: '明显的呼吸喷麦' },
  { type: 'tone', desc: '语调平淡，缺少起伏' },
  { type: 'stutter', desc: '卡壳重复这个产品' },
  { type: 'wrong_word', desc: '价格数字读错：999读成了9999' },
];

function randomOf<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function formatDateTime(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() - offsetDays);
  const hour = Math.floor(Math.random() * 10) + 8;
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

export function seedMockData(): void {
  const userCount = db.prepare('SELECT COUNT(*) as cnt FROM users').get() as { cnt: number };
  if (userCount.cnt > 0) return;

  const insertUser = db.prepare('INSERT INTO users (id, name, role, avatar) VALUES (?, ?, ?, ?)');
  const insertTask = db.prepare(
    'INSERT INTO tasks (id, title, audio_url, duration, status, priority, producer_id, producer_name, reviewer_id, reviewer_name, editor_id, editor_name, issue_count, unresolved_count, created_at, deadline) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  );
  const insertSegment = db.prepare(
    'INSERT INTO segments (id, task_id, start_time, end_time, label, script) VALUES (?, ?, ?, ?, ?, ?)'
  );
  const insertIssue = db.prepare(
    'INSERT INTO issues (id, task_id, segment_id, time_point, duration, type, severity, description, created_by, created_at, resolved_by, resolved_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  );
  const insertHistory = db.prepare(
    'INSERT INTO history_records (id, task_id, action, operator_id, operator_name, timestamp, remark, metadata) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  );

  const tx = db.transaction(() => {
    for (const u of USERS) {
      insertUser.run(u.id, u.name, u.role, null);
    }

    for (let idx = 0; idx < TASK_TEMPLATES.length; idx++) {
      const tpl = TASK_TEMPLATES[idx];
      const taskId = 't-' + String(idx + 1).padStart(3, '0');
      const producer = USERS[0];
      const reviewer = (tpl.status !== 'pending' && tpl.status !== 'archived')
        ? randomOf(USERS.filter(u => u.role === 'reviewer'))
        : null;
      const editor = (['reworking', 'resubmitted', 'passed', 'archived'].indexOf(tpl.status) !== -1)
        ? randomOf(USERS.filter(u => u.role === 'editor'))
        : null;

      const createdAt = formatDateTime(idx);
      const deadline = new Date(new Date(createdAt).getTime() + 3 * 24 * 3600 * 1000).toISOString();
      const issueCount = Math.floor(Math.random() * 8);
      const unresolvedCount = (tpl.status === 'passed' || tpl.status === 'archived') ? 0 : issueCount;

      insertTask.run(
        taskId, tpl.title, '/audio/mock-audio-' + (idx + 1) + '.wav', tpl.duration, tpl.status, tpl.priority,
        producer.id, producer.name,
        reviewer ? reviewer.id : null, reviewer ? reviewer.name : null,
        editor ? editor.id : null, editor ? editor.name : null,
        issueCount, unresolvedCount, createdAt, deadline
      );

      const segCount = 4 + Math.floor(Math.random() * 5);
      const segDuration = tpl.duration / segCount;
      const segments: AudioSegment[] = [];
      for (let s = 0; s < segCount; s++) {
        const segId = 'seg-' + taskId + '-' + s;
        const startTime = s * segDuration;
        const endTime = (s + 1) * segDuration;
        const label = SEGMENT_LABELS[s % SEGMENT_LABELS.length];
        const scriptText = '这是' + label + '部分的参考文稿内容';
        insertSegment.run(segId, taskId, startTime, endTime, label, scriptText);
        segments.push({ id: segId, taskId, startTime, endTime, label });
      }

      for (let i = 0; i < issueCount; i++) {
        const issueId = 'iss-' + taskId + '-' + i;
        const seg = randomOf(segments);
        const tpl2 = randomOf(ISSUE_TEMPLATES);
        const timePoint = seg.startTime + Math.random() * (seg.endTime - seg.startTime);
        const sev = randomOf(['low', 'medium', 'high'] as const);
        const createdBy = reviewer || USERS[1];
        const resolved = (tpl.status === 'passed' || tpl.status === 'archived');
        insertIssue.run(
          issueId, taskId, seg.id, timePoint, 1.5 + Math.random() * 2,
          tpl2.type, sev, tpl2.desc,
          createdBy.id, formatDateTime(idx - 1),
          resolved ? (editor ? editor.id : USERS[4].id) : null,
          resolved ? formatDateTime(Math.max(0, idx - 0.5)) : null
        );
      }

      insertHistory.run(uuidv4(), taskId, 'create', producer.id, producer.name, createdAt, '创建复检任务', JSON.stringify({ source: 'system' }));
      if (reviewer) {
        insertHistory.run(uuidv4(), taskId, 'assign', producer.id, producer.name,
          new Date(new Date(createdAt).getTime() + 3600000).toISOString(),
          '指派给' + reviewer.name, JSON.stringify({ reviewerId: reviewer.id }));
      }
      const needsIssueHistory = tpl.status === 'reviewing' || tpl.status === 'reworking' || tpl.status === 'resubmitted' || tpl.status === 'passed' || tpl.status === 'archived';
      if (needsIssueHistory) {
        insertHistory.run(uuidv4(), taskId, 'mark_issue', (reviewer || USERS[1]).id, (reviewer || USERS[1]).name,
          new Date(new Date(createdAt).getTime() + 4 * 3600000).toISOString(),
          '标记' + issueCount + '个问题', JSON.stringify({ issueCount }));
      }
      if (editor && ['reworking', 'resubmitted', 'passed', 'archived'].indexOf(tpl.status) !== -1) {
        insertHistory.run(uuidv4(), taskId, 'assign', (reviewer || USERS[1]).id, (reviewer || USERS[1]).name,
          new Date(new Date(createdAt).getTime() + 6 * 3600000).toISOString(),
          '派工给' + editor.name, JSON.stringify({ editorId: editor.id }));
      }
      if (['resubmitted', 'passed', 'archived'].indexOf(tpl.status) !== -1) {
        insertHistory.run(uuidv4(), taskId, 'submit_rework', editor!.id, editor!.name,
          new Date(new Date(createdAt).getTime() + 24 * 3600000).toISOString(),
          '完成返工修改', JSON.stringify({ version: 2 }));
      }
      if (tpl.status === 'passed' || tpl.status === 'archived') {
        insertHistory.run(uuidv4(), taskId, 'review_pass', (reviewer || USERS[1]).id, (reviewer || USERS[1]).name,
          new Date(new Date(createdAt).getTime() + 26 * 3600000).toISOString(),
          '复检通过', null);
      }
      if (tpl.status === 'archived') {
        insertHistory.run(uuidv4(), taskId, 'archive', producer.id, producer.name,
          new Date(new Date(createdAt).getTime() + 50 * 3600000).toISOString(),
          '归档任务', null);
      }
    }
  });

  tx();
  console.log('[DB] Mock data seeded successfully');
}
