// Re-exportar todo desde user.types
export { EducationLevel } from './user.types';
export type {
  FinancialTopic,
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
  IngestionJobStatus,
  IngestionEvent,
  IngestionRun,
  IngestionJob,
  StartIngestionResponse,
} from './ingestion.types';


// Re-exportar todo desde learning.types
export type {
  PracticeTestStatus,
  PracticeDifficulty,
  DomainKnowledge,
  PracticeHistoryEntry,
  PracticeHistorySummary,
  UserLearningProfile,
  PracticeTestCreateRequest,
  PracticeTestQuestionPublic,
  PracticeTestDetailResponse,
  PracticeTestSummaryResponse,
  SubmitAnswerRequest,
  SubmitAnswerResponse,
  RegisterPracticeAttemptRequest,
} from './learning.types';
