import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  UserResponse,
  RefreshTokenResponse,
  UpdatePasswordRequest,
  UpdatePasswordResponse,
} from '@/types';
import { api, refreshAccessTokenOnce } from '@/lib/api';

export interface RegistrationTaxonomyCategory {
  name: string;
  description: string;
  subcategories: Array<{
    name: string;
    description: string;
    include_terms: string[];
    exclude_terms: string[];
    examples: string[];
  }>;
}

export interface RegistrationTaxonomyResponse {
  taxonomy_version: string;
  taxonomy_categories: RegistrationTaxonomyCategory[];
  categories: string[];
  subtopics: Record<string, string[]>;
  updated_at: string;
}

export async function login(credentials: LoginRequest): Promise<LoginResponse> {
  // OAuth2 Password Flow requiere application/x-www-form-urlencoded
  const formData = new URLSearchParams();
  formData.append('username', credentials.email); // OAuth2 usa 'username' para el email
  formData.append('password', credentials.password);

  const response = await api.post('/api/v1/auth/login', formData, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });
  return response.data;
}

export async function register(credentials: RegisterRequest): Promise<RegisterResponse> {
  const response = await api.post('/api/v1/auth/register', credentials);
  return response.data;
}

export async function me(): Promise<UserResponse> {
  const response = await api.get('/api/v1/auth/me');
  return response.data;
}

export async function refreshToken(): Promise<Pick<RefreshTokenResponse, 'access_token' | 'token_type'>> {
  const access_token = await refreshAccessTokenOnce();
  return { access_token, token_type: 'bearer' };
}

export async function updatePassword(credentials: UpdatePasswordRequest): Promise<UpdatePasswordResponse> {
  const response = await api.post('/api/v1/auth/update-password', credentials);
  return response.data;
}

export async function getRegistrationTaxonomy(): Promise<RegistrationTaxonomyResponse> {
  const response = await api.get('/api/v1/auth/registration-taxonomy');
  return response.data;
}
