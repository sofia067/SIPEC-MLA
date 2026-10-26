import cookieParser from 'cookie-parser';
import express from 'express';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import helmet from 'helmet';
import { env } from './config/env.js';
import { pool } from './db/pool.js';
import { AppError } from './errors/app-error.js';
import { errorHandler, notFoundHandler } from './middleware/error-handler.js';
import { createAuthRouter } from './routes/auth-routes.js';
import { createModuleRouter } from './routes/module-routes.js';
import { createRequestRouter } from './routes/request-routes.js';

export const app = express();

app.disable('x-powered-by');
if (env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}
app.use(helmet());
app.use(express.json({ limit: '32kb' }));
app.use(cookieParser());

app.get('/api/health/live', (req, res) => res.status(200).json({ status: 'ok' }));
app.get('/api/health/ready', async (req, res, next) => {
  try {
    await pool.query('SELECT 1');
    return res.status(200).json({ status: 'ready' });
  } catch (error) {
    return next(new AppError(503, 'DATABASE_UNAVAILABLE', 'La base de datos no está disponible.'));
  }
});

app.use('/api/auth', createAuthRouter({ secureCookies: env.SESSION_COOKIE_SECURE === 'true' }));
app.use('/api', createRequestRouter());
app.use('/api', createModuleRouter());
app.use('/api', notFoundHandler);
const frontendDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '../../frontend/dist');
if (existsSync(frontendDirectory)) {
  app.use(express.static(frontendDirectory));
  app.get(/.*/, (req, res) => res.sendFile(resolve(frontendDirectory, 'index.html')));
}
app.use(errorHandler);
