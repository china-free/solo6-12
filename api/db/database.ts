import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, '../../data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'audio_review.db');

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initializeDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('producer','reviewer','editor')),
      avatar TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      audio_url TEXT NOT NULL,
      duration INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','reviewing','reworking','resubmitted','passed','archived')),
      priority TEXT NOT NULL DEFAULT 'normal' CHECK(priority IN ('normal','urgent')),
      producer_id TEXT NOT NULL REFERENCES users(id),
      producer_name TEXT NOT NULL,
      reviewer_id TEXT REFERENCES users(id),
      reviewer_name TEXT,
      editor_id TEXT REFERENCES users(id),
      editor_name TEXT,
      issue_count INTEGER NOT NULL DEFAULT 0,
      unresolved_count INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      deadline DATETIME
    );

    CREATE TABLE IF NOT EXISTS segments (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
      start_time REAL NOT NULL,
      end_time REAL NOT NULL,
      label TEXT NOT NULL,
      script TEXT
    );

    CREATE TABLE IF NOT EXISTS issues (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
      segment_id TEXT REFERENCES segments(id) ON DELETE SET NULL,
      time_point REAL NOT NULL,
      duration REAL,
      type TEXT NOT NULL CHECK(type IN ('stutter','wrong_word','long_pause','noise','breath','tone','other')),
      severity TEXT NOT NULL DEFAULT 'medium' CHECK(severity IN ('low','medium','high')),
      description TEXT,
      created_by TEXT NOT NULL REFERENCES users(id),
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      resolved_by TEXT REFERENCES users(id),
      resolved_at DATETIME
    );

    CREATE TABLE IF NOT EXISTS history_records (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
      action TEXT NOT NULL,
      operator_id TEXT NOT NULL REFERENCES users(id),
      operator_name TEXT NOT NULL,
      timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      remark TEXT,
      metadata TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
    CREATE INDEX IF NOT EXISTS idx_tasks_producer ON tasks(producer_id);
    CREATE INDEX IF NOT EXISTS idx_tasks_reviewer ON tasks(reviewer_id);
    CREATE INDEX IF NOT EXISTS idx_issues_task ON issues(task_id);
    CREATE INDEX IF NOT EXISTS idx_history_task ON history_records(task_id);
  `);
}

export default db;
