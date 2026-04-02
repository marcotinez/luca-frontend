import { GenerationQuestionRequest, GenerationQuestionResponse } from '@/lib/prompt-generation.api';
import { readStorage, removeStorage, writeStorage } from '@/lib/client-storage';

const OPENAI_LOGS_STORAGE_KEY = 'admin:openai-generation-logs';
const MAX_LOG_ENTRIES = 200;

export interface OpenAILogResponseSnapshot {
  questions: GenerationQuestionResponse['questions'];
  generated_count: number;
  requested_count?: number;
  discarded_count?: number;
  discarded_question_indexes?: number[] | null;
  semantic_total: number;
  used_model: string;
  final_prompt?: string;
  raw_output: string;
  failure_stage?: string | null;
  validation_issues?: string[] | null;
  status?: 'completed' | 'completed_partial' | 'failed';
  error?: string | null;
  message?: string | null;
}

export interface OpenAILogEntry {
  id: string;
  created_at: string;
  request: GenerationQuestionRequest;
  response: OpenAILogResponseSnapshot;
}

export function getOpenAILogs(): OpenAILogEntry[] {
  return readStorage<OpenAILogEntry[]>(OPENAI_LOGS_STORAGE_KEY, [], (value) =>
    Array.isArray(value) ? (value as OpenAILogEntry[]) : []
  );
}

export function addOpenAILog(payload: { request: GenerationQuestionRequest; response: OpenAILogResponseSnapshot }) {
  const currentLogs = getOpenAILogs();
  const nextEntry: OpenAILogEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    created_at: new Date().toISOString(),
    request: payload.request,
    response: payload.response,
  };

  const updatedLogs = [nextEntry, ...currentLogs].slice(0, MAX_LOG_ENTRIES);
  writeStorage(OPENAI_LOGS_STORAGE_KEY, updatedLogs);
}

export function clearOpenAILogs() {
  removeStorage(OPENAI_LOGS_STORAGE_KEY);
}
