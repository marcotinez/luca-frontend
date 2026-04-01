export type IngestionStatus = 'QUEUED' | 'RUNNING' | 'FINISHED' | 'PARTIAL' | 'FAILED';
export type IngestionJobStatus =
  | 'queued'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | string;

export interface IngestionEvent {
  step: string;
  message: string;
  level: 'INFO' | 'WARNING' | 'ERROR';
  chunk_id?: number | null;
  timestamp: string;
}

export interface IngestionRun {
  run_id: string;
  file_name: string;
  file_size?: string | null;
  status: IngestionStatus;
  total_chunks: number;
  processed_chunks: number;
  total_nodes: number;
  total_relations: number;
  errors: string[];
  events: IngestionEvent[];
  created_at: string;
  updated_at: string;
  finished_at?: string | null;
}

export interface StartIngestionResponse {
  message: string;
  run_id: string;
  filename?: string;
  status: IngestionStatus;
  total_chunks?: number;
  processed_chunks?: number;
  total_nodes?: number;
  total_relations?: number;
  errors?: string[];
  events?: IngestionEvent[];
}

export interface IngestionJob {
  job_id: string;
  run_id?: string | null;
  status: IngestionJobStatus;
  stage?: string | null;
  progress?: number | null;
  message?: string | null;
  error?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}
