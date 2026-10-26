export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export async function apiRequest(path, options = {}) {
  const headers = new Headers(options.headers);
  const isFormData = options.body instanceof FormData;

  if (options.body && !isFormData && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`/api${path}`, {
    ...options,
    headers,
    credentials: 'same-origin',
  });
  const text = await response.text();
  let result;

  if (text) {
    try {
      result = JSON.parse(text);
    } catch {
      throw new Error('El servidor devolvió una respuesta no válida.');
    }
  }

  if (!response.ok) {
    throw new ApiError(
      result?.error?.message || 'No se pudo completar la solicitud.',
      response.status,
    );
  }

  return result;
}
