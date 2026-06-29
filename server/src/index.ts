import express from 'express';
import type { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import { env } from './lib/env';
import authRouter from './routes/auth';
import habitsRouter from './routes/habits';
import completionsRouter from './routes/completions';
import statsRouter from './routes/stats';
import journalRouter from './routes/journal';

const app = express();

app.use(
  cors({
    origin: env.corsOrigin === '*' ? true : env.corsOrigin.split(',').map((s) => s.trim()),
    credentials: true,
  }),
);
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'cadence-api' });
});

app.use('/auth', authRouter);
app.use('/api/habits', habitsRouter);
app.use('/api/habits', completionsRouter);
app.use('/api/stats', statsRouter);
app.use('/api/journal', journalRouter);

// 404
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Centralized error handler
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[error]', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(env.port, () => {
  console.log(`Cadence API listening on http://localhost:${env.port}`);
});
