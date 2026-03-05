import type { IngestionJob, UploadResponse } from '@/types/ingestion.types';
import axios from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const API_URL = `${BASE_URL}/api/v1/ingestion`;

/**
 * Sube un documento PDF al webhook de n8n
 * @param file El archivo PDF
 * @param chunks Cantidad de chunks (se enviará como form-data si es necesario,
 *               aunque el user request solo especifica 'file' en los parametros curl,
 *               la UI pide seleccionar cantidad de chunks. Asumiremos que se envia o se usa solo para calculo local.
 *               Revisando el request del usuario: "La idea es que al seleccionar la cantidad de chunks nos muestre la cantidad de paginas que quedarán por chunk."
 *               Pero el endpoint solo muestra 'file'.
 *               Voy a enviar 'chunks' también por si acaso el backend lo soporta, o solo 'file' si es estricto.
 *               El curl del usuario solo muestra -F "file=@...".
 *               Seguiré ESTRICTAMENTE el curl del usuario para evitar errores 422.
 */
export async function uploadDocument(
  file: File,
  chunks?: number
): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('file', file);

  // Nota: El usuario pidió seleccionar chunks en UI, pero la doc de API
  // proporcionada SOLO menciona el campo 'file'.
  // Si el backend soportara 'chunks', lo agregariamos aqui:
  if (chunks) {
     formData.append('chunks', String(chunks));
  }

  const response = await axios.post(`${API_URL}/upload-pdf`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
}

/**
 * Obtiene el historial de ingesta (Jobs)
 */
export async function getJobsHistory(): Promise<IngestionJob[]> {
  const response = await axios.get(`${API_URL}/jobs`);
  return response.data;
}

/**
 * Elimina todos los jobs asociados a un nombre de archivo
 */
export async function deleteJobsByFile(fileName: string): Promise<{ message: string }> {
  // curl -X DELETE "http://localhost:8000/api/v1/ingestion/jobs?file_name=documento.pdf"
  const response = await axios.delete(`${API_URL}/jobs`, {
    params: { file_name: fileName },
  });
  return response.data;
}


