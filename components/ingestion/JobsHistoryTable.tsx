'use client';

import { useEffect, useState, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Eye, RefreshCw } from "lucide-react";
import { getIngestionRuns } from "@/lib/ingestion.api";
import type { IngestionRun, IngestionStatus } from "@/types/ingestion.types";

interface JobsHistoryTableProps {
  refreshTrigger?: number;
  currentRunId?: string | null;
  onSelectRun?: (runId: string) => void;
}

const HISTORY_POLLING_INTERVAL_MS = 4000;
const POST_UPLOAD_REFRESH_DELAY_MS = 1800;

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleString("es-CL", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function getStatusBadge(status: IngestionStatus) {
  switch (status) {
    case "FINISHED":
      return (
        <Badge className="bg-green-600 hover:bg-green-700">Completado</Badge>
      );
    case "RUNNING":
      return (
        <Badge className="bg-blue-600 hover:bg-blue-700">Ejecutando</Badge>
      );
    case "QUEUED":
      return <Badge variant="secondary">En cola</Badge>;
    case "PARTIAL":
      return <Badge className="bg-amber-500 hover:bg-amber-600">Parcial</Badge>;
    case "FAILED":
      return <Badge variant="destructive">Fallido</Badge>;
    default:
      return <Badge variant="outline">Desconocido</Badge>;
  }
}

function getVisualStatusBadge(run: IngestionRun, runs: IngestionRun[]) {
  const isResolvedByRetry =
    (run.status === "PARTIAL" || run.status === "FAILED")
    && runs.some(
      (candidate) =>
        candidate.retry_of_run_id === run.run_id && candidate.status === "FINISHED",
    );

  if (isResolvedByRetry) {
    return (
      <Badge className="bg-emerald-600 hover:bg-emerald-700">
        Resuelto por retry
      </Badge>
    );
  }

  return getStatusBadge(run.status);
}

export function JobsHistoryTable({
  refreshTrigger,
  currentRunId,
  onSelectRun,
}: JobsHistoryTableProps) {
  const [runs, setRuns] = useState<IngestionRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchRuns = useCallback(async (options?: { silent?: boolean; resetPage?: boolean }) => {
    const silent = options?.silent ?? false;
    const resetPage = options?.resetPage ?? false;

    try {
      if (silent) {
        setIsRefreshing(true);
      } else {
        setLoading(true);
      }
      const data = await getIngestionRuns();
      const sortedRuns = [...data].sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
      setRuns(sortedRuns);
      if (resetPage) {
        setPage(1);
      }
    } catch (error) {
      console.error("Error fetching ingestion runs:", error);
      setRuns([]);
    } finally {
      if (silent) {
        setIsRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void fetchRuns({ resetPage: true });
  }, [fetchRuns]);

  useEffect(() => {
    if (refreshTrigger === undefined) {
      return;
    }

    const timeoutId = setTimeout(() => {
      void fetchRuns({ silent: true, resetPage: true });
    }, POST_UPLOAD_REFRESH_DELAY_MS);

    return () => clearTimeout(timeoutId);
  }, [fetchRuns, refreshTrigger]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      void fetchRuns({ silent: true });
    }, HISTORY_POLLING_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [fetchRuns]);

  const totalPages = Math.max(1, Math.ceil(runs.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedRuns = runs.slice(startIndex, endIndex);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium text-muted-foreground">
          Historial de Ejecuciones
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => void fetchRuns({ resetPage: true })}
        >
          <RefreshCw
            className={`w-4 h-4 mr-2 ${(loading || isRefreshing) ? "animate-spin" : ""}`}
          />
          Actualizar
        </Button>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Archivo</TableHead>
              <TableHead className="text-center">Estado</TableHead>
              <TableHead className="text-center">Nodos</TableHead>
              <TableHead className="text-center">Relaciones</TableHead>
              <TableHead className="text-center">Actualizado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {runs.length === 0 && !loading ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-8 text-muted-foreground"
                >
                  No hay Ejecuciones de ingesta registradas.
                </TableCell>
              </TableRow>
            ) : (
              paginatedRuns.map((run) => {
                const isSelected = currentRunId === run.run_id;

                return (
                  <TableRow
                    key={run.run_id}
                    className={isSelected ? "bg-primary/5" : ""}
                  >
                    <TableCell
                      className="max-w-[240px] truncate"
                      title={run.file_name}
                    >
                      {run.file_name}
                    </TableCell>
                    <TableCell className="text-center">
                      {getVisualStatusBadge(run, runs)}
                    </TableCell>
                    <TableCell className="text-center">
                      {run.total_nodes}
                    </TableCell>
                    <TableCell className="text-center">
                      {run.total_relations}
                    </TableCell>
                    <TableCell className="text-center text-muted-foreground">
                      {formatDate(run.updated_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onSelectRun?.(run.run_id)}
                        title="Ver seguimiento"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Ver
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {runs.length > 0 && (
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <p className="text-xs text-muted-foreground">
            Mostrando {startIndex + 1}-{Math.min(endIndex, runs.length)} de {runs.length}
          </p>
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground" htmlFor="history-page-size">
              Filas
            </label>
            <select
              id="history-page-size"
              className="h-8 rounded-md border bg-background px-2 text-sm"
              value={pageSize}
              onChange={(event) => {
                setPageSize(Number(event.target.value));
                setPage(1);
              }}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={safePage <= 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm min-w-16 text-center">
              {safePage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={safePage >= totalPages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
