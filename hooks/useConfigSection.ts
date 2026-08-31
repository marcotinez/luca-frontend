'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { apiErrorMessage } from '@/lib/api';
import {
  getGenerationConfig,
  patchGenerationConfig,
  GenerationConfigPatchRequest,
  GenerationConfigResponse,
} from '@/lib/config.api';

/**
 * Ciclo común a las páginas de configuración: cargar, mantener un borrador,
 * detectar cambios sin guardar, y guardar solo lo modificado (PATCH parcial).
 * `cloneDraft` proyecta la config del servidor al borrador de la sección;
 * `buildPatch` calcula el PATCH comparando borrador contra la última config
 * conocida, para no reenviar campos que no cambiaron.
 */
export function useConfigSection<TDraft>(
  cloneDraft: (config: GenerationConfigResponse) => TDraft,
  buildPatch: (draft: TDraft, config: GenerationConfigResponse) => GenerationConfigPatchRequest
) {
  const [config, setConfig] = useState<GenerationConfigResponse | null>(null);
  const [draft, setDraft] = useState<TDraft | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await getGenerationConfig();
      setConfig(response);
      setDraft(cloneDraft(response));
    } catch (error) {
      toast.error(apiErrorMessage(error, 'No se pudo cargar la configuración'));
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const isDirty = useMemo(() => {
    if (!config || draft === null) return false;
    return JSON.stringify(cloneDraft(config)) !== JSON.stringify(draft);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config, draft]);

  // Avisa de cambios sin guardar al cerrar o refrescar la pestaña.
  useEffect(() => {
    if (!isDirty) return;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  const restore = useCallback(() => {
    if (!config) return;
    setDraft(cloneDraft(config));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config]);

  const save = useCallback(async () => {
    if (!config || draft === null) return null;
    const patch = buildPatch(draft, config);
    if (Object.keys(patch).length === 0) {
      toast.info('No hay cambios para guardar.');
      return null;
    }
    setIsSaving(true);
    try {
      const updated = await patchGenerationConfig(patch);
      setConfig(updated);
      setDraft(cloneDraft(updated));
      toast.success('Configuración actualizada');
      return updated;
    } catch (error) {
      toast.error(apiErrorMessage(error, 'No se pudo actualizar la configuración'));
      return null;
    } finally {
      setIsSaving(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config, draft, buildPatch]);

  return { config, draft, setDraft, isLoading, isSaving, isDirty, restore, save };
}
