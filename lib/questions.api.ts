import axios from 'axios';
import { getApiBaseUrl } from '@/lib/api-base';
import type { QuestionResponse, QuestionCreate, QuestionUpdate, Status } from '@/types';
import { Difficulty } from '@/types';
import { getStoredToken } from '@/lib/auth-session.storage';

const BASE_URL = getApiBaseUrl();
const API_URL = `${BASE_URL}/api/v1/questions`;

export type QuestionFilters = {
  category: string;
  subtopic?: string;
  difficulty?: Difficulty;
  status?: Status;
  skip?: number;
  limit?: number;
};

function authHeaders() {
  const token = getStoredToken();
  return token ? { Authorization: `Bearer ${token}` } : undefined;
}

/**
 * Lista todas las preguntas con paginación y filtros opcionales
 */
export async function getQuestions(
  skip: number = 0,
  limit: number = 100,
  category?: string,
  status?: Status
): Promise<QuestionResponse[]> {
  const params: Record<string, string | number> = { skip, limit };
  if (category) params.category = category;
  if (status) params.status = status;

  const response = await axios.get(API_URL, { params });
  return response.data;
}

/**
 * Lista preguntas por filtros sin cargar todo el banco
 */
export async function listQuestions(filters: QuestionFilters): Promise<QuestionResponse[]> {
  const params = {
    category: filters.category,
    subtopic: filters.subtopic || undefined,
    difficulty: filters.difficulty || undefined,
    status: filters.status || undefined,
    skip: filters.skip ?? 0,
    limit: filters.limit ?? 20,
  };

  const { data } = await axios.get(`${API_URL}/`, {
    params,
    headers: authHeaders(),
  });

  return data as QuestionResponse[];
}

/**
 * Obtiene una pregunta por su ID
 */
export async function getQuestion(id: string): Promise<QuestionResponse> {
  const response = await axios.get(`${API_URL}/${id}`);
  return response.data;
}

/**
 * Crea una nueva pregunta
 */
export async function createQuestion(data: QuestionCreate): Promise<QuestionResponse> {
  const response = await axios.post(API_URL, data);
  return response.data;
}

/**
 * Actualiza una pregunta existente
 */
export async function updateQuestion(id: string, data: QuestionUpdate): Promise<QuestionResponse> {
  const response = await axios.put(`${API_URL}/${id}`, data);
  return response.data;
}

/**
 * Elimina una pregunta existente
 */
export async function deleteQuestion(id: string): Promise<void> {
  await axios.delete(`${API_URL}/${id}`);
}
