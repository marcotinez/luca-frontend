'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { apiErrorMessage } from '@/lib/api';
import { executeUnit, listUnits, retryUnit, GenerationUnitResponse } from '@/lib/generation.api';

/**
 * Unidades del lote activo. El backend solo filtra por `status` en
 * `/generation/units` (no hay filtro por selección ni por dificultad/tipo);
 * se pide la página por estado y se intersecta localmente con los
 * `unit_ids` de la selección — el resto de filtros (dificultad, tipo de
 * pregunta, clase de unidad) siguen siendo del lado del cliente.
 */
export function useGenerationUnits(
  snapshotId: string,
  selectionUnitIds: string[],
  statusFilter: string,
  refreshKey: string
) {
  const [units, setUnits] = useState<GenerationUnitResponse[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!snapshotId || selectionUnitIds.length === 0) {
      setUnits([]);
      return;
    }
    setLoading(true);
    try {
      const selectedIdSet = new Set(selectionUnitIds);
      const response = await listUnits(snapshotId, {
        status: statusFilter !== 'all' ? statusFilter : undefined,
        limit: 500,
        skip: 0,
      });
      setUnits(response.items.filter((item) => selectedIdSet.has(item.id)));
    } catch (error) {
      toast.error(apiErrorMessage(error, 'No se pudieron cargar las unidades del lote'));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snapshotId, selectionUnitIds.join(','), statusFilter]);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  const runUnit = useCallback(
    async (unitId: string) => {
      try {
        const result = await executeUnit(unitId);
        toast.success(`Unit ${unitId} ejecutada: ${result.unit.status}.`);
        await load();
      } catch (error) {
        toast.error(apiErrorMessage(error, 'No se pudo ejecutar la unidad'));
      }
    },
    [load]
  );

  const retry = useCallback(
    async (unitId: string) => {
      try {
        const result = await retryUnit(unitId);
        toast.success(`Retry unit ${unitId}: ${result.status}.`);
        await load();
      } catch (error) {
        toast.error(apiErrorMessage(error, 'No se pudo reintentar la unidad'));
      }
    },
    [load]
  );

  return { units, loading, reload: load, runUnit, retry };
}
