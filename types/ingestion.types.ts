/**
 * Estados posibles del proceso de ingesta
 */
export type IngestionStatus =
  | 'PENDING'     // En cola, esperando worker
  | 'PROCESSING'  // Trabajando activamente
  | 'COMPLETED'   // Finalizado con éxito
  | 'ERROR'       // Fallo crítico
  | 'SKIPPED'     // Archivo vacío o duplicado sin force
  | 'COMPLETED_WITH_ERRORS'; // Finalizado parcialmente

/**
 * Entrada de log del proceso de ingesta
 */
export interface IngestionLogEntry {
  timestamp: string;
  level: string;
  message: string;
}

/**
 * Detalle del procesamiento de un chunk individual
 */
export interface ChunkDetail {
  chunk_id: number;
  extraction_tokens: number;
  refinement_tokens: number;
  extraction_response?: unknown; // JSON raw
  refinement_response?: unknown; // JSON raw
}

/**
 * Configuración para el proceso de ingesta
 */
export interface IngestionConfig {
  display_name?: string;    // Nombre personalizado para el archivo
  chunk_size: number;       // Páginas por chunk (1-50, default 5)
  start_page?: number;      // Página inicial (1-indexed, inclusive)
  end_page?: number;        // Página final (1-indexed, inclusive)
}

/**
 * Modelo principal del trabajo de ingesta
 */
export interface IngestionJob {
  _id: string;            // ID único del trabajo (Mongo ID)
  file_name: string;      // Nombre original del archivo
  file_path: string;      // Ruta interna (no exponer al usuario final)
  display_name?: string;  // Nombre personalizado del usuario
  status: IngestionStatus;

  // Configuración de usuario
  start_page?: number;    // Página inicial (1-indexed)
  end_page?: number;      // Página final (1-indexed)

  // Métricas de progreso
  total_pages: number;        // Páginas totales del PDF
  chunk_size: number;         // Páginas por chunk
  total_chunks: number;       // Total de unidades de trabajo
  processed_chunks: number;   // Unidades completadas
  failed_chunks: number;      // Unidades fallidas

  // Estadísticas de GraphRAG
  total_tokens: number;       // Consumo total de tokens
  extraction_tokens: number;  // Tokens en extracción
  refinement_tokens: number;  // Tokens en refinamiento

  entities_extracted: number; // Nodos encontrados
  relationships_extracted: number; // Relaciones base
  refined_relationships: number;   // Relaciones inferidas por refinamiento

  // Detalles finos
  chunk_details: ChunkDetail[];
  logs: IngestionLogEntry[];

  // Tiempos y Diagnóstico
  created_at: string;         // ISO Date
  updated_at?: string;        // ISO Date
  completed_at?: string;      // ISO Date
  execution_time_seconds: number;

  error_message?: string;     // Detalle del error si status === 'ERROR'
  error_code?: string;        // Código de error máquina
}

/**
 * Respuesta del endpoint de Restore
 */
export interface RestoreResponse {
  status: 'success' | 'error';
  message: string;
  statements_executed: number;
}

/**
 * Parámetros para listar historial de trabajos
 */
export interface JobsHistoryParams {
  limit?: number;
  status?: IngestionStatus;
}

