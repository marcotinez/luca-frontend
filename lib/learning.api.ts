import { api } from '@/lib/api';
import type {
  CreateCategoryPracticeTestRequest,
  CreateRecommendedPracticeTestRequest,
  PracticeAvailabilityResponse,
  PracticeTestDifficulty,
  PracticeTestCreateRequest,
  PracticeTestDetailResponse,
  PracticeTestSummaryResponse,
  SubmitAnswerRequest,
  SubmitAnswerResponse,
} from '@/types';

const API_URL = '/api/v1/learning/tests';

export async function createPracticeTest(data: PracticeTestCreateRequest): Promise<PracticeTestDetailResponse> {
  const response = await api.post(API_URL, data);
  return response.data;
}

export async function createCategoryPracticeTest(
  data: CreateCategoryPracticeTestRequest,
): Promise<PracticeTestDetailResponse> {
  const response = await api.post(`${API_URL}/category`, data);
  return response.data;
}

export async function createRecommendedPracticeTest(
  data: CreateRecommendedPracticeTestRequest,
): Promise<PracticeTestDetailResponse> {
  const response = await api.post(`${API_URL}/recommended`, data);
  return response.data;
}

export async function getPracticeTests(): Promise<PracticeTestSummaryResponse[]> {
  const response = await api.get(API_URL);
  return response.data;
}

export async function getPracticeTest(testId: string): Promise<PracticeTestDetailResponse> {
  const response = await api.get(`${API_URL}/${testId}`);
  return response.data;
}

export async function submitPracticeTestAnswer(
  testId: string,
  data: SubmitAnswerRequest,
): Promise<SubmitAnswerResponse> {
  const response = await api.post(`${API_URL}/${testId}/answer`, data);
  return response.data;
}

export async function getPracticeTestAvailability(params: {
  category?: string;
  subtopic?: string;
  difficulty?: PracticeTestDifficulty;
  question_count?: number;
}): Promise<PracticeAvailabilityResponse> {
  const response = await api.get(`${API_URL}/availability`, {
    params: {
      category: params.category || undefined,
      subtopic: params.subtopic || undefined,
      difficulty: params.difficulty || undefined,
      question_count: params.question_count ?? 5,
    },
  });
  return response.data;
}
