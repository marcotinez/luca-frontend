import * as z from 'zod';
import { api, ApiError } from '@/lib/api';
import type { components } from '@/types/api.generated';

export type TaxonomySubcategoryRule = components['schemas']['TaxonomySubcategoryRule'];
export type TaxonomyCategoryRule = components['schemas']['TaxonomyCategoryRule'];
export type GenerationConfigResponse = components['schemas']['LegacyGenerationConfigResponse'];
export type GenerationConfigPatchRequest = components['schemas']['LegacyGenerationConfigPatchRequest'];

// Config y taxonomía alimentan directamente formularios de edición: una respuesta
// malformada no debe llegar a poblar el editor. El resto de la API se consume
// tipado sin validar en runtime (ver generation.api.ts / models.api.ts).
const taxonomySubcategorySchema = z.object({
  name: z.string(),
  description: z.string(),
  include_terms: z.array(z.string()).default([]),
  exclude_terms: z.array(z.string()).default([]),
  examples: z.array(z.string()).default([]),
});

const taxonomyCategorySchema = z.object({
  name: z.string(),
  description: z.string(),
  subcategories: z.array(taxonomySubcategorySchema).default([]),
});

const rubricConfigSchema = z
  .object({
    weights: z.record(z.string(), z.number()).default({}),
    pass_threshold: z.number(),
  })
  .passthrough();

const generationConfigSchema = z.object({
  generation_stem_system_prompt: z.string(),
  generation_stem_user_prompt_template: z.string(),
  generation_distractor_system_prompt: z.string(),
  generation_distractor_user_prompt_template: z.string(),
  generation_judge_system_prompt: z.string(),
  generation_judge_user_prompt_template: z.string(),
  llm_default_model: z.string(),
  llm_models: z.record(z.string(), z.string()),
  llm_model_sections: z.array(z.string()),
  question_type_catalog: z.array(z.string()),
  rubric_config: rubricConfigSchema,
  ingestion_extraction_system_prompt: z.string(),
  ingestion_extraction_user_prompt_template: z.string(),
  ingestion_refinement_system_prompt: z.string(),
  ingestion_refinement_user_prompt_template: z.string(),
  ingestion_taxonomy_classification_system_prompt: z.string(),
  ingestion_taxonomy_classification_user_prompt_template: z.string(),
  taxonomy_version: z.string(),
  taxonomy_max_labels_per_item: z.number(),
  taxonomy_allow_fallback_other: z.boolean(),
  taxonomy_categories: z.array(taxonomyCategorySchema),
  categories: z.array(z.string()),
  subtopics: z.record(z.string(), z.array(z.string())),
  updated_at: z.string(),
});

function parseConfig(data: unknown): GenerationConfigResponse {
  const result = generationConfigSchema.safeParse(data);
  if (!result.success) {
    throw new ApiError('La configuración recibida del servidor no cumple el contrato esperado.', {
      code: 'INVALID_CONFIG_SHAPE',
      details: result.error.flatten(),
    });
  }
  return result.data as GenerationConfigResponse;
}

export async function getGenerationConfig(): Promise<GenerationConfigResponse> {
  const response = await api.get('/api/v1/admin/generation-config');
  return parseConfig(response.data);
}

export async function patchGenerationConfig(
  data: GenerationConfigPatchRequest
): Promise<GenerationConfigResponse> {
  const response = await api.patch('/api/v1/admin/generation-config', data);
  return parseConfig(response.data);
}

// El contrato de placeholders requeridos por plantilla solo lo publica el
// endpoint nuevo por secciones (`/admin/config`), no el legado. Las claves
// son rutas "sección.campo" (p. ej. "generation.stem_user_prompt_template").
export type PromptPlaceholders = Record<string, string[]>;

const promptPlaceholdersSchema = z.record(z.string(), z.array(z.string()));

export async function getPromptPlaceholders(): Promise<PromptPlaceholders> {
  const response = await api.get('/api/v1/admin/config');
  const raw = (response.data as { prompt_placeholders?: unknown } | undefined)?.prompt_placeholders;
  const result = promptPlaceholdersSchema.safeParse(raw);
  if (!result.success) {
    throw new ApiError('El contrato de placeholders recibido del servidor no cumple lo esperado.', {
      code: 'INVALID_PLACEHOLDERS_SHAPE',
      details: result.error.flatten(),
    });
  }
  return result.data;
}

// Secciones que el servidor declara activas en la configuración por secciones.
const sectionsResponseSchema = z.object({ sections: z.array(z.string()) });

export async function getConfigSections(): Promise<string[]> {
  const response = await api.get('/api/v1/admin/config');
  const result = sectionsResponseSchema.safeParse(response.data);
  return result.success ? result.data.sections : [];
}
