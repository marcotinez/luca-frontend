import axios from "axios";
import { getApiBaseUrl } from '@/lib/api-base';
import type {
  CreateCategoryPracticeTestRequest,
  CreateRecommendedPracticeTestRequest,
  AdaptiveStatsResponse,
  PracticeAvailabilityResponse,
  PracticeTestDifficulty,
  PracticeTestCreateRequest,
  PracticeTestDetailResponse,
  PracticeTestSummaryResponse,
  SubmitAnswerRequest,
  SubmitAnswerResponse,
} from "@/types";
import { getStoredToken } from "@/lib/auth-session.storage";

const BASE_URL = getApiBaseUrl();
const API_URL = `${BASE_URL}/api/v1/learning/tests`;

function authHeaders() {
  const token = getStoredToken();
  return token ? { Authorization: `Bearer ${token}` } : undefined;
}

export async function createPracticeTest(
  data: PracticeTestCreateRequest,
): Promise<PracticeTestDetailResponse> {
  const response = await axios.post(API_URL, data, { headers: authHeaders() });
  return response.data;
}

export async function createCategoryPracticeTest(
  data: CreateCategoryPracticeTestRequest,
): Promise<PracticeTestDetailResponse> {
  const response = await axios.post(`${API_URL}/category`, data, { headers: authHeaders() });
  return response.data;
}

export async function createRecommendedPracticeTest(
  data: CreateRecommendedPracticeTestRequest,
): Promise<PracticeTestDetailResponse> {
  const response = await axios.post(`${API_URL}/recommended`, data, { headers: authHeaders() });
  return response.data;
}

export async function getPracticeTests(): Promise<PracticeTestSummaryResponse[]> {
  const response = await axios.get(API_URL, { headers: authHeaders() });
  return response.data;
}

export async function getPracticeTest(testId: string): Promise<PracticeTestDetailResponse> {
  const response = await axios.get(`${API_URL}/${testId}`, { headers: authHeaders() });
  return response.data;
}

export async function submitPracticeTestAnswer(
  testId: string,
  data: SubmitAnswerRequest,
): Promise<SubmitAnswerResponse> {
  const response = await axios.post(`${API_URL}/${testId}/answer`, data, { headers: authHeaders() });
  return response.data;
}

export async function getPracticeTestAvailability(params: {
  category?: string;
  subtopic?: string;
  difficulty?: PracticeTestDifficulty;
  question_count?: number;
}): Promise<PracticeAvailabilityResponse> {
  const response = await axios.get(`${API_URL}/availability`, {
    headers: authHeaders(),
    params: {
      category: params.category || undefined,
      subtopic: params.subtopic || undefined,
      difficulty: params.difficulty || undefined,
      question_count: params.question_count ?? 5,
    },
  });
  return response.data;
}

export async function getAdaptiveStats(): Promise<AdaptiveStatsResponse> {
  const response = await axios.get(`${API_URL.replace("/tests", "")}/adaptive-stats`, {
    headers: authHeaders(),
  });
  return response.data;
}
