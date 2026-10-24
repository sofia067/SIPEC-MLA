import cookieParser from 'cookie-parser';
import express from 'express';
import helmet from 'helmet';
import { env } from './config/env.js';
import { pool } from './db/pool.js';
import { AppError } from './errors/app-error.js';
import { errorHandler, notFoundHandler } from './middleware/error-handler.js';
import { createAuthRouter } from './routes/auth-routes.js';
import { createModuleRouter } from './routes/module-routes.js';
import { createPublicApplicationRouter } from './routes/public-application-routes.js';
import { createRequestRouter } from './routes/request-routes.js';

export const app = express();

app.disable('x-powered-by');
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
app.use('/api', createPublicApplicationRouter());
app.use('/api', createRequestRouter());
app.use('/api', createModuleRouter());
app.use('/api', notFoundHandler);
app.use(errorHandler);
