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

export type RubricConfig = {
  weights: Record<string, number>;
  pass_threshold: number;
};

export interface GenerationConfigResponse {
  generation_stem_system_prompt: string;
  generation_stem_user_prompt_template: string;
  generation_distractor_system_prompt: string;
  generation_distractor_user_prompt_template: string;
  generation_judge_system_prompt: string;
  generation_judge_user_prompt_template: string;
  llm_default_model: string;
  llm_models: Record<string, string>;
  embedding_default_model: string;
  embedding_models: Record<string, string>;
  question_type_catalog: string[];
  rubric_config: RubricConfig;
  llm_providers: Record<string, Record<string, string>>;
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
  generation_stem_system_prompt: string;
  generation_stem_user_prompt_template: string;
  generation_distractor_system_prompt: string;
  generation_distractor_user_prompt_template: string;
  generation_judge_system_prompt: string;
  generation_judge_user_prompt_template: string;
  llm_default_model: string;
  llm_models: Record<string, string>;
  embedding_default_model: string;
  embedding_models: Record<string, string>;
  question_type_catalog: string[];
  rubric_config: RubricConfig;
  llm_providers: Record<string, Record<string, string>>;
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

export type CreateSnapshotRequest = {
  category: string;
  subtopic?: string | null;
  target_difficulties: Difficulty[];
  question_types?: string[];
  include_entities: boolean;
  include_relations: boolean;
};

export type SnapshotResponse = {
  snapshot_id: string;
  category?: string;
  subtopic?: string | null;
  target_difficulties?: string[];
  include_entities?: boolean;
  include_relations?: boolean;
  question_types?: string[];
  entity_count: number;
  relation_count: number;
  unit_count: number;
  refresh_count: number;
  created_at?: string;
  updated_at?: string;
};

export type RefreshSnapshotResponse = {
  snapshot_id: string;
  refresh_count: number;
  added_units: number;
  entity_count: number;
  relation_count: number;
  updated_at?: string;
};

export type SnapshotProgressResponse = {
  snapshot_id: string;
  ok_units: number;
  failed_units: number;
  pending_units: number;
  in_progress_units: number;
  total_units: number;
  updated_at?: string;
};

export type SnapshotViewModel = {
  snapshot_id: string;
  category?: string;
  subtopic?: string | null;
  target_difficulties: string[];
  include_entities: boolean;
  include_relations: boolean;
  question_types: string[];
  entity_count: number;
  relation_count: number;
  unit_count: number;
  refresh_count: number;
  created_at?: string;
  updated_at?: string;
  progress: SnapshotProgressResponse;
};

export type GenerationUnitStatus = 'pending' | 'in_progress' | 'ok' | 'failed' | string;

export type GenerationUnitResponse = {
  unit_id: string;
  snapshot_id: string;
  status: GenerationUnitStatus;
  difficulty?: Difficulty | string;
  question_type?: string;
  unit_kind?: string;
  attempts?: number;
  max_attempts?: number;
  question_id?: string | null;
  last_error?: string | null;
  updated_at?: string;
  created_at?: string;
};

export type UnitExecuteRequest = {
  force?: boolean;
};

export type ExecuteUnitResponse = {
  unit_id: string;
  status: GenerationUnitStatus;
  message?: string;
  error?: string | null;
  rubric_scores?: Record<string, number> | null;
  trace?: Record<string, unknown> | null;
};

export type ListUnitsResponse = {
  items: GenerationUnitResponse[];
  total: number;
};

export type ListSnapshotsResponse = {
  items: SnapshotResponse[];
  total: number;
};

export type ListUnitsRequest = {
  status?: string;
  limit?: number;
  skip?: number;
};

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

function normalizeNumber(value: unknown, fallback = 0): number {
  const candidate = Number(value);
  if (!Number.isFinite(candidate)) {
    return fallback;
  }
  return candidate;
}

function normalizeNumberMap(value: unknown): Record<string, number> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  const output: Record<string, number> = {};

