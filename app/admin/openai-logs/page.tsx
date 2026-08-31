'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { apiErrorMessage } from '@/lib/api';
import { listGenerationRuns, GenerationRunResponse } from '@/lib/generation.api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ChevronLeft, ChevronRight, RefreshCcw } from 'lucide-react';
import { TraceViewer } from '@/components/generation/TraceViewer';

const PAGE_SIZE = 20;

export default function GenerationRunsPage() {
  const [runs, setRuns] = useState<GenerationRunResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [snapshotIdFilter, setSnapshotIdFilter] = useState('');
  const [unitIdFilter, setUnitIdFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(0);

  const loadRuns = useCallback(async () => {
    setLoading(true);
    try {
      const response = await listGenerationRuns({
        snapshot_id: snapshotIdFilter.trim() || undefined,
        unit_id: unitIdFilter.trim() || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        limit: PAGE_SIZE,
        skip: page * PAGE_SIZE,
      });
      setRuns(response.items);
      setTotal(response.total);
    } catch (error) {
      toast.error(apiErrorMessage(error, 'No se pudieron cargar las ejecuciones de generación'));
    } finally {
      setLoading(false);
    }
  }, [snapshotIdFilter, unitIdFilter, statusFilter, page]);

  useEffect(() => {
    void loadRuns();
  }, [loadRuns]);

  const handleApplyFilters = () => {
    setPage(0);
    void loadRuns();
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Ejecuciones de generación</h1>
          <p className="text-muted-foreground mt-1">
            Historial de ejecuciones guardado por el servidor: prompts, modelos y trazas de cada unidad procesada.
          </p>
        </div>
        <Button variant="outline" onClick={() => void loadRuns()} disabled={loading}>
          <RefreshCcw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refrescar
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filtros</CardTitle>
          <CardDescription>Resueltos en el servidor, con paginación.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <div className="space-y-2">
            <Label>Snapshot ID</Label>
            <Input
              value={snapshotIdFilter}
              onChange={(e) => setSnapshotIdFilter(e.target.value)}
              placeholder="snapshot_id"
            />
          </div>
          <div className="space-y-2">
            <Label>Unit ID</Label>
            <Input value={unitIdFilter} onChange={(e) => setUnitIdFilter(e.target.value)} placeholder="unit_id" />
          </div>
          <div className="space-y-2">
            <Label>Estado</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="ok">Correcta</SelectItem>
                <SelectItem value="failed">Con error</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button onClick={handleApplyFilters} className="w-full">
              Aplicar filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Badge variant="outline">Total: {total}</Badge>
        <Badge variant="outline">
          Página {page + 1}/{totalPages}
        </Badge>
      </div>

      {loading ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">Cargando ejecuciones...</CardContent>
        </Card>
      ) : runs.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Sin ejecuciones</CardTitle>
            <CardDescription>No hay ejecuciones registradas para estos filtros.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <Accordion type="multiple" className="w-full border border-border rounded-md px-4">
          {runs.map((run, index) => (
            <AccordionItem key={run.id} value={run.id}>
              <AccordionTrigger className="hover:no-underline">
                <div className="flex flex-wrap items-center gap-2 pr-3">
                  <Badge variant="outline">#{page * PAGE_SIZE + index + 1}</Badge>
                  <Badge variant="outline">{new Date(run.created_at).toLocaleString('es-CL')}</Badge>
                  <Badge variant={run.status === 'ok' ? 'secondary' : 'destructive'}>{run.status}</Badge>
                  <span className="text-sm text-muted-foreground line-clamp-1">
                    snapshot {run.snapshot_id} · unit {run.unit_id}
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <TraceViewer run={run} />
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}

      <div className="flex items-center justify-end gap-2">
        <Button variant="outline" onClick={() => setPage((prev) => Math.max(0, prev - 1))} disabled={page <= 0 || loading}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Anterior
        </Button>
        <Button
          variant="outline"
          onClick={() => setPage((prev) => Math.min(totalPages - 1, prev + 1))}
          disabled={page >= totalPages - 1 || loading}
        >
          Siguiente
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
