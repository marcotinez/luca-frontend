'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Difficulty } from '@/types';
import {
  buildSnapshotViewModel,
  createSnapshot,
  executeUnit,
  GenerationConfigResponse,
  GenerationUnitResponse,
  getGenerationConfig,
  getNextUnit,
  getSnapshotProgress,
  listUnits,
  listSnapshots,
  refreshSnapshot,
  retryUnit,
  SnapshotProgressResponse,
  SnapshotResponse,
  SnapshotViewModel,
} from '@/lib/prompt-generation.api';
import { addOpenAILog } from '@/lib/openai-logs.storage';
import { readStorage, removeStorage, writeStorage } from '@/lib/client-storage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import {
  Loader2,
  Play,
  RotateCcw,
  Settings2,
  Sparkles,
  StopCircle,
  RefreshCw,
  WandSparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const STATE_STORAGE_KEY = 'admin:generator-v2-state';
const AUTO_RUN_TICK_MS = 700;
const MAX_CONSECUTIVE_ERRORS = 5;

const DIFFICULTY_OPTIONS: Difficulty[] = [Difficulty.FACIL, Difficulty.MEDIO, Difficulty.DIFICIL];
type StatusFilter = 'all' | 'pending' | 'in_progress' | 'ok' | 'failed';

type PersistedState = {
  snapshotId?: string;
  snapshots?: SnapshotResponse[];
  statusFilter?: StatusFilter;
  difficultyFilter?: string;
  questionTypeFilter?: string;
  unitKindFilter?: string;
  includeEntities?: boolean;
  includeRelations?: boolean;
};

type SnapshotDraft = {
  category: string;
  subtopic: string;
  targetDifficulties: Difficulty[];
  questionTypes: string[];
  includeEntities: boolean;
  includeRelations: boolean;
};

const EMPTY_PROGRESS: SnapshotProgressResponse = {
  snapshot_id: '',
  ok_units: 0,
  failed_units: 0,
  pending_units: 0,
  in_progress_units: 0,
  total_units: 0,
};

function parsePersistedState(value: unknown): PersistedState | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  const raw = value as Record<string, unknown>;
  const snapshots = Array.isArray(raw.snapshots)
    ? raw.snapshots
        .filter((entry) => entry && typeof entry === 'object' && !Array.isArray(entry))
        .map((entry) => entry as SnapshotResponse)
    : [];

  return {
    snapshotId: typeof raw.snapshotId === 'string' ? raw.snapshotId : undefined,
    snapshots,
    statusFilter: typeof raw.statusFilter === 'string' ? (raw.statusFilter as StatusFilter) : undefined,
    difficultyFilter: typeof raw.difficultyFilter === 'string' ? raw.difficultyFilter : undefined,
    questionTypeFilter: typeof raw.questionTypeFilter === 'string' ? raw.questionTypeFilter : undefined,
    unitKindFilter: typeof raw.unitKindFilter === 'string' ? raw.unitKindFilter : undefined,
    includeEntities: typeof raw.includeEntities === 'boolean' ? raw.includeEntities : undefined,
    includeRelations: typeof raw.includeRelations === 'boolean' ? raw.includeRelations : undefined,
  };
}

function getErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const backendMessage = error.response?.data?.detail || error.response?.data?.message;
    return backendMessage || 'No se pudo completar la operación de generación';
  }

  return 'No se pudo completar la operación de generación';
}

function getSnapshotCompletion(progress: SnapshotProgressResponse): number {
  if (progress.total_units <= 0) {
    return 0;
  }
  return Math.round(((progress.ok_units + progress.failed_units) / progress.total_units) * 100);
}

function getUnitsPerMinute(startedAtMs: number | null, processedUnits: number): number {
  if (!startedAtMs || processedUnits <= 0) {
    return 0;
  }

  const elapsedMinutes = (Date.now() - startedAtMs) / 60000;
  if (elapsedMinutes <= 0) {
    return 0;
  }

  return Number((processedUnits / elapsedMinutes).toFixed(2));
}

const QUESTION_TYPE_LABELS: Record<string, string> = {
  single_choice: 'Opción única',
  multiple_choice: 'Opción múltiple',
  true_false: 'Verdadero/Falso',
  fill_blank: 'Completar espacios',
  ordering: 'Ordenamiento',
  matching: 'Relación de pares',
  open_ended: 'Respuesta abierta',
  scenario: 'Caso aplicado',
  entity_relation: 'Entidades y relaciones',
};

const UNIT_KIND_LABELS: Record<string, string> = {
  question_type: 'Tipo de pregunta',
  entity: 'Entidad',
  relation: 'Relación',
  taxonomy: 'Taxonomía',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  in_progress: 'En progreso',
  ok: 'Correcta',
  failed: 'Con error',
};

