import express from 'express';
import cors from 'cors';
import taskRoutes from './routes/tasks.js';
import { initializeDatabase } from './db/database.js';
import { seedMockData } from './db/seed.js';

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

initializeDatabase();
seedMockData();

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api', taskRoutes);

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[API Error]', err);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

export default app;
