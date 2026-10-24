import { AppError } from '../errors/app-error.js';

export function notFoundHandler(req, res) {
  res.status(404).json({
    error: { code: 'NOT_FOUND', message: 'El recurso solicitado no existe.' },
  });
}

export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);

  if (error instanceof AppError) {
    const payload = { code: error.code, message: error.message };
    if (error.details) payload.details = error.details;
    return res.status(error.status).json({ error: payload });
  }

  if (error?.name === 'ZodError') {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Revisa los datos ingresados.',
        details: error.issues.map(({ path, message }) => ({ field: path.join('.'), message })),
      },
    });
  }

  if (error?.type === 'entity.too.large') {
    return res.status(413).json({
      error: { code: 'PAYLOAD_TOO_LARGE', message: 'El contenido enviado supera el tamaño permitido.' },
    });
  }
  if (error?.name === 'MulterError') {
    return res.status(error.code === 'LIMIT_FILE_SIZE' ? 413 : 400).json({
      error: {
        code: error.code,
        message: error.code === 'LIMIT_FILE_SIZE'
          ? `El archivo supera el tamaño máximo permitido (${error.field === 'resume' ? '5' : '10'} MB).`
          : 'No se pudo procesar el archivo cargado.',
      },
    });
  }
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return res.status(400).json({
      error: { code: 'INVALID_JSON', message: 'El cuerpo de la solicitud no contiene JSON válido.' },
    });
  }

  if (error?.code === '23505') {
    return res.status(409).json({
      error: { code: 'DUPLICATE_RECORD', message: 'Ya existe un registro con esos datos únicos.' },
    });
  }
  if (error?.code === '23503') {
    return res.status(409).json({
      error: { code: 'RELATED_RECORDS', message: 'No se puede eliminar o modificar porque hay registros relacionados.' },
    });
  }

  console.error('Error no controlado en la API:', error);
  return res.status(500).json({
    error: { code: 'INTERNAL_ERROR', message: 'Ocurrió un error interno. Intenta nuevamente.' },
  });
}
