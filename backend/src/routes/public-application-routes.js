import { createHash } from 'node:crypto';
import { readFile, unlink } from 'node:fs/promises';
import { basename } from 'node:path';
import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { z } from 'zod';
import { AppError } from '../errors/app-error.js';
import { uploadPublicApplication } from '../middleware/upload.js';
import { modulesRepository } from '../repositories/modules-repository.js';
import { requestRepository } from '../repositories/request-repository.js';
import { getApplicationDocumentLabel } from '../services/application-documents.js';
import { processUploadedDocument } from '../services/document-service.js';
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
const trackingSchema = z.object({
  applicationCode: z.string().trim().min(1).max(24).transform((value) => value.toUpperCase()),
  documentNumber: z.string().trim().min(6).max(24),
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

const trackingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    error: { code: 'APPLICATION_TRACKING_RATE_LIMIT', message: 'Demasiadas consultas de seguimiento. Intenta nuevamente más tarde.' },
  },
});

async function removeUploadedFiles(files) {
  await Promise.all(files.map(async (file) => {
    try {
      await unlink(file.path);
    } catch (error) {
      if (error.code !== 'ENOENT') console.error('No se pudo eliminar un archivo de postulación:', error);
    }
  }));
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

  router.post('/public/applications/track', trackingLimiter, async (req, res, next) => {
    try {
      const input = trackingSchema.parse(req.body);
      const progress = await modulesRepository.getPublicApplicationProgress(
        input.applicationCode, input.documentNumber,
      );
      if (!progress) {
        throw new AppError(404, 'APPLICATION_NOT_FOUND', 'No se encontró un seguimiento con esos datos.');
      }
      return res.json({ progress });
    } catch (error) {
      return next(error);
    }
  });

  router.post('/public/applications', applicationLimiter, uploadPublicApplication, async (req, res, next) => {
    let keepUploadedFiles = false;
    const uploadedFiles = Object.values(req.files ?? {}).flat();
    try {
      const resumeFile = req.files?.resume?.[0];
      if (!resumeFile) {
        throw new AppError(400, 'RESUME_REQUIRED', 'Adjunta un currículum de prueba en formato PDF.');
      }
      const input = applicationSchema.parse(req.body);
      const resumeBuffer = await readFile(resumeFile.path);
      if (resumeBuffer.length < 5 || resumeBuffer.subarray(0, 5).toString() !== '%PDF-') {
        throw new AppError(400, 'INVALID_RESUME_CONTENT', 'El currículum adjunto no parece ser un PDF válido.');
      }
      const profile = await modulesRepository.getPublicMatchCriteria(input.requestId);
      if (!profile) {
        throw new AppError(404, 'OPENING_NOT_FOUND', 'La convocatoria ya no está disponible.');
      }

      const configuredDocuments = profile.application_documents ?? [];
      const uploadedDocuments = Object.entries(req.files ?? {})
        .filter(([type]) => type !== 'resume')
        .flatMap(([type, files]) => files.map((file) => ({ type, file })));
      const configuredTypes = new Set(configuredDocuments.map(({ type }) => type));
      const missingRequired = configuredDocuments
        .filter(({ type, required }) => required && !req.files?.[type]?.length)
        .map(({ type }) => getApplicationDocumentLabel(type));
      if (missingRequired.length) {
        throw new AppError(
          400,
          'REQUIRED_APPLICATION_DOCUMENTS_MISSING',
          `Adjunta los documentos obligatorios: ${missingRequired.join(', ')}.`,
        );
      }
      const unexpectedDocument = uploadedDocuments.find(({ type }) => !configuredTypes.has(type));
      if (unexpectedDocument) {
        throw new AppError(
          400,
          'UNREQUESTED_APPLICATION_DOCUMENT',
          'Adjuntaste un tipo de documento que no está solicitado en esta convocatoria.',
        );
      }

      const applicationDocuments = [];
      for (const { type, file } of uploadedDocuments) {
        const fileBuffer = await readFile(file.path);
        if (fileBuffer.length < 5 || fileBuffer.subarray(0, 5).toString() !== '%PDF-') {
          throw new AppError(400, 'INVALID_APPLICATION_DOCUMENT_CONTENT', 'Uno de los certificados adjuntos no parece ser un PDF válido.');
        }
        applicationDocuments.push({
          type,
          label: getApplicationDocumentLabel(type),
          fileName: basename(file.originalname.replaceAll('\\', '/')).replace(/[\r\n]/g, '').slice(0, 260),
          filePath: file.path,
          fileSize: file.size,
          fileSha256: createHash('sha256').update(fileBuffer).digest('hex'),
        });
      }

      const resume = {
        fileName: basename(resumeFile.originalname.replaceAll('\\', '/')).replace(/[\r\n]/g, '').slice(0, 260),
        filePath: resumeFile.path,
        fileSize: resumeFile.size,
        fileSha256: createHash('sha256').update(resumeBuffer).digest('hex'),
      };
      let resumeText;
      try {
        resumeText = await extractText(resumeFile.path, 'application/pdf');
      } catch (error) {
        console.error('No se pudo extraer texto para calcular el match del CV:', error);
      }
      const matchResult = resumeText === undefined
        ? { status: 'extraction_failed', score: null, breakdown: [] }
        : scoreResumeMatch(profile, resumeText);
      const candidate = await modulesRepository.createPublicDemoApplication(
        input, resume, applicationDocuments, matchResult,
      );
      keepUploadedFiles = true;
      for (const document of candidate.documents) {
        processUploadedDocument(document.id, document.file_path, 'application/pdf');
      }
      return res.status(201).json({
        application: {
          applicationCode: candidate.application_code,
          message: 'La postulación de demostración se registró correctamente.',
        },
      });
    } catch (error) {
      return next(error);
    } finally {
      if (!keepUploadedFiles) await removeUploadedFiles(uploadedFiles);
    }
  });

  return router;
}
