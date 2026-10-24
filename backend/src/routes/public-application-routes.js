import { createHash } from 'node:crypto';
import { readFile, unlink } from 'node:fs/promises';
import { basename } from 'node:path';
import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { z } from 'zod';
import { AppError } from '../errors/app-error.js';
import { uploadApplicationResume } from '../middleware/upload.js';
import { modulesRepository } from '../repositories/modules-repository.js';
import { requestRepository } from '../repositories/request-repository.js';
import { extractText } from '../services/ocr-service.js';
import { scoreResumeMatch } from '../services/match-scoring.js';

const applicationSchema = z.object({
  requestId: z.uuid(),
  fullName: z.string().trim().min(3).max(160),
  documentNumber: z.string().trim().min(6).max(24),
  email: z.union([z.literal(''), z.email().max(254)]).default(''),
  phone: z.string().trim().max(40).default(''),
  demoConfirmation: z.literal('true'),
});

const openingsLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    error: { code: 'OPENINGS_RATE_LIMIT', message: 'Demasiadas consultas. Intenta nuevamente en un minuto.' },
  },
});

const applicationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    error: { code: 'APPLICATION_RATE_LIMIT', message: 'Se alcanzó el límite de envíos de prueba. Intenta más tarde.' },
  },
});

async function removeUploadedResume(filePath) {
  try {
    await unlink(filePath);
  } catch (error) {
    if (error.code !== 'ENOENT') console.error('No se pudo eliminar el archivo de postulación:', error);
  }
}

export function createPublicApplicationRouter() {
  const router = Router();

  router.get('/public/applications/openings', openingsLimiter, async (req, res, next) => {
    try {
      return res.json({ openings: await requestRepository.listPublicOpenings() });
    } catch (error) {
      return next(error);
    }
  });

  router.post('/public/applications', applicationLimiter, uploadApplicationResume, async (req, res, next) => {
    let keepUploadedFile = false;
    try {
      if (!req.file) {
        throw new AppError(400, 'RESUME_REQUIRED', 'Adjunta un currículum de prueba en formato PDF.');
      }
      const input = applicationSchema.parse(req.body);
      const fileBuffer = await readFile(req.file.path);
      if (fileBuffer.length < 5 || fileBuffer.subarray(0, 5).toString() !== '%PDF-') {
        throw new AppError(400, 'INVALID_RESUME_CONTENT', 'El archivo adjunto no parece ser un PDF válido.');
      }
      const profile = await modulesRepository.getPublicMatchCriteria(input.requestId);
      if (!profile) {
        throw new AppError(404, 'OPENING_NOT_FOUND', 'La convocatoria ya no está disponible.');
      }

      const resume = {
        fileName: basename(req.file.originalname.replaceAll('\\', '/')).replace(/[\r\n]/g, '').slice(0, 260),
        filePath: req.file.path,
        fileSize: req.file.size,
        fileSha256: createHash('sha256').update(fileBuffer).digest('hex'),
      };
      let resumeText;
      try {
        resumeText = await extractText(req.file.path, 'application/pdf');
      } catch (error) {
        console.error('No se pudo extraer texto para calcular el match del CV:', error);
      }
      const matchResult = resumeText === undefined
        ? { status: 'extraction_failed', score: null, breakdown: [] }
        : scoreResumeMatch(profile, resumeText);
      const candidate = await modulesRepository.createPublicDemoApplication(input, resume, matchResult);
      keepUploadedFile = true;
      return res.status(201).json({
        application: {
          applicationCode: candidate.application_code,
          message: 'La postulación de demostración se registró correctamente.',
        },
      });
    } catch (error) {
      return next(error);
    } finally {
      if (req.file && !keepUploadedFile) await removeUploadedResume(req.file.path);
    }
  });

  return router;
}
