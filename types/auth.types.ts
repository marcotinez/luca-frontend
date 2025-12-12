import { EducationLevel, FinancialTopic, UserResponse } from "./user.types";

// ============================================================================
// AUTHENTICATION
// ============================================================================

// Se usa al enviar datos para iniciar sesión
export interface LoginRequest {
  email: string;
  password: string;
}

// Es lo que se recibe al iniciar sesión
export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: UserResponse;
}

// Son los datos que se envían al registrar un usuario
export interface RegisterRequest {
  email: string;
  password: string;
  age: number;
  education_level: EducationLevel;
  interests: FinancialTopic[];
}

// Es lo que se recibe al registrar un usuario
export interface RegisterResponse {
  user: UserResponse;
  access_token: string;
  token_type: string;
}

export interface RefreshTokenResponse {
  access_token: string;
  token_type: string;
  user_id: string;
  email: string;
}

export interface UpdatePasswordRequest {
  current_password: string;
  new_password: string;
  new_password_confirmation: string;
}

export interface UpdatePasswordResponse {
  access_token: string;
  token_type: string;
  user_id: string;
  email: string;
}