function formatDisplayLabel(value: string, labels: Record<string, string>) {
  const candidate = value.trim();
  if (!candidate) return '-';

  const normalized = candidate.toLowerCase();
  if (labels[candidate]) return labels[candidate];
  if (labels[normalized]) return labels[normalized];

  return candidate
    .replace(/[_-]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toLocaleUpperCase('es-CL') + part.slice(1).toLocaleLowerCase('es-CL'))
    .join(' ');
}

function formatQuestionTypeLabel(item: string) {
  return formatDisplayLabel(item, QUESTION_TYPE_LABELS);
}

function formatUnitKindLabel(value: string) {
  return formatDisplayLabel(value, UNIT_KIND_LABELS);
}

function formatStatusLabel(value: string) {
  return formatDisplayLabel(value, STATUS_LABELS);
}

export default function GeneradorPreguntasPage() {
  const [config, setConfig] = useState<GenerationConfigResponse | null>(null);
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);

  const [draft, setDraft] = useState<SnapshotDraft>({
    category: '',
    subtopic: '__ALL__',
    targetDifficulties: [Difficulty.FACIL, Difficulty.MEDIO, Difficulty.DIFICIL],
    questionTypes: [],
    includeEntities: true,
    includeRelations: true,
  });

  const [isCreatingSnapshot, setIsCreatingSnapshot] = useState(false);
  const [isRefreshingSnapshot, setIsRefreshingSnapshot] = useState(false);

  const [activeSnapshotId, setActiveSnapshotId] = useState('');
  const [snapshots, setSnapshots] = useState<SnapshotResponse[]>([]);
  const [progress, setProgress] = useState<SnapshotProgressResponse>(EMPTY_PROGRESS);
  const [units, setUnits] = useState<GenerationUnitResponse[]>([]);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [questionTypeFilter, setQuestionTypeFilter] = useState('all');
  const [unitKindFilter, setUnitKindFilter] = useState('all');

  const [isPolling, setIsPolling] = useState(false);

  const [isAutoRunning, setIsAutoRunning] = useState(false);
  const [autoRunStartedAt, setAutoRunStartedAt] = useState<number | null>(null);
  const [autoRunProcessedUnits, setAutoRunProcessedUnits] = useState(0);
  const [consecutiveErrors, setConsecutiveErrors] = useState(0);
  const [lastRunInfo, setLastRunInfo] = useState<{ unitId: string; status: string; at: string } | null>(null);
  const autoRunLockRef = useRef(false);

  const availableCategories = useMemo(() => config?.categories || [], [config]);
  const availableSubtopics = useMemo(
    () => (draft.category ? config?.subtopics[draft.category] || [] : []),
    [config, draft.category]
  );
  const availableQuestionTypes = useMemo(() => config?.question_type_catalog || [], [config]);

  const canCreateSnapshot = useMemo(() => {
    return Boolean(draft.category) && draft.targetDifficulties.length > 0;
  }, [draft.category, draft.targetDifficulties.length]);

  const filteredUnits = useMemo(() => {
    return units.filter((unit) => {
      if (statusFilter !== 'all' && unit.status !== statusFilter) return false;
      if (difficultyFilter !== 'all' && unit.difficulty !== difficultyFilter) return false;
      if (questionTypeFilter !== 'all' && unit.question_type !== questionTypeFilter) return false;
      if (unitKindFilter !== 'all' && unit.unit_kind !== unitKindFilter) return false;
      return true;
    });
  }, [units, statusFilter, difficultyFilter, questionTypeFilter, unitKindFilter]);

  const uniqueDifficulties = useMemo(
    () => Array.from(new Set(units.map((unit) => unit.difficulty).filter(Boolean))) as string[],
    [units]
  );

  const uniqueQuestionTypes = useMemo(
    () => Array.from(new Set(units.map((unit) => unit.question_type).filter(Boolean))) as string[],
    [units]
  );

  const uniqueUnitKinds = useMemo(
    () => Array.from(new Set(units.map((unit) => unit.unit_kind).filter(Boolean))) as string[],
    [units]
  );

  const completion = getSnapshotCompletion(progress);
  const unitsPerMinute = getUnitsPerMinute(autoRunStartedAt, autoRunProcessedUnits);
  const snapshotsForSelect = useMemo(() => {
    if (!activeSnapshotId) return snapshots;
    if (snapshots.some((item) => item.snapshot_id === activeSnapshotId)) return snapshots;
    return [
      {
        snapshot_id: activeSnapshotId,
        entity_count: 0,
        relation_count: 0,
        unit_count: 0,
        refresh_count: 0,
      },
      ...snapshots,
    ];
  }, [activeSnapshotId, snapshots]);

  const activeSnapshotMetadata = useMemo(
    () => snapshotsForSelect.find((item) => item.snapshot_id === activeSnapshotId) || null,
    [snapshotsForSelect, activeSnapshotId]
  );

  const activeSnapshotViewModel: SnapshotViewModel | null = useMemo(() => {
    if (!activeSnapshotMetadata) return null;
    return buildSnapshotViewModel(activeSnapshotMetadata, progress);
  }, [activeSnapshotMetadata, progress]);

  const loadConfig = useCallback(async () => {
    try {
      setIsLoadingConfig(true);
      const [configResponse, snapshotsResponse] = await Promise.all([
        getGenerationConfig(),
        listSnapshots(100, 0),
      ]);
      setConfig(configResponse);
      setSnapshots(snapshotsResponse.items);
      setDraft((prev) => {
        const nextCategory = configResponse.categories.includes(prev.category) ? prev.category : configResponse.categories[0] || '';
        const nextSubtopics = nextCategory ? configResponse.subtopics[nextCategory] || [] : [];
        const nextSubtopic = nextSubtopics.includes(prev.subtopic) || prev.subtopic === '__ALL__' ? prev.subtopic : '__ALL__';
        const nextQuestionTypes = prev.questionTypes.filter((item) => configResponse.question_type_catalog.includes(item));

        return {
          ...prev,
          category: nextCategory,
          subtopic: nextSubtopic,
          questionTypes: nextQuestionTypes,
        };
      });
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoadingConfig(false);
    }
  }, []);

  const loadSnapshotProgress = useCallback(async (snapshotId: string) => {
    if (!snapshotId) return;

    try {
      const snapshotProgress = await getSnapshotProgress(snapshotId);
      setProgress(snapshotProgress);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }, []);

  const loadUnitsList = useCallback(async (snapshotId: string) => {
    if (!snapshotId) return;

    setIsPolling(true);
    try {
      const primary = await listUnits(snapshotId, { limit: 500, skip: 0 });
      let items = primary.items;

      // Fallback: algunos escenarios devuelven vacío en consulta general.
      // Reintentamos por estado y consolidamos resultados.
      if (items.length === 0 && progress.total_units > 0) {
        const statuses = ['pending', 'in_progress', 'ok', 'failed'] as const;
        const chunks = await Promise.all(statuses.map((status) => listUnits(snapshotId, { status, limit: 500, skip: 0 })));
        const merged = chunks.flatMap((chunk) => chunk.items);
        const uniqueById = new Map<string, GenerationUnitResponse>();
        for (const item of merged) {
          const key = (item.unit_id || '').trim();
          if (!key) continue;
          uniqueById.set(key, item);
        }
        items = Array.from(uniqueById.values());
      }

      setUnits(items);

      if (items.length === 0 && progress.total_units > 0) {
        toast.warning('No se pudieron cargar units, aunque el progreso indica unidades disponibles.');
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsPolling(false);
    }
  }, [progress.total_units]);

  useEffect(() => {
    void loadConfig();

    const parsed = readStorage<PersistedState | null>(STATE_STORAGE_KEY, null, parsePersistedState);
    if (!parsed) return;

    if (parsed.snapshotId) setActiveSnapshotId(parsed.snapshotId);
    if (parsed.snapshots && parsed.snapshots.length > 0) setSnapshots(parsed.snapshots);
    if (parsed.statusFilter) setStatusFilter(parsed.statusFilter);
    if (typeof parsed.difficultyFilter === 'string') setDifficultyFilter(parsed.difficultyFilter);
    if (typeof parsed.questionTypeFilter === 'string') setQuestionTypeFilter(parsed.questionTypeFilter);
    if (typeof parsed.unitKindFilter === 'string') setUnitKindFilter(parsed.unitKindFilter);
    if (typeof parsed.includeEntities === 'boolean') {
      setDraft((prev) => ({ ...prev, includeEntities: parsed.includeEntities as boolean }));
    }
    if (typeof parsed.includeRelations === 'boolean') {
      setDraft((prev) => ({ ...prev, includeRelations: parsed.includeRelations as boolean }));
    }
  }, [loadConfig]);

  useEffect(() => {
    writeStorage<PersistedState>(STATE_STORAGE_KEY, {
      snapshotId: activeSnapshotId,
      snapshots: snapshots.slice(0, 50),
      statusFilter,
      difficultyFilter,
      questionTypeFilter,
      unitKindFilter,
      includeEntities: draft.includeEntities,
      includeRelations: draft.includeRelations,
    });
  }, [
    activeSnapshotId,
    statusFilter,
    snapshots,
    difficultyFilter,
    questionTypeFilter,
    unitKindFilter,
    draft.includeEntities,
    draft.includeRelations,
  ]);

  useEffect(() => {
    if (!activeSnapshotId) return;
    setUnits([]);
    void loadSnapshotProgress(activeSnapshotId);
  }, [activeSnapshotId, loadSnapshotProgress]);

  useEffect(() => {
    if (!isAutoRunning || !activeSnapshotId) return;

    const timer = window.setInterval(() => {
      if (autoRunLockRef.current) return;
      autoRunLockRef.current = true;

      void (async () => {
        try {
          const nextUnit = await getNextUnit(activeSnapshotId);
          if (!nextUnit?.unit_id) {
            setIsAutoRunning(false);
            toast.success('No quedan units pendientes o fallidas para ejecutar.');
            return;
          }

          const execution = await executeUnit(nextUnit.unit_id);
          const status = execution.status || 'unknown';

          setLastRunInfo({
            unitId: nextUnit.unit_id,
            status,
            at: new Date().toISOString(),
          });

          if (status === 'ok') {
            setConsecutiveErrors(0);
          } else {
            setConsecutiveErrors((previous) => {
              const nextCount = previous + 1;
              if (nextCount >= MAX_CONSECUTIVE_ERRORS) {
                setIsAutoRunning(false);
                toast.error(`Auto-run detenido por ${MAX_CONSECUTIVE_ERRORS} errores consecutivos.`);
              }
              return nextCount;
            });
          }

          setAutoRunProcessedUnits((previous) => previous + 1);

          addOpenAILog({
            request: {
              endpoint: `/generation/units/${nextUnit.unit_id}/execute`,
              snapshot_id: activeSnapshotId,
              unit_id: nextUnit.unit_id,
              category: draft.category,
              subtopic: draft.subtopic === '__ALL__' ? null : draft.subtopic,
              mode: 'v2_unit_execute',
            },
            response: {
              status: status === 'ok' ? 'completed' : 'failed',
              generated_count: status === 'ok' ? 1 : 0,
              semantic_total: 0,
              used_model: config?.llm_default_model || '',
              raw_output: JSON.stringify(execution, null, 2),
              error: execution.error || null,
              message: execution.message || null,
              meta: {
                snapshot_id: activeSnapshotId,
                unit_id: nextUnit.unit_id,
                unit_status: status,
              },
            },
          });

          await loadSnapshotProgress(activeSnapshotId);
        } catch (error) {
          setConsecutiveErrors((previous) => {
            const nextCount = previous + 1;
            if (nextCount >= MAX_CONSECUTIVE_ERRORS) {
              setIsAutoRunning(false);
              toast.error(`Auto-run detenido por ${MAX_CONSECUTIVE_ERRORS} errores consecutivos.`);
            }
            return nextCount;
          });
          toast.error(getErrorMessage(error));
        } finally {
          autoRunLockRef.current = false;
        }
      })();
    }, AUTO_RUN_TICK_MS);

    return () => {
      window.clearInterval(timer);
      autoRunLockRef.current = false;
    };
  }, [activeSnapshotId, config?.llm_default_model, draft.category, draft.subtopic, isAutoRunning, loadSnapshotProgress]);

  const handleCreateSnapshot = async () => {
    if (!canCreateSnapshot) {
      toast.error('Completa categoría y al menos una dificultad.');
      return;
    }

    try {
      setIsCreatingSnapshot(true);
      const created = await createSnapshot({
        category: draft.category,
        subtopic: draft.subtopic === '__ALL__' ? null : draft.subtopic,
        target_difficulties: draft.targetDifficulties,
        question_types: draft.questionTypes.length > 0 ? draft.questionTypes : undefined,
        include_entities: draft.includeEntities,
        include_relations: draft.includeRelations,
      });

      setSnapshots((previous) => [created, ...previous.filter((item) => item.snapshot_id !== created.snapshot_id)]);
      setActiveSnapshotId(created.snapshot_id);
      setIsAutoRunning(false);
      setConsecutiveErrors(0);
      setAutoRunProcessedUnits(0);
      setAutoRunStartedAt(null);
      setLastRunInfo(null);
      toast.success(`Snapshot ${created.snapshot_id} creado.`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsCreatingSnapshot(false);
    }
  };

  const handleRefreshSnapshot = async () => {
    if (!activeSnapshotId) return;

    try {
      setIsRefreshingSnapshot(true);
      const refreshed = await refreshSnapshot(activeSnapshotId);
      setSnapshots((previous) => {
        const existing = previous.find((item) => item.snapshot_id === refreshed.snapshot_id);
        const merged: SnapshotResponse = {
          snapshot_id: refreshed.snapshot_id,
          category: existing?.category || draft.category || undefined,
          subtopic:
            existing?.subtopic !== undefined
              ? existing.subtopic
              : draft.subtopic === '__ALL__'
              ? null
              : draft.subtopic || undefined,
          target_difficulties: existing?.target_difficulties || [],
          include_entities: existing?.include_entities ?? true,
          include_relations: existing?.include_relations ?? true,
          question_types: existing?.question_types || [],
          entity_count: refreshed.entity_count,
          relation_count: refreshed.relation_count,
          unit_count: Math.max(existing?.unit_count || 0, (existing?.unit_count || 0) + (refreshed.added_units || 0)),
          refresh_count: refreshed.refresh_count,
          created_at: existing?.created_at,
          updated_at: refreshed.updated_at || existing?.updated_at,
        };
        return [merged, ...previous.filter((item) => item.snapshot_id !== refreshed.snapshot_id)].slice(0, 20);
      });
      await loadSnapshotProgress(activeSnapshotId);
      toast.success('Snapshot refrescado.');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsRefreshingSnapshot(false);
    }
  };

  const handleExecuteUnit = async (unitId: string) => {
    if (!activeSnapshotId) return;
    if (!unitId.trim()) {
      toast.error('La unit no trae unit_id válido, no se puede ejecutar.');
      return;
    }

    try {
      const result = await executeUnit(unitId);
      toast.success(`Unit ${unitId} ejecutada: ${result.status}.`);
      addOpenAILog({
        request: {
          endpoint: `/generation/units/${unitId}/execute`,
          snapshot_id: activeSnapshotId,
          unit_id: unitId,
          category: draft.category,
          subtopic: draft.subtopic === '__ALL__' ? null : draft.subtopic,
          mode: 'v2_unit_execute_manual',
        },
        response: {
          status: result.status === 'ok' ? 'completed' : 'failed',
          generated_count: result.status === 'ok' ? 1 : 0,
          semantic_total: 0,
          used_model: config?.llm_default_model || '',
          raw_output: JSON.stringify(result, null, 2),
          error: result.error || null,
          message: result.message || null,
          meta: {
            snapshot_id: activeSnapshotId,
            unit_id: unitId,
            unit_status: result.status,
          },
        },
      });
      await loadSnapshotProgress(activeSnapshotId);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleRetryUnit = async (unitId: string) => {
    if (!activeSnapshotId) return;
    if (!unitId.trim()) {
      toast.error('La unit no trae unit_id válido, no se puede reintentar.');
      return;
    }

    try {
      const result = await retryUnit(unitId);
      toast.success(`Retry unit ${unitId}: ${result.status}.`);
      await loadSnapshotProgress(activeSnapshotId);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleStartAutoRun = () => {
    if (!activeSnapshotId) {
      toast.error('Selecciona o crea un snapshot antes de iniciar auto-run.');
      return;
    }

    setConsecutiveErrors(0);
    setAutoRunProcessedUnits(0);
    setAutoRunStartedAt(Date.now());
    setIsAutoRunning(true);
  };

  const handleStopAutoRun = () => {
    setIsAutoRunning(false);
  };

  const handleClearState = () => {
    setIsAutoRunning(false);
    setActiveSnapshotId('');
    setSnapshots([]);
    setProgress(EMPTY_PROGRESS);
    setUnits([]);
    setStatusFilter('all');
    setDifficultyFilter('all');
    setQuestionTypeFilter('all');
    setUnitKindFilter('all');
    setLastRunInfo(null);
    setConsecutiveErrors(0);
    setAutoRunProcessedUnits(0);
    setAutoRunStartedAt(null);
    removeStorage(STATE_STORAGE_KEY);
    toast.success('Estado operativo limpiado.');
  };

  return (
    <div className="space-y-8 p-4 sm:p-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl flex items-center gap-3">
            <WandSparkles className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
            Operación de Generación V2
          </h1>
          <p className="text-muted-foreground mt-1">
            Gestiona snapshots y units en tiempo real con ejecución manual o auto-run serial.
          </p>
        </div>
        <div className="ml-auto flex w-full flex-col items-start gap-3 sm:w-auto sm:items-end">
          <Button asChild size="lg" className="shadow-sm">
            <Link href="/admin/generador/configuracion">
              <Settings2 className="w-4 h-4 mr-2" />
              Ir a configuraciones
            </Link>
          </Button>
          <div className="flex items-center gap-2 flex-wrap sm:justify-end">
            {config?.updated_at && (
              <Badge variant="outline">Config actualizada: {new Date(config.updated_at).toLocaleString('es-CL')}</Badge>
            )}
            {activeSnapshotId && <Badge variant="outline">Snapshot activo: {activeSnapshotId}</Badge>}
            <Badge variant="outline">Auto-run: {isAutoRunning ? 'Activo' : 'Detenido'}</Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <Card className="overflow-hidden border-2 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Crear Snapshot
            </CardTitle>
            <CardDescription>Define el alcance operativo con bloques separados y legibles.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {isLoadingConfig ? (
              <div className="rounded-md border border-dashed p-5 text-sm text-muted-foreground">Cargando configuración...</div>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-4 rounded-2xl border bg-muted/20 p-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Categoría</Label>
                    <Select
                      value={draft.category}
                      onValueChange={(value) =>
                        setDraft((prev) => ({
                          ...prev,
                          category: value,
                          subtopic: '__ALL__',
                        }))
                      }
                    >
                      <SelectTrigger className="h-12 border-2 bg-background">
                        <SelectValue placeholder="Selecciona categoría" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableCategories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Subtópico</Label>
                    <Select
                      value={draft.subtopic}
                      onValueChange={(value) => setDraft((prev) => ({ ...prev, subtopic: value }))}
                      disabled={!draft.category}
                    >
                      <SelectTrigger className="h-12 border-2 bg-background">
                        <SelectValue placeholder="Selecciona subtópico" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__ALL__">Toda la categoría</SelectItem>
                        {availableSubtopics.map((subtopic) => (
                          <SelectItem key={subtopic} value={subtopic}>
                            {subtopic}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="rounded-2xl border bg-card p-4 shadow-sm">
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold">Dificultades objetivo</h3>
                      <p className="text-xs text-muted-foreground">Selecciona el rango de complejidad para el snapshot.</p>
                    </div>
                    <Badge variant="outline">{draft.targetDifficulties.length} seleccionadas</Badge>
                  </div>
                  <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                    {DIFFICULTY_OPTIONS.map((difficulty) => {
                      const checked = draft.targetDifficulties.includes(difficulty);
                      return (
                        <label
                          key={difficulty}
                          className={cn(
                            'flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm transition-colors',
                            checked ? 'border-primary bg-primary/5 shadow-sm' : 'hover:bg-muted/40'
                          )}
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(nextValue) => {
                              const shouldInclude = Boolean(nextValue);
                              setDraft((prev) => {
                                const next = shouldInclude
                                  ? [...prev.targetDifficulties, difficulty]
                                  : prev.targetDifficulties.filter((item) => item !== difficulty);
                                return { ...prev, targetDifficulties: Array.from(new Set(next)) };
                              });
                            }}
                          />
                          <div className="flex flex-1 items-center justify-between gap-2">
                            <span className="font-medium">{difficulty}</span>
                            {checked ? <Badge variant="secondary">Activo</Badge> : null}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-2xl border bg-card p-4 shadow-sm">
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold">Tipos de pregunta</h3>
                      <p className="text-xs text-muted-foreground">
                        Define qué variantes admite el snapshot. Es opcional; si no eliges ninguna, el backend usa su valor por defecto.
                      </p>
                    </div>
                    <Badge variant="outline">{availableQuestionTypes.length} disponibles</Badge>
                  </div>

                  {availableQuestionTypes.length === 0 ? (
                    <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
                      No hay catálogo cargado. El backend usará su configuración por defecto.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                      {availableQuestionTypes.map((questionType) => {
                        const checked = draft.questionTypes.includes(questionType);
                        const displayLabel = formatQuestionTypeLabel(questionType);
                        return (
                          <label
                            key={questionType}
                            className={cn(
                              'flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-sm transition-colors',
                              checked ? 'border-primary bg-primary/5 shadow-sm' : 'hover:bg-muted/40'
                            )}
                            title={questionType}
                          >
                            <Checkbox
                              className="mt-0.5"
                              checked={checked}
                              onCheckedChange={(nextValue) => {
                                const shouldInclude = Boolean(nextValue);
                                setDraft((prev) => ({
                                  ...prev,
                                  questionTypes: shouldInclude
                                    ? [...prev.questionTypes, questionType]
                                    : prev.questionTypes.filter((item) => item !== questionType),
                                }));
                              }}
                            />
                            <div className="min-w-0 flex-1 space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-medium">{displayLabel}</span>
                                {checked ? <Badge variant="secondary">Incluido</Badge> : null}
                              </div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="rounded-2xl border bg-card p-4 shadow-sm">
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold">Entidades y relaciones</h3>
                    <p className="text-xs text-muted-foreground">
                      Ajusta si el snapshot debe considerar ambos componentes del grafo. Son opciones independientes de los tipos de pregunta.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                    <label
                      className={cn(
                        'flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm transition-colors',
                        draft.includeEntities ? 'border-primary bg-primary/5 shadow-sm' : 'hover:bg-muted/40'
                      )}
                    >
                      <Checkbox
                        checked={draft.includeEntities}
                        onCheckedChange={(value) => setDraft((prev) => ({ ...prev, includeEntities: Boolean(value) }))}
                      />
                      <span className="font-medium">Incluir entidades</span>
                    </label>
                    <label
                      className={cn(
                        'flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm transition-colors',
                        draft.includeRelations ? 'border-primary bg-primary/5 shadow-sm' : 'hover:bg-muted/40'
                      )}
                    >
                      <Checkbox
                        checked={draft.includeRelations}
                        onCheckedChange={(value) => setDraft((prev) => ({ ...prev, includeRelations: Boolean(value) }))}
                      />
                      <span className="font-medium">Incluir relaciones</span>
                    </label>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 justify-between">
                  <Button variant="outline" onClick={handleClearState}>
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Limpiar estado
                  </Button>
                  <Button onClick={handleCreateSnapshot} disabled={!canCreateSnapshot || isCreatingSnapshot}>
                    {isCreatingSnapshot ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4 mr-2" />
                    )}
                    Crear snapshot
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border-2 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl">Snapshots activos</CardTitle>
            <CardDescription>Selecciona el snapshot operativo actual.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_auto] lg:items-end">
              <div className="space-y-2">
                <Label>Snapshot</Label>
                <Select value={activeSnapshotId} onValueChange={setActiveSnapshotId}>
                  <SelectTrigger className="h-11 border-2">
                    <SelectValue placeholder="Selecciona snapshot" />
                  </SelectTrigger>
                  <SelectContent>
                    {snapshotsForSelect.map((snapshot) => (
                      <SelectItem key={snapshot.snapshot_id} value={snapshot.snapshot_id}>
                        {snapshot.category ? `${snapshot.category}` : 'Sin categoría'} ·{' '}
                        {snapshot.subtopic ? snapshot.subtopic : 'General'} · u:{snapshot.unit_count} · e:
                        {snapshot.entity_count} · r:{snapshot.relation_count}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-wrap gap-2 lg:justify-end">
                <Button
                  variant="outline"
                  onClick={handleRefreshSnapshot}
                  disabled={!activeSnapshotId || isRefreshingSnapshot}
                >
                  {isRefreshingSnapshot ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-2" />
                  )}
                  Actualizar
                </Button>
                {!isAutoRunning ? (
                  <Button onClick={handleStartAutoRun} disabled={!activeSnapshotId}>
                    <Play className="w-4 h-4 mr-2" />
                    Auto-run
                  </Button>
                ) : (
                  <Button variant="destructive" onClick={handleStopAutoRun}>
                    <StopCircle className="w-4 h-4 mr-2" />
                    Detener
                  </Button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
              <div className="rounded-lg border px-3 py-2 text-sm">
                <p className="text-xs text-muted-foreground">Velocidad</p>
                <p className="font-semibold">{unitsPerMinute} unidades/min</p>
              </div>
              <div className="rounded-lg border px-3 py-2 text-sm">
                <p className="text-xs text-muted-foreground">Errores consecutivos</p>
                <p className="font-semibold">
                  {consecutiveErrors}/{MAX_CONSECUTIVE_ERRORS}
                </p>
              </div>
              <div className="rounded-lg border px-3 py-2 text-sm">
                <p className="text-xs text-muted-foreground">Última ejecución</p>
                <p className="font-semibold truncate">
                  {lastRunInfo
                    ? `${lastRunInfo.unitId} · ${lastRunInfo.status} · ${new Date(lastRunInfo.at).toLocaleTimeString('es-CL')}`
                    : 'Sin ejecuciones'}
                </p>
              </div>
            </div>

            {activeSnapshotViewModel ? (
              <div className="rounded-lg border bg-muted/10 p-3 space-y-3">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <div className="rounded-md border bg-background px-3 py-2">
                    <p className="text-xs text-muted-foreground">Categoría</p>
                    <p className="text-sm font-semibold">{activeSnapshotViewModel.category || 'N/A'}</p>
                  </div>
                  <div className="rounded-md border bg-background px-3 py-2">
                    <p className="text-xs text-muted-foreground">Subtópico</p>
                    <p className="text-sm font-semibold">{activeSnapshotViewModel.subtopic || 'General'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <div className="rounded-md border bg-background px-3 py-2">
                    <p className="text-xs text-muted-foreground">Entidades</p>
                    <p className="text-sm font-semibold">{activeSnapshotViewModel.entity_count}</p>
                  </div>
                  <div className="rounded-md border bg-background px-3 py-2">
                    <p className="text-xs text-muted-foreground">Relaciones</p>
                    <p className="text-sm font-semibold">{activeSnapshotViewModel.relation_count}</p>
                  </div>
                  <div className="rounded-md border bg-background px-3 py-2">
                    <p className="text-xs text-muted-foreground">Units</p>
                    <p className="text-sm font-semibold">{activeSnapshotViewModel.unit_count}</p>
                  </div>
                  <div className="rounded-md border bg-background px-3 py-2">
                    <p className="text-xs text-muted-foreground">Refresh</p>
                    <p className="text-sm font-semibold">{activeSnapshotViewModel.refresh_count}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge variant={activeSnapshotViewModel.include_entities ? 'secondary' : 'outline'}>
                    Entidades: {activeSnapshotViewModel.include_entities ? 'Incluidas' : 'No incluidas'}
                  </Badge>
                  <Badge variant={activeSnapshotViewModel.include_relations ? 'secondary' : 'outline'}>
                    Relaciones: {activeSnapshotViewModel.include_relations ? 'Incluidas' : 'No incluidas'}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Dificultades objetivo</p>
                  <div className="flex flex-wrap gap-2">
                    {activeSnapshotViewModel.target_difficulties.length > 0 ? (
                      activeSnapshotViewModel.target_difficulties.map((item) => (
                        <Badge key={`difficulty-${item}`} variant="outline">
                          {item}
                        </Badge>
                      ))
                    ) : (
                      <Badge variant="outline">Sin definir</Badge>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Tipos de pregunta</p>
                  <div className="flex flex-wrap gap-2">
                    {activeSnapshotViewModel.question_types.length > 0 ? (
                      activeSnapshotViewModel.question_types.map((item) => (
                        <Badge key={`qtype-${item}`} variant="outline">
                          {item}
                        </Badge>
                      ))
                    ) : (
                      <Badge variant="outline">Sin definir</Badge>
                    )}
                  </div>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <Card className="border-2 shadow-sm">
        <CardHeader>
          <CardTitle>Progreso en tiempo real</CardTitle>
          <CardDescription>Estado agregado por snapshot.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-xl font-semibold">{progress.total_units}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Pendientes</p>
              <p className="text-xl font-semibold">{progress.pending_units}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">En progreso</p>
              <p className="text-xl font-semibold">{progress.in_progress_units}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Correctas</p>
              <p className="text-xl font-semibold">{progress.ok_units}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Con error</p>
              <p className="text-xl font-semibold">{progress.failed_units}</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Completitud</span>
              <span className="font-medium">{completion}%</span>
            </div>
            <Progress value={completion} />
          </div>
        </CardContent>
      </Card>

      <Card className="border-2 shadow-sm">
        <CardHeader>
          <CardTitle>Unidades</CardTitle>
          <CardDescription>Listado filtrable con acciones por unidad (carga manual).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={() => void loadUnitsList(activeSnapshotId)}
              disabled={!activeSnapshotId || isPolling}
            >
              {isPolling ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Cargar/actualizar units
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <div className="space-y-2">
              <Label>Estado</Label>
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilter)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pending">Pendiente</SelectItem>
                  <SelectItem value="in_progress">En progreso</SelectItem>
                  <SelectItem value="ok">Correcta</SelectItem>
                  <SelectItem value="failed">Con error</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Dificultad</Label>
              <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {uniqueDifficulties.map((difficulty) => (
                    <SelectItem key={difficulty} value={difficulty}>
                      {difficulty}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tipo de pregunta</Label>
              <Select value={questionTypeFilter} onValueChange={setQuestionTypeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {uniqueQuestionTypes.map((questionType) => (
                    <SelectItem key={questionType} value={questionType}>
                      {formatDisplayLabel(questionType, QUESTION_TYPE_LABELS)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tipo de unidad</Label>
              <Select value={unitKindFilter} onValueChange={setUnitKindFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {uniqueUnitKinds.map((unitKind) => (
                    <SelectItem key={unitKind} value={unitKind}>
                      {formatUnitKindLabel(unitKind)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {isPolling ? (
            <div className="rounded-md border border-dashed p-5 text-sm text-muted-foreground">Actualizando units...</div>
          ) : filteredUnits.length === 0 ? (
            <div className="rounded-md border border-dashed p-5 text-sm text-muted-foreground">
              No hay units para el snapshot/filtros seleccionados.
            </div>
          ) : (
            <div className="space-y-2">
              {filteredUnits.map((unit, index) => (
                <div
                  key={`${unit.unit_id || 'unit'}-${unit.snapshot_id || 'snapshot'}-${unit.question_type || unit.unit_kind || 'kind'}-${index}`}
                  className="grid gap-3 rounded-lg border p-3 md:grid-cols-[1.4fr_0.9fr_0.9fr_0.9fr_auto] md:items-center"
                >
                  <div className="space-y-1">
                    <p className="font-medium text-sm">{unit.unit_id}</p>
                    <p className="text-xs text-muted-foreground">
                      intentos: {unit.attempts ?? 0}/{unit.max_attempts ?? 0}
                    </p>
                    {unit.last_error ? <p className="text-xs text-destructive">{unit.last_error}</p> : null}
                  </div>
                  <Badge variant="outline">{formatStatusLabel(unit.status)}</Badge>
                  <Badge variant="outline">{unit.difficulty || '-'}</Badge>
                  <Badge variant="outline">
                    {unit.question_type
                      ? formatDisplayLabel(unit.question_type, QUESTION_TYPE_LABELS)
                      : unit.unit_kind
                        ? formatUnitKindLabel(unit.unit_kind)
                        : '-'}
                  </Badge>
                  <div className="flex gap-2 justify-end">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleExecuteUnit(unit.unit_id)}
                      disabled={!activeSnapshotId || !unit.unit_id}
                    >
                      Ejecutar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRetryUnit(unit.unit_id)}
                      disabled={!activeSnapshotId || !unit.unit_id}
                    >
                      Reintentar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Atajo de operación</CardTitle>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline">
            <Link href="/admin/openai-logs">Ver trazas OpenAI</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
