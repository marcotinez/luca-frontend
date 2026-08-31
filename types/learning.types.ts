import type { FinancialTopic } from "./user.types";

export type PracticeTestStatus = "in_progress" | "completed";

export type PracticeDifficulty = "Fácil" | "Medio" | "Difícil";
export type PracticeTestDifficulty = Exclude<PracticeDifficulty, "Difícil">;

export interface DomainKnowledge {
  topic: FinancialTopic;
  score: number;
  attempts: number;
  correct_attempts: number;
  last_practiced_at: string | null;
}

export interface SubtopicKnowledge {
  topic: FinancialTopic;
  subtopic: string;
  score: number;
  attempts: number;
  correct_attempts: number;
  last_practiced_at: string | null;
}

export interface PracticeHistoryEntry {
  question_id: string | null;
  topic: FinancialTopic;
  subtopic: string | null;
  difficulty: string | null;
  is_correct: boolean;
  response_time_seconds: number | null;
  practiced_at: string;
}

export interface PracticeHistorySummary {
  topic: FinancialTopic;
  last_practiced_at: string | null;
  total_seen: number;
  recent_accuracy: number;
}

export interface UserLearningProfile {
  domain_knowledge: DomainKnowledge[];
  subtopic_knowledge: SubtopicKnowledge[];
  practice_history: PracticeHistoryEntry[];
  total_practice_minutes: number;
  last_practice_at: string | null;
}

export type PracticeTestSelectionMode = "category" | "recommended";
export type AdaptiveQuestionTag = "reinforce" | "challenge";

export interface AdaptiveContext {
  target_category?: FinancialTopic | null;
  target_difficulty?: PracticeTestDifficulty | null;
  reason?: string | null;
  reinforce_ratio: number;
  challenge_ratio: number;
  basis_accuracy?: number | null;
}

export interface PracticeTestCreateRequest {
  question_count?: number;
  category?: FinancialTopic;
  subtopic?: string;
  difficulty?: PracticeTestDifficulty;
  title?: string;
}

export interface CreateCategoryPracticeTestRequest {
  question_count?: number;
  category: FinancialTopic;
  subtopic?: string;
  difficulty?: PracticeTestDifficulty;
  title?: string;
}

export interface CreateRecommendedPracticeTestRequest {
  question_count?: number;
  difficulty?: PracticeTestDifficulty;
  title?: string;
}

export interface PracticeTestQuestionPublic {
  question_index: number;
  question_id: string;
  category: FinancialTopic;
  subtopic: string;
  difficulty: PracticeTestDifficulty;
  adaptive_tag?: AdaptiveQuestionTag | null;
  prompt: string;
  alternatives: { option_id: number; text: string }[];
}

export interface PracticeTestDetailResponse {
  id: string;
  user_id: string;
  title: string | null;
  selection_mode?: PracticeTestSelectionMode | null;
  target_category?: FinancialTopic | null;
  target_subtopic?: string | null;
  recommendation_reason?: string | null;
  adaptive_context?: AdaptiveContext | null;
  status: PracticeTestStatus;
  total_questions: number;
  answered_questions: number;
  correct_answers: number;
  created_at: string;
  completed_at: string | null;
  current_question: PracticeTestQuestionPublic | null;
}

export interface PracticeTestSummaryResponse {
  id: string;
  user_id: string;
  title: string | null;
  selection_mode?: PracticeTestSelectionMode | null;
  target_category?: FinancialTopic | null;
  target_subtopic?: string | null;
  recommendation_reason?: string | null;
  adaptive_context?: AdaptiveContext | null;
  status: PracticeTestStatus;
  total_questions: number;
  answered_questions: number;
  correct_answers: number;
  created_at: string;
  completed_at: string | null;
}

export interface SubmitAnswerRequest {
  selected_option_id: number;
  response_time_seconds?: number;
}

export interface SubmitAnswerResponse {
  test: PracticeTestDetailResponse;
  is_correct: boolean;
  correct_option_id: number;
  feedback: string;
}

export interface PracticeAvailabilityBucket {
  category: FinancialTopic;
  subtopic: string | null;
  available: number;
  enough_for_requested: boolean;
}

export interface PracticeAvailabilityResponse {
  requested_count: number;
  category?: FinancialTopic | null;
  subtopic?: string | null;
  difficulty?: PracticeTestDifficulty | null;
  available_total: number;
  enough_for_requested: boolean;
  buckets: PracticeAvailabilityBucket[];
  suggestions: PracticeAvailabilityBucket[];
}

