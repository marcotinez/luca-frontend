const QUESTION_TYPE_LABELS: Record<string, string> = {
  single_choice: 'Opción única',
  multiple_choice: 'Opción múltiple',
  true_false: 'Verdadero/Falso',
  fill_blank: 'Completar espacios',
  ordering: 'Ordenamiento',
  matching: 'Relación de pares',
  open_ended: 'Respuesta abierta',
  scenario: 'Caso aplicado',
  entity_relation: 'Entidades y relaciones',
};

const UNIT_KIND_LABELS: Record<string, string> = {
  question_type: 'Tipo de pregunta',
  entity: 'Entidad',
  relation: 'Relación',
  taxonomy: 'Taxonomía',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  in_progress: 'En progreso',
  ok: 'Correcta',
  failed: 'Con error',
};

function formatDisplayLabel(value: string, labels: Record<string, string>) {
  const candidate = value.trim();
  if (!candidate) return '-';

  const normalized = candidate.toLowerCase();
  if (labels[candidate]) return labels[candidate];
  if (labels[normalized]) return labels[normalized];

  return candidate
    .replace(/[_-]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toLocaleUpperCase('es-CL') + part.slice(1).toLocaleLowerCase('es-CL'))
    .join(' ');
}

export function formatQuestionTypeLabel(item: string) {
  return formatDisplayLabel(item, QUESTION_TYPE_LABELS);
}

export function formatUnitKindLabel(value: string) {
  return formatDisplayLabel(value, UNIT_KIND_LABELS);
}

export function formatStatusLabel(value: string) {
  return formatDisplayLabel(value, STATUS_LABELS);
}
