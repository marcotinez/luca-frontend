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
import { Eye, RefreshCw } from "lucide-react";
import { getIngestionRuns } from "@/lib/ingestion.api";
import type { IngestionRun, IngestionStatus } from "@/types/ingestion.types";

interface JobsHistoryTableProps {
  refreshTrigger?: number;
  currentRunId?: string | null;
  onSelectRun?: (runId: string) => void;
}

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

export function JobsHistoryTable({
  refreshTrigger,
  currentRunId,
  onSelectRun,
}: JobsHistoryTableProps) {
  const [runs, setRuns] = useState<IngestionRun[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRuns = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getIngestionRuns();
      const sortedRuns = [...data].sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
      setRuns(sortedRuns);
    } catch (error) {
      console.error("Error fetching ingestion runs:", error);
      setRuns([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRuns();
  }, [fetchRuns, refreshTrigger]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium text-muted-foreground">
          Historial de Ejecuciones
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={fetchRuns}
          disabled={loading}
        >
          <RefreshCw
            className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
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
              runs.map((run) => {
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
                      {getStatusBadge(run.status)}
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
    </div>
  );
}
