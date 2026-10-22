import { unlink } from 'node:fs/promises';
import { AppError } from '../errors/app-error.js';
import { modulesRepository } from '../repositories/modules-repository.js';
import { extractText, isSupportedMime } from './ocr-service.js';

async function processOcr(id, filePath, mime) {
  await modulesRepository.setDocumentOcrResult(id, { status: 'processing', text: null, message: null });
  try {
    const text = (await extractText(filePath, mime))?.trim() ?? '';
    if (!text) {
      await modulesRepository.setDocumentOcrResult(id, {
        status: 'no_text',
        text: '',
        message: 'No se detectó texto legible en el documento.',
      });
      return;
    }
    await modulesRepository.setDocumentOcrResult(id, { status: 'completed', text, message: null });
  } catch (error) {
    await modulesRepository.setDocumentOcrResult(id, {
      status: 'failed',
      text: null,
      message: String(error?.message ?? error).slice(0, 500),
    });
  }
}

export const documentService = {
  async attachFile(id, file, actorId) {
    if (!file) {
      throw new AppError(400, 'FILE_REQUIRED', 'Adjunta un archivo para validar.');
    }
    if (!isSupportedMime(file.mimetype)) {
      await unlink(file.path).catch(() => {});
      throw new AppError(400, 'UNSUPPORTED_FILE', 'Formato no soportado. Usa PDF, PNG, JPG, WEBP, BMP o TIFF.');
    }

    const previous = await modulesRepository.getDocumentFile(id);
    if (!previous) {
      await unlink(file.path).catch(() => {});
      throw new AppError(404, 'NOT_FOUND', 'No se encontró el documento a validar.');
    }

    const document = await modulesRepository.setDocumentFile(id, {
      fileName: file.originalname,
      filePath: file.path,
      fileMime: file.mimetype,
      fileSize: file.size,
    }, actorId);

    if (previous.file_path && previous.file_path !== file.path) {
      await unlink(previous.file_path).catch(() => {});
    }

    processOcr(id, file.path, file.mimetype).catch((error) => {
      console.error('No se pudo procesar el OCR del documento:', error);
    });

    return document;
  },

  async reprocessOcr(id) {
    const document = await modulesRepository.getDocumentFile(id);
    if (!document || !document.file_path) {
      throw new AppError(404, 'NO_FILE', 'El documento no tiene archivo adjunto.');
    }
    await modulesRepository.setDocumentOcrResult(id, { status: 'processing', text: null, message: null });
    processOcr(id, document.file_path, document.file_mime).catch((error) => {
      console.error('No se pudo reprocesar el OCR del documento:', error);
    });
    return { id, ocr_status: 'processing' };
  },
};
