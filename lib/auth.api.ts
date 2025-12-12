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

const API_URL = `${process.env.NEXT_PUBLIC_API_URL}/auth` || 'http://localhost:8000/api/v1/auth';

// ============================================================================
// INTERCEPTOR DE REQUEST - Agrega el token automáticamente
// ============================================================================
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token'); // 1. Leer el token de localStorage
    if (token) config.headers.Authorization = `Bearer ${token}`; // 2. Si existe, agregarlo al header Authorization
    return config; // 3. Retornar la configuración modificada
  },
  (error) => { // Si hay error al preparar la petición, rechazarlo
    return Promise.reject(error);
  }
);

// ============================================================================
// INTERCEPTOR DE RESPONSE - Maneja tokens expirados
// ============================================================================
axios.interceptors.response.use(
  (response) => { // Si la respuesta es exitosa (200-299), simplemente retornarla
    return response;
  },
  (error) => { // Si hay un error, verificar si es 401 (Unauthorized)
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
    return Promise.reject(error);
  }
);

// ============================================================================
// FUNCIONES DE API
// ============================================================================

export async function login(credentials: LoginRequest): Promise<LoginResponse> {
  const response = await axios.post(`${API_URL}/login`, credentials);
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
