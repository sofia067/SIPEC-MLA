import { createHash, randomBytes } from 'node:crypto';
import { AppError } from '../errors/app-error.js';
import { authRepository } from '../repositories/auth-repository.js';
import { verifyPassword } from '../security/password.js';

const SESSION_DURATION_MS = 8 * 60 * 60 * 1000;
const hashToken = (token) => createHash('sha256').update(token).digest('hex');
const toPublicUser = ({ id, username, display_name, role, area_name }) => ({
  id,
  username,
  displayName: display_name,
  role,
  areaName: area_name,
});

export const authService = {
  async login(username, password, expectedRole) {
    const user = await authRepository.findUserByUsername(username);
    if (!(await verifyPassword(password, user?.password_hash)) || user.role !== expectedRole) {
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Usuario o contraseña incorrectos.');
    }

    const token = randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
    await authRepository.createSession(hashToken(token), user.id, expiresAt);
    return { token, expiresAt, user: toPublicUser(user) };
  },

  async getUserFromToken(token) {
    if (!token) return null;
    const user = await authRepository.findUserBySession(hashToken(token));
    return user ? toPublicUser(user) : null;
  },

  async logout(token) {
    if (token) await authRepository.deleteSession(hashToken(token));
  },
};
