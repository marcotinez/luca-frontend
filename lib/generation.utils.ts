import type { SnapshotProgressResponse, SnapshotResponse } from '@/lib/generation.api';
import type { TaxonomyCategoryRule } from '@/lib/config.api';

// Transformaciones de presentación: combinan datos ya tipados de la API en
// vistas que usan las páginas administrativas. No acceden a la red ni
// reconstruyen campos ausentes.

export type SnapshotViewModel = SnapshotResponse & {
  progress: SnapshotProgressResponse;
};

export function buildSnapshotViewModel(
  snapshot: SnapshotResponse,
  progress?: SnapshotProgressResponse
): SnapshotViewModel {
  const fallbackProgress: SnapshotProgressResponse = {
    snapshot_id: snapshot.snapshot_id,
    ok_units: 0,
    failed_units: 0,
    pending_units: 0,
    in_progress_units: 0,
    total_units: snapshot.unit_count || 0,
    missing_combinations: 0,
  };

  const resolvedProgress = progress && progress.snapshot_id === snapshot.snapshot_id ? progress : fallbackProgress;

  return {
    ...snapshot,
    progress: resolvedProgress,
  };
}

export function deriveCatalogFromTaxonomy(taxonomyCategories: TaxonomyCategoryRule[]): {
  categories: string[];
  subtopics: Record<string, string[]>;
} {
  const categories: string[] = [];
  const subtopics: Record<string, string[]> = {};

  for (const category of taxonomyCategories) {
    const categoryName = category.name.trim();
    if (!categoryName) continue;

    categories.push(categoryName);
    subtopics[categoryName] = (category.subcategories ?? [])
      .map((subcategory) => subcategory.name.trim())
      .filter(Boolean);
  }

  return { categories, subtopics };
}
