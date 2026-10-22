import { pool } from '../db/pool.js';
import { AppError } from '../errors/app-error.js';

export const requestRepository = {
  async create({ department, positionTitle, reason, requiredBy, userId }) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');
      const departmentResult = await client.query(
        `INSERT INTO departments (name) VALUES ($1)
         ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
         RETURNING id`,
        [department],
      );
      const positionResult = await client.query(
        `INSERT INTO position_profiles (department_id, title) VALUES ($1, $2)
         ON CONFLICT (department_id, title) DO UPDATE SET title = EXCLUDED.title
         RETURNING id`,
        [departmentResult.rows[0].id, positionTitle],
      );
      const sequenceResult = await client.query("SELECT nextval('coverage_request_code_seq') AS value");
      const code = `SC-${String(sequenceResult.rows[0].value).padStart(5, '0')}`;
      const requestResult = await client.query(
        `INSERT INTO coverage_requests
           (code, department_id, position_id, reason, required_by, requested_by)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, code, status, created_at`,
        [code, departmentResult.rows[0].id, positionResult.rows[0].id, reason, requiredBy, userId],
      );
      const request = requestResult.rows[0];
      await client.query(
        `INSERT INTO audit_events (actor_id, event_type, resource_type, resource_id, metadata)
         VALUES ($1, 'coverage_request.created', 'coverage_request', $2, $3)`,
        [userId, request.id, JSON.stringify({ code })],
      );
      await client.query('COMMIT');
      return request;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  async listRecent(limit = 10) {
    const result = await pool.query(
      `SELECT r.id, r.code, d.name AS department, p.title AS position_title,
              r.status, r.required_by, r.created_at, u.display_name AS requested_by
       FROM coverage_requests r
       JOIN departments d ON d.id = r.department_id
       JOIN position_profiles p ON p.id = r.position_id
       JOIN users u ON u.id = r.requested_by
       ORDER BY r.created_at DESC
       LIMIT $1`,
      [limit],
    );
    return result.rows;
  },

  async listAll() {
    const result = await pool.query(
      `SELECT r.id, r.code, r.department_id, r.position_id, d.name AS department,
              p.title AS position_title, r.reason, r.status, r.required_by, r.created_at,
              r.reviewed_at, u.display_name AS requested_by
       FROM coverage_requests r
       JOIN departments d ON d.id = r.department_id
       JOIN position_profiles p ON p.id = r.position_id
       JOIN users u ON u.id = r.requested_by
       ORDER BY r.created_at DESC`,
    );
    return result.rows;
  },

  async updateStatus(id, status, userId) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await client.query(
        `UPDATE coverage_requests SET status = $2, reviewed_by = $3, reviewed_at = now(), updated_at = now()
         WHERE id = $1 AND (
           (status = 'pending' AND $2 IN ('in_review', 'approved', 'rejected')) OR
           (status = 'in_review' AND $2 IN ('approved', 'rejected', 'pending'))
         )
         RETURNING id, code, status, updated_at`,
        [id, status, userId],
      );
      if (result.rowCount) {
        await client.query(
          `INSERT INTO audit_events (actor_id, event_type, resource_type, resource_id, metadata)
           VALUES ($1, 'coverage_request.status_changed', 'coverage_request', $2, $3)`,
          [userId, result.rows[0].id, JSON.stringify({ status })],
        );
      }
      await client.query('COMMIT');
      return result.rows[0] ?? null;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  async updatePending(id, { department, positionTitle, reason, requiredBy }, userId) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const departmentResult = await client.query(
        `INSERT INTO departments (name) VALUES ($1)
         ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id`,
        [department],
      );
      const positionResult = await client.query(
        `INSERT INTO position_profiles (department_id, title) VALUES ($1, $2)
         ON CONFLICT (department_id, title) DO UPDATE SET title = EXCLUDED.title RETURNING id`,
        [departmentResult.rows[0].id, positionTitle],
      );
      const result = await client.query(
        `UPDATE coverage_requests SET department_id = $2, position_id = $3, reason = $4,
           required_by = $5, updated_at = now()
         WHERE id = $1 AND status = 'pending'
         RETURNING id, code, status, updated_at`,
        [id, departmentResult.rows[0].id, positionResult.rows[0].id, reason, requiredBy],
      );
      if (result.rowCount) {
        await client.query(
          `INSERT INTO audit_events (actor_id, event_type, resource_type, resource_id)
           VALUES ($1, 'coverage_request.updated', 'coverage_request', $2)`,
          [userId, id],
        );
      }
      await client.query('COMMIT');
      return result.rows[0] ?? null;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  async deletePending(id, userId) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const related = await client.query(
        `SELECT
           (SELECT count(*) FROM document_validations WHERE request_id = $1) +
           (SELECT count(*) FROM technical_evaluations WHERE request_id = $1) +
           (SELECT count(*) FROM assignments WHERE request_id = $1) AS count`,
        [id],
      );
      if (Number(related.rows[0].count) > 0) {
        throw new AppError(409, 'RELATED_RECORDS', 'No se puede eliminar una solicitud con documentos, evaluaciones o asignaciones asociadas.');
      }
      const result = await client.query(
        `DELETE FROM coverage_requests WHERE id = $1 AND status = 'pending' RETURNING id, code`,
        [id],
      );
      if (!result.rowCount) {
        await client.query('COMMIT');
        return null;
      }
      await client.query(
        `INSERT INTO audit_events (actor_id, event_type, resource_type, resource_id, metadata)
         VALUES ($1, 'coverage_request.deleted', 'coverage_request', $2, $3)`,
        [userId, result.rows[0].id, JSON.stringify({ code: result.rows[0].code })],
      );
      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  async getDashboardSummary() {
    const result = await pool.query(`
      SELECT
        (SELECT count(*)::int FROM coverage_requests WHERE status = 'pending') AS pending_requests,
        (SELECT count(*)::int FROM document_validations WHERE status = 'pending') AS pending_validations,
        (SELECT count(*)::int FROM technical_evaluations WHERE status = 'pending') AS pending_evaluations,
        (SELECT count(*)::int FROM assignments) AS completed_assignments,
        (SELECT count(*)::int FROM document_validations WHERE status = 'pending') AS pending_documents,
        (SELECT count(*)::int FROM technical_evaluations WHERE status = 'pending') AS pending_technical_evaluations,
        (SELECT count(*)::int FROM coverage_requests
          WHERE status IN ('pending', 'in_review')
            AND required_by BETWEEN CURRENT_DATE AND CURRENT_DATE + 7) AS expiring_requests
    `);
    return result.rows[0];
  },
};
