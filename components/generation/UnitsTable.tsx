'use client';

import { useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { useGenerationUnits } from '@/hooks/useGenerationUnits';
import { formatQuestionTypeLabel, formatStatusLabel, formatUnitKindLabel } from './labels';

type StatusFilter = 'all' | 'pending' | 'in_progress' | 'ok' | 'failed';

interface UnitsTableProps {
  snapshotId: string;
  selectionId: string;
  selectionUnitIds: string[];
  refreshKey: string;
}

export function UnitsTable({ snapshotId, selectionId, selectionUnitIds, refreshKey }: UnitsTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const statusFilter = (searchParams.get('status') as StatusFilter) || 'all';
  const difficultyFilter = searchParams.get('difficulty') || 'all';
  const questionTypeFilter = searchParams.get('question_type') || 'all';
  const unitKindFilter = searchParams.get('unit_kind') || 'all';

  const setFilter = (key: string, value: string) => {
    const current = new URLSearchParams(searchParams.toString());
    if (value === 'all') current.delete(key);
    else current.set(key, value);
    router.replace(`${pathname}?${current.toString()}`, { scroll: false });
  };

  const { units, loading, reload, runUnit, retry } = useGenerationUnits(snapshotId, selectionUnitIds, statusFilter, refreshKey);

  const filteredUnits = useMemo(() => {
    return units.filter((unit) => {
      if (difficultyFilter !== 'all' && unit.difficulty !== difficultyFilter) return false;
      if (questionTypeFilter !== 'all' && unit.question_type !== questionTypeFilter) return false;
      if (unitKindFilter !== 'all' && unit.unit_kind !== unitKindFilter) return false;
      return true;
    });
  }, [units, difficultyFilter, questionTypeFilter, unitKindFilter]);

  const uniqueDifficulties = useMemo(
    () => Array.from(new Set(units.map((unit) => unit.difficulty).filter(Boolean))),
    [units]
  );
  const uniqueQuestionTypes = useMemo(
    () => Array.from(new Set(units.map((unit) => unit.question_type).filter(Boolean))),
    [units]
  );
  const uniqueUnitKinds = useMemo(() => Array.from(new Set(units.map((unit) => unit.unit_kind).filter(Boolean))), [units]);

  return (
    <Card className="border-2 shadow-sm">
      <CardHeader>
        <CardTitle>Unidades del lote activo</CardTitle>
        <CardDescription>
          Listado filtrable de unidades pertenecientes a la selección activa del snapshot. El filtro de estado se
          resuelve en el servidor; dificultad, tipo de pregunta y clase de unidad filtran sobre la página cargada.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-end">
          <Button variant="outline" onClick={() => void reload()} disabled={!snapshotId || !selectionId || loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Cargar/actualizar unidades del lote
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <div className="space-y-2">
            <Label>Estado</Label>
            <Select value={statusFilter} onValueChange={(value) => setFilter('status', value)}>
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
            <Select value={difficultyFilter} onValueChange={(value) => setFilter('difficulty', value)}>
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
            <Select value={questionTypeFilter} onValueChange={(value) => setFilter('question_type', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {uniqueQuestionTypes.map((questionType) => (
                  <SelectItem key={questionType} value={questionType}>
                    {formatQuestionTypeLabel(questionType)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Tipo de unidad</Label>
            <Select value={unitKindFilter} onValueChange={(value) => setFilter('unit_kind', value)}>
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

        {loading ? (
          <div className="rounded-md border border-dashed p-5 text-sm text-muted-foreground">Actualizando unidades del lote...</div>
        ) : !selectionId ? (
          <div className="rounded-md border border-dashed p-5 text-sm text-muted-foreground">
            No hay lote activo. Crea una selección para ver sus unidades.
          </div>
        ) : filteredUnits.length === 0 ? (
          <div className="rounded-md border border-dashed p-5 text-sm text-muted-foreground">
            No hay unidades para el lote/filtros seleccionados.
          </div>
        ) : (
          <div className="space-y-2">
            {filteredUnits.map((unit, index) => (
              <div
                key={`${unit.id || 'unit'}-${unit.snapshot_id || 'snapshot'}-${unit.question_type || unit.unit_kind || 'kind'}-${index}`}
                className="grid gap-3 rounded-lg border p-3 md:grid-cols-[1.4fr_0.9fr_0.9fr_0.9fr_auto] md:items-center"
              >
                <div className="space-y-1">
                  <p className="font-medium text-sm">{unit.id}</p>
                  <p className="text-xs text-muted-foreground">intentos: {unit.attempt_count}</p>
                  {unit.last_error ? <p className="text-xs text-destructive">{unit.last_error}</p> : null}
                </div>
                <Badge variant="outline">{formatStatusLabel(unit.status)}</Badge>
                <Badge variant="outline">{unit.difficulty || '-'}</Badge>
                <Badge variant="outline">
                  {unit.question_type
                    ? formatQuestionTypeLabel(unit.question_type)
                    : unit.unit_kind
                      ? formatUnitKindLabel(unit.unit_kind)
                      : '-'}
                </Badge>
                <div className="flex gap-2 justify-end">
                  <Button size="sm" variant="outline" onClick={() => void runUnit(unit.id)} disabled={!snapshotId}>
                    Ejecutar
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => void retry(unit.id)} disabled={!snapshotId}>
                    Reintentar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
