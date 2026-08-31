import { api } from '@/lib/api';

const ADMIN_API_URL = '/api/v1/admin';

export interface BackupFile {
  filename: string;
  size: string;
  created_at: string;
}

export interface CreateBackupResponse {
  message: string;
  filename: string;
  details: string;
  neo4j_file: string;
  ingestion_history_file: string;
}

export interface RestoreBackupResponse {
  message: string;
}

export interface WipeGraphResponse {
  message: string;
}

/**
 * Obtiene la lista de backups disponibles
 */
export async function getBackups(): Promise<BackupFile[]> {
  const response = await api.get(`${ADMIN_API_URL}/backups`);
  return response.data;
}

/**
 * Inicia el proceso de backup de la base de datos
 */
export async function createBackup(): Promise<CreateBackupResponse> {
  const response = await api.post(`${ADMIN_API_URL}/backup`);
  return response.data;
}

/**
 * Restaura la base de datos desde un archivo de backup
 */
export async function restoreBackup(filename: string): Promise<RestoreBackupResponse> {
  const response = await api.post(`${ADMIN_API_URL}/restore`, { filename });
  return response.data;
}

/**
 * Vacía completamente el grafo y vuelve a inicializar su configuración base
 */
export async function wipeGraph(): Promise<WipeGraphResponse> {
  const response = await api.post(`${ADMIN_API_URL}/wipe`);
  return response.data;
}
