import axios from 'axios';
import { Difficulty } from '@/types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const API_BASE = `${BASE_URL}/api/v1`;

export type PromptLayer = 'base' | 'difficulty' | 'feedback_incorrect' | 'feedback_session_final';

export interface PromptEntry {
  id: string;
  layer: PromptLayer;
  difficulty: Difficulty | null;
  content: string;
  note: string | null;
  created_by: string;
  created_at: string;
}

export interface PromptEntryUpsertRequest {
  layer: PromptLayer;
  difficulty?: Difficulty | null;
  content: string;
  note?: string | null;
}

export interface LatestPromptsResponse {
  base: PromptEntry | null;
  facil: PromptEntry | null;
  medio: PromptEntry | null;
  dificil: PromptEntry | null;
  feedback_incorrect: PromptEntry | null;
  feedback_session_final: PromptEntry | null;
}

export interface GetPromptHistoryParams {
  layer: PromptLayer;
  difficulty?: Difficulty;
  limit?: number;
}

export interface GenerationQuestionRequest {
  user_input: string;
  category: string;
  subtopic: string;
  difficulty: Difficulty;
  semantic_limit?: number;
  semantic_depth?: 1 | 2;
  model?: string;
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
  question: GeneratedQuestion;
  semantic_total: number;
  used_model: string;
  raw_output: string;
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

export async function createPromptEntry(data: PromptEntryUpsertRequest): Promise<PromptEntry> {
  const response = await axios.post(`${API_BASE}/prompts/entries`, data, {
    headers: getAuthHeaders(),
  });
  return response.data;
}

export async function updatePromptEntry(data: PromptEntryUpsertRequest): Promise<PromptEntry> {
  const response = await axios.put(`${API_BASE}/prompts/entries`, data, {
    headers: getAuthHeaders(),
  });
  return response.data;
}

export async function getLatestPrompts(): Promise<LatestPromptsResponse> {
  const response = await axios.get(`${API_BASE}/prompts/latest`, {
    headers: getAuthHeaders(),
  });
  return response.data;
}

export async function getPromptHistory(params: GetPromptHistoryParams): Promise<PromptEntry[]> {
  const response = await axios.get(`${API_BASE}/prompts/history`, {
    params,
    headers: getAuthHeaders(),
  });
  return response.data;
}

export async function generateQuestion(data: GenerationQuestionRequest): Promise<GenerationQuestionResponse> {
  const response = await axios.post(`${API_BASE}/generation/questions`, data, {
    headers: getAuthHeaders(),
  });
  return response.data;
}
