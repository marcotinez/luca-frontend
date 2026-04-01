import type { PracticeHistorySummary, UserLearningProfile } from "./learning.types";

// ============================================================================
// ENUMS
// ============================================================================

// Son los posibles niveles educativos
export enum EducationLevel {
  MEDIA_INCOMPLETA = "Media Incompleta",
  MEDIA_COMPLETA = "Media Completa",
  TECNICA_INCOMPLETA = "Técnica Superior Incompleta",
  TECNICA_COMPLETA = "Técnica Superior Completa",
  UNIVERSITARIA_INCOMPLETA = "Universitaria Incompleta",
  UNIVERSITARIA_COMPLETA = "Universitaria Completa",
}

export type FinancialTopic = string;

// ============================================================================
// USER TYPES
// ============================================================================

// Es el perfil del usuario
export interface UserProfile {
  age: number;
  education_level: EducationLevel;
  interests: FinancialTopic[];
}

// Es la información de gamificación del usuario
export interface UserGamification {
  current_streak: number;
  max_streak: number;
  total_xp: number;
  last_activity_date: string | null;
}

// Es la respuesta de la API al obtener un usuario
export interface UserResponse {
  id: string;
  email: string;
  is_active: boolean;
  is_superuser: boolean;
  profile: UserProfile;
  gamification: UserGamification;
  learning_profile?: UserLearningProfile;
  practice_history_summary?: PracticeHistorySummary[];
  created_at: string;
}

// Es el objeto que se envía al actualizar un usuario
export interface UserUpdate {
  password?: string;
  age?: number;
  education_level?: EducationLevel;
  interests?: FinancialTopic[];
}
