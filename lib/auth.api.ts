import type {
  LoginRequest, LoginResponse, RegisterRequest,
  RegisterResponse, UserResponse, RefreshTokenResponse,
  UpdatePasswordRequest, UpdatePasswordResponse,
} from '@/types';
import axios from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const API_URL = `${BASE_URL}/api/v1/auth`;

// ============================================================================
// INTERCEPTOR DE REQUEST - Agrega el token automáticamente
// ============================================================================
axios.interceptors.request.use(
  (config) => {
    // 1. Leer el token de localStorage
    const token = localStorage.getItem('token');
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
    if (error.response?.status === 401) {
      console.log('Token inválido o expirado');

      // 1. Limpiar localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      // 2. Redirigir al login (solo en el navegador)
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
