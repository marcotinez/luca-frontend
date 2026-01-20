import { useState, useEffect, useCallback } from 'react';
import type { IngestionJob } from '@/types/ingestion.types';
import { getJobStatus } from '@/lib/ingestion.api';

interface UseIngestionJobReturn {
  job: IngestionJob | null;
  error: string | null;
  isPolling: boolean;
}

/**
 * Hook para manejar el polling automático de un trabajo de ingesta
 */
export function useIngestionJob(initialJobId: string | null): UseIngestionJobReturn {
  const [job, setJob] = useState<IngestionJob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  const fetchJobStatus = useCallback(async (id: string) => {
    try {
      const data = await getJobStatus(id);
      setJob(data);
      setError(null);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      return null;
    }
  }, []);

  useEffect(() => {
    if (!initialJobId) {
      setJob(null);
      setIsPolling(false);
      return;
    }

    fetchJobStatus(initialJobId);
    setIsPolling(true);

    const intervalId = setInterval(async () => {
      const currentJob = await fetchJobStatus(initialJobId);
      if (currentJob && ['COMPLETED', 'ERROR', 'SKIPPED', 'COMPLETED_WITH_ERRORS'].includes(currentJob.status)) {
        setIsPolling(false);
        clearInterval(intervalId);
      }
    }, 2000);

    return () => {
      clearInterval(intervalId);
      setIsPolling(false);
    };
  }, [initialJobId, fetchJobStatus]);

  return { job, error, isPolling };
}
