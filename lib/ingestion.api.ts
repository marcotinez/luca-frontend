import { api } from '@/lib/api';
import type { IngestionJob, IngestionRun, StartIngestionResponse } from '@/types/ingestion.types';

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
  const response = await api.get<unknown>(`${API_URL}/jobs`);

  if (!Array.isArray(response.data)) {
    return [];
  }

  return response.data.map((item) => normalizeIngestionJob(item)).filter((item): item is IngestionJob => item !== null);
}
