import axios from 'axios';
import type { IngestionRun, StartIngestionResponse } from '@/types/ingestion.types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
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

export async function startIngestion(file: File, chunks = 8): Promise<StartIngestionResponse> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('chunks', String(chunks));

  try {
    const response = await axios.post<StartIngestionResponse>(`${API_URL}/upload-pdf`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'No se pudo iniciar la ingesta.'));
  }
}

export async function getIngestionRuns(): Promise<IngestionRun[]> {
  try {
    const response = await axios.get<IngestionRun[]>(`${API_URL}/runs`);
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'No se pudo obtener el historial de ingestas.'));
  }
}

export async function getIngestionRun(runId: string): Promise<IngestionRun> {
  try {
    const response = await axios.get<IngestionRun>(`${API_URL}/runs/${runId}`);
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'No se pudo obtener el estado de la ingesta.'));
  }
}
