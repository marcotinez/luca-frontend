import axios from 'axios';
import type { QuestionResponse, QuestionCreate, QuestionUpdate, Status } from '@/types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const API_URL = `${BASE_URL}/api/v1/questions`;

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
