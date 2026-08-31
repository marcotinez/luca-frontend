'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Difficulty } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Play, Sparkles } from 'lucide-react';
import { useSelectionRun } from '@/hooks/useSelectionRun';
import { formatQuestionTypeLabel, formatUnitKindLabel } from './labels';

const DIFFICULTY_OPTIONS: Difficulty[] = [Difficulty.FACIL, Difficulty.MEDIO, Difficulty.DIFICIL];

type SelectionDraft = {
  count: number;
  difficulties: string[];
  questionTypes: string[];
  unitKind: 'all' | 'entity' | 'relation';
  includeFailed: boolean;
};

function parseSelectionFilters(filters: Record<string, unknown> | undefined) {
  const difficulties = Array.isArray(filters?.difficulties)
    ? filters.difficulties.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    : [];
  const questionTypes = Array.isArray(filters?.question_types)
    ? filters.question_types.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    : [];
  const unitKindRaw = typeof filters?.unit_kind === 'string' ? filters.unit_kind.trim() : '';
  const includeFailed = typeof filters?.include_failed === 'boolean' ? filters.include_failed : undefined;
  return { difficulties, questionTypes, unitKindRaw, includeFailed };
}

interface SelectionRunPanelProps {
  snapshotId: string;
  availableQuestionTypes: string[];
  selectionRun: ReturnType<typeof useSelectionRun>;
}

