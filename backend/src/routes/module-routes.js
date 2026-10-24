import { Router } from 'express';
import { z } from 'zod';
import { AppError } from '../errors/app-error.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { uploadDocument } from '../middleware/upload.js';
import { modulesRepository } from '../repositories/modules-repository.js';
import { requestRepository } from '../repositories/request-repository.js';
import { hashPassword } from '../security/password.js';
import { documentService } from '../services/document-service.js';
import { extractText } from '../services/ocr-service.js';
import { scoreResumeMatch } from '../services/match-scoring.js';

const idSchema = z.uuid();
const nonEmptyText = (max) => z.string().trim().min(1).max(max);
const workerSchema = z.object({
  employeeNumber: nonEmptyText(32),
  documentNumber: nonEmptyText(24),
  fullName: nonEmptyText(160),
  email: z.union([z.literal(''), z.email().max(254)]).optional().default(''),
  phone: z.string().trim().max(40).optional().default(''),
  department: nonEmptyText(160),
  positionId: z.union([z.literal(''), idSchema]).optional().default(''),
  status: z.enum(['active', 'inactive']).default('active'),
});
const competencySchema = z.object({
  name: nonEmptyText(160),
  description: z.string().trim().max(2000).default(''),
});
const profileSchema = z.object({
  title: nonEmptyText(160),
  department: nonEmptyText(160),
  level: nonEmptyText(80),
  principalRequirements: z.string().trim().max(4000).default(''),
  description: z.string().trim().max(4000).default(''),
  profileCode: z.string().trim().max(40).default(''),
  remuneration: z.union([z.literal(''), z.coerce.number().min(0).max(9999999999.99)]).optional().transform((value) => value === '' ? null : value),
  education: z.string().trim().max(4000).default(''),
  generalExperience: z.string().trim().max(2000).default(''),
  specificExperience: z.string().trim().max(2000).default(''),
  technicalKnowledge: z.string().trim().max(8000).default(''),
  functions: z.array(nonEmptyText(2000)).max(60).default([]),
  status: z.enum(['active', 'inactive']).default('active'),
  competencies: z.array(competencySchema).max(30).default([]),
});
const requestStatusSchema = z.object({
  status: z.enum(['pending', 'in_review', 'approved', 'rejected', 'completed']),
});
const requestDetailsSchema = z.object({
  department: nonEmptyText(160),
  positionTitle: nonEmptyText(160),
  reason: z.string().trim().min(10).max(4000),
  priority: z.enum(['Alta', 'Media', 'Baja']).default('Media'),
  requiredBy: z.union([z.literal(''), z.iso.date()]).optional().transform((value) => value || null),
});
const documentSchema = z.object({
  requestId: z.union([z.literal(''), idSchema]).optional().default(''),
  workerId: z.union([z.literal(''), idSchema]).optional().default(''),
  documentType: nonEmptyText(120),
  description: z.string().trim().max(2000).default(''),
  status: z.enum(['pending', 'completed']).default('pending'),
}).refine((data) => data.requestId || data.workerId, {
  message: 'Vincula el documento a una solicitud o a un trabajador.',
});
const evaluationSchema = z.object({
  requestId: z.union([z.literal(''), idSchema]).optional().default(''),
  workerId: z.union([z.literal(''), idSchema]).optional().default(''),
  evaluationName: nonEmptyText(160).default('Evaluación técnica'),
  candidateName: z.string().trim().max(160).default(''),
  notes: z.string().trim().max(4000).default(''),
  score: z.union([z.literal(''), z.coerce.number().min(0).max(100)]).optional().transform((value) => value === '' ? null : value),
  status: z.enum(['pending', 'completed']).default('pending'),
}).refine((data) => data.requestId || data.workerId, {
  message: 'Vincula la evaluación a una solicitud o a un trabajador.',
});
const assignmentSchema = z.object({
  requestId: idSchema,
  workerId: z.union([z.literal(''), idSchema]).optional().default(''),
  employeeName: nonEmptyText(160),
  startsOn: z.iso.date(),
  notes: z.string().trim().max(2000).default(''),
});
const createUserSchema = z.object({
  username: nonEmptyText(80).toLowerCase(),
  displayName: nonEmptyText(160),
  role: z.enum(['admin', 'hr_specialist', 'area_manager']),
  areaName: z.string().trim().max(160).default(''),
  password: z.string().min(12).max(256),
});
const updateUserSchema = z.object({
  displayName: nonEmptyText(160),
  role: z.enum(['admin', 'hr_specialist', 'area_manager']),
  areaName: z.string().trim().max(160).default(''),
  password: z.union([z.literal(''), z.string().min(12).max(256)]).optional().default(''),
  isActive: z.boolean(),
});
const applicationSettingsSchema = z.object({
  anonymizationEnabled: z.boolean(),
  ocrConfidenceThreshold: z.number().int().min(0).max(100),
});
const blindCandidateSchema = z.object({
  requestId: idSchema,
  fullName: nonEmptyText(160),
  documentNumber: nonEmptyText(24),
  email: z.union([z.literal(''), z.email().max(254)]).optional().default(''),
  phone: z.string().trim().max(40).optional().default(''),
});
const blindExamSchema = z.object({
  answers: z.array(z.union([z.number().int(), z.string().max(2000)])).length(20),
});
const blindExamReviewSchema = z.object({
  status: z.enum(['approved', 'rejected']),
});

