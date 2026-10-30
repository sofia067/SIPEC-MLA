import { pool } from '../db/pool.js';
import { AppError } from '../errors/app-error.js';

export const requestRepository = {
  async create({
    department,
    positionTitle,
    reason,
    requiredBy,
    priority,
    userId,
  }) {
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
           (code, department_id, position_id, reason, required_by, priority, requested_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, code, status, created_at`,
        [code, departmentResult.rows[0].id, positionResult.rows[0].id, reason, requiredBy, priority, userId],
      );
      const request = requestResult.rows[0];
      await client.query(
        `INSERT INTO audit_events (actor_id, event_type, resource_type, resource_id, metadata)
         VALUES ($1, 'coverage_request.created', 'coverage_request', $2, $3)`,
        [userId, request.id, JSON.stringify({ code })],
      );
      await client.query(
        `INSERT INTO notifications (recipient_id, event_type, title, message, href)
         SELECT id, 'coverage_request.created', 'Nueva solicitud de cobertura',
                $2, '/solicitudes-cobertura'
         FROM users
         WHERE role IN ('admin', 'hr_specialist') AND is_active = true AND id <> $1`,
        [userId, `Se registró la solicitud ${code} para ${positionTitle} en ${department}.`],
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

  async listRecent(limit = 10, areaName = null, requestedBy = null) {
    const result = await pool.query(
      `SELECT r.id, r.code, d.name AS department, p.title AS position_title,
              r.status, r.priority, r.required_by, r.created_at, u.display_name AS requested_by
       FROM coverage_requests r
       JOIN departments d ON d.id = r.department_id
       JOIN position_profiles p ON p.id = r.position_id
       JOIN users u ON u.id = r.requested_by
       WHERE ($2::text IS NULL OR d.name = $2)
         AND ($3::uuid IS NULL OR r.requested_by = $3)
       ORDER BY r.created_at DESC
       LIMIT $1`,
      [limit, areaName, requestedBy],
    );
    return result.rows;
  },

  async listAll(areaName = null, requestedBy = null) {
    const result = await pool.query(
      `SELECT r.id, r.code, r.department_id, r.position_id, d.name AS department,
              p.title AS position_title, r.reason, r.status, r.priority, r.required_by, r.created_at,
              r.reviewed_at, u.display_name AS requested_by
       FROM coverage_requests r
       JOIN departments d ON d.id = r.department_id
       JOIN position_profiles p ON p.id = r.position_id
       JOIN users u ON u.id = r.requested_by
       WHERE ($1::text IS NULL OR d.name = $1)
         AND ($2::uuid IS NULL OR r.requested_by = $2)
       ORDER BY r.created_at DESC`,
      [areaName, requestedBy],
    );
    return result.rows;
  },

  async listCandidateRequests() {
    const result = await pool.query(
      `SELECT r.id, r.code, p.title AS position_title, r.priority, r.status
       FROM coverage_requests r
       JOIN position_profiles p ON p.id = r.position_id
       WHERE r.status NOT IN ('rejected', 'completed')
       ORDER BY r.created_at DESC`,
    );
    return result.rows;
  },

  async listPublicOpenings() {
    const result = await pool.query(
      `SELECT r.id, r.code, d.name AS department, p.title AS position_title, p.description,
              r.required_by
       FROM coverage_requests r
       JOIN departments d ON d.id = r.department_id
       JOIN position_profiles p ON p.id = r.position_id
       WHERE r.status = 'approved'
       ORDER BY r.created_at DESC`,
    );
    return result.rows;
  },

  async createPublicApplication({
    requestId,
    fullName,
    documentNumber,
    email,
    phone,
    resumeName,
    resumeContent,
  }) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const opening = await client.query(
        `SELECT code FROM coverage_requests
         WHERE id = $1 AND status = 'approved'
         FOR SHARE`,
        [requestId],
      );
      if (!opening.rowCount) {
        throw new AppError(404, 'OPENING_NOT_AVAILABLE', 'La convocatoria ya no está disponible.');
      }

      const sequence = await client.query("SELECT nextval('public_application_code_seq') AS value");
      const applicationCode = `POST-${String(sequence.rows[0].value).padStart(5, '0')}`;
      const application = await client.query(
        `INSERT INTO public_applications
           (application_code, request_id, full_name, document_number, email, phone,
            resume_name, resume_content)
         VALUES ($1, $2, $3, $4, NULLIF($5, ''), NULLIF($6, ''), $7, $8)
           RETURNING application_code AS "applicationCode"`,
        [applicationCode, requestId, fullName, documentNumber, email, phone, resumeName, resumeContent],
      );
      await client.query(
        `INSERT INTO audit_events (event_type, resource_type, resource_id, metadata)
         SELECT 'application.submitted', 'application', a.id, $2
         FROM public_applications a
         WHERE a.application_code = $1`,
        [applicationCode, JSON.stringify({ applicationCode, requestCode: opening.rows[0].code })],
      );
      await client.query(
        `INSERT INTO notifications (recipient_id, event_type, title, message, href)
         SELECT id, 'application.submitted', 'Nueva postulación de prueba',
                $1, '/candidatos-compatibles'
         FROM users
         WHERE role IN ('admin', 'hr_specialist') AND is_active = true`,
        [`Se recibió la postulación ${applicationCode} para la convocatoria ${opening.rows[0].code}.`],
      );
      await client.query('COMMIT');
      return application.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  async updateStatus(id, status, userId) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const requestOwner = await client.query(
        'SELECT requested_by FROM coverage_requests WHERE id = $1 FOR UPDATE',
        [id],
      );
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
        const ownerId = requestOwner.rows[0]?.requested_by;
        if (ownerId && ownerId !== userId) {
           const statusLabels = {
             pending: 'Pendiente',
             in_review: 'En revisión',
             approved: 'Aprobada',
             rejected: 'Rechazada',
             completed: 'Completada',
           };
           await client.query(
             `INSERT INTO notifications (recipient_id, event_type, title, message, href)
              VALUES ($1, 'coverage_request.status_changed', 'Actualización de solicitud', $2, '/solicitudes-cobertura')`,
             [ownerId, `La solicitud ${result.rows[0].code} ahora está ${statusLabels[status]}.`],
           );
        }
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

  async updatePending(id, { department, positionTitle, reason, requiredBy, priority }, userId) {
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
           required_by = $5, priority = COALESCE($6, priority), updated_at = now()
         WHERE id = $1 AND status = 'pending'
         RETURNING id, code, status, updated_at`,
        [id, departmentResult.rows[0].id, positionResult.rows[0].id, reason, requiredBy, priority ?? null],
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

  async getDashboardSummary(areaName = null) {
    const result = await pool.query(`
      WITH scoped_requests AS (
        SELECT r.id, r.status, r.required_by
        FROM coverage_requests r
        JOIN departments d ON d.id = r.department_id
        WHERE $1::text IS NULL OR d.name = $1
      ),
      scoped_documents AS (
        SELECT dv.status
        FROM document_validations dv
        LEFT JOIN coverage_requests r ON r.id = dv.request_id
        LEFT JOIN departments rd ON rd.id = r.department_id
        LEFT JOIN workers w ON w.id = dv.worker_id
        LEFT JOIN departments wd ON wd.id = w.department_id
        WHERE $1::text IS NULL OR rd.name = $1 OR wd.name = $1
      ),
      scoped_evaluations AS (
        SELECT te.status
        FROM technical_evaluations te
        LEFT JOIN coverage_requests r ON r.id = te.request_id
        LEFT JOIN departments rd ON rd.id = r.department_id
        LEFT JOIN workers w ON w.id = te.worker_id
        LEFT JOIN departments wd ON wd.id = w.department_id
        WHERE $1::text IS NULL OR rd.name = $1 OR wd.name = $1
      )
      SELECT
        (SELECT count(*)::int FROM scoped_requests WHERE status = 'pending') AS pending_requests,
        (SELECT count(*)::int FROM scoped_documents WHERE status = 'pending') AS pending_validations,
        (SELECT count(*)::int FROM scoped_evaluations WHERE status = 'pending') AS pending_evaluations,
        (SELECT count(*)::int FROM assignments a JOIN scoped_requests r ON r.id = a.request_id) AS completed_assignments,
        (SELECT count(*)::int FROM scoped_documents WHERE status = 'pending') AS pending_documents,
        (SELECT count(*)::int FROM scoped_evaluations WHERE status = 'pending') AS pending_technical_evaluations,
        (SELECT count(*)::int FROM scoped_requests
          WHERE status IN ('pending', 'in_review')
            AND required_by BETWEEN CURRENT_DATE AND CURRENT_DATE + 7) AS expiring_requests
    `, [areaName]);
    return result.rows[0];
  },
};
