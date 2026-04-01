export interface RuntimeTaxonomy {
  categories: string[];
  subtopicsByCategory: Record<string, string[]>;
}

function normalizeString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function dedupeStrings(values: unknown[]): string[] {
  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const value of values) {
    const item = normalizeString(value);
    if (!item) continue;

    const key = item.toLocaleLowerCase();
    if (seen.has(key)) continue;

    seen.add(key);
    normalized.push(item);
  }

  return normalized;
}

export function normalizeRuntimeTaxonomy(input: {
  categories?: unknown[];
  subtopics?: Record<string, unknown[]>;
}): RuntimeTaxonomy {
  const categories = dedupeStrings(input.categories || []);
  const subtopicsByCategory: Record<string, string[]> = {};

  for (const category of categories) {
    const rawList = input.subtopics?.[category] || [];
    subtopicsByCategory[category] = Array.isArray(rawList) ? dedupeStrings(rawList) : [];
  }

  return {
    categories,
    subtopicsByCategory,
  };
}
