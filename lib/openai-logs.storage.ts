import { GenerationQuestionRequest, GenerationQuestionResponse } from '@/lib/prompt-generation.api';

const OPENAI_LOGS_STORAGE_KEY = 'admin_openai_generation_logs_v1';
const MAX_LOG_ENTRIES = 200;

export interface OpenAILogEntry {
  id: string;
  created_at: string;
  request: GenerationQuestionRequest;
  response: GenerationQuestionResponse;
}

function canUseStorage() {
  return typeof window !== 'undefined' && !!window.localStorage;
}

export function getOpenAILogs(): OpenAILogEntry[] {
  if (!canUseStorage()) return [];
  try {
    const raw = window.localStorage.getItem(OPENAI_LOGS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as OpenAILogEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function addOpenAILog(payload: { request: GenerationQuestionRequest; response: GenerationQuestionResponse }) {
  if (!canUseStorage()) return;

  const currentLogs = getOpenAILogs();
  const nextEntry: OpenAILogEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    created_at: new Date().toISOString(),
    request: payload.request,
    response: payload.response,
  };

  const updatedLogs = [nextEntry, ...currentLogs].slice(0, MAX_LOG_ENTRIES);
  window.localStorage.setItem(OPENAI_LOGS_STORAGE_KEY, JSON.stringify(updatedLogs));
}

export function clearOpenAILogs() {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(OPENAI_LOGS_STORAGE_KEY);
}
