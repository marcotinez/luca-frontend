'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, RefreshCw, Trash2 } from 'lucide-react';
import { SnapshotResponse } from '@/lib/generation.api';
import { SnapshotViewModel } from '@/lib/generation.utils';

interface SnapshotPanelProps {
  snapshots: SnapshotResponse[];
  activeSnapshotId: string;
  onSelect: (snapshotId: string) => void;
  viewModel: SnapshotViewModel | null;
  isRefreshing: boolean;
  isDeleting: boolean;
  onRefresh: () => void;
  onDelete: (snapshotId: string) => Promise<boolean>;
  isBackfilling: boolean;
  onBackfill: (force: boolean) => void;
}

export function SnapshotPanel({
  snapshots,
  activeSnapshotId,
  onSelect,
  viewModel,
  isRefreshing,
  isDeleting,
  onRefresh,
  onDelete,
  isBackfilling,
  onBackfill,
}: SnapshotPanelProps) {
  const [snapshotToDelete, setSnapshotToDelete] = useState<SnapshotResponse | null>(null);
  const [backfillForce, setBackfillForce] = useState(false);

  const snapshotsForSelect: SnapshotResponse[] =
    activeSnapshotId && !snapshots.some((item) => item.snapshot_id === activeSnapshotId)
      ? [
          {
            snapshot_id: activeSnapshotId,
            category: '',
            subtopic: null,
            target_difficulties: [],
            include_entities: true,
            include_relations: true,
            question_types: [],
            entity_count: 0,
            relation_count: 0,
            unit_count: 0,
            refresh_count: 0,
            created_at: '',
            updated_at: '',
          },
          ...snapshots,
        ]
      : snapshots;

  const activeSnapshotMetadata = snapshotsForSelect.find((item) => item.snapshot_id === activeSnapshotId) || null;

  const handleConfirmDelete = async () => {
    if (!snapshotToDelete) return;
    const ok = await onDelete(snapshotToDelete.snapshot_id);
    if (ok) setSnapshotToDelete(null);
  };

  return (
    <Card className="border-2 shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl">Snapshots activos</CardTitle>
        <CardDescription>Selecciona el snapshot operativo actual.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="space-y-2">
            <Label>Snapshot</Label>
            <Select value={activeSnapshotId} onValueChange={onSelect}>
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
            <Button variant="outline" onClick={onRefresh} disabled={!activeSnapshotId || isRefreshing}>
              {isRefreshing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
              Actualizar
            </Button>
            <Button
              variant="destructive"
              onClick={() => setSnapshotToDelete(activeSnapshotMetadata)}
              disabled={!activeSnapshotId || isDeleting}
            >
              {isDeleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
              Eliminar
            </Button>
          </div>
        </div>

        <div className="rounded-lg border p-3 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-medium">Mantenimiento</p>
            <Button variant="outline" onClick={() => onBackfill(backfillForce)} disabled={isBackfilling}>
              {isBackfilling ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Backfill Orígenes
            </Button>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={backfillForce} onCheckedChange={(v) => setBackfillForce(Boolean(v))} />
            Forzar sobrescritura (force=true)
          </label>
        </div>

        {viewModel ? (
          <div className="rounded-lg border bg-muted/10 p-3 space-y-3">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div className="rounded-md border bg-background px-3 py-2">
                <p className="text-xs text-muted-foreground">Categoría</p>
                <p className="text-sm font-semibold">{viewModel.category || 'N/A'}</p>
              </div>
              <div className="rounded-md border bg-background px-3 py-2">
                <p className="text-xs text-muted-foreground">Subtópico</p>
                <p className="text-sm font-semibold">{viewModel.subtopic || 'General'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <div className="rounded-md border bg-background px-3 py-2">
                <p className="text-xs text-muted-foreground">Entidades</p>
                <p className="text-sm font-semibold">{viewModel.entity_count}</p>
              </div>
              <div className="rounded-md border bg-background px-3 py-2">
                <p className="text-xs text-muted-foreground">Relaciones</p>
                <p className="text-sm font-semibold">{viewModel.relation_count}</p>
              </div>
              <div className="rounded-md border bg-background px-3 py-2">
                <p className="text-xs text-muted-foreground">Units</p>
                <p className="text-sm font-semibold">{viewModel.unit_count}</p>
              </div>
              <div className="rounded-md border bg-background px-3 py-2">
                <p className="text-xs text-muted-foreground">Refresh</p>
                <p className="text-sm font-semibold">{viewModel.refresh_count}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge variant={viewModel.include_entities ? 'secondary' : 'outline'}>
                Entidades: {viewModel.include_entities ? 'Incluidas' : 'No incluidas'}
              </Badge>
              <Badge variant={viewModel.include_relations ? 'secondary' : 'outline'}>
                Relaciones: {viewModel.include_relations ? 'Incluidas' : 'No incluidas'}
              </Badge>
            </div>

            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Dificultades objetivo</p>
              <div className="flex flex-wrap gap-2">
                {viewModel.target_difficulties.length > 0 ? (
                  viewModel.target_difficulties.map((item) => (
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
                {viewModel.question_types.length > 0 ? (
                  viewModel.question_types.map((item) => (
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

      <Dialog
        open={Boolean(snapshotToDelete)}
        onOpenChange={(open) => {
          if (!open && !isDeleting) setSnapshotToDelete(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>¿Eliminar snapshot?</DialogTitle>
            <DialogDescription>
              Esta acción eliminará unidades/runs/selections del snapshot, pero no eliminará preguntas del banco.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-md border p-3 text-sm space-y-1">
            <p>
              <span className="font-medium">Snapshot:</span> {snapshotToDelete?.snapshot_id || '-'}
            </p>
            <p>
              <span className="font-medium">Categoría:</span> {snapshotToDelete?.category || 'N/A'}
            </p>
            <p>
              <span className="font-medium">Subtópico:</span> {snapshotToDelete?.subtopic || 'General'}
            </p>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setSnapshotToDelete(null)} disabled={isDeleting}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete} disabled={isDeleting}>
              {isDeleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
              Confirmar eliminación
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
