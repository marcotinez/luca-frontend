import { api } from '@/lib/api';
import type { components } from '@/types/api.generated';

export type CreateSnapshotRequest = components['schemas']['CreateSnapshotRequest'];
export type SnapshotResponse = components['schemas']['SnapshotResponse'];
export type ListSnapshotsResponse = components['schemas']['ListSnapshotsResponse'];
export type RefreshSnapshotResponse = components['schemas']['RefreshSnapshotResponse'];
export type DeleteSnapshotResponse = components['schemas']['DeleteSnapshotResponse'];
export type SnapshotProgressResponse = components['schemas']['SnapshotProgressResponse'];

export type GenerationUnitResponse = components['schemas']['GenerationUnitResponse'];
export type UnitExecuteRequest = components['schemas']['UnitExecuteRequest'];
export type ExecuteUnitResponse = components['schemas']['ExecuteUnitResponse'];
export type ListUnitsResponse = components['schemas']['ListUnitsResponse'];

export type CreateSelectionRequest = components['schemas']['CreateSelectionRequest'];
export type SelectionResponse = components['schemas']['SelectionResponse'];
export type SelectionProgressResponse = components['schemas']['SelectionProgressResponse'];

export type BackfillGenerationOriginsResponse = components['schemas']['BackfillGenerationOriginsResponse'];
export type GlobalProgressResponse = components['schemas']['GlobalProgressResponse'];
export type GlobalProgressBucket = components['schemas']['GlobalProgressBucket'];
export type GlobalProgressCategoryDifficultyBucket =
  components['schemas']['GlobalProgressCategoryDifficultyBucket'];

export type ListUnitsRequest = {
  status?: string;
  limit?: number;
  skip?: number;
};

export async function createSnapshot(data: CreateSnapshotRequest): Promise<SnapshotResponse> {
  const response = await api.post<SnapshotResponse>('/api/v1/generation/snapshots', data);
  return response.data;
}

export async function listSnapshots(limit = 50, skip = 0): Promise<ListSnapshotsResponse> {
  const response = await api.get<ListSnapshotsResponse>('/api/v1/generation/snapshots', {
    params: { limit, skip },
  });
  return response.data;
}

export async function refreshSnapshot(snapshotId: string): Promise<RefreshSnapshotResponse> {
  const response = await api.post<RefreshSnapshotResponse>(
    `/api/v1/generation/snapshots/${snapshotId}/refresh`,
    {}
  );
  return response.data;
}

export async function deleteSnapshot(snapshotId: string): Promise<DeleteSnapshotResponse> {
  const normalizedSnapshotId = (snapshotId || '').trim();
  if (!normalizedSnapshotId) {
    throw new Error('snapshot_id inválido');
  }
  const response = await api.delete<DeleteSnapshotResponse>(
    `/api/v1/generation/snapshots/${encodeURIComponent(normalizedSnapshotId)}`
  );
  return response.data;
}

export async function backfillGenerationOrigins(force = false): Promise<BackfillGenerationOriginsResponse> {
  const response = await api.post<BackfillGenerationOriginsResponse>(
    '/api/v1/generation/backfill/origins',
    {},
    { params: { force } }
  );
  return response.data;
}

export async function getSnapshotProgress(snapshotId: string): Promise<SnapshotProgressResponse> {
  const response = await api.get<SnapshotProgressResponse>(`/api/v1/generation/snapshots/${snapshotId}/progress`);
  return response.data;
}

export async function getGlobalGenerationProgress(): Promise<GlobalProgressResponse> {
  const response = await api.get<GlobalProgressResponse>('/api/v1/generation/progress/global');
  return response.data;
}

export async function createGenerationSelection(data: CreateSelectionRequest): Promise<SelectionResponse> {
  const payload: CreateSelectionRequest = {
    snapshot_id: data.snapshot_id,
    count: data.count,
    include_failed: typeof data.include_failed === 'boolean' ? data.include_failed : true,
  };
  if (data.difficulties && data.difficulties.length > 0) payload.difficulties = data.difficulties;
  if (data.question_types && data.question_types.length > 0) payload.question_types = data.question_types;
  if (data.unit_kind) payload.unit_kind = data.unit_kind;

  const response = await api.post<SelectionResponse>('/api/v1/generation/selections', payload);
  return response.data;
}

export async function getGenerationSelection(selectionId: string): Promise<SelectionProgressResponse> {
  const normalizedSelectionId = (selectionId || '').trim();
  if (!normalizedSelectionId) {
    throw new Error('selection_id inválido');
  }
  const response = await api.get<SelectionProgressResponse>(
    `/api/v1/generation/selections/${encodeURIComponent(normalizedSelectionId)}`
  );
  return response.data;
}

export async function cancelGenerationSelection(selectionId: string): Promise<SelectionProgressResponse> {
  const normalizedSelectionId = (selectionId || '').trim();
  if (!normalizedSelectionId) {
    throw new Error('selection_id inválido');
  }
  // El endpoint responde { selection, released_units }; el progreso vive anidado en `.selection`.
  const response = await api.post<components['schemas']['CancelSelectionResponse']>(
    `/api/v1/generation/selections/${encodeURIComponent(normalizedSelectionId)}/cancel`,
    {}
  );
  return response.data.selection;
}

export async function executeUnit(unitId: string, data?: UnitExecuteRequest): Promise<ExecuteUnitResponse> {
  const normalizedUnitId = (unitId || '').trim();
  if (!normalizedUnitId) {
    throw new Error('unit_id inválido: no se puede ejecutar una unidad sin ID');
  }
  const response = await api.post<ExecuteUnitResponse>(
    `/api/v1/generation/units/${encodeURIComponent(normalizedUnitId)}/execute`,
    data || {}
  );
  return response.data;
}

export async function retryUnit(unitId: string): Promise<GenerationUnitResponse> {
  const normalizedUnitId = (unitId || '').trim();
  if (!normalizedUnitId) {
    throw new Error('unit_id inválido: no se puede reintentar una unidad sin ID');
  }
  // El endpoint responde { unit }; a diferencia de /execute no trae rubric_scores/trace.
  const response = await api.post<components['schemas']['RetryUnitResponse']>(
    `/api/v1/generation/units/${encodeURIComponent(normalizedUnitId)}/retry`,
    {}
  );
  return response.data.unit;
}

export async function listUnits(snapshotId: string, options?: ListUnitsRequest): Promise<ListUnitsResponse> {
  const normalizedSnapshotId = (snapshotId || '').trim();
  if (!normalizedSnapshotId) {
    return { items: [], total: 0 };
  }
  const response = await api.get<ListUnitsResponse>('/api/v1/generation/units', {
    params: {
      snapshot_id: normalizedSnapshotId,
      ...(options?.status ? { status: options.status } : {}),
      ...(typeof options?.limit === 'number' ? { limit: options.limit } : {}),
      ...(typeof options?.skip === 'number' ? { skip: options.skip } : {}),
    },
  });
  return response.data;
}
