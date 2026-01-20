import type { IngestionJob, IngestionConfig, RestoreResponse, JobsHistoryParams } from '@/types/ingestion.types';
import axios from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const API_URL = `${BASE_URL}/api/v1/ingestion`;

/**
 * Sube un documento PDF e inicia el proceso de ingesta
 */
export async function uploadDocument(
  file: File,
  config: IngestionConfig,
  force: boolean = false
): Promise<IngestionJob> {
  const formData = new FormData();
  formData.append('file', file);

  // Construir query params
  const params = new URLSearchParams();
  params.append('force', String(force));
  params.append('chunk_size', String(config.chunk_size));

  if (config.display_name) {
    params.append('display_name', config.display_name);
  }
  if (config.start_page) {
    params.append('start_page', String(config.start_page));
  }
  if (config.end_page) {
    params.append('end_page', String(config.end_page));
  }

  const response = await axios.post(`${API_URL}/process?${params.toString()}`, formData);
  return response.data;
}

/**
 * Obtiene el estado actual de un trabajo de ingesta
 */
export async function getJobStatus(jobId: string): Promise<IngestionJob> {
  const response = await axios.get(`${API_URL}/jobs/${jobId}`);
  return response.data;
}

/**
 * Obtiene el historial de trabajos de ingesta
 */
export async function getJobsHistory(params?: JobsHistoryParams): Promise<IngestionJob[]> {
  const queryParams = new URLSearchParams();
  if (params?.limit) queryParams.append('limit', String(params.limit));
  if (params?.status) queryParams.append('status', params.status);

  const url = queryParams.toString() ? `${API_URL}/jobs?${queryParams.toString()}` : `${API_URL}/jobs`;
  const response = await axios.get(url);
  return response.data;
}

/**
 * Elimina un trabajo de ingesta
 */
export async function deleteJob(jobId: string): Promise<void> {
  await axios.delete(`${API_URL}/jobs/${jobId}`);
}

/**
 * Restaura la base de datos de grafos usando un archivo Cypher
 */
export async function restoreDatabase(file: File, clearDb: boolean = false): Promise<RestoreResponse> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('clear_db', String(clearDb));

  const response = await axios.post(`${API_URL}/restore`, formData);
  return response.data;
}

