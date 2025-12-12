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

// Son los posibles temas financieros
export enum FinancialTopic {
  PLANIFICACION = "Planificación y presupuesto",
  AHORRO = "Ahorro y metas",
  CREDITO = "El mundo del crédito",
  DEUDAS = "Manejo de deudas",
  PRODUCTOS_BANCARIOS = "Productos bancarios esenciales",
  PRIMER_EMPLEO = "Primer empleo y conceptos laborales",
  ECONOMIA = "Economía práctica",
  INVERSION = "Introducción a la inversión y riesgo",
  CONSUMO = "Consumo inteligente",
  SEGURIDAD = "Seguridad financiera",
}

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
  created_at: string;
}

// Es el objeto que se envía al actualizar un usuario
export interface UserUpdate {
  password?: string;
  age?: number;
  education_level?: EducationLevel;
  interests?: FinancialTopic[];
}
