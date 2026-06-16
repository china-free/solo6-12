import express from 'express';
import cors from 'cors';
import path from 'path';
import taskRoutes from './routes/tasks.js';
import { initializeDatabase } from './db/database.js';
import { seedMockData } from './db/seed.js';
import { ensureMockAudioFiles, AUDIO_DIR } from './db/mockAudio.js';
import db from './db/database.js';

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

initializeDatabase();
seedMockData();

const taskRows = db.prepare('SELECT id, audio_url, duration FROM tasks').all() as Array<{ id: string; audio_url: string; duration: number }>;
ensureMockAudioFiles(taskRows.map(r => ({ id: r.id, audioUrl: r.audio_url, duration: r.duration })));

app.use('/audio', express.static(AUDIO_DIR, {
  setHeaders: (res) => {
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cache-Control', 'public, max-age=86400');
  },
}));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api', taskRoutes);

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[API Error]', err);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

export default app;
