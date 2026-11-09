import { mkdirSync } from 'node:fs';
import { extname, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import multer from 'multer';
import { env } from '../config/env.js';
import { AppError } from '../errors/app-error.js';
import { APPLICATION_DOCUMENT_TYPES } from '../services/application-documents.js';

export const uploadsDirectory = resolve(process.cwd(), env.UPLOADS_DIR);

mkdirSync(uploadsDirectory, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, callback) => callback(null, uploadsDirectory),
  filename: (req, file, callback) => {
    const extension = extname(file.originalname).toLowerCase().slice(0, 12);
    callback(null, `${randomUUID()}${extension}`);
  },
});

export const uploadDocument = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
}).single('file');

export const uploadPublicApplication = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 6 },
  fileFilter: (req, file, callback) => {
    const allowedFields = new Set([
      'resume',
      ...APPLICATION_DOCUMENT_TYPES.map(({ type }) => type),
    ]);
    if (!allowedFields.has(file.fieldname)
      || file.mimetype !== 'application/pdf'
      || extname(file.originalname).toLowerCase() !== '.pdf') {
      return callback(new AppError(
        400,
        'INVALID_APPLICATION_DOCUMENT',
        'Adjunta el currículum y los documentos solicitados en formato PDF.',
      ));
    }
    return callback(null, true);
  },
}).fields([
  { name: 'resume', maxCount: 1 },
  ...APPLICATION_DOCUMENT_TYPES.map(({ type }) => ({ name: type, maxCount: 5 })),
]);
