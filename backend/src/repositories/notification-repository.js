import { pool } from '../db/pool.js';

export const notificationRepository = {
  async listForUser(userId) {
    const [notifications, unreadCount] = await Promise.all([
      pool.query(
        `SELECT id, event_type AS "eventType", title, message, href,
                created_at AS "createdAt", read_at IS NOT NULL AS "isRead"
         FROM notifications
         WHERE recipient_id = $1
         ORDER BY created_at DESC
         LIMIT 20`,
        [userId],
      ),
      pool.query(
        'SELECT count(*)::int AS count FROM notifications WHERE recipient_id = $1 AND read_at IS NULL',
        [userId],
      ),
    ]);

    return { notifications: notifications.rows, unreadCount: unreadCount.rows[0].count };
  },

  async markRead(id, userId) {
    const result = await pool.query(
      `UPDATE notifications SET read_at = COALESCE(read_at, now())
       WHERE id = $1 AND recipient_id = $2
       RETURNING id`,
      [id, userId],
    );
    return result.rowCount > 0;
  },

  async markAllRead(userId) {
    const result = await pool.query(
      'UPDATE notifications SET read_at = now() WHERE recipient_id = $1 AND read_at IS NULL',
      [userId],
    );
    return result.rowCount;
  },
};
