// Re-exportar todo desde user.types
export { EducationLevel, FinancialTopic } from './user.types';
export type {
  UserProfile,
  UserGamification,
  UserResponse,
  UserUpdate,
} from './user.types';


// Re-exportar todo desde auth.types
export type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  RefreshTokenResponse,
  UpdatePasswordRequest,
  UpdatePasswordResponse,
} from './auth.types';


// Re-exportar todo desde question.types
export { Difficulty, Status, SubTopic } from './question.types';
export type {
  Alternative,
  PedagogicMetadata,
  QuestionResponse,
  QuestionCreate,
  QuestionUpdate,
} from './question.types';


// Re-exportar todo desde ingestion.types
export type {
  IngestionStatus,
  IngestionJob,
  UploadResponse,
} from './ingestion.types';
