import { createHash } from 'node:crypto';
import { readFile, unlink } from 'node:fs/promises';
import { AppError } from '../errors/app-error.js';
import { modulesRepository } from '../repositories/modules-repository.js';
import { assessDocumentReview } from './document-review.js';
import { extractPdfMetadata, extractText, isSupportedMime } from './ocr-service.js';

async function processOcr(id, filePath, mime) {
  await modulesRepository.setDocumentOcrResult(id, { status: 'processing', text: null, message: null });
  let pdfMetadata = {};
  if (mime === 'application/pdf') {
    try {
      pdfMetadata = await extractPdfMetadata(filePath);
    } catch (error) {
      console.error('No se pudieron leer los metadatos de fecha del PDF:', error);
      pdfMetadata = { metadataStatus: 'unavailable' };
    }
  }

  let text;
  try {
    text = (await extractText(filePath, mime))?.trim() ?? '';
    if (!text) {
      await modulesRepository.setDocumentOcrResult(id, {
        status: 'no_text',
        text: '',
        message: 'No se detectó texto legible en el documento.',
      });
    } else {
      await modulesRepository.setDocumentOcrResult(id, { status: 'completed', text, message: null });
    }
  } catch (error) {
    await modulesRepository.setDocumentOcrResult(id, {
      status: 'failed',
      text: null,
      message: String(error?.message ?? error).slice(0, 500),
    });
    return;
  }

  try {
    const reviewInput = await modulesRepository.getDocumentReviewInput(id);
    const duplicates = reviewInput?.candidate_id
      ? await modulesRepository.findExactDuplicateCandidateDocuments(id, reviewInput.file_sha256)
      : [];
    const reviewFindings = assessDocumentReview({
      text,
      candidate: reviewInput?.candidate_id ? reviewInput : null,
      duplicates,
      pdfMetadata,
    });
    await modulesRepository.setDocumentReviewResult(
      id, { ...pdfMetadata, reviewStatus: 'complete' }, reviewFindings,
    );
  } catch (error) {
    console.error('No se pudieron completar las alertas de revisión documental:', error);
    try {
      await modulesRepository.setDocumentReviewResult(
        id,
        { ...pdfMetadata, reviewStatus: 'unavailable' },
        [{
          code: 'review_analysis_unavailable',
          severity: 'review',
          message: 'No se pudieron completar las comprobaciones automáticas. Reintenta el análisis y revisa el documento manualmente.',
        }],
      );
    } catch (reviewError) {
      console.error('No se pudieron guardar las alertas de revisión documental:', reviewError);
    }
  }
}

export function processUploadedDocument(id, filePath, mime) {
  return processOcr(id, filePath, mime).catch((error) => {
    console.error('No se pudo procesar el OCR del documento:', error);
  });
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

    let document;
    try {
      const fileSha256 = createHash('sha256').update(await readFile(file.path)).digest('hex');
      document = await modulesRepository.setDocumentFile(id, {
        fileName: file.originalname,
        filePath: file.path,
        fileMime: file.mimetype,
        fileSize: file.size,
        fileSha256,
      }, actorId);
    } catch (error) {
      await unlink(file.path).catch(() => {});
      throw error;
    }

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
