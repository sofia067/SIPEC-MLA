import { mkdirSync } from 'node:fs';
import { extname, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import multer from 'multer';
import { env } from '../config/env.js';

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