  for (const [rawKey, rawValue] of Object.entries(value)) {
    const key = normalizeString(rawKey).trim();
    if (!key) {
      continue;
    }
    const parsed = Number(rawValue);
    if (!Number.isFinite(parsed)) {
      continue;
    }
    output[key] = parsed;
  }

  return output;
}

function normalizeNestedNumberMap(value: unknown): Record<string, Record<string, number>> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  const output: Record<string, Record<string, number>> = {};

  for (const [rawKey, rawValue] of Object.entries(value)) {
    const key = normalizeString(rawKey).trim();
    if (!key) {
      continue;
    }
    output[key] = normalizeNumberMap(rawValue);
  }

  return output;
}

function ensureDifficultyNumberMap(
  input: Record<string, number>,
  defaultValue = 0
): Record<string, number> {
  return GENERATION_DIFFICULTY_KEYS.reduce<Record<string, number>>((acc, key) => {
    const value = input[key];
    acc[key] = Number.isFinite(value) ? value : defaultValue;
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

function normalizeQuestionTypeCatalog(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const output: string[] = [];
  const seen = new Set<string>();
  for (const entry of value) {
    if (typeof entry !== 'string') {
      continue;
    }
    const key = entry.trim();
    if (!key) continue;
    const normalized = key.toLocaleLowerCase();
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    output.push(key);
  }

  return output;
}

function normalizeRubricConfig(value: unknown): RubricConfig {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { weights: {}, pass_threshold: 0 };
  }

  const raw = value as Record<string, unknown>;
  return {
    weights: normalizeNumberMap(raw.weights),
    pass_threshold: normalizeNumber(raw.pass_threshold, 0),
  };
}

function normalizeLLMProviders(value: unknown): Record<string, Record<string, string>> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  const raw = value as Record<string, unknown>;
  const providers: Record<string, Record<string, string>> = {};
  for (const [providerName, providerValue] of Object.entries(raw)) {
    const key = normalizeString(providerName).trim();
    if (!key) continue;
    if (!providerValue || typeof providerValue !== 'object' || Array.isArray(providerValue)) {
      continue;
    }
    providers[key] = normalizeStringMap(providerValue);
  }
  return providers;
}

function normalizeGenerationConfig(data: unknown): GenerationConfigResponse {
  const raw =
    data && typeof data === 'object' && !Array.isArray(data)
      ? (data as Record<string, unknown>)
      : {};

  const legacyCategories = normalizeStringArray(raw.categories);
  const legacySubtopics = normalizeSubtopicsRecord(raw.subtopics);

  const incomingTaxonomyCategories = normalizeTaxonomyCategories(raw.taxonomy_categories);
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
    generation_stem_system_prompt: normalizeString(raw.generation_stem_system_prompt),
    generation_stem_user_prompt_template: normalizeString(raw.generation_stem_user_prompt_template),
    generation_distractor_system_prompt: normalizeString(raw.generation_distractor_system_prompt),
    generation_distractor_user_prompt_template: normalizeString(raw.generation_distractor_user_prompt_template),
    generation_judge_system_prompt: normalizeString(raw.generation_judge_system_prompt),
    generation_judge_user_prompt_template: normalizeString(raw.generation_judge_user_prompt_template),
    llm_default_model: normalizeString(raw.llm_default_model),
    llm_models: normalizeStringMap(raw.llm_models),
    embedding_default_model: normalizeString(raw.embedding_default_model),
    embedding_models: normalizeStringMap(raw.embedding_models),
    question_type_catalog: normalizeQuestionTypeCatalog(raw.question_type_catalog),
    rubric_config: normalizeRubricConfig(raw.rubric_config),
    llm_providers: normalizeLLMProviders(raw.llm_providers),
    ingestion_extraction_system_prompt: normalizeString(raw.ingestion_extraction_system_prompt),
    ingestion_extraction_user_prompt_template: normalizeString(raw.ingestion_extraction_user_prompt_template),
    ingestion_refinement_system_prompt: normalizeString(raw.ingestion_refinement_system_prompt),
    ingestion_refinement_user_prompt_template: normalizeString(raw.ingestion_refinement_user_prompt_template),
    ingestion_taxonomy_classification_system_prompt: normalizeString(
      raw.ingestion_taxonomy_classification_system_prompt
    ),
    ingestion_taxonomy_classification_user_prompt_template: normalizeString(
      raw.ingestion_taxonomy_classification_user_prompt_template
    ),
    taxonomy_version: normalizeString(raw.taxonomy_version) || 'v1',
    taxonomy_max_labels_per_item: taxonomyMaxLabelsPerItem,
    taxonomy_allow_fallback_other:
      typeof raw.taxonomy_allow_fallback_other === 'boolean' ? raw.taxonomy_allow_fallback_other : true,
    taxonomy_categories: taxonomyCategories,
    categories: derivedCatalog.categories.length > 0 ? derivedCatalog.categories : legacyCategories,
    subtopics: Object.keys(derivedCatalog.subtopics).length > 0 ? derivedCatalog.subtopics : legacySubtopics,
    updated_at: normalizeString(raw.updated_at),
  };
}

