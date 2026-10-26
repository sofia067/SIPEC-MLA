import { mkdirSync } from 'node:fs';
import { extname, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import multer from 'multer';
import { env } from '../config/env.js';
import { pool } from '../db/pool.js';

export const uploadsDirectory = resolve(process.cwd(), env.UPLOADS_DIR);

mkdirSync(uploadsDirectory, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, callback) => callback(null, uploadsDirectory),
  filename: (req, file, callback) => {
    const extension = extname(file.originalname).toLowerCase().slice(0, 12);
    callback(null, `${randomUUID()}${extension}`);
  },
});

export async function uploadDocument(req, res, next) {
  try {
    const result = await pool.query('SELECT max_upload_mb FROM system_settings WHERE id = 1');
    const maxUploadMb = result.rows[0]?.max_upload_mb ?? 10;
    const upload = multer({
      storage,
      limits: { fileSize: maxUploadMb * 1024 * 1024, files: 1 },
    }).single('file');
    upload(req, res, (error) => {
      if (error?.name === 'MulterError' && error.code === 'LIMIT_FILE_SIZE') {
        error.uploadLimitMb = maxUploadMb;
      }
      next(error);
    });
  } catch (error) {
    next(error);
  }
}
