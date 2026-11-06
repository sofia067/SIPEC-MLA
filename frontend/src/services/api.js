export class ApiError extends Error {
  constructor(message, status, code) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

export async function apiRequest(path, options = {}) {
  const { signal, timeoutMs, ...requestOptions } = options;
  const headers = new Headers(requestOptions.headers);
  const isFormData = requestOptions.body instanceof FormData;

  if (requestOptions.body && !isFormData && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const controller = new AbortController();
  let timedOut = false;
  let timeoutId;
  const abortRequest = () => controller.abort();
  if (signal?.aborted) {
    controller.abort();
  } else {
    signal?.addEventListener('abort', abortRequest, { once: true });
  }
  if (Number.isFinite(timeoutMs) && timeoutMs > 0) {
    timeoutId = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, timeoutMs);
  }

  try {
    const response = await fetch(`/api${path}`, {
      ...requestOptions,
      headers,
      credentials: 'include',
      signal: controller.signal,
    });
    if (response.status === 204) return null;

    const payload = await response.json().catch((error) => {
      if (controller.signal.aborted) throw error;
      return null;
    });
    if (!response.ok) {
      throw new ApiError(
        payload?.error?.message ?? 'Ocurrió un error al comunicarse con el backend.',
        response.status,
        payload?.error?.code,
      );
    }

    return payload;
  } catch (requestError) {
    if (requestError instanceof ApiError) throw requestError;
    if (timedOut) {
      throw new ApiError(
        `El backend no respondió en ${Math.ceil(timeoutMs / 1000)} segundos. Intenta nuevamente.`,
        0,
        'REQUEST_TIMEOUT',
      );
    }
    if (controller.signal.aborted) {
      throw new ApiError('La solicitud fue cancelada.', 0, 'REQUEST_ABORTED');
    }
    throw new ApiError('No se pudo conectar con el backend. Verifica que la API esté iniciada.', 0, 'NETWORK_ERROR');
  } finally {
    clearTimeout(timeoutId);
    signal?.removeEventListener('abort', abortRequest);
  }
}
