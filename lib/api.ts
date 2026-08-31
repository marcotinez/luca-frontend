import axios, { AxiosError, AxiosRequestConfig, AxiosInstance } from 'axios';
import { getApiBaseUrl } from '@/lib/api-base';
import { clearStoredSession, getStoredToken, setStoredToken } from '@/lib/auth-session.storage';

/**
 * Error de aplicación al que se traduce toda respuesta fallida del backend.
 * `code` y `details` conservan el detalle estructurado que el backend ya
 * devuelve (por ejemplo, sugerencias de disponibilidad de preguntas).
 */
export class ApiError extends Error {
  status?: number;
  code?: string;
  details?: unknown;

  constructor(message: string, opts: { status?: number; code?: string; details?: unknown } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = opts.status;
    this.code = opts.code;
    this.details = opts.details;
  }
}

/** Todo error de una llamada a `api` llega aquí como `ApiError`; extrae su mensaje o usa el fallback. */
export function apiErrorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError && error.message ? error.message : fallback;
}

function toApiError(error: unknown): ApiError {
  if (!axios.isAxiosError(error)) {
    return error instanceof Error ? new ApiError(error.message) : new ApiError('Error inesperado.');
  }

  if (!error.response) {
    return new ApiError('No se pudo conectar con el servidor.', { code: 'NETWORK_ERROR' });
  }

  const status = error.response.status;
  const data = error.response.data as { detail?: unknown; message?: unknown } | undefined;
  const detail = data?.detail;

  if (detail && typeof detail === 'object' && !Array.isArray(detail)) {
    const structured = detail as { code?: string; message?: string };
    return new ApiError(structured.message || error.message, { status, code: structured.code, details: detail });
  }
  if (typeof detail === 'string' && detail.trim()) {
    return new ApiError(detail, { status });
  }
  if (Array.isArray(detail) && detail.length > 0) {
    const first = detail[0] as { msg?: string };
    if (typeof first?.msg === 'string') {
      return new ApiError(first.msg, { status, details: detail });
    }
  }
  if (typeof data?.message === 'string' && data.message.trim()) {
    return new ApiError(data.message, { status });
  }
  return new ApiError(error.message, { status });
}

/** Instancia única de cliente HTTP: toda petición al backend pasa por aquí. */
export const api: AxiosInstance = axios.create({ baseURL: getApiBaseUrl() });

type RetryableConfig = AxiosRequestConfig & { _retry?: boolean };

let refreshPromise: Promise<string> | null = null;

/**
 * Renueva la credencial de sesión, compartiendo una sola petición en curso
 * entre todos los llamadores concurrentes (401 automáticos y renovación
 * proactiva por igual).
 */
export async function refreshAccessTokenOnce(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = api
      .post<{ access_token: string }>('/api/v1/auth/refresh', undefined, {
        headers: (() => {
          const token = getStoredToken();
          return token ? { Authorization: `Bearer ${token}` } : undefined;
        })(),
      })
      .then((res) => {
        setStoredToken(res.data.access_token);
        return res.data.access_token;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

api.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const url = error.config?.url ?? '';
    const isAuthRoute = url.includes('/auth/login') || url.includes('/auth/refresh');
    const original = error.config as RetryableConfig | undefined;

    if (error.response?.status === 401 && !isAuthRoute && original && !original._retry) {
      try {
        original._retry = true;
        const token = await refreshAccessTokenOnce();
        original.headers = { ...(original.headers || {}), Authorization: `Bearer ${token}` };
        return api(original);
      } catch {
        clearStoredSession();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return Promise.reject(toApiError(error));
      }
    }

    return Promise.reject(toApiError(error));
  }
);
