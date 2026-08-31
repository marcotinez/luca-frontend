'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { apiErrorMessage } from '@/lib/api';
import { getPromptPlaceholders, PromptPlaceholders } from '@/lib/config.api';

/**
 * Placeholders requeridos por plantilla, según el servidor (claves "sección.campo",
 * p. ej. "generation.stem_user_prompt_template"). Reemplaza el contrato que antes
 * vivía hardcodeado en el cliente.
 */
export function usePromptPlaceholders() {
  const [placeholders, setPlaceholders] = useState<PromptPlaceholders>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await getPromptPlaceholders();
        if (!cancelled) setPlaceholders(response);
      } catch (error) {
        if (!cancelled) toast.error(apiErrorMessage(error, 'No se pudo cargar el contrato de placeholders'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { placeholders, loading };
}
