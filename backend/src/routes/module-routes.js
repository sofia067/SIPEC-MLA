import { Router } from 'express';
import { z } from 'zod';
import { AppError } from '../errors/app-error.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { uploadDocument } from '../middleware/upload.js';
import { modulesRepository } from '../repositories/modules-repository.js';
import { notificationRepository } from '../repositories/notification-repository.js';
import { requestRepository } from '../repositories/request-repository.js';
import { hashPassword } from '../security/password.js';
import { documentService } from '../services/document-service.js';

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
  profileCode: z.string().trim().max(32).optional().default(''),
  referenceSalary: z.number().min(0).max(99999999.99).nullable().optional(),
  academicFormation: z.string().trim().max(4000).optional().default(''),
  generalExperience: z.string().trim().max(1000).optional().default(''),
  specificExperience: z.string().trim().max(1000).optional().default(''),
  technicalKnowledge: z.array(nonEmptyText(1000)).max(30).optional().default([]),
  responsibilities: z.array(nonEmptyText(2000)).max(30).optional().default([]),
  principalRequirements: z.string().trim().max(4000).default(''),
  description: z.string().trim().max(4000).default(''),
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
  priority: z.enum(['low', 'medium', 'high']).optional(),
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
  notes: z.string().trim().max(40000).default(''),
  score: z.union([z.literal(''), z.null(), z.coerce.number().min(0).max(100)]).optional().transform((value) => value === '' ? null : value),
  status: z.enum(['pending', 'completed']).default('pending'),
}).refine((data) => data.requestId || data.workerId, {
  message: 'Vincula la evaluación a una solicitud o a un trabajador.',
});
const evaluationScoreSchema = z.object({
  score: z.number().min(0).max(100),
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
const systemSettingsSchema = z.object({
  organizationName: nonEmptyText(200),
  fiscalYear: z.number().int().min(2000).max(2100),
  supportEmail: z.union([z.literal(''), z.email().max(254)]).default(''),
  maxUploadMb: z.number().int().min(1).max(50),
  passingScore: z.number().int().min(0).max(100),
  declarationDeadlineDays: z.number().int().min(1).max(90),
});
const departmentSchema = z.object({ name: nonEmptyText(160) });

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

  router.get('/notifications', async (req, res) => {
    res.json(await notificationRepository.listForUser(req.user.id));
  });
  router.patch('/notifications/:id/read', validateIdParam, async (req, res) => {
    const updated = await notificationRepository.markRead(req.params.id, req.user.id);
    if (!updated) throw new AppError(404, 'NOTIFICATION_NOT_FOUND', 'No se encontró la notificación.');
    res.status(204).end();
  });
  router.post('/notifications/read-all', async (req, res) => {
    const updated = await notificationRepository.markAllRead(req.user.id);
    res.json({ updated });
  });

  router.get('/lookups', async (req, res) => res.json(await modulesRepository.getLookups()));

  router.get('/workers', async (req, res) => res.json({ workers: await modulesRepository.listWorkers() }));
  router.post('/workers', async (req, res) => {
    const input = workerSchema.omit({ status: true }).parse(req.body);
    res.status(201).json({ worker: await modulesRepository.createWorker(input, req.user.id) });
  });
  router.patch('/workers/:id', async (req, res) => {
    const input = workerSchema.parse(req.body);
    res.json({ worker: await findOr404(() => modulesRepository.updateWorker(requireId(req.params.id), input, req.user.id)) });
  });
  router.delete('/workers/:id', async (req, res) => {
    await findOr404(() => modulesRepository.deleteWorker(requireId(req.params.id), req.user.id));
    res.status(204).end();
  });

  router.get('/profiles', async (req, res) => res.json({ profiles: await modulesRepository.listProfiles() }));
  router.get('/profiles/:id', async (req, res) => {
    const profile = await findOr404(
      () => modulesRepository.getProfile(requireId(req.params.id)),
      'No se encontró el perfil solicitado.',
    );
    res.json({ profile });
  });
  router.post('/profiles', async (req, res) => {
    const input = profileSchema.parse(req.body);
    res.status(201).json({ id: await modulesRepository.createProfile(input, req.user.id) });
  });
  router.patch('/profiles/:id', async (req, res) => {
    const input = profileSchema.parse(req.body);
    await findOr404(() => modulesRepository.updateProfile(requireId(req.params.id), input, req.user.id));
    res.json({ id: req.params.id });
  });
  router.delete('/profiles/:id', async (req, res) => {
    await findOr404(() => modulesRepository.deleteProfile(requireId(req.params.id), req.user.id));
    res.status(204).end();
  });

  router.get('/requests', async (req, res) => res.json({ requests: await requestRepository.listAll() }));
  router.get('/candidate-requests', async (req, res) => (
    res.json({ requests: await requestRepository.listCandidateRequests() })
  ));
  router.patch('/requests/:id', async (req, res) => {
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
  router.patch('/requests/:id/status', async (req, res) => {
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
  router.delete('/requests/:id', async (req, res) => {
    await findOr404(
      () => requestRepository.deletePending(requireId(req.params.id), req.user.id),
      'Solo se pueden eliminar solicitudes pendientes sin asignaciones.',
    );
    res.status(204).end();
  });

  router.get('/documents', async (req, res) => res.json({ documents: await modulesRepository.listWorkItems('documents') }));
  router.post('/documents', async (req, res) => {
    const input = documentSchema.parse(req.body);
    res.status(201).json({ document: await modulesRepository.createWorkItem('documents', input, req.user.id) });
  });
  router.patch('/documents/:id', async (req, res) => {
    const input = documentSchema.parse(req.body);
    res.json({ document: await findOr404(() => modulesRepository.updateWorkItem('documents', requireId(req.params.id), input, req.user.id)) });
  });
  router.delete('/documents/:id', async (req, res) => {
    await findOr404(() => modulesRepository.deleteWorkItem('documents', requireId(req.params.id), req.user.id));
    res.status(204).end();
  });

  router.get('/evaluations', async (req, res) => res.json({ evaluations: await modulesRepository.listWorkItems('evaluations') }));
  router.post('/evaluations', async (req, res) => {
    const input = evaluationSchema.parse(req.body);
    res.status(201).json({ evaluation: await modulesRepository.createWorkItem('evaluations', input, req.user.id) });
  });
  router.patch('/evaluations/:id', async (req, res) => {
    const input = evaluationSchema.parse(req.body);
    res.json({ evaluation: await findOr404(() => modulesRepository.updateWorkItem('evaluations', requireId(req.params.id), input, req.user.id)) });
  });
  router.patch('/evaluations/:id/score', async (req, res) => {
    const { score } = evaluationScoreSchema.parse(req.body);
    const evaluation = await findOr404(() => modulesRepository.scoreEvaluation(
      requireId(req.params.id),
      score,
      req.user.id,
    ));
    res.json({ evaluation });
  });
  router.delete('/evaluations/:id', async (req, res) => {
    await findOr404(() => modulesRepository.deleteWorkItem('evaluations', requireId(req.params.id), req.user.id));
    res.status(204).end();
  });

  router.post('/documents/:id/file', validateIdParam, uploadDocument, async (req, res) => {
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
  router.post('/documents/:id/ocr', async (req, res) => {
    res.status(202).json({ document: await documentService.reprocessOcr(requireId(req.params.id)) });
  });

  router.get('/assignments', async (req, res) => res.json({ assignments: await modulesRepository.listAssignments() }));
  router.post('/assignments', async (req, res) => {
    const input = assignmentSchema.parse(req.body);
    res.status(201).json({ assignment: await modulesRepository.createAssignment(input, req.user.id) });
  });
  router.patch('/assignments/:id', async (req, res) => {
    const input = assignmentSchema.parse(req.body);
    res.json({ assignment: await findOr404(() => modulesRepository.updateAssignment(requireId(req.params.id), input, req.user.id)) });
  });
  router.delete('/assignments/:id', async (req, res) => {
    await findOr404(() => modulesRepository.deleteAssignment(requireId(req.params.id), req.user.id));
    res.status(204).end();
  });

  router.get('/reports', async (req, res) => {
    const type = z.enum(['requests', 'workers', 'evaluations']).parse(req.query.type ?? 'requests');
    res.json({ type, rows: await modulesRepository.getReportData(type) });
  });
  router.get('/reports/:type.csv', async (req, res) => {
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

  router.get('/system-info', async (req, res) => {
    res.json({ system: await modulesRepository.getSystemInfo() });
  });

  router.get('/settings/users', authorize('admin'), async (req, res) => {
    res.json({ users: await modulesRepository.listUsers() });
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
  router.get('/settings/system', authorize('admin'), async (req, res) => {
    res.json({ settings: await modulesRepository.getSystemSettings() });
  });
  router.patch('/settings/system', authorize('admin'), async (req, res) => {
    const input = systemSettingsSchema.parse(req.body);
    res.json({ settings: await modulesRepository.updateSystemSettings(input, req.user.id) });
  });
  router.get('/settings/departments', authorize('admin'), async (req, res) => {
    res.json({ departments: await modulesRepository.listDepartments() });
  });
  router.post('/settings/departments', authorize('admin'), async (req, res) => {
    const { name } = departmentSchema.parse(req.body);
    res.status(201).json({ department: await modulesRepository.createDepartment(name, req.user.id) });
  });
  router.patch('/settings/departments/:id', authorize('admin'), async (req, res) => {
    const { name } = departmentSchema.parse(req.body);
    const department = await modulesRepository.updateDepartment(
      requireId(req.params.id),
      name,
      req.user.id,
    );
    res.json({ department: await findOr404(() => department) });
  });
  router.delete('/settings/departments/:id', authorize('admin'), async (req, res) => {
    await findOr404(
      () => modulesRepository.deleteDepartment(requireId(req.params.id), req.user.id),
    );
    res.status(204).end();
  });

  return router;
}
