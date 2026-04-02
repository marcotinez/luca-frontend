import axios from 'axios';
import { Difficulty } from '@/types';
import { getStoredToken } from '@/lib/auth-session.storage';

const DEFAULT_BASE_URL = 'http://localhost:8000';

function resolveApiBase(baseUrl?: string) {
  const rawBaseUrl = baseUrl || process.env.NEXT_PUBLIC_API_URL || DEFAULT_BASE_URL;
  const withoutTrailingSlash = rawBaseUrl.replace(/\/+$/, '');
  const withoutApiVersion = withoutTrailingSlash.replace(/\/api\/v1$/i, '');
  return `${withoutApiVersion}/api/v1`;
}

const API_BASE = resolveApiBase();

export interface GenerationQuestionRequest {
  user_input: string;
  category?: string;
  subtopic?: string;
  difficulty: Difficulty;
  question_count?: number;
  semantic_limit?: number;
  semantic_depth?: 1 | 2;
  model?: string;
  output_schema?: Record<string, unknown>;
  output_contract?: Record<string, unknown>;
}

export interface GeneratedAlternative {
  text: string;
  is_correct: boolean;
  feedback: string;
}

export interface GeneratedQuestion {
  id: string;
  status: string;
  category: string;
  subtopic: string;
  difficulty: Difficulty;
  question: string;
  alternatives: GeneratedAlternative[];
  pedagogic_metadata: {
    rag_reference: string;
    complete_explanation: string;
  };
  created_at: string;
}

export interface GenerationQuestionResponse {
  questions: GeneratedQuestion[];
  generated_count: number;
  requested_count?: number;
  discarded_count?: number;
  discarded_question_indexes?: number[] | null;
  semantic_total: number;
  used_model: string;
  final_prompt?: string;
  raw_output: string;
  failure_stage?: string | null;
  validation_issues?: string[] | null;
}

export type GenerationJobStatus = 'queued' | 'running' | 'completed' | 'completed_partial' | 'failed';

export interface GenerationJobState {
  job_id: string;
  status: GenerationJobStatus;
  progress: number;
  stage: string;
  message?: string | null;
  error?: string | null;
  result?: GenerationQuestionResponse | null;
}

export const GENERATION_DIFFICULTY_KEYS = ['Fácil', 'Medio', 'Difícil'] as const;
export type GenerationDifficultyKey = (typeof GENERATION_DIFFICULTY_KEYS)[number];

export type TaxonomySubcategoryRule = {
  name: string;
  description: string;
  include_terms: string[];
  exclude_terms: string[];
  examples: string[];
};

export type TaxonomyCategoryRule = {
  name: string;
  description: string;
  subcategories: TaxonomySubcategoryRule[];
};

export interface GenerationConfigResponse {
  general_prompt: string;
  facil_prompt: string;
  medio_prompt: string;
  dificil_prompt: string;
  generation_user_prompt_template: string;
  generation_difficulty_semantic_instructions: Record<string, string>;
  generation_output_rules_template: string[];
  ingestion_extraction_system_prompt: string;
  ingestion_extraction_user_prompt_template: string;
  ingestion_refinement_system_prompt: string;
  ingestion_refinement_user_prompt_template: string;
  ingestion_taxonomy_classification_system_prompt: string;
  ingestion_taxonomy_classification_user_prompt_template: string;
  taxonomy_version: string;
  taxonomy_max_labels_per_item: number;
  taxonomy_allow_fallback_other: boolean;
  taxonomy_categories: TaxonomyCategoryRule[];
  categories: string[];
  subtopics: Record<string, string[]>;
  updated_at: string;
}

export type GenerationConfigPatchRequest = Partial<{
  general_prompt: string;
  facil_prompt: string;
  medio_prompt: string;
  dificil_prompt: string;
  generation_user_prompt_template: string;
  generation_difficulty_semantic_instructions: Record<string, string>;
  generation_output_rules_template: string[];
  ingestion_extraction_system_prompt: string;
  ingestion_extraction_user_prompt_template: string;
  ingestion_refinement_system_prompt: string;
  ingestion_refinement_user_prompt_template: string;
  ingestion_taxonomy_classification_system_prompt: string;
  ingestion_taxonomy_classification_user_prompt_template: string;
  taxonomy_version: string;
  taxonomy_max_labels_per_item: number;
  taxonomy_allow_fallback_other: boolean;
  taxonomy_categories: TaxonomyCategoryRule[];
  categories: string[];
  subtopics: Record<string, string[]>;
}>;

