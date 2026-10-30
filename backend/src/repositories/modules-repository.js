import { pool } from '../db/pool.js';
import { AppError } from '../errors/app-error.js';

const workerSelect = `
  SELECT w.id, w.employee_number, w.document_number, w.full_name, w.email, w.phone,
         d.name AS department, w.department_id, p.title AS position, w.position_id,
         w.status, w.created_at, w.updated_at
  FROM workers w
  JOIN departments d ON d.id = w.department_id
  LEFT JOIN position_profiles p ON p.id = w.position_id
`;

const profileSelect = `
  SELECT p.id, p.title, p.description, p.level, p.principal_requirements,
         p.profile_code, p.reference_salary, p.academic_formation,
         p.general_experience, p.specific_experience, p.technical_knowledge,
         p.responsibilities,
         p.status, p.created_at, p.updated_at,
         d.id AS department_id, d.name AS department,
         coalesce(json_agg(json_build_object('id', c.id, 'name', c.name, 'description', c.description))
           FILTER (WHERE c.id IS NOT NULL), '[]'::json) AS competencies
  FROM position_profiles p
  JOIN departments d ON d.id = p.department_id
  LEFT JOIN position_competencies c ON c.position_id = p.id
`;

async function recordAudit(client, actorId, eventType, resourceType, resourceId, metadata = {}) {
  await client.query(
    `INSERT INTO audit_events (actor_id, event_type, resource_type, resource_id, metadata)
     VALUES ($1, $2, $3, $4, $5)`,
    [actorId, eventType, resourceType, resourceId, JSON.stringify(metadata)],
  );
}

