import { pool } from '../db/pool.js';
import { AppError } from '../errors/app-error.js';
import { EVALUATION_BANKS } from '../data/evaluation-banks.js';
import { getRequestIpAddress } from '../middleware/request-context.js';
import { getAreaScope } from '../middleware/role-scope.js';
import { redactCandidateDocumentText } from '../services/resume-review.js';

const workerSelect = `
  SELECT w.id, w.employee_number, w.document_number, w.full_name, w.email, w.phone,
         d.name AS department, w.department_id, p.title AS position, w.position_id,
         w.status, w.is_demo, w.appointment_resolution, w.appointment_date,
         w.created_at, w.updated_at
  FROM workers w
  JOIN departments d ON d.id = w.department_id
  LEFT JOIN position_profiles p ON p.id = w.position_id
`;

const profileSelect = `
  SELECT p.id, p.title, p.description, p.level, p.principal_requirements,
         p.profile_code, p.remuneration, p.education, p.general_experience,
         p.specific_experience, p.technical_knowledge,
         p.functions,
         p.status, p.created_at, p.updated_at,
         d.id AS department_id, d.name AS department,
         coalesce(json_agg(json_build_object('id', c.id, 'name', c.name, 'description', c.description))
           FILTER (WHERE c.id IS NOT NULL), '[]'::json) AS competencies
  FROM position_profiles p
  JOIN departments d ON d.id = p.department_id
  LEFT JOIN position_competencies c ON c.position_id = p.id
`;

function validateEvaluationBank(bank) {
  const objectiveCount = bank.preguntas.filter((question) => question.tipo === 'opcion').length;
  const writtenCount = bank.preguntas.filter((question) => question.tipo === 'escrita').length;
  if (bank.preguntas.length !== 20 || objectiveCount !== 15 || writtenCount !== 5) {
    throw new AppError(500, 'INVALID_EVALUATION_BANK', `El banco de evaluación para «${bank.puesto}» debe tener 15 preguntas objetivas y 5 de desarrollo.`);
  }
}

