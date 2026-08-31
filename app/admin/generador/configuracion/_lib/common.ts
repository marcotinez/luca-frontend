export const LARGE_TEXTAREA_CLASSNAME = 'min-h-[420px] resize-y font-mono text-sm leading-6';
export const MAX_TERMS_PER_LIST = 30;

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
