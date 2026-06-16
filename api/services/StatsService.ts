import { TaskRepository } from '../repositories/TaskRepository.js';
import db from '../db/database.js';
import type { StatsSummary } from '../../shared/types.js';

export const StatsService = {
  getSummary(): StatsSummary {
    const tasks = TaskRepository.findAll();
    const summary: StatsSummary = {
      totalTasks: tasks.length,
      pending: 0,
      reviewing: 0,
      reworking: 0,
      passed: 0,
      archived: 0,
      resubmitted: 0,
      totalIssues: 0,
      unresolvedIssues: 0,
      byIssueType: {
        stutter: 0,
        wrong_word: 0,
        long_pause: 0,
        noise: 0,
        breath: 0,
        tone: 0,
        other: 0,
      },
    };
    for (const t of tasks) {
      if (t.status in summary) {
        (summary as any)[t.status]++;
      }
      summary.totalIssues += t.issueCount;
      summary.unresolvedIssues += t.unresolvedCount;
    }
    const issueRows = db.prepare('SELECT type FROM issues').all() as { type: string }[];
    for (const row of issueRows) {
      if (row.type in summary.byIssueType) {
        summary.byIssueType[row.type as keyof StatsSummary['byIssueType']]++;
      }
    }
    return summary;
  },
};
