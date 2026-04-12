import axios from 'axios';
import { getApiBaseUrl } from '@/lib/api-base';
import { getStoredToken } from '@/lib/auth-session.storage';
import type {
  IngestionJob,
  IngestionRun,
  StartIngestionResponse,
} from '@/types/ingestion.types';

const BASE_URL = getApiBaseUrl();
const API_URL = `${BASE_URL}/api/v1/ingestion`;

function getErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail;
    if (typeof detail === 'string' && detail.trim().length > 0) {
      return detail;
    }
    if (Array.isArray(detail) && detail.length > 0) {
      const firstIssue = detail[0];
      if (
        typeof firstIssue === 'object' &&
        firstIssue !== null &&
        'msg' in firstIssue &&
        typeof firstIssue.msg === 'string'
      ) {
        return firstIssue.msg;
      }
    }

    const message = error.response?.data?.message;
    if (typeof message === 'string' && message.trim().length > 0) {
      return message;
    }
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return fallback;
}

function getAuthHeaders() {
  const token = getStoredToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function startIngestion(file: File, chunks = 8): Promise<StartIngestionResponse> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('chunks', String(chunks));

  try {
    const response = await axios.post<StartIngestionResponse>(`${API_URL}/upload-pdf`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        ...getAuthHeaders(),
      },
    });

    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'No se pudo iniciar la ingesta.'));
  }
}

export async function getIngestionRuns(): Promise<IngestionRun[]> {
  try {
    const response = await axios.get<IngestionRun[]>(`${API_URL}/runs`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'No se pudo obtener el historial de ingestas.'));
  }
}

export async function getIngestionRun(runId: string): Promise<IngestionRun> {
  try {
    const response = await axios.get<IngestionRun>(`${API_URL}/runs/${runId}`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'No se pudo obtener el estado de la ingesta.'));
  }
}

function normalizeIngestionJob(candidate: unknown): IngestionJob | null {
  if (!candidate || typeof candidate !== 'object') {
    return null;
  }

  const item = candidate as Record<string, unknown>;
  const jobId = typeof item.job_id === 'string' ? item.job_id : null;
  if (!jobId) {
    return null;
  }

  return {
    job_id: jobId,
    run_id: typeof item.run_id === 'string' ? item.run_id : null,
    status: typeof item.status === 'string' ? item.status : 'queued',
    stage: typeof item.stage === 'string' ? item.stage : null,
    progress: typeof item.progress === 'number' ? item.progress : null,
    message: typeof item.message === 'string' ? item.message : null,
    error: typeof item.error === 'string' ? item.error : null,
    created_at: typeof item.created_at === 'string' ? item.created_at : null,
    updated_at: typeof item.updated_at === 'string' ? item.updated_at : null,
  };
}

export async function getIngestionJobs(): Promise<IngestionJob[]> {
  try {
    const response = await axios.get<unknown>(`${API_URL}/jobs`, {
      headers: getAuthHeaders(),
    });

    if (!Array.isArray(response.data)) {
      return [];
    }

    return response.data
      .map((item) => normalizeIngestionJob(item))
      .filter((item): item is IngestionJob => item !== null);
  } catch (error) {
    throw new Error(getErrorMessage(error, 'No se pudo obtener el estado de jobs de ingesta.'));
  }
}
