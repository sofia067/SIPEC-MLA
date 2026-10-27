import { Router } from 'express';
import multer from 'multer';
import { rateLimit } from 'express-rate-limit';
import { z } from 'zod';
import { AppError } from '../errors/app-error.js';
import { authenticate } from '../middleware/authenticate.js';
import { requestRepository } from '../repositories/request-repository.js';
import { requestService } from '../services/request-service.js';

const applicationUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1, fields: 6, parts: 7 },
  fileFilter(req, file, callback) {
    if (file.mimetype !== 'application/pdf' || !file.originalname.toLowerCase().endsWith('.pdf')) {
      return callback(new AppError(400, 'INVALID_RESUME', 'Adjunta un archivo PDF válido.'));
    }
    return callback(null, true);
  },
}).single('resume');

const publicApplicationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    error: { code: 'APPLICATION_RATE_LIMIT', message: 'Se alcanzó el límite de postulaciones de prueba. Intenta más tarde.' },
  },
});

const applicationSchema = z.object({
  requestId: z.uuid(),
  fullName: z.string().trim().min(3).max(160),
  documentNumber: z.string().trim().min(6).max(24),
  email: z.union([z.literal(''), z.email().max(254)]).optional().default(''),
  phone: z.string().trim().max(40).optional().default(''),
  demoConfirmation: z.literal('true'),
});

const requestSchema = z.object({
  department: z.string().trim().min(2).max(160),
  positionTitle: z.string().trim().min(2).max(160),
  reason: z.string().trim().min(10).max(4000),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  requiredBy: z.union([z.literal(''), z.iso.date()]).optional().transform((value) => value || null),
});

export function createRequestRouter() {
  const router = Router();

  router.post('/public/applications', publicApplicationLimiter, (req, res, next) => {
    applicationUpload(req, res, (error) => {
      if (error?.name === 'MulterError' && error.code === 'LIMIT_FILE_SIZE') {
        error.uploadLimitMb = 5;
      }
      next(error);
    });
  }, async (req, res) => {
    const input = applicationSchema.parse(req.body);
    if (!req.file) {
      throw new AppError(400, 'RESUME_REQUIRED', 'Adjunta el currículum ficticio en PDF.');
    }
    if (req.file.buffer.subarray(0, 5).toString('ascii') !== '%PDF-') {
      throw new AppError(400, 'INVALID_RESUME', 'El archivo adjunto no contiene un PDF válido.');
    }

    const application = await requestRepository.createPublicApplication({
      ...input,
      resumeName: req.file.originalname.replace(/[\\/\u0000-\u001f\u007f]/g, '_').slice(0, 255),
      resumeContent: req.file.buffer,
    });
    res.status(201).json({ application });
  });

  router.get('/public/applications/openings', async (req, res, next) => {
    try {
      return res.json({ openings: await requestRepository.listPublicOpenings() });
    } catch (error) {
      return next(error);
    }
  });

  router.use(authenticate);

  router.get('/dashboard', async (req, res, next) => {
    try {
      return res.json(await requestService.getDashboard());
    } catch (error) {
      return next(error);
    }
  });

  router.post('/requests', async (req, res, next) => {
    try {
      const input = requestSchema.parse(req.body);
      const request = await requestService.create(input, req.user.id);
      return res.status(201).json({ request });
    } catch (error) {
      return next(error);
    }
  });

  return router;
}
