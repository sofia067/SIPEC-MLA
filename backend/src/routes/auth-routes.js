import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { z } from 'zod';
import { authenticate } from '../middleware/authenticate.js';
import { authService } from '../services/auth-service.js';

const loginSchema = z.object({
  username: z.string().trim().min(1).max(80),
  password: z.string().min(1).max(256),
  role: z.enum(['jefe', 'rrhh', 'admin']).transform((role) => ({
    jefe: 'area_manager',
    rrhh: 'hr_specialist',
    admin: 'admin',
  })[role]),
});
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    error: { code: 'LOGIN_RATE_LIMIT', message: 'Demasiados intentos. Espera unos minutos e intenta nuevamente.' },
  },
});
const cookieOptions = (secure, maxAge) => ({
  httpOnly: true,
  secure,
  sameSite: 'lax',
  path: '/',
  ...(maxAge ? { maxAge } : {}),
});

export function createAuthRouter({ secureCookies }) {
  const router = Router();

  router.post('/login', loginLimiter, async (req, res, next) => {
    try {
      const credentials = loginSchema.parse(req.body);
      const session = await authService.login(credentials.username, credentials.password, credentials.role);
      res.cookie('sipec_session', session.token, cookieOptions(secureCookies, session.expiresAt.getTime() - Date.now()));
      return res.json({ user: session.user });
    } catch (error) {
      return next(error);
    }
  });

  router.get('/me', authenticate, (req, res) => res.json({ user: req.user }));

  router.post('/logout', async (req, res, next) => {
    try {
      await authService.logout(req.cookies.sipec_session);
      res.clearCookie('sipec_session', cookieOptions(secureCookies));
      return res.status(204).end();
    } catch (error) {
      return next(error);
    }
  });

  return router;
}
