import cookieParser from 'cookie-parser';
import express from 'express';
import { existsSync } from 'node:fs';
import helmet from 'helmet';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { env } from './config/env.js';
import { pool } from './db/pool.js';
import { AppError } from './errors/app-error.js';
import { errorHandler, notFoundHandler } from './middleware/error-handler.js';
import { withRequestContext } from './middleware/request-context.js';
import { createAuthRouter } from './routes/auth-routes.js';
import { createCandidateAuthRouter } from './routes/candidate-auth-routes.js';
import { createConvocationRouter } from './routes/convocation-routes.js';
import { createModuleRouter } from './routes/module-routes.js';
import { createPublicApplicationRouter } from './routes/public-application-routes.js';
import { createRequestRouter } from './routes/request-routes.js';

export const app = express();
const backendSourceDirectory = fileURLToPath(new URL('.', import.meta.url));
const frontendBuildDirectory = [
  resolve(backendSourceDirectory, '../../frontend/dist'),
  resolve(backendSourceDirectory, '../frontend/dist'),
].find((directory) => existsSync(directory)) ?? resolve(backendSourceDirectory, '../../frontend/dist');

app.disable('x-powered-by');
app.set('trust proxy', env.NODE_ENV === 'production' ? 1 : false);
app.use(helmet());
app.use(express.json({ limit: '32kb' }));
app.use(cookieParser());
app.use(withRequestContext);

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
app.use('/api/candidate-auth', createCandidateAuthRouter({ secureCookies: env.SESSION_COOKIE_SECURE === 'true' }));
app.use('/api', createConvocationRouter());
app.use('/api', createPublicApplicationRouter());
app.use('/api', createRequestRouter());
app.use('/api', createModuleRouter());
app.use('/api', notFoundHandler);

app.use(express.static(frontendBuildDirectory));
app.use((req, res, next) => {
  if (req.method !== 'GET' || !req.accepts('html')) return next();
  return res.sendFile(resolve(frontendBuildDirectory, 'index.html'), (error) => {
    if (error) next(error);
  });
});
app.use(notFoundHandler);
app.use(errorHandler);
