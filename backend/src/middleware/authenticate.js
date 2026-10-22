import { authService } from '../services/auth-service.js';

export async function authenticate(req, res, next) {
  try {
    req.user = await authService.getUserFromToken(req.cookies.sipec_session);
    if (!req.user) {
      return res.status(401).json({
        error: { code: 'UNAUTHENTICATED', message: 'Inicia sesión para continuar.' },
      });
    }
    return next();
  } catch (error) {
    return next(error);
  }
}
