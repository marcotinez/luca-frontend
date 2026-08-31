import { api } from '@/lib/api';
import type { IngestionRun, StartIngestionResponse } from '@/types/ingestion.types';

const API_URL = '/api/v1/ingestion';

export type RetryIngestionRunResponse = {
  message: string;
  retry_of_run_id: string;
  run_id: string;
  retry_chunk_ids: number[];
  status: 'QUEUED' | 'RUNNING' | 'PARTIAL' | 'FAILED' | 'FINISHED';
};

export async function startIngestion(file: File, chunks = 8): Promise<StartIngestionResponse> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('chunks', String(chunks));

  const response = await api.post<StartIngestionResponse>(`${API_URL}/upload-pdf`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}

export async function getIngestionRuns(): Promise<IngestionRun[]> {
  const response = await api.get<IngestionRun[]>(`${API_URL}/runs`);
  return response.data;
}

export async function getIngestionRun(runId: string): Promise<IngestionRun> {
  const response = await api.get<IngestionRun>(`${API_URL}/runs/${runId}`);
  return response.data;
}

export async function retryIngestionRun(runId: string): Promise<RetryIngestionRunResponse> {
  const response = await api.post<RetryIngestionRunResponse>(`${API_URL}/runs/${encodeURIComponent(runId)}/retry`);
  return response.data;
}

