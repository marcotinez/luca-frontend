import { api } from '@/lib/api';
import type { QuestionResponse, QuestionUpdate, Status } from '@/types';
import { Difficulty } from '@/types';

const API_URL = '/api/v1/questions';

export type QuestionFilters = {
  category: string;
  subtopic?: string;
  difficulty?: Difficulty;
  status?: Status;
  skip?: number;
  limit?: number;
};

export type QuestionCategoryCount = {
  category: string;
  total_questions: number;
};

/**
 * Lista preguntas por filtros, paginado
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

  const { data } = await api.get(`${API_URL}/`, { params });
  return data as QuestionResponse[];
}

export async function getQuestionCategoryCounts(): Promise<QuestionCategoryCount[]> {
  const { data } = await api.get(`${API_URL}/stats/category-counts`);
  return (data as QuestionCategoryCount[]) || [];
}

/**
 * Actualiza una pregunta existente
 */
export async function updateQuestion(id: string, data: QuestionUpdate): Promise<QuestionResponse> {
  const response = await api.put(`${API_URL}/${id}`, data);
  return response.data;
}

/**
 * Elimina una pregunta existente
 */
export async function deleteQuestion(id: string): Promise<void> {
  await api.delete(`${API_URL}/${id}`);
}