function normalizeSnapshotResponse(data: unknown): SnapshotResponse {
  const raw = data && typeof data === 'object' && !Array.isArray(data) ? (data as Record<string, unknown>) : {};
  return {
    snapshot_id: normalizeString(raw.snapshot_id),
    category: normalizeString(raw.category) || undefined,
    subtopic: raw.subtopic === null ? null : normalizeString(raw.subtopic) || undefined,
    target_difficulties: normalizeStringArray(raw.target_difficulties),
    include_entities: typeof raw.include_entities === 'boolean' ? raw.include_entities : undefined,
    include_relations: typeof raw.include_relations === 'boolean' ? raw.include_relations : undefined,
    question_types: normalizeStringArray(raw.question_types),
    entity_count: normalizeNumber(raw.entity_count, 0),
    relation_count: normalizeNumber(raw.relation_count, 0),
    unit_count: normalizeNumber(raw.unit_count, 0),
    refresh_count: normalizeNumber(raw.refresh_count, 0),
    created_at: normalizeString(raw.created_at) || undefined,
    updated_at: normalizeString(raw.updated_at) || undefined,
  };
}

function normalizeSnapshotProgressResponse(data: unknown): SnapshotProgressResponse {
  const raw = data && typeof data === 'object' && !Array.isArray(data) ? (data as Record<string, unknown>) : {};
  const okUnits = normalizeNumber(raw.ok_units, 0);
  const failedUnits = normalizeNumber(raw.failed_units, 0);
  const pendingUnits = normalizeNumber(raw.pending_units, 0);
  const inProgressUnits = normalizeNumber(raw.in_progress_units, 0);
  const total = normalizeNumber(raw.total_units, okUnits + failedUnits + pendingUnits + inProgressUnits);

  return {
    snapshot_id: normalizeString(raw.snapshot_id),
    ok_units: okUnits,
    failed_units: failedUnits,
    pending_units: pendingUnits,
    in_progress_units: inProgressUnits,
    total_units: total,
    updated_at: normalizeString(raw.updated_at) || undefined,
  };
}

function normalizeRefreshSnapshotResponse(data: unknown): RefreshSnapshotResponse {
  const raw = data && typeof data === 'object' && !Array.isArray(data) ? (data as Record<string, unknown>) : {};
  return {
    snapshot_id: normalizeString(raw.snapshot_id),
    refresh_count: normalizeNumber(raw.refresh_count, 0),
    added_units: normalizeNumber(raw.added_units, 0),
    entity_count: normalizeNumber(raw.entity_count, 0),
    relation_count: normalizeNumber(raw.relation_count, 0),
    updated_at: normalizeString(raw.updated_at) || undefined,
  };
}

