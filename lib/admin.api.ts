import axios from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
const ADMIN_API_URL = `${BASE_URL}/api/v1/admin`;

function getErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail;
    if (typeof detail === 'string' && detail.trim().length > 0) {
      return detail;
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

export interface BackupFile {
  filename: string;
  size: string;
  created_at: string;
}

export interface CreateBackupResponse {
  message: string;
  filename: string;
  details: string;
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
  const response = await axios.get(`${ADMIN_API_URL}/backups`);
  return response.data;
}

/**
 * Inicia el proceso de backup de la base de datos
 */
export async function createBackup(): Promise<CreateBackupResponse> {
  const response = await axios.post(`${ADMIN_API_URL}/backup`);
  return response.data;
}

/**
 * Restaura la base de datos desde un archivo de backup
 */
export async function restoreBackup(filename: string): Promise<RestoreBackupResponse> {
  const response = await axios.post(`${ADMIN_API_URL}/restore`, { filename });
  return response.data;
}

/**
 * Vacía completamente el grafo y vuelve a inicializar su configuración base
 */
export async function wipeGraph(): Promise<WipeGraphResponse> {
  try {
    const response = await axios.post(`${ADMIN_API_URL}/wipe`);
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'No se pudo vaciar el grafo.'));
  }
}
