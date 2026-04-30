import type {
  GraphCategoryStats,
  GraphStats,
  GraphSubcategoryStats,
  RelationshipTypeStat,
} from '@/types/graph.types';

export const STRUCTURAL_RELATIONSHIP_TYPES = new Set(['IN_CATEGORY', 'IN_SUBCATEGORY']);

export type GraphStatsSortKey = 'entity_count' | 'total_relationships' | 'non_structural_relationships';

export function getStructuralTypes(stats: RelationshipTypeStat[]): RelationshipTypeStat[] {
  return stats.filter((item) => STRUCTURAL_RELATIONSHIP_TYPES.has(item.relationship_type));
}

export function getNonStructuralTypes(stats: RelationshipTypeStat[]): RelationshipTypeStat[] {
  return stats.filter((item) => !STRUCTURAL_RELATIONSHIP_TYPES.has(item.relationship_type));
}

export function sumRelationshipTypes(stats: RelationshipTypeStat[]): number {
  return stats.reduce((acc, item) => acc + item.count, 0);
}

export function findCategory(data: GraphStats, categoryName: string): GraphCategoryStats | null {
  return data.categories?.find((category) => category.name === categoryName) ?? null;
}

export function findSubcategory(
  data: GraphStats,
  categoryName: string,
  subcategoryName: string
): GraphSubcategoryStats | null {
  const category = findCategory(data, categoryName);
  return category?.subcategories.find((subcategory) => subcategory.name === subcategoryName) ?? null;
}

export function getVisibleRelationshipTypes(
  stats: RelationshipTypeStat[],
  mode: 'structural' | 'non_structural'
): RelationshipTypeStat[] {
  if (mode === 'structural') return getStructuralTypes(stats);
  return getNonStructuralTypes(stats);
}

export function sortCategories(
  categories: GraphCategoryStats[],
  sortKey: GraphStatsSortKey
): GraphCategoryStats[] {
  return categories.slice().sort((a, b) => {
    if (sortKey === 'entity_count') return b.entity_count - a.entity_count;
    if (sortKey === 'non_structural_relationships') {
      return b.relationships.non_structural_relationships - a.relationships.non_structural_relationships;
    }
    return b.relationships.total_relationships - a.relationships.total_relationships;
  });
}
