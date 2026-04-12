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
import axios from 'axios';
import { getApiBaseUrl } from '@/lib/api-base';
import { clearStoredSession, getStoredToken } from '@/lib/auth-session.storage';

const BASE_URL = getApiBaseUrl();
const API_URL = `${BASE_URL}/api/v1/auth`;

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

// ============================================================================
// INTERCEPTOR DE REQUEST - Agrega el token automáticamente
// ============================================================================
axios.interceptors.request.use(
  (config) => {
    const token = getStoredToken();
    // 2. Si existe, agregarlo al header Authorization
    if (token) config.headers.Authorization = `Bearer ${token}`;
    // 3. Retornar la configuración modificada
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ============================================================================
// INTERCEPTOR DE RESPONSE - Maneja tokens expirados
// ============================================================================
axios.interceptors.response.use(
  // Si la respuesta es exitosa (200-299), simplemente retornarla
  (response) => {
    return response;
  },
  // Si hay un error, verificar si es 401 (Unauthorized)
  (error) => {
    const requestUrl = error.config?.url as string | undefined;
    const isLoginRequest = typeof requestUrl === 'string' && requestUrl.includes('/auth/login');

    if (error.response?.status === 401 && !isLoginRequest) {
      console.log('Token inválido o expirado');

      clearStoredSession();

      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    // Si no es 401, rechazar la petición
    return Promise.reject(error);
  }
);

// ============================================================================
// FUNCIONES DE API
// ============================================================================

export async function login(credentials: LoginRequest): Promise<LoginResponse> {
  // OAuth2 Password Flow requiere application/x-www-form-urlencoded
  const formData = new URLSearchParams();
  formData.append('username', credentials.email); // OAuth2 usa 'username' para el email
  formData.append('password', credentials.password);

  const response = await axios.post(`${API_URL}/login`, formData, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });
  return response.data;
}

export async function register(credentials: RegisterRequest): Promise<RegisterResponse> {
  const response = await axios.post(`${API_URL}/register`, credentials);
  return response.data;
}

export async function me(): Promise<UserResponse> {
  const response = await axios.get(`${API_URL}/me`);
  return response.data;
}

export async function refreshToken(): Promise<RefreshTokenResponse> {
  const response = await axios.post(`${API_URL}/refresh`);
  return response.data;
}

export async function updatePassword(credentials: UpdatePasswordRequest): Promise<UpdatePasswordResponse> {
  const response = await axios.post(`${API_URL}/update-password`, credentials);
  return response.data;
}

export async function getRegistrationTaxonomy(): Promise<RegistrationTaxonomyResponse> {
  const response = await axios.get(`${API_URL}/registration-taxonomy`);
  return response.data;
}
