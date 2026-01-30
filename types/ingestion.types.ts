/**
 * Estados posibles del proceso de ingesta
 */
export type IngestionStatus =
  | 'PENDING'     // En cola
  | 'PROCESSING'  // Procesando
  | 'FINISHED'    // Finalizado
  | 'ERROR';      // Error

/**
 * Modelo de Datos (IngestionJob)
 * Basado en la respuesta de /jobs
 */
export interface IngestionJob {
  file_name: string;      // Nombre del archivo PDF
  file_size?: string;     // Tamaño del archivo (opcional)
  directory?: string;     // URL o ruta de origen (opcional)
  chunk_id: number | string; // Identificador del chunk
  nodes: number;          // Cantidad de nodos extraídos
  relations: number;      // Cantidad de relaciones extraídas
  status?: IngestionStatus; // Estado del procesamiento

  // Agregamos campos opcionales por si la API los devuelve en el futuro o para compatibilidad
  message?: string;
  webhook_status?: number;
}

/**
 * Respuesta del endpoint de Upload
 */
export interface UploadResponse {
    message: string;
    filename: string;
    webhook_status: number;
}