async function recordAudit(client, actorId, eventType, resourceType, resourceId, metadata = {}) {
  await client.query(
    `INSERT INTO audit_events (actor_id, event_type, resource_type, resource_id, metadata, ip_address)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [actorId, eventType, resourceType, resourceId, JSON.stringify(metadata), getRequestIpAddress()],
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
  async getLookups(areaName = null) {
    const [departments, profiles, workers, requests, settings] = await Promise.all([
      pool.query('SELECT id, name FROM departments WHERE ($1::text IS NULL OR lower(name) = lower($1)) ORDER BY name', [areaName]),
      pool.query(
        `SELECT p.id, p.title, d.name AS department
         FROM position_profiles p JOIN departments d ON d.id = p.department_id
         WHERE p.status = 'active' AND ($1::text IS NULL OR lower(d.name) = lower($1))
         ORDER BY d.name, p.title`,
        [areaName],
      ),
      pool.query(`SELECT w.id, w.full_name FROM workers w JOIN departments d ON d.id = w.department_id
                  WHERE w.status = 'active' AND ($1::text IS NULL OR lower(d.name) = lower($1)) ORDER BY w.full_name`, [areaName]),
      pool.query(`SELECT r.id, r.code FROM coverage_requests r JOIN departments d ON d.id = r.department_id
                  WHERE ($1::text IS NULL OR lower(d.name) = lower($1)) ORDER BY r.created_at DESC LIMIT 500`, [areaName]),
      pool.query('SELECT catalog_data FROM application_settings WHERE id = 1'),
    ]);
    const catalogData = settings.rows[0]?.catalog_data ?? {};
    const configuredAreas = Array.isArray(catalogData.organizationalAreas) ? catalogData.organizationalAreas : [];
    const departmentNames = departments.rows.map(({ name }) => name);
    const areaSource = configuredAreas.length ? configuredAreas : departmentNames;
    const uniqueAreas = new Map(areaSource.map((name) => [name.toLocaleLowerCase(), name]));
    const departmentIds = new Map(departments.rows.map(({ id, name }) => [name.toLocaleLowerCase(), id]));
    const areaNames = [...uniqueAreas.values()]
      .filter((name) => !areaName || name.toLocaleLowerCase() === areaName.toLocaleLowerCase())
      .sort((left, right) => left.localeCompare(right, 'es'));
    return {
      departments: areaNames.map((name) => ({ id: departmentIds.get(name.toLocaleLowerCase()) ?? null, name })),
      catalogData: {
        positionLevels: catalogData.positionLevels ?? [],
        educationLevels: catalogData.educationLevels ?? [],
      },
      profiles: profiles.rows,
      workers: workers.rows,
      requests: requests.rows,
    };
  },

  async listWorkers(areaName = null) {
    const result = await pool.query(`${workerSelect} WHERE ($1::text IS NULL OR lower(d.name) = lower($1)) ORDER BY w.full_name`, [areaName]);
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

  async listProfiles(areaName = null) {
    const result = await pool.query(`${profileSelect} WHERE ($1::text IS NULL OR lower(d.name) = lower($1)) GROUP BY p.id, d.id ORDER BY d.name, p.title`, [areaName]);
    return result.rows;
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
            profile_code, remuneration, education, general_experience, specific_experience,
            technical_knowledge, functions)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         RETURNING id`,
        [department.rows[0].id, input.title, input.description, input.level,
          input.principalRequirements, input.status, input.profileCode || null,
          input.remuneration, input.education, input.generalExperience,
          input.specificExperience, input.technicalKnowledge.split(/\r?\n/).map((value) => value.trim()).filter(Boolean),
          JSON.stringify(input.functions)],
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
           remuneration = $9, education = $10, general_experience = $11,
           specific_experience = $12, technical_knowledge = $13, functions = $14,
           updated_at = now()
         WHERE id = $1 RETURNING id`,
        [id, department.rows[0].id, input.title, input.description, input.level,
          input.principalRequirements, input.status, input.profileCode || null,
          input.remuneration, input.education, input.generalExperience,
          input.specificExperience, input.technicalKnowledge.split(/\r?\n/).map((value) => value.trim()).filter(Boolean),
          JSON.stringify(input.functions)],
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
    const query = type === 'documents'
      ? `SELECT d.id, d.document_type, d.description, d.status::text AS status, d.created_at,
                  d.validated_at, d.validated_by,
                  d.request_id, r.code AS request_code, d.worker_id, w.full_name AS worker_name,
                  d.candidate_id, bc.application_code AS candidate_code,
                  (bc.identity_revealed_at IS NOT NULL) AS candidate_identity_revealed,
                  bc.full_name AS candidate_full_name, bc.document_number AS candidate_document_number,
                  bc.email AS candidate_email, bc.phone AS candidate_phone,
                  d.file_name, d.file_mime, d.file_size, d.file_sha256, d.ocr_status, d.ocr_text, d.ocr_message,
                  d.ocr_processed_at, d.file_metadata, d.review_findings,
                  (d.file_path IS NOT NULL) AS has_file
           FROM document_validations d
           LEFT JOIN coverage_requests r ON r.id = d.request_id
           LEFT JOIN workers w ON w.id = d.worker_id
           LEFT JOIN blind_candidates bc ON bc.id = d.candidate_id
           ORDER BY d.created_at DESC`
      : `SELECT e.id, e.evaluation_name, e.candidate_name, e.notes, e.score,
                  e.status::text AS status, e.created_at, e.request_id, r.code AS request_code,
                  e.worker_id, w.full_name AS worker_name
           FROM technical_evaluations e
           LEFT JOIN coverage_requests r ON r.id = e.request_id
           LEFT JOIN workers w ON w.id = e.worker_id
           ORDER BY e.created_at DESC`;
    const result = await pool.query(query);
    if (type === 'documents') {
      return result.rows.map((row) => {
        const {
          candidate_full_name: fullName,
          candidate_document_number: documentNumber,
          candidate_email: email,
          candidate_phone: phone,
          candidate_identity_revealed: identityRevealed,
          ...document
        } = row;
        if (document.candidate_id && identityRevealed) {
          return { ...document, candidate_identity_revealed: true };
        }

        if (document.candidate_id) {
          const blindText = redactCandidateDocumentText(document.ocr_text, {
            full_name: fullName,
            document_number: documentNumber,
            email,
            phone,
          }, document.review_findings);
          return {
            ...document,
            candidate_identity_revealed: false,
            description: '',
            file_name: document.document_type || 'Documento de postulante',
            ocr_text: blindText.text,
            blind_review_identity_mismatch: blindText.identityMismatch,
          };
        }

        if (document.request_id && !document.worker_id) {
          return {
            ...document,
            file_name: document.document_type || 'Documento vinculado a solicitud',
            ocr_text: null,
            blind_review_requires_candidate_link: true,
          };
        }

        return document;
      });
    }
    return result.rows;
  },

  async createWorkItem(type, input, actorId) {
    return withTransaction(async (client) => {
      const result = type === 'documents'
        ? await client.query(
          `INSERT INTO document_validations
             (request_id, worker_id, candidate_id, document_type, description, status, validated_by, validated_at)
             VALUES ($1, $2, $3, $4, $5, $6::work_item_status, $7,
               CASE WHEN $6::work_item_status = 'completed' THEN now() ELSE NULL END)
           RETURNING *`,
          [input.requestId || null, input.workerId || null, input.candidateId || null,
            input.documentType, input.description, input.status,
            input.status === 'completed' ? actorId : null],
        )
        : await client.query(
          `INSERT INTO technical_evaluations
             (request_id, worker_id, evaluation_name, candidate_name, notes, score, status,
              evaluated_by, evaluated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8,
             CASE WHEN $7::work_item_status = 'completed' THEN now() ELSE NULL END)
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
      ? `UPDATE document_validations SET request_id = $2, worker_id = $3, candidate_id = $4, document_type = $5,
           description = $6, status = $7::work_item_status,
           validated_by = CASE WHEN $7::work_item_status = 'completed' THEN COALESCE(validated_by, $8) ELSE NULL END,
           validated_at = CASE
             WHEN $7::work_item_status = 'completed' THEN COALESCE(validated_at, now())
             ELSE NULL
           END
         WHERE id = $1 RETURNING *`
      : `UPDATE technical_evaluations SET request_id = $2, worker_id = $3, evaluation_name = $4,
           candidate_name = $5, notes = $6, score = $7, status = $8::work_item_status,
           evaluated_by = CASE WHEN $8::work_item_status = 'completed' THEN $9 ELSE NULL END,
           evaluated_at = CASE WHEN $8::work_item_status = 'completed' THEN now() ELSE NULL END
         WHERE id = $1 RETURNING *`;
    const values = type === 'documents'
      ? [id, input.requestId || null, input.workerId || null, input.candidateId || null,
        input.documentType, input.description, input.status,
        input.status === 'completed' ? actorId : null]
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
      `SELECT d.id, d.file_name, d.file_path, d.file_mime
       FROM document_validations d
       WHERE d.id = $1`,
      [id],
    );
    return result.rows[0] ?? null;
  },

  async listBlindCandidateDocumentOptions(areaName = null) {
    const result = await pool.query(
      `SELECT c.id, c.application_code, r.code AS request_code, p.title AS position_title
       FROM blind_candidates c
       JOIN coverage_requests r ON r.id = c.request_id
       JOIN departments d ON d.id = r.department_id
       JOIN position_profiles p ON p.id = r.position_id
       WHERE ($1::text IS NULL OR lower(d.name) = lower($1))
       ORDER BY c.created_at DESC`,
      [areaName],
    );
    return result.rows;
  },

  async getDocumentReviewInput(documentId) {
    const result = await pool.query(
      `SELECT d.id, d.file_sha256, d.file_mime, d.candidate_id,
              c.application_code, c.full_name, c.document_number
       FROM document_validations d
       LEFT JOIN blind_candidates c ON c.id = d.candidate_id
       WHERE d.id = $1`,
      [documentId],
    );
    return result.rows[0] ?? null;
  },

  async findExactDuplicateCandidateDocuments(documentId, fileSha256) {
    if (!fileSha256) return [];
    const result = await pool.query(
      `WITH current AS (
         SELECT candidate_id FROM document_validations WHERE id = $1
       ), duplicates AS (
         SELECT c.application_code, d.document_type
         FROM document_validations d
         JOIN blind_candidates c ON c.id = d.candidate_id
         CROSS JOIN current
         WHERE d.id <> $1 AND d.file_sha256 = $2
           AND d.candidate_id <> current.candidate_id
         UNION
         SELECT c.application_code, 'Currículum' AS document_type
         FROM blind_candidates c, current
         WHERE c.resume_file_sha256 = $2
           AND c.id <> current.candidate_id
       )
       SELECT application_code, document_type
       FROM duplicates
       ORDER BY application_code, document_type
       LIMIT 20`,
      [documentId, fileSha256],
    );
    return result.rows.map((row) => ({
      applicationCode: row.application_code,
      documentType: row.document_type,
    }));
  },

  async setDocumentReviewResult(id, fileMetadata, reviewFindings) {
    const result = await pool.query(
      `UPDATE document_validations
       SET file_metadata = $2, review_findings = $3
       WHERE id = $1
       RETURNING id`,
      [id, JSON.stringify(fileMetadata), JSON.stringify(reviewFindings)],
    );
    return result.rows[0] ?? null;
  },

  async setDocumentFile(id, { fileName, filePath, fileMime, fileSize, fileSha256 }, actorId) {
    return withTransaction(async (client) => {
      const result = await client.query(
        `UPDATE document_validations
         SET file_name = $2, file_path = $3, file_mime = $4, file_size = $5,
             file_sha256 = $6, ocr_status = 'processing', ocr_text = NULL,
             ocr_message = NULL, ocr_processed_at = NULL,
             file_metadata = '{}'::jsonb, review_findings = '[]'::jsonb
         WHERE id = $1
         RETURNING id, document_type, status::text AS status, file_name, file_mime,
                   file_size, file_sha256, ocr_status`,
        [id, fileName, filePath, fileMime, fileSize, fileSha256],
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
           ocr_processed_at = CASE WHEN $5 THEN NULL ELSE now() END
       WHERE id = $1
       RETURNING id, ocr_status, ocr_processed_at`,
      [id, status, text, message, status === 'processing'],
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
        [input.username, input.displayName, input.role,
          input.areaName || (input.role === 'area_manager' ? 'Subgerencia de Logística y Control Patrimonial' : null),
          passwordHash],
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
              host(e.ip_address) AS ip_address,
              u.username, u.display_name
       FROM audit_events e LEFT JOIN users u ON u.id = e.actor_id
       ORDER BY e.created_at DESC LIMIT 500`,
    );
    return result.rows;
  },

  async recordAuthenticationEvent(actorId, eventType) {
    await pool.query(
      `INSERT INTO audit_events (actor_id, event_type, resource_type, metadata, ip_address)
       VALUES ($1, $2, 'session', '{}'::jsonb, $3)`,
      [actorId, eventType, getRequestIpAddress()],
    );
  },

  async listBlindSelectionCandidates(areaName = null) {
    const result = await pool.query(
      `SELECT c.id, c.application_code, c.request_id, r.code AS request_code,
              d.name AS department, r.reason,
              CASE r.priority::text
                WHEN 'high' THEN 'Alta'
                WHEN 'medium' THEN 'Media'
                WHEN 'low' THEN 'Baja'
              END AS priority,
              p.title AS position_title, c.is_demo, (c.resume_file_path IS NOT NULL) AS has_resume,
              c.process_stage, c.process_stage_updated_at,
              c.resume_reviewed_at, reviewer.display_name AS resume_reviewed_by_name,
              c.match_score, c.match_status, c.match_breakdown, c.match_calculated_at,
              e.objective_score, e.written_review_status,
              e.submitted_at, e.id AS exam_id,
              (c.identity_revealed_at IS NOT NULL) AS identity_revealed,
              CASE WHEN c.identity_revealed_at IS NOT NULL THEN c.full_name END AS full_name,
              CASE WHEN c.identity_revealed_at IS NOT NULL THEN c.document_number END AS document_number,
              CASE WHEN c.identity_revealed_at IS NOT NULL THEN c.email END AS email,
              CASE WHEN c.identity_revealed_at IS NOT NULL THEN c.phone END AS phone
       FROM blind_candidates c
       JOIN coverage_requests r ON r.id = c.request_id
       JOIN departments d ON d.id = r.department_id
       JOIN position_profiles p ON p.id = r.position_id
       LEFT JOIN blind_candidate_exams e ON e.candidate_id = c.id
       LEFT JOIN users reviewer ON reviewer.id = c.resume_reviewed_by
       WHERE ($1::text IS NULL OR lower(d.name) = lower($1))
       ORDER BY c.created_at DESC`,
      [areaName],
    );
    return result.rows;
  },

  async listSimulatedCandidateNotifications(areaName = null) {
    const result = await pool.query(
      `SELECT n.id, n.candidate_id, c.application_code, p.title AS position_title,
              n.channel, n.message, n.status, n.created_at,
              sender.display_name AS sender_name
       FROM blind_candidate_notifications n
       JOIN blind_candidates c ON c.id = n.candidate_id
       JOIN coverage_requests r ON r.id = c.request_id
       JOIN departments d ON d.id = r.department_id
       JOIN position_profiles p ON p.id = r.position_id
       LEFT JOIN users sender ON sender.id = n.created_by
       WHERE ($1::text IS NULL OR lower(d.name) = lower($1))
       ORDER BY n.created_at DESC
       LIMIT 100`,
      [areaName],
    );
    return result.rows;
  },

  async createSimulatedCandidateNotification(candidateId, message, actorId, areaName = null) {
    return withTransaction(async (client) => {
      const candidate = await client.query(
        `SELECT c.application_code, p.title AS position_title
         FROM blind_candidates c
         JOIN coverage_requests r ON r.id = c.request_id
         JOIN departments d ON d.id = r.department_id
         JOIN position_profiles p ON p.id = r.position_id
         WHERE c.id = $1 AND ($2::text IS NULL OR lower(d.name) = lower($2))`,
        [candidateId, areaName],
      );
      if (!candidate.rowCount) return null;

      const notification = await client.query(
        `INSERT INTO blind_candidate_notifications (candidate_id, message, created_by)
         VALUES ($1, $2, $3)
         RETURNING id, candidate_id, channel, message, status, created_at`,
        [candidateId, message, actorId],
      );
      const saved = notification.rows[0];
      await recordAudit(client, actorId, 'blind_candidate.notification_simulated', 'blind_candidate',
        candidateId, {
          applicationCode: candidate.rows[0].application_code,
          channel: saved.channel,
          status: saved.status,
        });
      return {
        ...saved,
        application_code: candidate.rows[0].application_code,
        position_title: candidate.rows[0].position_title,
      };
    });
  },

  async updateBlindCandidateStage(candidateId, processStage, publicMessage, actorId, appointment = null) {
    return withTransaction(async (client) => {
      const current = await client.query(
        `SELECT process_stage
         FROM blind_candidates
         WHERE id = $1
         FOR UPDATE`,
        [candidateId],
      );
      if (!current.rowCount) return null;
      const previousStage = current.rows[0].process_stage;
      if (previousStage === processStage && !publicMessage && !appointment) {
        throw new AppError(409, 'PROCESS_STAGE_UNCHANGED', 'El postulante ya se encuentra en esa etapa.');
      }

      const updated = previousStage === processStage
        ? await client.query(
          `SELECT process_stage, process_stage_updated_at
           FROM blind_candidates
           WHERE id = $1`,
          [candidateId],
        )
        : await client.query(
          `UPDATE blind_candidates
           SET process_stage = $2, process_stage_updated_at = now()
           WHERE id = $1
           RETURNING process_stage, process_stage_updated_at`,
          [candidateId, processStage],
        );
      await client.query(
        `INSERT INTO blind_candidate_process_history
           (candidate_id, previous_stage, process_stage, public_message, updated_by,
            interview_at, interview_modality, interview_location)
         VALUES ($1, $2, $3, $4, $5,
                 CASE WHEN $6::date IS NOT NULL AND $7::time IS NOT NULL
                   THEN ($6::date + $7::time) AT TIME ZONE 'America/Lima'
                 END,
                 $8, $9)`,
        [candidateId, previousStage, processStage, publicMessage, actorId,
          appointment?.interviewDate ?? null, appointment?.interviewTime ?? null,
          appointment?.interviewModality ?? null, appointment?.interviewLocation ?? null],
      );
      const eventType = previousStage !== processStage
        ? 'blind_candidate.process_stage_changed'
        : appointment
          ? 'blind_candidate.interview_scheduled'
          : 'blind_candidate.process_message_added';
      await recordAudit(client, actorId,
        eventType,
        'blind_candidate', candidateId, {
          previousStage,
          processStage,
          ...(appointment ? {
            interviewDate: appointment.interviewDate,
            interviewTime: appointment.interviewTime,
            interviewModality: appointment.interviewModality,
          } : {}),
        });
      return updated.rows[0];
    });
  },

  async getPublicApplicationProgress(applicationCode, documentNumber) {
    const result = await pool.query(
      `SELECT c.id, c.application_code, r.code AS request_code,
              p.title AS position_title, c.process_stage,
              c.process_stage_updated_at, c.created_at
       FROM blind_candidates c
       JOIN coverage_requests r ON r.id = c.request_id
       JOIN position_profiles p ON p.id = r.position_id
       WHERE upper(c.application_code) = $1 AND c.document_number = $2`,
      [applicationCode, documentNumber],
    );
    if (!result.rowCount) return null;
    const candidate = result.rows[0];
    const history = await pool.query(
      `SELECT process_stage, public_message, created_at,
              interview_at, interview_modality, interview_location
       FROM blind_candidate_process_history
       WHERE candidate_id = $1
       ORDER BY created_at, id`,
      [candidate.id],
    );
    return {
      applicationCode: candidate.application_code,
      requestCode: candidate.request_code,
      positionTitle: candidate.position_title,
      processStage: candidate.process_stage,
      processStageUpdatedAt: candidate.process_stage_updated_at,
      submittedAt: candidate.created_at,
      history: history.rows,
    };
  },

  async getPublicMatchCriteria(requestId) {
    const result = await pool.query(
      `SELECT r.application_documents,
              p.education, p.general_experience, p.specific_experience,
              p.technical_knowledge, p.principal_requirements,
              coalesce(json_agg(json_build_object('name', c.name, 'description', c.description))
                FILTER (WHERE c.id IS NOT NULL), '[]'::json) AS competencies
       FROM coverage_requests r
       JOIN position_profiles p ON p.id = r.position_id
       LEFT JOIN position_competencies c ON c.position_id = p.id
       WHERE r.id = $1 AND r.status = 'approved'
         AND r.application_deadline >= CURRENT_DATE
       GROUP BY p.id, r.application_documents`,
      [requestId],
    );
    return result.rows[0] ?? null;
  },

  async getBlindCandidateMatchInput(candidateId) {
    const result = await pool.query(
      `SELECT c.resume_file_path, c.resume_file_mime,
              p.education, p.general_experience, p.specific_experience,
              p.technical_knowledge, p.principal_requirements,
              coalesce(json_agg(json_build_object('name', pc.name, 'description', pc.description))
                FILTER (WHERE pc.id IS NOT NULL), '[]'::json) AS competencies
       FROM blind_candidates c
       JOIN coverage_requests r ON r.id = c.request_id
       LEFT JOIN position_profiles p ON p.id = r.position_id
       LEFT JOIN position_competencies pc ON pc.position_id = p.id
       WHERE c.id = $1
       GROUP BY c.id, p.id`,
      [candidateId],
    );
    return result.rows[0] ?? null;
  },

  async getBlindCandidateResumeReviewInput(candidateId, areaName = null) {
    const result = await pool.query(
      `SELECT c.id, c.application_code, c.full_name, c.document_number, c.email, c.phone,
              c.resume_file_name, c.resume_file_path, c.resume_file_mime, c.resume_file_sha256,
              (c.identity_revealed_at IS NOT NULL) AS identity_revealed,
              c.resume_reviewed_at,
              reviewer.display_name AS resume_reviewed_by_name
       FROM blind_candidates c
       JOIN coverage_requests r ON r.id = c.request_id
       JOIN departments d ON d.id = r.department_id
       LEFT JOIN users reviewer ON reviewer.id = c.resume_reviewed_by
       WHERE c.id = $1 AND ($2::text IS NULL OR lower(d.name) = lower($2))`,
      [candidateId, areaName],
    );
    return result.rows[0] ?? null;
  },

  async findExactDuplicateCandidateResumeFiles(candidateId, fileSha256) {
    if (!fileSha256) return [];
    const result = await pool.query(
      `SELECT application_code, document_type
       FROM (
         SELECT c.application_code, d.document_type
         FROM document_validations d
         JOIN blind_candidates c ON c.id = d.candidate_id
         WHERE d.file_sha256 = $2 AND c.id <> $1
         UNION
         SELECT c.application_code, 'Currículum' AS document_type
         FROM blind_candidates c
         WHERE c.resume_file_sha256 = $2 AND c.id <> $1
       ) AS duplicates
       ORDER BY application_code, document_type
       LIMIT 20`,
      [candidateId, fileSha256],
    );
    return result.rows.map((row) => ({
      applicationCode: row.application_code,
      documentType: row.document_type,
    }));
  },

  async markBlindCandidateResumeReviewed(candidateId, actorId) {
    return withTransaction(async (client) => {
      const result = await client.query(
        `UPDATE blind_candidates
         SET resume_reviewed_at = now(), resume_reviewed_by = $2
         WHERE id = $1 AND resume_file_path IS NOT NULL
         RETURNING id, application_code, resume_reviewed_at`,
        [candidateId, actorId],
      );
      if (!result.rowCount) return null;
      await recordAudit(client, actorId, 'blind_candidate.resume_reviewed', 'blind_candidate',
        candidateId, { applicationCode: result.rows[0].application_code });
      return result.rows[0];
    });
  },

  async updateBlindCandidateMatch(candidateId, matchResult, actorId) {
    return withTransaction(async (client) => {
      const result = await client.query(
        `UPDATE blind_candidates
         SET match_score = $2, match_status = $3, match_breakdown = $4,
             match_calculated_at = $5
         WHERE id = $1
         RETURNING match_score, match_status, match_breakdown, match_calculated_at`,
        [candidateId, matchResult.score, matchResult.status, JSON.stringify(matchResult.breakdown),
          matchResult.status === 'calculated' ? new Date() : null],
      );
      if (!result.rowCount) return null;
      await recordAudit(client, actorId, 'blind_candidate.match_calculated', 'blind_candidate',
        candidateId, { score: matchResult.score, status: matchResult.status });
      return result.rows[0];
    });
  },

  async getRevealedCandidateResume(candidateId) {
    const result = await pool.query(
      `SELECT resume_file_path AS file_path, resume_file_name AS file_name
       FROM blind_candidates
       WHERE id = $1 AND identity_revealed_at IS NOT NULL
         AND resume_file_path IS NOT NULL`,
      [candidateId],
    );
    return result.rows[0] ?? null;
  },

  async getBlindSelectionExamForReview(candidateId) {
    const result = await pool.query(
      `SELECT c.id, c.application_code, p.title AS position_title,
              e.objective_score, e.written_answers, e.written_review_status
       FROM blind_candidates c
       JOIN coverage_requests r ON r.id = c.request_id
       JOIN position_profiles p ON p.id = r.position_id
       JOIN blind_candidate_exams e ON e.candidate_id = c.id
       WHERE c.id = $1`,
      [candidateId],
    );
    if (!result.rowCount) return null;
    const candidate = result.rows[0];
    if (Number(candidate.objective_score) !== 100 || candidate.written_review_status !== 'pending') {
      throw new AppError(409, 'EXAM_NOT_REVIEWABLE', 'Solo se pueden revisar respuestas pendientes de postulantes con puntaje objetivo perfecto.');
    }
    const bank = EVALUATION_BANKS.find((item) => item.puesto === candidate.position_title);
    if (bank) validateEvaluationBank(bank);
    return {
      ...candidate,
      written_questions: bank?.preguntas
        .filter((question) => question.tipo === 'escrita')
        .map((question) => question.texto) ?? [],
    };
  },

  async createBlindSelectionCandidate(input, actorId) {
    return withTransaction(async (client) => {
      const request = await client.query(
        `SELECT r.id, r.code, r.status::text AS status, p.title
         FROM coverage_requests r
         JOIN position_profiles p ON p.id = r.position_id
         WHERE r.id = $1`,
        [input.requestId],
      );
      if (!request.rowCount) throw new AppError(404, 'REQUEST_NOT_FOUND', 'No se encontró la solicitud seleccionada.');
      if (['rejected', 'completed'].includes(request.rows[0].status)) {
        throw new AppError(409, 'REQUEST_NOT_OPEN', 'Solo se pueden registrar postulantes en solicitudes activas.');
      }

      const sequence = await client.query("SELECT nextval('blind_candidate_code_seq') AS value");
      const applicationCode = `PC-${String(sequence.rows[0].value).padStart(5, '0')}`;
      const candidate = await client.query(
        `INSERT INTO blind_candidates
           (application_code, request_id, full_name, document_number, email, phone, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, application_code, request_id`,
        [applicationCode, input.requestId, input.fullName, input.documentNumber,
          input.email || null, input.phone || null, actorId],
      );
      await client.query(
        `INSERT INTO blind_candidate_process_history
           (candidate_id, process_stage, updated_by, created_at)
         VALUES ($1, 'application_received', $2, now())`,
        [candidate.rows[0].id, actorId],
      );
      await recordAudit(client, actorId, 'blind_candidate.created', 'blind_candidate',
        candidate.rows[0].id, { applicationCode, requestCode: request.rows[0].code });
      return candidate.rows[0];
    });
  },

  async createPublicDemoApplication(input, resume, documents, matchResult) {
    return withTransaction(async (client) => {
      const request = await client.query(
        `SELECT r.id, r.code
         FROM coverage_requests r
         WHERE r.id = $1 AND r.status = 'approved'
           AND r.application_deadline >= CURRENT_DATE
         FOR SHARE`,
        [input.requestId],
      );
      if (!request.rowCount) {
        throw new AppError(404, 'OPENING_NOT_FOUND', 'La convocatoria ya no está disponible.');
      }

      const sequence = await client.query("SELECT nextval('blind_candidate_code_seq') AS value");
      const applicationCode = `PC-${String(sequence.rows[0].value).padStart(5, '0')}`;
      const candidate = await client.query(
        `INSERT INTO blind_candidates
           (application_code, request_id, full_name, document_number, email, phone,
            is_demo, resume_file_name, resume_file_path, resume_file_mime,
            resume_file_size, resume_file_sha256, match_score, match_status,
            match_breakdown, match_calculated_at)
         VALUES ($1, $2, $3, $4, $5, $6, true, $7, $8, 'application/pdf', $9, $10,
                 $11, $12, $13, $14)
         RETURNING id, application_code`,
        [applicationCode, input.requestId, input.fullName, input.documentNumber,
          input.email || null, input.phone || null, resume.fileName, resume.filePath,
          resume.fileSize, resume.fileSha256, matchResult.score, matchResult.status,
          JSON.stringify(matchResult.breakdown),
          matchResult.status === 'calculated' ? new Date() : null],
      );
      const savedDocuments = [];
      for (const document of documents) {
        const savedDocument = await client.query(
          `INSERT INTO document_validations
             (candidate_id, document_type, description, status, file_name, file_path,
              file_mime, file_size, file_sha256)
           VALUES ($1, $2, '', 'pending', $3, $4, 'application/pdf', $5, $6)
           RETURNING id, file_path`,
          [candidate.rows[0].id, document.label, document.fileName, document.filePath,
            document.fileSize, document.fileSha256],
        );
        savedDocuments.push(savedDocument.rows[0]);
      }
      await client.query(
        `INSERT INTO blind_candidate_process_history
           (candidate_id, process_stage, public_message, created_at)
         VALUES ($1, 'application_received', 'Recibimos tu postulación.', now())`,
        [candidate.rows[0].id],
      );
      await recordAudit(client, null, 'blind_candidate.demo_submitted', 'blind_candidate',
        candidate.rows[0].id, {
          applicationCode,
          requestCode: request.rows[0].code,
          matchScore: matchResult.score,
          matchStatus: matchResult.status,
          attachedDocumentCount: savedDocuments.length,
        });
      return { ...candidate.rows[0], documents: savedDocuments };
    });
  },

  async submitBlindSelectionExam(candidateId, answers, actorId) {
    return withTransaction(async (client) => {
      const candidateResult = await client.query(
        `SELECT c.id, c.application_code, c.process_stage, p.title AS position_title
         FROM blind_candidates c
         JOIN coverage_requests r ON r.id = c.request_id
         JOIN position_profiles p ON p.id = r.position_id
         WHERE c.id = $1
         FOR UPDATE OF c`,
        [candidateId],
      );
      if (!candidateResult.rowCount) throw new AppError(404, 'CANDIDATE_NOT_FOUND', 'No se encontró al postulante.');
      const candidate = candidateResult.rows[0];
      const bank = EVALUATION_BANKS.find((item) => item.puesto === candidate.position_title);
      if (!bank) {
        throw new AppError(409, 'NO_EVALUATION_BANK', 'No hay un banco de evaluación configurado para el puesto de esta solicitud.');
      }
      validateEvaluationBank(bank);
      if (answers.length !== bank.preguntas.length) {
        throw new AppError(400, 'INVALID_ANSWERS', 'Debes responder todas las preguntas del examen.');
      }
      const objectiveQuestions = bank.preguntas.filter((question) => question.tipo === 'opcion');
      for (const [index, question] of bank.preguntas.entries()) {
        const answer = answers[index];
        if (question.tipo === 'opcion') {
          if (!Number.isInteger(answer) || answer < 0 || answer >= question.opciones.length) {
            throw new AppError(400, 'INVALID_ANSWERS', 'Una respuesta de opción múltiple no es válida.');
          }
        } else if (typeof answer !== 'string' || !answer.trim()) {
          throw new AppError(400, 'INVALID_ANSWERS', 'Completa todas las preguntas de desarrollo.');
        }
      }

      const correctAnswers = bank.preguntas.reduce(
        (count, question, index) => count + (
          question.tipo === 'opcion' && answers[index] === question.respuesta ? 1 : 0
        ),
        0,
      );
      const objectiveScore = Math.round((correctAnswers / objectiveQuestions.length) * 100);
      const objectiveAnswers = bank.preguntas.map((question, index) => (
        question.tipo === 'opcion' ? answers[index] : null
      ));
      const writtenAnswers = bank.preguntas
        .map((question, index) => question.tipo === 'escrita' ? answers[index] : null)
        .filter((answer) => answer !== null);

      const existing = await client.query(
        'SELECT id FROM blind_candidate_exams WHERE candidate_id = $1',
        [candidateId],
      );
      if (existing.rowCount) {
        throw new AppError(409, 'EXAM_ALREADY_SUBMITTED', 'Este postulante ya tiene un examen registrado.');
      }
      const exam = await client.query(
        `INSERT INTO blind_candidate_exams
           (candidate_id, objective_answers, written_answers, objective_score)
         VALUES ($1, $2, $3, $4)
         RETURNING id, objective_score, written_review_status, submitted_at`,
        [candidateId, JSON.stringify(objectiveAnswers), JSON.stringify(writtenAnswers), objectiveScore],
      );
      if (candidate.process_stage !== 'exam') {
        await client.query(
          `UPDATE blind_candidates
           SET process_stage = 'exam', process_stage_updated_at = now()
           WHERE id = $1`,
          [candidateId],
        );
        await client.query(
          `INSERT INTO blind_candidate_process_history
             (candidate_id, previous_stage, process_stage, public_message, updated_by)
           VALUES ($1, $2, 'exam', 'El examen fue presentado.', $3)`,
          [candidateId, candidate.process_stage, actorId],
        );
      }
      await recordAudit(client, actorId, 'blind_candidate.exam_submitted', 'blind_candidate',
        candidateId, { applicationCode: candidate.application_code, objectiveScore });
      return { ...exam.rows[0], application_code: candidate.application_code, position_title: candidate.position_title };
    });
  },

  async reviewBlindSelectionExam(candidateId, status, actorId) {
    return withTransaction(async (client) => {
      const result = await client.query(
        `SELECT e.objective_score, e.written_review_status, c.application_code,
                c.identity_revealed_at, c.process_stage
         FROM blind_candidate_exams e
         JOIN blind_candidates c ON c.id = e.candidate_id
         WHERE c.id = $1
         FOR UPDATE OF e, c`,
        [candidateId],
      );
      if (!result.rowCount) throw new AppError(404, 'EXAM_NOT_FOUND', 'No se encontró un examen enviado para este postulante.');
      const exam = result.rows[0];
      if (Number(exam.objective_score) !== 100) {
        throw new AppError(409, 'VALLA_NOT_REACHED', 'Solo se revisan las respuestas abiertas de postulantes con 100% en opción múltiple.');
      }
      if (exam.written_review_status !== 'pending') {
        throw new AppError(409, 'EXAM_ALREADY_REVIEWED', 'Las respuestas de desarrollo de este examen ya fueron revisadas.');
      }
      const revealsIdentity = status === 'approved';
      await client.query(
        `UPDATE blind_candidate_exams
         SET written_review_status = $2, reviewed_by = $3, reviewed_at = now()
         WHERE candidate_id = $1`,
        [candidateId, status, actorId],
      );
      const previousStage = exam.process_stage;
      const nextStage = status === 'approved'
        ? ['application_received', 'document_review', 'exam'].includes(previousStage) ? 'interview' : previousStage
        : 'final_result';
      const stageMessage = status === 'approved'
        ? 'El postulante superó la etapa de examen.'
        : 'El postulante no continúa a la siguiente etapa.';
      if (previousStage !== nextStage) {
        await client.query(
          `UPDATE blind_candidates
           SET process_stage = $2, process_stage_updated_at = now()
           WHERE id = $1`,
          [candidateId, nextStage],
        );
        await client.query(
          `INSERT INTO blind_candidate_process_history
             (candidate_id, previous_stage, process_stage, public_message, updated_by)
           VALUES ($1, $2, $3, $4, $5)`,
          [candidateId, previousStage, nextStage, stageMessage, actorId],
        );
      }
      if (revealsIdentity) {
        await client.query(
          'UPDATE blind_candidates SET identity_revealed_at = now() WHERE id = $1',
          [candidateId],
        );
      }
      await recordAudit(client, actorId, 'blind_candidate.exam_reviewed', 'blind_candidate',
        candidateId, { applicationCode: exam.application_code, status, objectiveScore: exam.objective_score });
      if (revealsIdentity) {
        await recordAudit(client, actorId, 'blind_candidate.identity_revealed', 'blind_candidate',
          candidateId, { applicationCode: exam.application_code });
      }
      return { status, identityRevealed: revealsIdentity || Boolean(exam.identity_revealed_at) };
    });
  },

  getBlindSelectionBanks() {
    return EVALUATION_BANKS.map((bank) => {
      validateEvaluationBank(bank);
      return ({
      puesto: bank.puesto,
      gerencia: bank.gerencia,
      preguntas: bank.preguntas.map(({ tipo, texto, opciones }) => ({ tipo, texto, ...(opciones ? { opciones } : {}) })),
      });
    });
  },

  async getApplicationSettings() {
    const result = await pool.query(
      `SELECT anonymization_enabled AS "anonymizationEnabled",
              ocr_confidence_threshold AS "ocrConfidenceThreshold",
              institutional_data AS "institutionalData",
              catalog_data AS "catalogData"
       FROM application_settings
       WHERE id = 1`,
    );
    return result.rows[0];
  },

  async updateApplicationSettings(input, actorId) {
    return withTransaction(async (client) => {
      const result = await client.query(
        `UPDATE application_settings
         SET anonymization_enabled = $1, ocr_confidence_threshold = $2,
             institutional_data = COALESCE($3::jsonb, institutional_data),
             catalog_data = COALESCE($4::jsonb, catalog_data),
             updated_by = $5, updated_at = now()
         WHERE id = 1
         RETURNING anonymization_enabled AS "anonymizationEnabled",
                   ocr_confidence_threshold AS "ocrConfidenceThreshold",
                   institutional_data AS "institutionalData",
                   catalog_data AS "catalogData"`,
        [
          input.anonymizationEnabled,
          input.ocrConfidenceThreshold,
          input.institutionalData ? JSON.stringify(input.institutionalData) : null,
          input.catalogData ? JSON.stringify(input.catalogData) : null,
          actorId,
        ],
      );
      await recordAudit(client, actorId, 'application_settings.updated', 'application_settings', null, input);
      return result.rows[0];
    });
  },

  async getReportKpis(areaName = null) {
    const [requests, documents, workers, departments] = await Promise.all([
      pool.query(
        `SELECT count(*)::int AS total,
                count(*) FILTER (WHERE status IN ('pending', 'in_review'))::int AS pending
         FROM coverage_requests r JOIN departments d ON d.id = r.department_id
         WHERE ($1::text IS NULL OR lower(d.name) = lower($1))`,
        [areaName],
      ),
      pool.query(
        `SELECT count(*)::int AS completed
         FROM document_validations v
         JOIN coverage_requests r ON r.id = v.request_id
         JOIN departments d ON d.id = r.department_id
         WHERE v.ocr_status = 'completed' AND ($1::text IS NULL OR lower(d.name) = lower($1))`,
        [areaName],
      ),
      pool.query(
        `SELECT count(*)::int AS active
         FROM workers w JOIN departments d ON d.id = w.department_id
         WHERE w.status = 'active' AND ($1::text IS NULL OR lower(d.name) = lower($1))`,
        [areaName],
      ),
      pool.query(
        `SELECT d.name AS department, count(r.id)::int AS total
         FROM departments d
         JOIN coverage_requests r ON r.department_id = d.id
         WHERE ($1::text IS NULL OR lower(d.name) = lower($1))
         GROUP BY d.id, d.name
         ORDER BY total DESC, d.name`,
        [areaName],
      ),
    ]);

    return {
      totalRequests: requests.rows[0].total,
      pendingRequests: requests.rows[0].pending,
      ocrCompletedDocuments: documents.rows[0].completed,
      activeWorkers: workers.rows[0].active,
      requestsByDepartment: departments.rows,
    };
  },

  async getReportData(type, areaName = null) {
    const queries = {
      requests: `SELECT r.code, d.name AS department, p.title AS position, r.status::text AS status,
                        r.required_by, u.display_name AS requested_by, r.created_at, r.reviewed_at,
                        CASE WHEN r.reviewed_at IS NOT NULL
                          THEN round((extract(epoch FROM (r.reviewed_at - r.created_at)) / 86400)::numeric, 1)
                        END AS response_days
                 FROM coverage_requests r
                 JOIN departments d ON d.id = r.department_id
                 JOIN position_profiles p ON p.id = r.position_id
                 JOIN users u ON u.id = r.requested_by
                 WHERE ($1::text IS NULL OR lower(d.name) = lower($1))
                 ORDER BY r.created_at DESC`,
      workers: `SELECT w.employee_number, w.document_number, w.full_name, w.email, w.phone,
                       d.name AS department, p.title AS position, w.status::text AS status
                FROM workers w JOIN departments d ON d.id = w.department_id
                LEFT JOIN position_profiles p ON p.id = w.position_id
                WHERE ($1::text IS NULL OR lower(d.name) = lower($1))
                ORDER BY w.full_name`,
      evaluations: `SELECT e.evaluation_name, e.candidate_name, e.status::text AS status, e.score,
                            r.code AS request_code, w.full_name AS worker, e.created_at
                     FROM technical_evaluations e
                     LEFT JOIN coverage_requests r ON r.id = e.request_id
                     LEFT JOIN workers w ON w.id = e.worker_id
                     LEFT JOIN departments rd ON rd.id = r.department_id
                     LEFT JOIN departments wd ON wd.id = w.department_id
                     WHERE ($1::text IS NULL OR lower(coalesce(rd.name, wd.name)) = lower($1))
                     ORDER BY e.created_at DESC`,
    };
    const result = await pool.query(queries[type], [areaName]);
    return result.rows;
  },
};