const requireId = (rawId) => {
  const parsed = idSchema.safeParse(rawId);
  if (!parsed.success) throw new AppError(400, 'INVALID_ID', 'El identificador no es válido.');
  return parsed.data;
};

const validateIdParam = (req, res, next) => {
  try {
    req.params.id = requireId(req.params.id);
    return next();
  } catch (error) {
    return next(error);
  }
};

async function findOr404(action, message = 'No se encontró el registro solicitado.') {
  const result = await action();
  if (!result) throw new AppError(404, 'NOT_FOUND', message);
  return result;
}

function csvCell(value) {
  let text = value == null ? '' : value instanceof Date ? value.toISOString() : String(value);
  if (/^[\s]*[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

export function createModuleRouter() {
  const router = Router();
  router.use(authenticate);

  router.get('/lookups', async (req, res) => res.json(await modulesRepository.getLookups()));

  router.get('/workers', async (req, res) => res.json({ workers: await modulesRepository.listWorkers() }));
  router.post('/workers', authorize('admin', 'hr_specialist'), async (req, res) => {
    const input = workerSchema.omit({ status: true }).parse(req.body);
    res.status(201).json({ worker: await modulesRepository.createWorker(input, req.user.id) });
  });
  router.patch('/workers/:id', authorize('admin', 'hr_specialist'), async (req, res) => {
    const input = workerSchema.parse(req.body);
    res.json({ worker: await findOr404(() => modulesRepository.updateWorker(requireId(req.params.id), input, req.user.id)) });
  });
  router.delete('/workers/:id', authorize('admin', 'hr_specialist'), async (req, res) => {
    await findOr404(() => modulesRepository.deleteWorker(requireId(req.params.id), req.user.id));
    res.status(204).end();
  });

  router.get('/profiles', async (req, res) => res.json({ profiles: await modulesRepository.listProfiles() }));
  router.post('/profiles', authorize('admin', 'hr_specialist', 'area_manager'), async (req, res) => {
    const input = profileSchema.parse(req.body);
    res.status(201).json({ id: await modulesRepository.createProfile(input, req.user.id) });
  });
  router.patch('/profiles/:id', authorize('admin', 'hr_specialist', 'area_manager'), async (req, res) => {
    const input = profileSchema.parse(req.body);
    await findOr404(() => modulesRepository.updateProfile(requireId(req.params.id), input, req.user.id));
    res.json({ id: req.params.id });
  });
  router.delete('/profiles/:id', authorize('admin', 'hr_specialist', 'area_manager'), async (req, res) => {
    await findOr404(() => modulesRepository.deleteProfile(requireId(req.params.id), req.user.id));
    res.status(204).end();
  });

  router.get('/requests', async (req, res) => res.json({ requests: await requestRepository.listAll() }));
  router.patch('/requests/:id', authorize('admin', 'hr_specialist'), async (req, res) => {
    const input = requestDetailsSchema.parse(req.body);
    if (input.requiredBy && input.requiredBy < new Date().toISOString().slice(0, 10)) {
      throw new AppError(400, 'INVALID_REQUIRED_DATE', 'La fecha requerida no puede estar en el pasado.');
    }
    const result = await findOr404(
      () => requestRepository.updatePending(requireId(req.params.id), input, req.user.id),
      'Solo se pueden editar solicitudes pendientes.',
    );
    res.json({ request: result });
  });
  router.patch('/requests/:id/status', authorize('admin', 'hr_specialist'), async (req, res) => {
    const { status } = requestStatusSchema.parse(req.body);
    if (status === 'completed') {
      throw new AppError(400, 'INVALID_STATUS_TRANSITION', 'Una solicitud se completa mediante una asignación.');
    }
    const result = await findOr404(
      () => requestRepository.updateStatus(requireId(req.params.id), status, req.user.id),
      'La solicitud no existe o el cambio de estado no está permitido.',
    );
    res.json({ request: result });
  });
  router.delete('/requests/:id', authorize('admin', 'hr_specialist'), async (req, res) => {
    await findOr404(
      () => requestRepository.deletePending(requireId(req.params.id), req.user.id),
      'Solo se pueden eliminar solicitudes pendientes sin asignaciones.',
    );
    res.status(204).end();
  });

  router.get('/documents', async (req, res) => res.json({ documents: await modulesRepository.listWorkItems('documents') }));
  router.post('/documents', authorize('admin', 'hr_specialist'), async (req, res) => {
    const input = documentSchema.parse(req.body);
    res.status(201).json({ document: await modulesRepository.createWorkItem('documents', input, req.user.id) });
  });
  router.patch('/documents/:id', authorize('admin', 'hr_specialist'), async (req, res) => {
    const input = documentSchema.parse(req.body);
    res.json({ document: await findOr404(() => modulesRepository.updateWorkItem('documents', requireId(req.params.id), input, req.user.id)) });
  });
  router.delete('/documents/:id', authorize('admin', 'hr_specialist'), async (req, res) => {
    await findOr404(() => modulesRepository.deleteWorkItem('documents', requireId(req.params.id), req.user.id));
    res.status(204).end();
  });

  router.get('/evaluations', async (req, res) => res.json({ evaluations: await modulesRepository.listWorkItems('evaluations') }));
  router.post('/evaluations', authorize('admin', 'hr_specialist'), async (req, res) => {
    const input = evaluationSchema.parse(req.body);
    res.status(201).json({ evaluation: await modulesRepository.createWorkItem('evaluations', input, req.user.id) });
  });
  router.patch('/evaluations/:id', authorize('admin', 'hr_specialist'), async (req, res) => {
    const input = evaluationSchema.parse(req.body);
    res.json({ evaluation: await findOr404(() => modulesRepository.updateWorkItem('evaluations', requireId(req.params.id), input, req.user.id)) });
  });
  router.delete('/evaluations/:id', authorize('admin', 'hr_specialist'), async (req, res) => {
    await findOr404(() => modulesRepository.deleteWorkItem('evaluations', requireId(req.params.id), req.user.id));
    res.status(204).end();
  });

  router.get('/blind-selection/banks', authorize('admin', 'hr_specialist'), async (req, res) => {
    res.json({ banks: modulesRepository.getBlindSelectionBanks() });
  });
  router.get('/blind-selection/candidates', authorize('admin', 'hr_specialist'), async (req, res) => {
    res.json({ candidates: await modulesRepository.listBlindSelectionCandidates() });
  });
  router.post('/blind-selection/candidates/:id/match', authorize('admin', 'hr_specialist'), async (req, res, next) => {
    try {
      const candidateId = requireId(req.params.id);
      const candidate = await modulesRepository.getBlindCandidateMatchInput(candidateId);
      if (!candidate) throw new AppError(404, 'CANDIDATE_NOT_FOUND', 'No se encontró al postulante.');
      if (!candidate.resume_file_path) {
        throw new AppError(404, 'RESUME_NOT_AVAILABLE', 'Este postulante no tiene un CV adjunto para calcular el match.');
      }

      let resumeText;
      try {
        resumeText = await extractText(candidate.resume_file_path, candidate.resume_file_mime);
      } catch (error) {
        console.error('No se pudo extraer texto para calcular el match del CV:', error);
        throw new AppError(422, 'MATCH_EXTRACTION_FAILED', 'No se pudo leer el CV. Verifica el archivo e inténtalo nuevamente.');
      }
      const matchResult = scoreResumeMatch(candidate, resumeText);
      const match = await modulesRepository.updateBlindCandidateMatch(candidateId, matchResult, req.user.id);
      if (!match) throw new AppError(404, 'CANDIDATE_NOT_FOUND', 'No se encontró al postulante.');
      return res.json({ match });
    } catch (error) {
      return next(error);
    }
  });
  router.get('/blind-selection/candidates/:id/resume', authorize('admin', 'hr_specialist'), async (req, res, next) => {
    try {
      const file = await modulesRepository.getRevealedCandidateResume(requireId(req.params.id));
      if (!file) throw new AppError(404, 'RESUME_NOT_AVAILABLE', 'El CV no está disponible hasta que se revele la identidad del postulante.');
      return res.download(file.file_path, file.file_name, (error) => {
        if (error) next(error);
      });
    } catch (error) {
      return next(error);
    }
  });
  router.post('/blind-selection/candidates', authorize('admin', 'hr_specialist'), async (req, res) => {
    const input = blindCandidateSchema.parse(req.body);
    const candidate = await modulesRepository.createBlindSelectionCandidate(input, req.user.id);
    res.status(201).json({ candidate });
  });
  router.post('/blind-selection/candidates/:id/exam', authorize('admin', 'hr_specialist'), async (req, res) => {
    const { answers } = blindExamSchema.parse(req.body);
    const exam = await modulesRepository.submitBlindSelectionExam(
      requireId(req.params.id),
      answers,
      req.user.id,
    );
    res.status(201).json({ exam });
  });
  router.get('/blind-selection/candidates/:id/review', authorize('admin', 'hr_specialist'), async (req, res) => {
    const exam = await findOr404(
      () => modulesRepository.getBlindSelectionExamForReview(requireId(req.params.id)),
      'No se encontró un examen para revisar.',
    );
    res.json({ exam });
  });
  router.patch('/blind-selection/candidates/:id/review', authorize('admin', 'hr_specialist'), async (req, res) => {
    const { status } = blindExamReviewSchema.parse(req.body);
    const result = await modulesRepository.reviewBlindSelectionExam(
      requireId(req.params.id),
      status,
      req.user.id,
    );
    res.json(result);
  });

  router.post('/documents/:id/file', authorize('admin', 'hr_specialist'), validateIdParam, uploadDocument, async (req, res) => {
    const document = await documentService.attachFile(req.params.id, req.file, req.user.id);
    res.status(202).json({ document });
  });
  router.get('/documents/:id/file', async (req, res) => {
    const file = await findOr404(
      () => modulesRepository.getDocumentFile(requireId(req.params.id)),
      'El documento no tiene archivo adjunto.',
    );
    if (!file.file_path) throw new AppError(404, 'NO_FILE', 'El documento no tiene archivo adjunto.');
    res.download(file.file_path, file.file_name ?? undefined);
  });
  router.post('/documents/:id/ocr', authorize('admin', 'hr_specialist'), async (req, res) => {
    res.status(202).json({ document: await documentService.reprocessOcr(requireId(req.params.id)) });
  });

  router.get('/assignments', async (req, res) => res.json({ assignments: await modulesRepository.listAssignments() }));
  router.post('/assignments', authorize('admin', 'hr_specialist'), async (req, res) => {
    const input = assignmentSchema.parse(req.body);
    res.status(201).json({ assignment: await modulesRepository.createAssignment(input, req.user.id) });
  });
  router.patch('/assignments/:id', authorize('admin', 'hr_specialist'), async (req, res) => {
    const input = assignmentSchema.parse(req.body);
    res.json({ assignment: await findOr404(() => modulesRepository.updateAssignment(requireId(req.params.id), input, req.user.id)) });
  });
  router.delete('/assignments/:id', authorize('admin', 'hr_specialist'), async (req, res) => {
    await findOr404(() => modulesRepository.deleteAssignment(requireId(req.params.id), req.user.id));
    res.status(204).end();
  });

  router.get('/reports', authorize('admin', 'hr_specialist'), async (req, res) => {
    const type = z.enum(['requests', 'workers', 'evaluations']).parse(req.query.type ?? 'requests');
    res.json({ type, rows: await modulesRepository.getReportData(type) });
  });
  router.get('/reports/kpis', authorize('admin', 'hr_specialist'), async (req, res) => {
    res.json(await modulesRepository.getReportKpis());
  });
  router.get('/reports/:type.csv', authorize('admin', 'hr_specialist'), async (req, res) => {
    const type = z.enum(['requests', 'workers', 'evaluations']).parse(req.params.type);
    const rows = await modulesRepository.getReportData(type);
    const columns = rows.length ? Object.keys(rows[0]) : [];
    const content = [columns, ...rows.map((row) => columns.map((column) => row[column]))]
      .map((row) => row.map(csvCell).join(','))
      .join('\r\n');
    res.type('text/csv; charset=utf-8');
    res.attachment(`sipec-${type}.csv`);
    res.send(`\uFEFF${content}`);
  });

  router.get('/audit', authorize('admin'), async (req, res) => {
    res.json({ events: await modulesRepository.listAuditEvents() });
  });

  router.get('/settings/users', authorize('admin'), async (req, res) => {
    res.json({ users: await modulesRepository.listUsers() });
  });
  router.get('/settings', authorize('admin'), async (req, res) => {
    res.json({ settings: await modulesRepository.getApplicationSettings() });
  });
  router.put('/settings', authorize('admin'), async (req, res) => {
    const input = applicationSettingsSchema.parse(req.body);
    res.json({ settings: await modulesRepository.updateApplicationSettings(input, req.user.id) });
  });
  router.post('/settings/users', authorize('admin'), async (req, res) => {
    const input = createUserSchema.parse(req.body);
    const user = await modulesRepository.createUser(input, req.user.id, await hashPassword(input.password));
    res.status(201).json({ user });
  });
  router.patch('/settings/users/:id', authorize('admin'), async (req, res) => {
    const input = updateUserSchema.parse(req.body);
    const id = requireId(req.params.id);
    if (id === req.user.id && !input.isActive) {
      throw new AppError(400, 'CANNOT_DEACTIVATE_SELF', 'No puedes desactivar tu propia cuenta.');
    }
    const passwordHash = input.password ? await hashPassword(input.password) : null;
    const user = await findOr404(() => modulesRepository.updateUser(
      id,
      input,
      req.user.id,
      passwordHash,
    ), 'No existe el usuario o no puede modificarse.');
    res.json({ user });
  });
  router.delete('/settings/users/:id', authorize('admin'), async (req, res) => {
    const id = requireId(req.params.id);
    if (id === req.user.id) throw new AppError(400, 'CANNOT_DEACTIVATE_SELF', 'No puedes desactivar tu propia cuenta.');
    await findOr404(() => modulesRepository.deactivateUser(id, req.user.id), 'No existe el usuario o no puede desactivarse.');
    res.status(204).end();
  });

  return router;
}
