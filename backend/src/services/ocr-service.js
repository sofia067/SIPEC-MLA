import { createRequire } from 'node:module';
import { mkdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { env } from '../config/env.js';

const require = createRequire(import.meta.url);
const { PDFParse } = require('pdf-parse');

const SUPPORTED_IMAGE_MIME = new Set([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/bmp',
  'image/tiff',
]);

let workerPromise = null;
let queue = Promise.resolve();

export function isSupportedMime(mime) {
  return mime === 'application/pdf' || SUPPORTED_IMAGE_MIME.has(mime);
}

async function getWorker() {
  if (!workerPromise) {
    workerPromise = (async () => {
      const { createWorker } = await import('tesseract.js');
      const cachePath = join(process.cwd(), '.cache', 'tesseract');
      await mkdir(cachePath, { recursive: true });
      return createWorker(env.OCR_LANGUAGES, 1, { cachePath });
    })().catch((error) => {
      workerPromise = null;
      throw error;
    });
  }
  return workerPromise;
}

async function extractFromImage(filePath) {
  const worker = await getWorker();
  const result = await worker.recognize(filePath);
  return result?.data?.text ?? '';
}

async function extractFromPdf(filePath) {
  const buffer = await readFile(filePath);
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    return result?.text ?? '';
  } finally {
    await parser.destroy();
  }
}

export function extractText(filePath, mime) {
  const task = queue.then(async () => {
    if (mime === 'application/pdf') return extractFromPdf(filePath);
    if (SUPPORTED_IMAGE_MIME.has(mime)) return extractFromImage(filePath);
    throw new Error(`Tipo de archivo no soportado para OCR: ${mime}`);
  });
  queue = task.then(
    () => undefined,
    () => undefined,
  );
  return task;
}
