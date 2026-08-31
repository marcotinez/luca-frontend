'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { apiErrorMessage } from '@/lib/api';
import {
  cancelGenerationSelection,
  createGenerationSelection,
  getGenerationSelection,
  startSelectionRun,
  CreateSelectionRequest,
  SelectionProgressResponse,
} from '@/lib/generation.api';

const ACTIVE_POLL_MS = 3000;
const IDLE_POLL_MS = 15000;

/**
 * Lote (selección) del snapshot activo: crearlo, lanzar su ejecución en el
 * servidor, cancelarlo y seguir su progreso con polling adaptativo — rápido
 * mientras hay unidades pendientes o en curso, lento cuando no, y sin llamar
 * a la red mientras la pestaña está oculta.
 */
export function useSelectionRun(snapshotId: string) {
  const [selectionId, setSelectionId] = useState('');
  const [selection, setSelection] = useState<SelectionProgressResponse | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const selectionRef = useRef<SelectionProgressResponse | null>(null);

  useEffect(() => {
    setSelectionId('');
    setSelection(null);
  }, [snapshotId]);

  const loadSelection = useCallback(async (id: string) => {
    if (!id) {
      setSelection(null);
      return null;
    }
    setIsPolling(true);
    try {
      const response = await getGenerationSelection(id);
      setSelection(response);
      selectionRef.current = response;
      return response;
    } catch (error) {
      toast.error(apiErrorMessage(error, 'No se pudo cargar el progreso de la selección'));
      return null;
    } finally {
      setIsPolling(false);
    }
  }, []);

  useEffect(() => {
    if (selectionId) void loadSelection(selectionId);
  }, [selectionId, loadSelection]);

  useEffect(() => {
    if (!selectionId) return;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;

    const tick = async () => {
      if (cancelled) return;
      if (typeof document === 'undefined' || document.visibilityState === 'visible') {
        await loadSelection(selectionId);
      }
      if (cancelled) return;
      const current = selectionRef.current;
      const hasActiveWork = !!current && (current.pending_units > 0 || current.in_progress_units > 0);
      timeoutId = setTimeout(tick, hasActiveWork ? ACTIVE_POLL_MS : IDLE_POLL_MS);
    };

    timeoutId = setTimeout(tick, ACTIVE_POLL_MS);
    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [selectionId, loadSelection]);

  const create = useCallback(
    async (data: CreateSelectionRequest) => {
      setIsCreating(true);
      try {
        const created = await createGenerationSelection(data);
        setSelectionId(created.selection_id);
        const details = await loadSelection(created.selection_id);
        if (details && details.claimed_count < data.count) {
          toast.warning('No había suficientes unidades elegibles para completar el count solicitado.');
        } else {
          toast.success(`Selección creada: ${created.selection_id}`);
        }
        return created;
      } catch (error) {
        toast.error(apiErrorMessage(error, 'No se pudo crear la selección'));
        return null;
      } finally {
        setIsCreating(false);
      }
    },
    [loadSelection]
  );

  const start = useCallback(
    async (concurrency?: number) => {
      if (!selectionId) return;
      setIsStarting(true);
      try {
        const result = await startSelectionRun(
          selectionId,
          typeof concurrency === 'number' ? { concurrency } : undefined
        );
        toast.success(
          result.running ? 'Ejecución del lote iniciada en el servidor.' : `El lote ya está en estado: ${result.status}.`
        );
        await loadSelection(selectionId);
      } catch (error) {
        toast.error(apiErrorMessage(error, 'No se pudo iniciar la ejecución del lote'));
      } finally {
        setIsStarting(false);
      }
    },
    [selectionId, loadSelection]
  );

  const cancel = useCallback(async () => {
    if (!selectionId) return;
    setIsCancelling(true);
    try {
      await cancelGenerationSelection(selectionId);
      await loadSelection(selectionId);
      toast.success('Selección cancelada.');
    } catch (error) {
      toast.error(apiErrorMessage(error, 'No se pudo cancelar la selección'));
    } finally {
      setIsCancelling(false);
    }
  }, [selectionId, loadSelection]);

  const isRunning = (selection?.in_progress_units ?? 0) > 0;

  return {
    selectionId,
    setSelectionId,
    selection,
    isRunning,
    isCreating,
    isStarting,
    isCancelling,
    isPolling,
    create,
    start,
    cancel,
    reload: () => loadSelection(selectionId),
  };
}
