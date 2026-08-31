'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ApiError, apiErrorMessage } from '@/lib/api';
import {
  createSnapshot,
  deleteSnapshot,
  getSnapshotProgress,
  listSnapshots,
  refreshSnapshot,
  CreateSnapshotRequest,
  SnapshotProgressResponse,
  SnapshotResponse,
} from '@/lib/generation.api';
import { buildSnapshotViewModel, SnapshotViewModel } from '@/lib/generation.utils';

const EMPTY_PROGRESS: SnapshotProgressResponse = {
  snapshot_id: '',
  ok_units: 0,
  failed_units: 0,
  pending_units: 0,
  in_progress_units: 0,
  total_units: 0,
  missing_combinations: 0,
};

/** Snapshots del servidor: lista, snapshot activo, su progreso, y las acciones sobre él. */
export function useSnapshots() {
  const [snapshots, setSnapshots] = useState<SnapshotResponse[]>([]);
  const [activeSnapshotId, setActiveSnapshotId] = useState('');
  const [progress, setProgress] = useState<SnapshotProgressResponse>(EMPTY_PROGRESS);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadSnapshots = useCallback(async () => {
    setLoading(true);
    try {
      const response = await listSnapshots(100, 0);
      setSnapshots(response.items);
    } catch (error) {
      toast.error(apiErrorMessage(error, 'No se pudieron cargar los snapshots'));
    } finally {
      setLoading(false);
    }
  }, []);

  const loadProgress = useCallback(async (snapshotId: string) => {
    if (!snapshotId) {
      setProgress(EMPTY_PROGRESS);
      return;
    }
    try {
      const response = await getSnapshotProgress(snapshotId);
      setProgress(response);
    } catch (error) {
      toast.error(apiErrorMessage(error, 'No se pudo cargar el progreso del snapshot'));
    }
  }, []);

  useEffect(() => {
    void loadSnapshots();
  }, [loadSnapshots]);

  useEffect(() => {
    void loadProgress(activeSnapshotId);
  }, [activeSnapshotId, loadProgress]);

  const create = useCallback(async (data: CreateSnapshotRequest) => {
    setIsCreating(true);
    try {
      const created = await createSnapshot(data);
      setSnapshots((prev) => [created, ...prev.filter((item) => item.snapshot_id !== created.snapshot_id)]);
      setActiveSnapshotId(created.snapshot_id);
      toast.success(`Snapshot ${created.snapshot_id} creado.`);
      return created;
    } catch (error) {
      toast.error(apiErrorMessage(error, 'No se pudo crear el snapshot'));
      return null;
    } finally {
      setIsCreating(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    if (!activeSnapshotId) return;
    setIsRefreshing(true);
    try {
      const refreshed = await refreshSnapshot(activeSnapshotId);
      setSnapshots((prev) => {
        const existing = prev.find((item) => item.snapshot_id === refreshed.snapshot_id);
        const merged: SnapshotResponse = {
          snapshot_id: refreshed.snapshot_id,
          category: existing?.category || '',
          subtopic: existing?.subtopic ?? null,
          target_difficulties: existing?.target_difficulties || [],
          include_entities: existing?.include_entities ?? true,
          include_relations: existing?.include_relations ?? true,
          question_types: existing?.question_types || [],
          entity_count: refreshed.entity_count,
          relation_count: refreshed.relation_count,
          unit_count: Math.max(existing?.unit_count || 0, (existing?.unit_count || 0) + (refreshed.added_units || 0)),
          refresh_count: refreshed.refresh_count,
          created_at: existing?.created_at || '',
          updated_at: refreshed.updated_at || existing?.updated_at || '',
        };
        return [merged, ...prev.filter((item) => item.snapshot_id !== refreshed.snapshot_id)].slice(0, 20);
      });
      await loadProgress(activeSnapshotId);
      toast.success('Snapshot refrescado.');
    } catch (error) {
      toast.error(apiErrorMessage(error, 'No se pudo refrescar el snapshot'));
    } finally {
      setIsRefreshing(false);
    }
  }, [activeSnapshotId, loadProgress]);

  const remove = useCallback(
    async (snapshotId: string) => {
      setIsDeleting(true);
      try {
        const deleted = await deleteSnapshot(snapshotId);
        setSnapshots((prev) => prev.filter((item) => item.snapshot_id !== snapshotId));
        if (activeSnapshotId === snapshotId) {
          setActiveSnapshotId('');
          setProgress(EMPTY_PROGRESS);
        }
        toast.success(
          `Snapshot eliminado. snapshots:${deleted.deleted_snapshots} units:${deleted.deleted_units} runs:${deleted.deleted_runs} selections:${deleted.deleted_selections}`
        );
        return true;
      } catch (error) {
        if (error instanceof ApiError && error.status === 409) {
          toast.warning('No se puede borrar: existen unidades en progreso.');
        } else if (error instanceof ApiError && error.status === 404) {
          toast.error('Snapshot no encontrado.');
        } else {
          toast.error(apiErrorMessage(error, 'No se pudo eliminar el snapshot'));
        }
        return false;
      } finally {
        setIsDeleting(false);
      }
    },
    [activeSnapshotId]
  );

  const activeSnapshot = snapshots.find((item) => item.snapshot_id === activeSnapshotId) || null;
  const viewModel: SnapshotViewModel | null = activeSnapshot ? buildSnapshotViewModel(activeSnapshot, progress) : null;

  return {
    snapshots,
    activeSnapshotId,
    setActiveSnapshotId,
    activeSnapshot,
    viewModel,
    progress,
    loading,
    isCreating,
    isRefreshing,
    isDeleting,
    create,
    refresh,
    remove,
    reload: loadSnapshots,
  };
}
