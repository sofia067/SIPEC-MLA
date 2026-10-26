import { pool } from '../db/pool.js';

export const authRepository = {
  async findUserByUsername(username) {
    const result = await pool.query(
      `SELECT id, username, display_name, role, password_hash, area_name
       FROM users
       WHERE lower(username) = lower($1) AND is_active = true`,
      [username],
    );
    return result.rows[0] ?? null;
  },

  async findUserBySession(tokenHash) {
    const result = await pool.query(
      `SELECT u.id, u.username, u.display_name, u.role, u.area_name
       FROM user_sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.token_hash = $1 AND s.expires_at > now() AND u.is_active = true`,
      [tokenHash],
    );
    return result.rows[0] ?? null;
  },

  async createSession(tokenHash, userId, expiresAt) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');
      await client.query('DELETE FROM user_sessions WHERE expires_at <= now()');
      await client.query(
        'INSERT INTO user_sessions (token_hash, user_id, expires_at) VALUES ($1, $2, $3)',
        [tokenHash, userId, expiresAt],
      );
      await client.query(
        `INSERT INTO audit_events (actor_id, event_type, resource_type, resource_id)
         VALUES ($1, 'auth.login', 'session', NULL)`,
        [userId],
      );
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  async deleteSession(tokenHash) {
    await pool.query('DELETE FROM user_sessions WHERE token_hash = $1', [tokenHash]);
  },
};
