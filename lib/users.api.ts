import axios from 'axios';
import { getApiBaseUrl } from '@/lib/api-base';
import type {
  UserLearningProfile,
  UserResponse,
  UserUpdate,
  RegisterRequest,
  RegisterPracticeAttemptRequest,
} from '@/types';

const BASE_URL = getApiBaseUrl();
const USERS_API_URL = `${BASE_URL}/api/v1/users`;

export async function getUsers(): Promise<UserResponse[]> {
  // Keep trailing slash to avoid proxy/scheme redirect issues in some deployments.
  const response = await axios.get(`${USERS_API_URL}/`);
  return response.data;
}

export async function createUser(data: RegisterRequest): Promise<UserResponse> {
  const response = await axios.post(`${BASE_URL}/api/v1/auth/register`, data);
  return response.data;
}

export async function getUser(id: string): Promise<UserResponse> {
  const response = await axios.get(`${USERS_API_URL}/${id}`);
  return response.data;
}

export async function updateUser(id: string, data: UserUpdate): Promise<UserResponse> {
  // Backend exposes PUT /users/{id}
  const response = await axios.put(`${USERS_API_URL}/${id}`, data);
  return response.data;
}

export async function deleteUser(id: string): Promise<void> {
  await axios.delete(`${USERS_API_URL}/${id}`);
}

export async function toggleUserStatus(id: string): Promise<UserResponse> {
  const current = await getUser(id);
  const response = await axios.put(`${USERS_API_URL}/${id}`, {
    is_active: !current.is_active,
  });
  return response.data;
}

export async function getLearningProfile(id: string): Promise<UserLearningProfile> {
  const response = await axios.get(`${USERS_API_URL}/${id}/learning-profile`);
  return response.data;
}

export async function registerPracticeAttempt(
  id: string,
  data: RegisterPracticeAttemptRequest,
): Promise<UserLearningProfile> {
  const response = await axios.post(`${USERS_API_URL}/${id}/practice-attempt`, data);
  return response.data;
}