export function SelectionRunPanel({ snapshotId, availableQuestionTypes, selectionRun }: SelectionRunPanelProps) {
  const { selection, isRunning, isCreating, isStarting, isCancelling, isPolling, create, start, cancel } = selectionRun;
  const [draft, setDraft] = useState<SelectionDraft>({
    count: 500,
    difficulties: [Difficulty.FACIL, Difficulty.MEDIO],
    questionTypes: [],
    unitKind: 'all',
    includeFailed: true,
  });
  const [concurrency, setConcurrency] = useState(1);

  const handleCreateSelection = () => {
    if (!snapshotId) {
      toast.error('Selecciona un snapshot activo.');
      return;
    }
    if (draft.count <= 0) {
      toast.error('El count debe ser mayor que 0.');
      return;
    }
    void create({
      snapshot_id: snapshotId,
      count: draft.count,
      difficulties: draft.difficulties.length > 0 ? draft.difficulties : undefined,
      question_types: draft.questionTypes.length > 0 ? draft.questionTypes : undefined,
      unit_kind: draft.unitKind === 'all' ? undefined : draft.unitKind,
      include_failed: draft.includeFailed,
    });
  };

  const handleStart = () => {
    if (!selection) {
      toast.error('Crea un lote antes de ejecutar.');
      return;
    }
    void start(concurrency);
  };

  const filters = parseSelectionFilters(selection?.filters as Record<string, unknown> | undefined);
  const total = selection?.total_units ?? 0;
  const done = (selection?.ok_units ?? 0) + (selection?.failed_units ?? 0);
  const completion = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <Card className="border-2 shadow-sm">
      <CardHeader>
        <CardTitle>Generación por Lote (Selección)</CardTitle>
        <CardDescription>
          Reserva un lote de unidades del snapshot activo y lánzalo: el servidor ejecuta la cola completa, aunque
          cierres esta pestaña.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          <div className="space-y-2">
            <Label>Cantidad de unidades</Label>
            <Input
              type="number"
              min={1}
              value={draft.count}
              onChange={(e) => setDraft((prev) => ({ ...prev, count: Math.max(1, Number(e.target.value) || 1) }))}
            />
          </div>
          <div className="space-y-2">
            <Label>Tipo de unidad</Label>
            <Select
              value={draft.unitKind}
              onValueChange={(value) => setDraft((prev) => ({ ...prev, unitKind: value as SelectionDraft['unitKind'] }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="entity">Entidad</SelectItem>
                <SelectItem value="relation">Relación</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Concurrencia del servidor</Label>
            <Select value={String(concurrency)} onValueChange={(value) => setConcurrency(Math.max(1, Math.min(16, Number(value) || 1)))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 8].map((value) => (
                  <SelectItem key={value} value={String(value)}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Unidades que el servidor procesa en paralelo al ejecutar el lote.</p>
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-4 shadow-sm">
          <p className="text-sm font-semibold mb-2">Dificultades del lote</p>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
            {DIFFICULTY_OPTIONS.map((difficulty) => {
              const checked = draft.difficulties.includes(difficulty);
              return (
                <label key={`selection-difficulty-${difficulty}`} className="flex items-center gap-2 rounded-lg border p-2">
                  <Checkbox
                    checked={checked}
                    onCheckedChange={(next) => {
                      const shouldInclude = Boolean(next);
                      setDraft((prev) => ({
                        ...prev,
                        difficulties: shouldInclude
                          ? Array.from(new Set([...prev.difficulties, difficulty]))
                          : prev.difficulties.filter((item) => item !== difficulty),
                      }));
                    }}
                  />
                  <span>{difficulty}</span>
                </label>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-4 shadow-sm">
          <p className="text-sm font-semibold mb-2">Tipos de pregunta del lote</p>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {availableQuestionTypes.map((questionType) => {
              const checked = draft.questionTypes.includes(questionType);
              return (
                <label key={`selection-qtype-${questionType}`} className="flex items-center gap-2 rounded-lg border p-2">
                  <Checkbox
                    checked={checked}
                    onCheckedChange={(next) => {
                      const shouldInclude = Boolean(next);
                      setDraft((prev) => ({
                        ...prev,
                        questionTypes: shouldInclude
                          ? Array.from(new Set([...prev.questionTypes, questionType]))
                          : prev.questionTypes.filter((item) => item !== questionType),
                      }));
                    }}
                  />
                  <span>{formatQuestionTypeLabel(questionType)}</span>
                </label>
              );
            })}
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={draft.includeFailed}
            onCheckedChange={(next) => setDraft((prev) => ({ ...prev, includeFailed: Boolean(next) }))}
          />
          Incluir unidades previamente fallidas
        </label>

        <div className="flex flex-wrap gap-2">
          <Button onClick={handleCreateSelection} disabled={!snapshotId || isCreating}>
            {isCreating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
            Crear selección
          </Button>
          <Button variant="secondary" onClick={handleStart} disabled={!selection || isStarting || isRunning}>
            {isStarting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
            {isRunning ? 'Ejecutándose en el servidor...' : 'Ejecutar en el servidor'}
          </Button>
          <Button variant="outline" onClick={() => void cancel()} disabled={!selection || isCancelling}>
            {isCancelling ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            Cancelar selección
          </Button>
        </div>

        <div className="rounded-xl border bg-muted/10 p-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Selección activa</p>
              <p className="text-sm font-semibold truncate">{selection?.selection_id || '-'}</p>
            </div>
            <Badge variant={isRunning ? 'secondary' : 'outline'}>
              {isRunning ? 'Ejecución activa en el servidor' : isPolling ? 'Actualizando...' : 'Sin ejecución activa'}
            </Badge>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">Total: {selection?.total_units ?? 0}</Badge>
            <Badge variant="outline">Pendientes: {selection?.pending_units ?? 0}</Badge>
            <Badge variant="outline">En progreso: {selection?.in_progress_units ?? 0}</Badge>
            <Badge variant="outline">Correctas: {selection?.ok_units ?? 0}</Badge>
            <Badge variant="outline">Fallidas: {selection?.failed_units ?? 0}</Badge>
          </div>

          {selection ? (
            <div className="rounded-lg border bg-background p-3 space-y-3">
              <p className="text-xs text-muted-foreground">Metadata de la selección</p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">Estado: {selection.status}</Badge>
                <Badge variant="outline">Solicitadas: {selection.requested_count}</Badge>
                <Badge variant="outline">Reservadas: {selection.claimed_count}</Badge>
                <Badge variant="outline">Snapshot: {selection.snapshot_id}</Badge>
              </div>
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">
                    Tipo unidad: {filters.unitKindRaw ? formatUnitKindLabel(filters.unitKindRaw) : 'Todas'}
                  </Badge>
                  <Badge variant="secondary">
                    Incluir fallidas: {typeof filters.includeFailed === 'boolean' ? (filters.includeFailed ? 'Sí' : 'No') : 'No definido'}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Dificultades filtro</p>
                  <div className="flex flex-wrap gap-2">
                    {filters.difficulties.length > 0 ? (
                      filters.difficulties.map((item) => (
                        <Badge key={`selection-filter-difficulty-${item}`} variant="outline">
                          {item}
                        </Badge>
                      ))
                    ) : (
                      <Badge variant="outline">Sin filtro</Badge>
                    )}
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Tipos de pregunta filtro</p>
                  <div className="flex flex-wrap gap-2">
                    {filters.questionTypes.length > 0 ? (
                      filters.questionTypes.map((item) => (
                        <Badge key={`selection-filter-question-type-${item}`} variant="outline">
                          {formatQuestionTypeLabel(item)}
                        </Badge>
                      ))
                    ) : (
                      <Badge variant="outline">Sin filtro</Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Completitud del lote</span>
              <span className="font-medium">{completion}%</span>
            </div>
            <Progress value={completion} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