export function buildSnapshotViewModel(
  snapshot: SnapshotResponse,
  progress?: SnapshotProgressResponse
): SnapshotViewModel {
  const snapshotId = snapshot.snapshot_id;
  const fallbackProgress: SnapshotProgressResponse = {
    snapshot_id: snapshotId,
    ok_units: 0,
    failed_units: 0,
    pending_units: 0,
    in_progress_units: 0,
    total_units: snapshot.unit_count || 0,
    updated_at: snapshot.updated_at,
  };

  const resolvedProgress =
    progress && progress.snapshot_id === snapshotId
      ? progress
      : fallbackProgress;

  return {
    snapshot_id: snapshotId,
    category: snapshot.category,
    subtopic: snapshot.subtopic,
    target_difficulties: snapshot.target_difficulties || [],
    include_entities: typeof snapshot.include_entities === 'boolean' ? snapshot.include_entities : true,
    include_relations: typeof snapshot.include_relations === 'boolean' ? snapshot.include_relations : true,
    question_types: snapshot.question_types || [],
    entity_count: snapshot.entity_count,
    relation_count: snapshot.relation_count,
    unit_count: snapshot.unit_count,
    refresh_count: snapshot.refresh_count,
    created_at: snapshot.created_at,
    updated_at: snapshot.updated_at,
    progress: resolvedProgress,
  };
}

function normalizeGenerationUnitResponse(data: unknown): GenerationUnitResponse {
  const raw = data && typeof data === 'object' && !Array.isArray(data) ? (data as Record<string, unknown>) : {};
  const normalizedUnitId =
    normalizeString(raw.unit_id).trim() ||
    normalizeString(raw.id).trim() ||
    normalizeString(raw.uuid).trim();

  return {
    unit_id: normalizedUnitId,
    snapshot_id: normalizeString(raw.snapshot_id),
    status: normalizeString(raw.status) || 'pending',
    difficulty: normalizeString(raw.difficulty) || undefined,
    question_type: normalizeString(raw.question_type) || undefined,
    unit_kind: normalizeString(raw.unit_kind) || undefined,
    attempts: normalizeNumber(
      raw.attempt_count ?? raw.attempts,
      0
    ),
    max_attempts: normalizeNumber(raw.max_attempts, 0),
    question_id:
      raw.question_id == null
        ? null
        : normalizeString(raw.question_id),
    last_error: raw.last_error == null ? null : normalizeString(raw.last_error),
    created_at: normalizeString(raw.created_at) || undefined,
    updated_at: normalizeString(raw.updated_at) || undefined,
  };
}

function normalizeExecuteUnitResponse(data: unknown): ExecuteUnitResponse {
  const raw = data && typeof data === 'object' && !Array.isArray(data) ? (data as Record<string, unknown>) : {};
  const unitRaw =
    raw.unit && typeof raw.unit === 'object' && !Array.isArray(raw.unit)
      ? (raw.unit as Record<string, unknown>)
      : null;
  const unitId =
    normalizeString(raw.unit_id).trim() ||
    normalizeString(unitRaw?.id).trim() ||
    normalizeString(unitRaw?.unit_id).trim();
  const status =
    normalizeString(raw.status).trim() ||
    normalizeString(unitRaw?.status).trim() ||
    'failed';

  const rubricScoresRaw = raw.rubric_scores;
  const rubricScores =
    rubricScoresRaw && typeof rubricScoresRaw === 'object' && !Array.isArray(rubricScoresRaw)
      ? (rubricScoresRaw as Record<string, number>)
      : null;
  const traceRaw = raw.trace;
  const trace =
    traceRaw && typeof traceRaw === 'object' && !Array.isArray(traceRaw)
      ? (traceRaw as Record<string, unknown>)
      : null;

  return {
    unit_id: unitId,
    status,
    message: normalizeString(raw.message) || undefined,
    error: raw.error == null ? null : normalizeString(raw.error),
    rubric_scores: rubricScores,
    trace,
  };
}

export async function createSnapshot(data: CreateSnapshotRequest): Promise<SnapshotResponse> {
  const response = await axios.post(`${API_BASE}/generation/snapshots`, data, {
    headers: getAuthHeaders(),
    withCredentials: true,
  });
  return normalizeSnapshotResponse(response.data);
}

