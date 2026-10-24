import { mkdirSync } from 'node:fs';
import { extname, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import multer from 'multer';
import { env } from '../config/env.js';
import { AppError } from '../errors/app-error.js';

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

export const uploadApplicationResume = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, callback) => {
    if (file.mimetype !== 'application/pdf' || extname(file.originalname).toLowerCase() !== '.pdf') {
      return callback(new AppError(400, 'INVALID_RESUME_FORMAT', 'Adjunta el currículum en formato PDF.'));
    }
    return callback(null, true);
  },
}).single('resume');
