import axios from "axios";
import type {
  CreateCategoryPracticeTestRequest,
  CreateRecommendedPracticeTestRequest,
  PracticeTestCreateRequest,
  PracticeTestDetailResponse,
  PracticeTestSummaryResponse,
  SubmitAnswerRequest,
  SubmitAnswerResponse,
} from "@/types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const API_URL = `${BASE_URL}/api/v1/learning/tests`;

export async function createPracticeTest(
  data: PracticeTestCreateRequest,
): Promise<PracticeTestDetailResponse> {
  const response = await axios.post(API_URL, data);
  return response.data;
}

export async function createCategoryPracticeTest(
  data: CreateCategoryPracticeTestRequest,
): Promise<PracticeTestDetailResponse> {
  const response = await axios.post(`${API_URL}/category`, data);
  return response.data;
}

export async function createRecommendedPracticeTest(
  data: CreateRecommendedPracticeTestRequest,
): Promise<PracticeTestDetailResponse> {
  const response = await axios.post(`${API_URL}/recommended`, data);
  return response.data;
}

export async function getPracticeTests(): Promise<PracticeTestSummaryResponse[]> {
  const response = await axios.get(API_URL);
  return response.data;
}

export async function getPracticeTest(testId: string): Promise<PracticeTestDetailResponse> {
  const response = await axios.get(`${API_URL}/${testId}`);
  return response.data;
}

export async function submitPracticeTestAnswer(
  testId: string,
  data: SubmitAnswerRequest,
): Promise<SubmitAnswerResponse> {
  const response = await axios.post(`${API_URL}/${testId}/answer`, data);
  return response.data;
}
