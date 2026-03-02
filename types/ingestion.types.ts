// Estados posibles del proceso de ingesta
export type IngestionStatus =
  | 'PENDING'     // En cola
  | 'PROCESSING'  // Procesando
  | 'FINISHED'    // Finalizado
  | 'ERROR';      // Error

// Modelo de Datos
export interface IngestionJob {
  file_name: string;
  file_size?: string;
  directory?: string;
  chunk_id: number | string;
  nodes: number;
  relations: number;
  status?: IngestionStatus;
}

// Respuesta del endpoint de Upload
export interface UploadResponse {
    message: string;
    filename: string;
    webhook_status: number;
}


