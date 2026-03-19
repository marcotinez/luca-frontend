import axios from 'axios';
import { Difficulty } from '@/types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const API_BASE = `${BASE_URL}/api/v1`;

export interface GenerationQuestionRequest {
  user_input: string;
  category?: string;
  subtopic?: string;
  difficulty: Difficulty;
  question_count?: number;
  semantic_limit?: number;
  semantic_depth?: 1 | 2;
  model?: string;
  output_schema?: Record<string, unknown>;
  output_contract?: Record<string, unknown>;
}

export interface GeneratedAlternative {
  text: string;
  is_correct: boolean;
  feedback: string;
}

export interface GeneratedQuestion {
  id: string;
  status: string;
  category: string;
  subtopic: string;
  difficulty: Difficulty;
  question: string;
  alternatives: GeneratedAlternative[];
  pedagogic_metadata: {
    rag_reference: string;
    complete_explanation: string;
  };
  created_at: string;
}

export interface GenerationQuestionResponse {
  questions: GeneratedQuestion[];
  generated_count: number;
  semantic_total: number;
  used_model: string;
  final_prompt?: string;
  raw_output: string;
}

export type GenerationJobStatus = 'queued' | 'running' | 'completed' | 'failed';

export interface GenerationJobState {
  job_id: string;
  status: GenerationJobStatus;
  progress: number;
  stage: string;
  message?: string | null;
  error?: string | null;
  result?: GenerationQuestionResponse | null;
}

function getAuthHeaders() {
  if (typeof window === 'undefined') {
    return {
      'Content-Type': 'application/json',
    };
  }

  const token = localStorage.getItem('token');

  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function generateQuestion(data: GenerationQuestionRequest): Promise<GenerationQuestionResponse> {
  const payload: GenerationQuestionRequest = {
    ...data,
    category: data.category || 'Planificación y presupuesto',
    subtopic: data.subtopic || 'Diferenciar Gastos Fijos vs. Variables',
  };

  const response = await axios.post(`${API_BASE}/generation/questions`, payload, {
    headers: getAuthHeaders(),
  });
  return response.data;
}

function normalizeGenerationJobState(data: Partial<GenerationJobState> & { job_id: string }): GenerationJobState {
  return {
    job_id: data.job_id,
    status: (data.status || 'queued') as GenerationJobStatus,
    progress: typeof data.progress === 'number' ? data.progress : 0,
    stage: data.stage || 'queued',
    message: data.message ?? null,
    error: data.error ?? null,
    result: data.result ?? null,
  };
}

export async function startGenerationJob(data: GenerationQuestionRequest): Promise<GenerationJobState> {
  const payload: GenerationQuestionRequest = {
    ...data,
    category: data.category || 'Planificación y presupuesto',
    subtopic: data.subtopic || 'Diferenciar Gastos Fijos vs. Variables',
  };

  const response = await axios.post(`${API_BASE}/generation/questions/jobs`, payload, {
    headers: getAuthHeaders(),
  });

  const body = response.data as Partial<GenerationJobState> & { job_id: string };
  return normalizeGenerationJobState(body);
}

export async function getGenerationJob(jobId: string): Promise<GenerationJobState> {
  const response = await axios.get(`${API_BASE}/generation/questions/jobs/${jobId}`, {
    headers: getAuthHeaders(),
  });
  const body = response.data as Partial<GenerationJobState> & { job_id: string };
  return normalizeGenerationJobState(body);
}