async function withTransaction(action) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await action(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export const modulesRepository = {
  async getLookups() {
    const [departments, profiles, workers, requests] = await Promise.all([
      pool.query('SELECT id, name FROM departments ORDER BY name'),
      pool.query(
        `SELECT p.id, p.title, d.name AS department
         FROM position_profiles p JOIN departments d ON d.id = p.department_id
         WHERE p.status = 'active'
         ORDER BY d.name, p.title`,
      ),
      pool.query(
        `SELECT w.id, w.full_name FROM workers w
         WHERE w.status = 'active'
         ORDER BY w.full_name`,
      ),
      pool.query(
        `SELECT r.id, r.code FROM coverage_requests r
         ORDER BY r.created_at DESC LIMIT 500`,
      ),
    ]);
    return {
      departments: departments.rows,
      profiles: profiles.rows,
      workers: workers.rows,
      requests: requests.rows,
    };
  },

  async listWorkers() {
    const result = await pool.query(
      `${workerSelect} ORDER BY w.full_name`,
    );
    return result.rows;
  },

  async createWorker(input, actorId) {
    return withTransaction(async (client) => {
      const department = await client.query(
        `INSERT INTO departments (name) VALUES ($1)
         ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id`,
        [input.department],
      );
      const positionId = input.positionId || null;
      const result = await client.query(
        `INSERT INTO workers
           (employee_number, document_number, full_name, email, phone, department_id, position_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, employee_number, document_number, full_name, email, phone, status`,
        [input.employeeNumber, input.documentNumber, input.fullName, input.email || null,
          input.phone || null, department.rows[0].id, positionId],
      );
      await recordAudit(client, actorId, 'worker.created', 'worker', result.rows[0].id);
      return result.rows[0];
    });
  },

  async updateWorker(id, input, actorId) {
    return withTransaction(async (client) => {
      const department = await client.query(
        `INSERT INTO departments (name) VALUES ($1)
         ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id`,
        [input.department],
      );
      const result = await client.query(
        `UPDATE workers SET employee_number = $2, document_number = $3, full_name = $4,
           email = $5, phone = $6, department_id = $7, position_id = $8, status = $9,
           updated_at = now()
         WHERE id = $1
         RETURNING id, employee_number, document_number, full_name, email, phone, status`,
        [id, input.employeeNumber, input.documentNumber, input.fullName, input.email || null,
          input.phone || null, department.rows[0].id, input.positionId || null, input.status],
      );
      if (!result.rowCount) return null;
      await recordAudit(client, actorId, 'worker.updated', 'worker', id);
      return result.rows[0];
    });
  },

  async deleteWorker(id, actorId) {
    return withTransaction(async (client) => {
      const result = await client.query(
        `UPDATE workers SET status = 'inactive', updated_at = now()
         WHERE id = $1 AND status = 'active' RETURNING id`,
        [id],
      );
      if (!result.rowCount) return false;
      await recordAudit(client, actorId, 'worker.deactivated', 'worker', id);
      return true;
    });
  },

  async listProfiles() {
    const result = await pool.query(`${profileSelect} GROUP BY p.id, d.id ORDER BY d.name, p.title`);
    return result.rows;
  },

  async getProfile(id) {
    const result = await pool.query(
      `${profileSelect} WHERE p.id = $1 GROUP BY p.id, d.id`,
      [id],
    );
    return result.rows[0] ?? null;
  },

  async createProfile(input, actorId) {
    return withTransaction(async (client) => {
      const department = await client.query(
        `INSERT INTO departments (name) VALUES ($1)
         ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id`,
        [input.department],
      );
      const profile = await client.query(
        `INSERT INTO position_profiles
           (department_id, title, description, level, principal_requirements, status,
            profile_code, reference_salary, academic_formation, general_experience,
            specific_experience, technical_knowledge, responsibilities)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING id`,
        [department.rows[0].id, input.title, input.description, input.level,
          input.principalRequirements, input.status, input.profileCode || null,
          input.referenceSalary ?? null, input.academicFormation, input.generalExperience,
          input.specificExperience, input.technicalKnowledge, input.responsibilities],
      );
      const profileId = profile.rows[0].id;
      for (const competency of input.competencies) {
        await client.query(
          'INSERT INTO position_competencies (position_id, name, description) VALUES ($1, $2, $3)',
          [profileId, competency.name, competency.description],
        );
      }
      await recordAudit(client, actorId, 'position_profile.created', 'position_profile', profileId);
      return profileId;
    });
  },

  async updateProfile(id, input, actorId) {
    return withTransaction(async (client) => {
      const department = await client.query(
        `INSERT INTO departments (name) VALUES ($1)
         ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id`,
        [input.department],
      );
      const result = await client.query(
        `UPDATE position_profiles SET department_id = $2, title = $3, description = $4,
           level = $5, principal_requirements = $6, status = $7, profile_code = $8,
           reference_salary = $9, academic_formation = $10, general_experience = $11,
           specific_experience = $12, technical_knowledge = $13, responsibilities = $14,
           updated_at = now()
         WHERE id = $1 RETURNING id`,
        [id, department.rows[0].id, input.title, input.description, input.level,
          input.principalRequirements, input.status, input.profileCode || null,
          input.referenceSalary ?? null, input.academicFormation, input.generalExperience,
          input.specificExperience, input.technicalKnowledge, input.responsibilities],
      );
      if (!result.rowCount) return false;
      await client.query('DELETE FROM position_competencies WHERE position_id = $1', [id]);
      for (const competency of input.competencies) {
        await client.query(
          'INSERT INTO position_competencies (position_id, name, description) VALUES ($1, $2, $3)',
          [id, competency.name, competency.description],
        );
      }
      await recordAudit(client, actorId, 'position_profile.updated', 'position_profile', id);
      return true;
    });
  },

  async deleteProfile(id, actorId) {
    return withTransaction(async (client) => {
      const result = await client.query(
        `UPDATE position_profiles SET status = 'inactive', updated_at = now()
         WHERE id = $1 AND status = 'active' RETURNING id`,
        [id],
      );
      if (!result.rowCount) return false;
      await recordAudit(client, actorId, 'position_profile.deleted', 'position_profile', id);
      return true;
    });
  },

  async listWorkItems(type) {
    const result = await pool.query(
      type === 'documents'
        ? `SELECT d.id, d.document_type, d.description, d.status::text AS status, d.created_at,
                  d.request_id, r.code AS request_code, d.worker_id, w.full_name AS worker_name,
                  d.file_name, d.file_mime, d.file_size, d.ocr_status, d.ocr_text, d.ocr_message,
                  d.ocr_processed_at,
                  (d.file_path IS NOT NULL) AS has_file
           FROM document_validations d
           LEFT JOIN coverage_requests r ON r.id = d.request_id
           LEFT JOIN workers w ON w.id = d.worker_id
           ORDER BY d.created_at DESC`
        : `SELECT e.id, e.evaluation_name, coalesce(e.candidate_name, w.full_name) AS candidate_name,
                  e.notes, e.score,
                  e.status::text AS status, e.created_at, e.request_id, r.code AS request_code,
                  p.title AS position_title,
                  e.worker_id,
                  w.full_name AS worker_name
           FROM technical_evaluations e
           LEFT JOIN coverage_requests r ON r.id = e.request_id
           LEFT JOIN position_profiles p ON p.id = r.position_id
           LEFT JOIN workers w ON w.id = e.worker_id
           ORDER BY e.created_at DESC`,
      [],
    );
    return result.rows;
  },

  async createWorkItem(type, input, actorId) {
    return withTransaction(async (client) => {
      const result = type === 'documents'
        ? await client.query(
          `INSERT INTO document_validations
             (request_id, worker_id, document_type, description, status, validated_by, validated_at)
           VALUES ($1, $2, $3, $4, $5, $6, CASE WHEN $5 = 'completed' THEN now() ELSE NULL END)
           RETURNING *`,
          [input.requestId || null, input.workerId || null, input.documentType, input.description,
            input.status, input.status === 'completed' ? actorId : null],
        )
        : await client.query(
          `INSERT INTO technical_evaluations
             (request_id, worker_id, evaluation_name, candidate_name, notes, score, status,
              evaluated_by, evaluated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8,
             CASE WHEN $7 = 'completed' THEN now() ELSE NULL END)
           RETURNING *`,
          [input.requestId || null, input.workerId || null, input.evaluationName,
            input.candidateName || null, input.notes, input.score ?? null, input.status,
            input.status === 'completed' ? actorId : null],
        );
      await recordAudit(client, actorId, `${type}.created`, type, result.rows[0].id);
      return result.rows[0];
    });
  },

  async updateWorkItem(type, id, input, actorId) {
    const table = type === 'documents' ? 'document_validations' : 'technical_evaluations';
    const statement = type === 'documents'
      ? `UPDATE document_validations SET request_id = $2, worker_id = $3, document_type = $4,
           description = $5, status = $6, validated_by = $7,
           validated_at = CASE WHEN $6 = 'completed' THEN now() ELSE NULL END
         WHERE id = $1 RETURNING *`
      : `UPDATE technical_evaluations SET request_id = $2, worker_id = $3, evaluation_name = $4,
           candidate_name = $5, notes = $6, score = $7, status = $8,
           evaluated_by = CASE WHEN $8 = 'completed' THEN $9 ELSE NULL END,
           evaluated_at = CASE WHEN $8 = 'completed' THEN now() ELSE NULL END
         WHERE id = $1 RETURNING *`;
    const values = type === 'documents'
      ? [id, input.requestId || null, input.workerId || null, input.documentType,
        input.description, input.status, input.status === 'completed' ? actorId : null]
      : [id, input.requestId || null, input.workerId || null, input.evaluationName,
        input.candidateName || null, input.notes, input.score ?? null, input.status,
        input.status === 'completed' ? actorId : null];
    return withTransaction(async (client) => {
      const result = await client.query(statement, values);
      if (!result.rowCount) return null;
      await recordAudit(client, actorId, `${type}.updated`, type, id);
      return result.rows[0];
    });
  },

  async scoreEvaluation(id, score, actorId) {
    return withTransaction(async (client) => {
      const result = await client.query(
        `UPDATE technical_evaluations
         SET score = $2, status = 'completed', evaluated_by = $3, evaluated_at = now()
         WHERE id = $1
         RETURNING id, score, status::text AS status, evaluated_at`,
        [id, score, actorId],
      );
      if (!result.rowCount) return null;
      await recordAudit(client, actorId, 'evaluations.scored', 'evaluations', id);
      return result.rows[0];
    });
  },

  async deleteWorkItem(type, id, actorId) {
    const table = type === 'documents' ? 'document_validations' : 'technical_evaluations';
    return withTransaction(async (client) => {
      const result = await client.query(`DELETE FROM ${table} WHERE id = $1 RETURNING id`, [id]);
      if (!result.rowCount) return false;
      await recordAudit(client, actorId, `${type}.deleted`, type, id);
      return true;
    });
  },

  async getDocumentFile(id) {
    const result = await pool.query(
      `SELECT id, file_name, file_path, file_mime, ocr_status
       FROM document_validations WHERE id = $1`,
      [id],
    );
    return result.rows[0] ?? null;
  },

  async setDocumentFile(id, { fileName, filePath, fileMime, fileSize }, actorId) {
    return withTransaction(async (client) => {
      const result = await client.query(
        `UPDATE document_validations
         SET file_name = $2, file_path = $3, file_mime = $4, file_size = $5,
             ocr_status = 'processing', ocr_text = NULL, ocr_message = NULL, ocr_processed_at = NULL
         WHERE id = $1
         RETURNING id, document_type, status::text AS status, file_name, file_mime, file_size, ocr_status`,
        [id, fileName, filePath, fileMime, fileSize],
      );
      if (!result.rowCount) return null;
      await recordAudit(client, actorId, 'document.file_uploaded', 'documents', id, { fileName });
      return result.rows[0];
    });
  },

  async setDocumentOcrResult(id, { status, text, message }) {
    const result = await pool.query(
      `UPDATE document_validations
       SET ocr_status = $2, ocr_text = $3, ocr_message = $4,
           ocr_processed_at = CASE WHEN $2 = 'processing' THEN NULL ELSE now() END
       WHERE id = $1
       RETURNING id, ocr_status, ocr_processed_at`,
      [id, status, text, message],
    );
    return result.rows[0] ?? null;
  },

  async listAssignments() {
    const result = await pool.query(
      `SELECT a.id, a.request_id, r.code AS request_code, d.name AS department,
              p.title AS position_title, a.worker_id, w.full_name AS worker_name,
              a.employee_name, a.starts_on, a.notes, a.created_at, a.updated_at
       FROM assignments a
       JOIN coverage_requests r ON r.id = a.request_id
       JOIN departments d ON d.id = r.department_id
       JOIN position_profiles p ON p.id = r.position_id
       LEFT JOIN workers w ON w.id = a.worker_id
       ORDER BY a.created_at DESC`,
    );
    return result.rows;
  },

  async createAssignment(input, actorId) {
    return withTransaction(async (client) => {
      const request = await client.query(
        `SELECT id, code, status::text AS status
         FROM coverage_requests WHERE id = $1 FOR UPDATE`,
        [input.requestId],
      );
      if (!request.rowCount) {
        throw new AppError(404, 'NOT_FOUND', 'No se encontró la solicitud a asignar.');
      }
      const current = request.rows[0];
      if (current.status === 'completed' || current.status === 'rejected') {
        throw new AppError(409, 'REQUEST_NOT_ASSIGNABLE', 'Solo se pueden asignar solicitudes activas (no completadas ni rechazadas).');
      }
      const existing = await client.query('SELECT id FROM assignments WHERE request_id = $1', [input.requestId]);
      if (existing.rowCount) {
        throw new AppError(409, 'ALREADY_ASSIGNED', 'La solicitud ya tiene una asignación registrada.');
      }
      const result = await client.query(
        `INSERT INTO assignments (request_id, worker_id, employee_name, starts_on, notes, assigned_by)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [input.requestId, input.workerId || null, input.employeeName, input.startsOn, input.notes || '', actorId],
      );
      await client.query(
        `UPDATE coverage_requests
         SET status = 'completed', reviewed_by = $2, reviewed_at = now(), updated_at = now()
         WHERE id = $1`,
        [input.requestId, actorId],
      );
      await recordAudit(client, actorId, 'assignment.created', 'assignment', result.rows[0].id, { code: current.code });
      await recordAudit(client, actorId, 'coverage_request.status_changed', 'coverage_request', input.requestId, { status: 'completed' });
      return result.rows[0];
    });
  },

  async updateAssignment(id, input, actorId) {
    return withTransaction(async (client) => {
      const result = await client.query(
        `UPDATE assignments
         SET worker_id = $2, employee_name = $3, starts_on = $4, notes = $5, updated_at = now()
         WHERE id = $1 RETURNING *`,
        [id, input.workerId || null, input.employeeName, input.startsOn, input.notes || ''],
      );
      if (!result.rowCount) return null;
      await recordAudit(client, actorId, 'assignment.updated', 'assignment', id);
      return result.rows[0];
    });
  },

  async deleteAssignment(id, actorId) {
    return withTransaction(async (client) => {
      const result = await client.query('DELETE FROM assignments WHERE id = $1 RETURNING id, request_id', [id]);
      if (!result.rowCount) return false;
      await client.query(
        `UPDATE coverage_requests
         SET status = 'approved', updated_at = now()
         WHERE id = $1 AND status = 'completed'`,
        [result.rows[0].request_id],
      );
      await recordAudit(client, actorId, 'assignment.deleted', 'assignment', id);
      return true;
    });
  },

  async listUsers() {
    const result = await pool.query(
      `SELECT id, username, display_name, role::text AS role, area_name, is_active, created_at
       FROM users ORDER BY display_name`,
    );
    return result.rows;
  },

  async createUser(input, actorId, passwordHash) {
    return withTransaction(async (client) => {
      const result = await client.query(
        `INSERT INTO users (username, display_name, role, area_name, password_hash)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, username, display_name, role::text AS role, area_name, is_active`,
        [input.username, input.displayName, input.role, input.areaName || null, passwordHash],
      );
      await recordAudit(client, actorId, 'user.created', 'user', result.rows[0].id, { role: input.role });
      return result.rows[0];
    });
  },

  async updateUser(id, input, actorId, passwordHash) {
    return withTransaction(async (client) => {
      const admin = await client.query(
        'SELECT role::text AS role, is_active FROM users WHERE id = $1 FOR UPDATE',
        [id],
      );
      if (!admin.rowCount) return null;
      if (admin.rows[0].role === 'admin' && admin.rows[0].is_active &&
          (input.role !== 'admin' || !input.isActive)) {
        const remaining = await client.query(
          `SELECT count(*)::int AS count FROM users
           WHERE role = 'admin' AND is_active = true AND id <> $1`,
          [id],
        );
        if (remaining.rows[0].count === 0) {
          throw new AppError(409, 'LAST_ADMIN', 'No se puede desactivar o degradar al único administrador activo.');
        }
      }
      const result = await client.query(
        `UPDATE users SET display_name = $2, role = $3, area_name = $4,
           password_hash = coalesce($5, password_hash), is_active = $6, updated_at = now()
         WHERE id = $1 AND username <> 'admin'
         RETURNING id, username, display_name, role::text AS role, area_name, is_active`,
        [id, input.displayName, input.role, input.areaName || null, passwordHash, input.isActive],
      );
      if (!result.rowCount) return null;
      if (!input.isActive || passwordHash) {
        await client.query('DELETE FROM user_sessions WHERE user_id = $1', [id]);
      }
      await recordAudit(client, actorId, 'user.updated', 'user', id);
      return result.rows[0];
    });
  },

  async deactivateUser(id, actorId) {
    return withTransaction(async (client) => {
      const result = await client.query(
        `UPDATE users SET is_active = false, updated_at = now()
         WHERE id = $1 AND username <> 'admin' RETURNING id`,
        [id],
      );
      if (!result.rowCount) return false;
      await client.query('DELETE FROM user_sessions WHERE user_id = $1', [id]);
      await recordAudit(client, actorId, 'user.deactivated', 'user', id);
      return true;
    });
  },

  async listAuditEvents() {
    const result = await pool.query(
      `SELECT e.id, e.event_type, e.resource_type, e.resource_id, e.metadata, e.created_at,
              u.username, u.display_name
       FROM audit_events e LEFT JOIN users u ON u.id = e.actor_id
       ORDER BY e.created_at DESC LIMIT 500`,
    );
    return result.rows;
  },

  async getSystemSettings() {
    const result = await pool.query(
      `SELECT organization_name, fiscal_year, support_email, max_upload_mb,
              passing_score, declaration_deadline_days, updated_at
       FROM system_settings WHERE id = 1`,
    );
    return result.rows[0];
  },

  async getSystemInfo() {
    const result = await pool.query(
      `SELECT organization_name, fiscal_year, support_email, passing_score,
              declaration_deadline_days
       FROM system_settings WHERE id = 1`,
    );
    return result.rows[0];
  },

  async updateSystemSettings(input, actorId) {
    return withTransaction(async (client) => {
      const result = await client.query(
        `UPDATE system_settings SET organization_name = $1, fiscal_year = $2,
           support_email = $3, max_upload_mb = $4, passing_score = $5,
           declaration_deadline_days = $6, updated_at = now()
         WHERE id = 1
         RETURNING organization_name, fiscal_year, support_email, max_upload_mb,
                   passing_score, declaration_deadline_days, updated_at`,
        [input.organizationName, input.fiscalYear, input.supportEmail, input.maxUploadMb,
          input.passingScore, input.declarationDeadlineDays],
      );
      await recordAudit(client, actorId, 'system_settings.updated', 'system_settings', null);
      return result.rows[0];
    });
  },

  async listDepartments() {
    const result = await pool.query(
      `SELECT d.id, d.name, d.created_at,
              (SELECT count(*)::int FROM position_profiles p WHERE p.department_id = d.id) AS profile_count,
              (SELECT count(*)::int FROM workers w WHERE w.department_id = d.id) AS worker_count,
              (SELECT count(*)::int FROM coverage_requests r WHERE r.department_id = d.id) AS request_count
       FROM departments d ORDER BY d.name`,
    );
    return result.rows;
  },

  async createDepartment(name, actorId) {
    return withTransaction(async (client) => {
      const result = await client.query(
        'INSERT INTO departments (name) VALUES ($1) RETURNING id, name, created_at',
        [name],
      );
      await recordAudit(client, actorId, 'department.created', 'department', result.rows[0].id);
      return result.rows[0];
    });
  },

  async updateDepartment(id, name, actorId) {
    return withTransaction(async (client) => {
      const current = await client.query('SELECT name FROM departments WHERE id = $1 FOR UPDATE', [id]);
      if (!current.rowCount) return null;
      const result = await client.query(
        'UPDATE departments SET name = $2 WHERE id = $1 RETURNING id, name, created_at',
        [id, name],
      );
      await client.query('UPDATE users SET area_name = $2 WHERE area_name = $1', [
        current.rows[0].name,
        name,
      ]);
      await recordAudit(client, actorId, 'department.updated', 'department', id);
      return result.rows[0];
    });
  },

  async deleteDepartment(id, actorId) {
    return withTransaction(async (client) => {
      const related = await client.query(
        `SELECT
           (SELECT count(*) FROM position_profiles WHERE department_id = $1) +
           (SELECT count(*) FROM workers WHERE department_id = $1) +
           (SELECT count(*) FROM coverage_requests WHERE department_id = $1) AS count`,
        [id],
      );
      if (Number(related.rows[0].count) > 0) {
        throw new AppError(409, 'RELATED_RECORDS', 'No se puede eliminar el área porque tiene perfiles, trabajadores o solicitudes asociados.');
      }
      const result = await client.query('DELETE FROM departments WHERE id = $1 RETURNING id', [id]);
      if (!result.rowCount) return false;
      await recordAudit(client, actorId, 'department.deleted', 'department', id);
      return true;
    });
  },

  async getReportData(type, areaName = null) {
    const queries = {
      requests: `SELECT r.code, d.name AS department, p.title AS position, r.status::text AS status,
                        r.priority::text AS priority, r.required_by, u.display_name AS requested_by, r.created_at
                 FROM coverage_requests r
                 JOIN departments d ON d.id = r.department_id
                 JOIN position_profiles p ON p.id = r.position_id
                 JOIN users u ON u.id = r.requested_by
                 WHERE ($1::text IS NULL OR d.name = $1)
                 ORDER BY r.created_at DESC`,
      workers: `SELECT w.employee_number, w.document_number, w.full_name, w.email, w.phone,
                       d.name AS department, p.title AS position, w.status::text AS status
                FROM workers w JOIN departments d ON d.id = w.department_id
                LEFT JOIN position_profiles p ON p.id = w.position_id
                WHERE ($1::text IS NULL OR d.name = $1)
                ORDER BY w.full_name`,
      evaluations: `SELECT e.evaluation_name, e.candidate_name, e.status::text AS status, e.score,
                            r.code AS request_code, w.full_name AS worker, e.created_at
                     FROM technical_evaluations e
                     LEFT JOIN coverage_requests r ON r.id = e.request_id
                     LEFT JOIN departments rd ON rd.id = r.department_id
                     LEFT JOIN workers w ON w.id = e.worker_id
                     LEFT JOIN departments wd ON wd.id = w.department_id
                     WHERE ($1::text IS NULL OR rd.name = $1 OR wd.name = $1)
                     ORDER BY e.created_at DESC`,
    };
    const result = await pool.query(queries[type], [areaName]);
    return result.rows;
  },
};
