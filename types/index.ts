export type EducationLevel =
  | "Media Incompleta"
  | "Media Completa"
  | "Técnica Superior Incompleta"
  | "Técnica Superior Completa"
  | "Universitaria Incompleta"
  | "Universitaria Completa"
  | "Postgrado";

export type FinancialTopic =
  | "Planificación y presupuesto"
  | "Ahorro y metas"
  | "El mundo del crédito"
  | "Manejo de deudas"
  | "Productos bancarios esenciales"
  | "Primer empleo y conceptos laborales"
  | "Economía práctica"
  | "Introducción a la inversión y riesgo"
  | "Consumo inteligente"
  | "Seguridad financiera";

export interface UserProfile {
  age: number;
  education_level: EducationLevel;
  interests: FinancialTopic[];
}

export interface UserGamification {
  current_streak: number;
  max_streak: number;
  total_xp: number;
  last_activity_date: string | null;
}

export interface User {
  id: string;
  email: string;
  is_active: boolean;
  is_superuser: boolean;
  profile: UserProfile;
  gamification: UserGamification;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

export interface ApiError {
  detail: string | { loc: (string | number)[]; msg: string; type: string }[];
}