export async function listSnapshots(limit = 50, skip = 0): Promise<ListSnapshotsResponse> {
  const response = await axios.get(`${API_BASE}/generation/snapshots`, {
    headers: getAuthHeaders(),
    withCredentials: true,
    params: { limit, skip },
  });

  const body = response.data;
  if (Array.isArray(body)) {
    const items = body.map((entry) => normalizeSnapshotResponse(entry));
    return { items, total: items.length };
  }

  const raw = body && typeof body === 'object' && !Array.isArray(body) ? (body as Record<string, unknown>) : {};
  const itemsRaw = Array.isArray(raw.items) ? raw.items : [];
  const items = itemsRaw.map((entry) => normalizeSnapshotResponse(entry));
  return {
    items,
    total: normalizeNumber(raw.total, items.length),
  };
}

export async function refreshSnapshot(snapshotId: string): Promise<RefreshSnapshotResponse> {
  const response = await axios.post(
    `${API_BASE}/generation/snapshots/${snapshotId}/refresh`,
    {},
    {
      headers: getAuthHeaders(),
      withCredentials: true,
    }
  );
  return normalizeRefreshSnapshotResponse(response.data);
}

export async function getSnapshotProgress(snapshotId: string): Promise<SnapshotProgressResponse> {
  const response = await axios.get(`${API_BASE}/generation/snapshots/${snapshotId}/progress`, {
    headers: getAuthHeaders(),
    withCredentials: true,
  });
  return normalizeSnapshotProgressResponse(response.data);
}

export async function getNextUnit(snapshotId: string): Promise<GenerationUnitResponse | null> {
  const response = await axios.post(
    `${API_BASE}/generation/units/next`,
    { snapshot_id: snapshotId },
    {
      headers: getAuthHeaders(),
      withCredentials: true,
    }
  );

  if (!response.data) {
    return null;
  }

  const unit = normalizeGenerationUnitResponse(response.data);
  return unit.unit_id ? unit : null;
}

export async function executeUnit(unitId: string, data?: UnitExecuteRequest): Promise<ExecuteUnitResponse> {
  const normalizedUnitId = (unitId || '').trim();
  if (!normalizedUnitId) {
    throw new Error('unit_id inválido: no se puede ejecutar una unidad sin ID');
  }
  const response = await axios.post(
    `${API_BASE}/generation/units/${encodeURIComponent(normalizedUnitId)}/execute`,
    data || {},
    {
      headers: getAuthHeaders(),
      withCredentials: true,
    }
  );
  return normalizeExecuteUnitResponse(response.data);
}

export async function retryUnit(unitId: string): Promise<ExecuteUnitResponse> {
  const normalizedUnitId = (unitId || '').trim();
  if (!normalizedUnitId) {
    throw new Error('unit_id inválido: no se puede reintentar una unidad sin ID');
  }
  const response = await axios.post(
    `${API_BASE}/generation/units/${encodeURIComponent(normalizedUnitId)}/retry`,
    {},
    {
    headers: getAuthHeaders(),
    withCredentials: true,
    }
  );
  return normalizeExecuteUnitResponse(response.data);
}

export async function listUnits(snapshotId: string, options?: ListUnitsRequest): Promise<ListUnitsResponse> {
  const normalizedSnapshotId = (snapshotId || '').trim();
  if (!normalizedSnapshotId) {
    return { items: [], total: 0 };
  }
  const response = await axios.get(`${API_BASE}/generation/units`, {
    headers: getAuthHeaders(),
    withCredentials: true,
    params: {
      snapshot_id: normalizedSnapshotId,
      ...(options?.status ? { status: options.status } : {}),
      ...(typeof options?.limit === 'number' ? { limit: options.limit } : {}),
      ...(typeof options?.skip === 'number' ? { skip: options.skip } : {}),
    },
  });

  const body = response.data;
  if (Array.isArray(body)) {
    const items = body.map((entry) => normalizeGenerationUnitResponse(entry));
    return { items, total: items.length };
  }

  const raw = body && typeof body === 'object' && !Array.isArray(body) ? (body as Record<string, unknown>) : {};
  const itemsRaw = Array.isArray(raw.items) ? raw.items : Array.isArray(raw.units) ? raw.units : [];
  const items = itemsRaw.map((entry) => normalizeGenerationUnitResponse(entry));
  return {
    items,
    total: normalizeNumber(raw.total, items.length),
  };
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