function getAuthHeaders() {
  const token = getStoredToken();

  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function normalizeString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const candidate of value) {
    if (typeof candidate !== 'string') {
      continue;
    }
    const trimmed = candidate.trim();
    if (!trimmed) {
      continue;
    }

    const lower = trimmed.toLocaleLowerCase();
    if (seen.has(lower)) {
      continue;
    }

    seen.add(lower);
    normalized.push(trimmed);
  }

  return normalized;
}

function normalizeSubtopicsRecord(value: unknown): Record<string, string[]> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  const output: Record<string, string[]> = {};

  for (const [rawCategory, rawSubtopics] of Object.entries(value)) {
    const categoryName = normalizeString(rawCategory).trim();
    if (!categoryName) {
      continue;
    }

    output[categoryName] = normalizeStringArray(rawSubtopics);
  }

  return output;
}

function normalizeStringMap(value: unknown): Record<string, string> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  const output: Record<string, string> = {};

  for (const [rawKey, rawValue] of Object.entries(value)) {
    const key = normalizeString(rawKey).trim();
    if (!key) {
      continue;
    }

    output[key] = normalizeString(rawValue);
  }

  return output;
}

function ensureDifficultyStringMap(
  input: Record<string, string>,
  defaultValue = ''
): Record<string, string> {
  return GENERATION_DIFFICULTY_KEYS.reduce<Record<string, string>>((acc, key) => {
    const value = input[key];
    acc[key] = typeof value === 'string' ? value : defaultValue;
    return acc;
  }, {});
}

function normalizeTaxonomySubcategory(value: unknown): TaxonomySubcategoryRule | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  const raw = value as Record<string, unknown>;
  const name = normalizeString(raw.name).trim();

  if (!name) {
    return null;
  }

  return {
    name,
    description: normalizeString(raw.description),
    include_terms: normalizeStringArray(raw.include_terms),
    exclude_terms: normalizeStringArray(raw.exclude_terms),
    examples: normalizeStringArray(raw.examples),
  };
}

function normalizeTaxonomyCategory(value: unknown): TaxonomyCategoryRule | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  const raw = value as Record<string, unknown>;
  const name = normalizeString(raw.name).trim();

  if (!name) {
    return null;
  }

  const subcategories = Array.isArray(raw.subcategories)
    ? raw.subcategories
        .map((entry) => normalizeTaxonomySubcategory(entry))
        .filter((entry): entry is TaxonomySubcategoryRule => entry !== null)
    : [];

  return {
    name,
    description: normalizeString(raw.description),
    subcategories,
  };
}

function normalizeTaxonomyCategories(value: unknown): TaxonomyCategoryRule[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => normalizeTaxonomyCategory(entry))
    .filter((entry): entry is TaxonomyCategoryRule => entry !== null);
}

function buildTaxonomyFromLegacyCatalog(
  categories: string[],
  subtopics: Record<string, string[]>
): TaxonomyCategoryRule[] {
  return categories.map((categoryName) => ({
    name: categoryName,
    description: '',
    subcategories: (subtopics[categoryName] || []).map((subtopicName) => ({
      name: subtopicName,
      description: '',
      include_terms: [],
      exclude_terms: [],
      examples: [],
    })),
  }));
}

export function deriveCatalogFromTaxonomy(taxonomyCategories: TaxonomyCategoryRule[]): {
  categories: string[];
  subtopics: Record<string, string[]>;
} {
  const categories: string[] = [];
  const subtopics: Record<string, string[]> = {};

  for (const category of taxonomyCategories) {
    const categoryName = category.name.trim();
    if (!categoryName) {
      continue;
    }

    categories.push(categoryName);
    subtopics[categoryName] = category.subcategories
      .map((subcategory) => subcategory.name.trim())
      .filter((subcategoryName) => Boolean(subcategoryName));
  }

  return {
    categories,
    subtopics,
  };
}

