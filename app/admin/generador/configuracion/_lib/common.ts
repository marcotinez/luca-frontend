import axios from 'axios';
import { GenerationDifficultyKey, GENERATION_DIFFICULTY_KEYS } from '@/lib/prompt-generation.api';

export const LARGE_TEXTAREA_CLASSNAME = 'min-h-[240px]';
export const MAX_TERMS_PER_LIST = 30;

export const REQUIRED_PLACEHOLDERS = {
  generation_user_prompt_template: [
    'difficulty',
    'user_input',
    'question_count',
    'difficulty_semantic_instruction',
    'semantic_context_block',
    'semantic_plan_block',
    'variation_matrix_block',
    'avoid_block',
    'output_rules_block',
  ],
  ingestion_extraction_user_prompt_template: ['file_name', 'chunk_text'],
  ingestion_refinement_user_prompt_template: ['entities_json', 'relationships_json'],
  ingestion_taxonomy_classification_user_prompt_template: [
    'taxonomy_version',
    'max_labels_per_item',
    'allow_fallback_other',
    'taxonomy_json',
    'entities_json',
    'relationships_json',
  ],
} as const;

export type TermListKey = 'include_terms' | 'exclude_terms' | 'examples';

export const TERM_LIST_CONFIG: {
  key: TermListKey;
  label: string;
  placeholder: string;
}[] = [
  {
    key: 'include_terms',
    label: 'Términos a incluir',
    placeholder: 'Agregar término permitido',
  },
  {
    key: 'exclude_terms',
    label: 'Términos a excluir',
    placeholder: 'Agregar término bloqueado',
  },
  {
    key: 'examples',
    label: 'Ejemplos',
    placeholder: 'Agregar ejemplo de clasificación',
  },
];

export const DIFFICULTY_PROMPT_FIELD_MAP: Record<GenerationDifficultyKey, 'facil_prompt' | 'medio_prompt' | 'dificil_prompt'> = {
  'Fácil': 'facil_prompt',
  Medio: 'medio_prompt',
  'Difícil': 'dificil_prompt',
};

export function decodeEscapedSequences(value: string): string {
  return value
    .replace(/\\r\\n/g, '\n')
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
    .replace(/\\"/g, '"')
    .replace(/\\'/g, "'")
    .replace(/\\\\/g, '\\');
}

export function normalizeName(value: string): string {
  return value.trim().toLocaleLowerCase();
}

export function validateTemplatePlaceholders(
  template: string,
  requiredKeys: readonly string[]
): string[] {
  return requiredKeys.filter((key) => !template.includes(`{${key}}`));
}

export function isGenerationDifficultyKey(value: string): value is GenerationDifficultyKey {
  return GENERATION_DIFFICULTY_KEYS.includes(value as GenerationDifficultyKey);
}

export function getConfigErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const statusCode = error.response?.status;
    const backendMessage = error.response?.data?.detail || error.response?.data?.message;

    if (statusCode === 400 && backendMessage) {
      return backendMessage;
    }

    if (statusCode === 500) {
      return backendMessage || 'Error interno del servidor al actualizar la configuración.';
    }

    return backendMessage || 'No se pudo actualizar la configuración';
  }

  return 'No se pudo actualizar la configuración';
}
