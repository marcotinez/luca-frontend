import type { GraphCategoryStats, GraphStats, RelationshipTypeStat } from '@/types/graph.types';

export const STRUCTURAL_RELATIONSHIP_TYPES = new Set(['IN_CATEGORY', 'IN_SUBCATEGORY']);

export type GraphStatsSortKey = 'entity_count' | 'total_relationships' | 'non_structural_relationships';

export function getStructuralTypes(stats: RelationshipTypeStat[]): RelationshipTypeStat[] {
  return stats.filter((item) => STRUCTURAL_RELATIONSHIP_TYPES.has(item.relationship_type));
}

export function getNonStructuralTypes(stats: RelationshipTypeStat[]): RelationshipTypeStat[] {
  return stats.filter((item) => !STRUCTURAL_RELATIONSHIP_TYPES.has(item.relationship_type));
}

export function findCategory(data: GraphStats, categoryName: string): GraphCategoryStats | null {
  return data.categories?.find((category) => category.name === categoryName) ?? null;
}