function normalizeGenerationConfig(data: unknown): GenerationConfigResponse {
  const raw =
    data && typeof data === 'object' && !Array.isArray(data)
      ? (data as Record<string, unknown>)
      : {};

  const legacyCategories = normalizeStringArray(raw.categories);
  const legacySubtopics = normalizeSubtopicsRecord(raw.subtopics);

  const incomingTaxonomyCategories = normalizeTaxonomyCategories(
    raw.taxonomy_categories
  );
  const normalizedDifficultyInstructions = ensureDifficultyStringMap(
    normalizeStringMap(raw.generation_difficulty_semantic_instructions)
  );

  const taxonomyCategories =
    incomingTaxonomyCategories.length > 0
      ? incomingTaxonomyCategories
      : buildTaxonomyFromLegacyCatalog(legacyCategories, legacySubtopics);

  const derivedCatalog = deriveCatalogFromTaxonomy(taxonomyCategories);

  const taxonomyMaxLabelsCandidate = Number(raw.taxonomy_max_labels_per_item);
  const taxonomyMaxLabelsPerItem =
    Number.isFinite(taxonomyMaxLabelsCandidate) && taxonomyMaxLabelsCandidate >= 1
      ? Math.min(2, Math.round(taxonomyMaxLabelsCandidate))
      : 2;

  return {
    general_prompt: normalizeString(raw.general_prompt),
    facil_prompt: normalizeString(raw.facil_prompt),
    medio_prompt: normalizeString(raw.medio_prompt),
    dificil_prompt: normalizeString(raw.dificil_prompt),
    generation_user_prompt_template: normalizeString(raw.generation_user_prompt_template),
    generation_difficulty_semantic_instructions: normalizedDifficultyInstructions,
    generation_output_rules_template: normalizeStringArray(raw.generation_output_rules_template),
    ingestion_extraction_system_prompt: normalizeString(raw.ingestion_extraction_system_prompt),
    ingestion_extraction_user_prompt_template: normalizeString(
      raw.ingestion_extraction_user_prompt_template
    ),
    ingestion_refinement_system_prompt: normalizeString(raw.ingestion_refinement_system_prompt),
    ingestion_refinement_user_prompt_template: normalizeString(
      raw.ingestion_refinement_user_prompt_template
    ),
    ingestion_taxonomy_classification_system_prompt: normalizeString(
      raw.ingestion_taxonomy_classification_system_prompt
    ),
    ingestion_taxonomy_classification_user_prompt_template: normalizeString(
      raw.ingestion_taxonomy_classification_user_prompt_template
    ),
    taxonomy_version: normalizeString(raw.taxonomy_version) || 'v1',
    taxonomy_max_labels_per_item: taxonomyMaxLabelsPerItem,
    taxonomy_allow_fallback_other:
      typeof raw.taxonomy_allow_fallback_other === 'boolean'
        ? raw.taxonomy_allow_fallback_other
        : true,
    taxonomy_categories: taxonomyCategories,
    categories:
      derivedCatalog.categories.length > 0
        ? derivedCatalog.categories
        : legacyCategories,
    subtopics:
      Object.keys(derivedCatalog.subtopics).length > 0
        ? derivedCatalog.subtopics
        : legacySubtopics,
    updated_at: normalizeString(raw.updated_at),
  };
}

export async function generateQuestion(
  data: GenerationQuestionRequest
): Promise<GenerationQuestionResponse> {
  const response = await axios.post(`${API_BASE}/generation/questions`, data, {
    headers: getAuthHeaders(),
    withCredentials: true,
  });
  return response.data;
}

function normalizeGenerationJobState(
  data: Partial<GenerationJobState> & { job_id: string }
): GenerationJobState {
  return {
    job_id: data.job_id,
    status: (data.status || 'queued') as GenerationJobStatus,
    progress: typeof data.progress === 'number' ? data.progress : 0,
    stage: data.stage || 'queued',
    message: data.message ?? null,
    error: data.error ?? null,
    result: data.result ?? null,
  };
}

export async function startGenerationJob(
  data: GenerationQuestionRequest
): Promise<GenerationJobState> {
  const response = await axios.post(`${API_BASE}/generation/questions/jobs`, data, {
    headers: getAuthHeaders(),
    withCredentials: true,
  });

  const body = response.data as Partial<GenerationJobState> & { job_id: string };
  return normalizeGenerationJobState(body);
}

export async function getGenerationJob(jobId: string): Promise<GenerationJobState> {
  const response = await axios.get(`${API_BASE}/generation/questions/jobs/${jobId}`, {
    headers: getAuthHeaders(),
    withCredentials: true,
  });
  const body = response.data as Partial<GenerationJobState> & { job_id: string };
  return normalizeGenerationJobState(body);
}

export async function getGenerationConfig(baseUrl?: string): Promise<GenerationConfigResponse> {
  const apiBase = resolveApiBase(baseUrl);
  const response = await axios.get(`${apiBase}/admin/generation-config`, {
    headers: getAuthHeaders(),
    withCredentials: true,
  });
  return normalizeGenerationConfig(response.data);
}

export async function patchGenerationConfig(
  data: GenerationConfigPatchRequest,
  baseUrl?: string
): Promise<GenerationConfigResponse> {
  const apiBase = resolveApiBase(baseUrl);
  const response = await axios.patch(`${apiBase}/admin/generation-config`, data, {
    headers: getAuthHeaders(),
    withCredentials: true,
  });
  return normalizeGenerationConfig(response.data);
}
