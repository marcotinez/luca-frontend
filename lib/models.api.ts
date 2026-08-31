import { api } from '@/lib/api';
import type { components } from '@/types/api.generated';

export type ModelCatalogItem = components['schemas']['ModelCatalogItem'];
export type ModelCatalogResponse = components['schemas']['ModelCatalogResponse'];

export async function getModelCatalog(): Promise<ModelCatalogResponse> {
  const response = await api.get<ModelCatalogResponse>('/api/v1/models');
  return response.data;
}
