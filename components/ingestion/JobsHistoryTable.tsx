'use client';

import { useEffect, useState, useCallback, Fragment } from 'react';
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
import { RefreshCw, ExternalLink, ChevronDown, ChevronRight, FileText, Layers, Folder, Trash2 } from "lucide-react";
import { getJobsHistory, deleteJobsByFile } from "@/lib/ingestion.api";
import type { IngestionJob, IngestionStatus } from "@/types/ingestion.types";

interface JobsHistoryTableProps {
  onViewJob?: (job: IngestionJob) => void;
  refreshTrigger?: number;
}

export function JobsHistoryTable({ onViewJob, refreshTrigger }: JobsHistoryTableProps) {
  const [jobs, setJobs] = useState<IngestionJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedFiles, setExpandedFiles] = useState<Record<string, boolean>>({});
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getJobsHistory();
      if (Array.isArray(data)) {
        setJobs(data);
      } else {
        console.error("Data received is not an array:", data);
        setJobs([]);
      }
    } catch (error) {
      console.error("Error fetching jobs:", error);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs, refreshTrigger]);

  const getStatusBadge = (status?: IngestionStatus) => {
    // ... (same as before)
    switch (status) {
      case 'FINISHED':
        return <Badge className="bg-green-500 hover:bg-green-600">Finished</Badge>;
      case 'PROCESSING':
        return <Badge className="bg-blue-500 hover:bg-blue-600">Processing</Badge>;
      case 'PENDING':
        return <Badge variant="secondary">Pending</Badge>;
      case 'ERROR':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return status ? <Badge variant="outline">{status}</Badge> : <Badge variant="outline">Unknown</Badge>;
    }
  };

  const toggleFile = (fileName: string) => {
    setExpandedFiles(prev => ({
      ...prev,
      [fileName]: !prev[fileName]
    }));
  };

  const handleDeleteFile = async (fileName: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Evitar expandir/colapsar al hacer click en borrar
    if (!confirm(`¿Estás seguro de que quieres eliminar todos los registros de "${fileName}"? Esta acción no se puede deshacer.`)) {
      return;
    }

    try {
      setIsDeleting(true);
      await deleteJobsByFile(fileName);
      await fetchJobs(); // Recargar la lista
    } catch (error) {
      console.error("Error deleting file jobs:", error);
      alert("Error al eliminar los registros.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Agrupar jobs por nombre de archivo...
  const groupedJobs = jobs.reduce((acc, job) => {
    const fileName = job.file_name || 'Sin Nombre';
    if (!acc[fileName]) {
      acc[fileName] = [];
    }
    acc[fileName].push(job);
    return acc;
  }, {} as Record<string, IngestionJob[]>);

  const fileNames = Object.keys(groupedJobs);

  return (
    <div className="space-y-4">
      {/* ... Header ... */}
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium text-muted-foreground">Historial de Procesamiento</h3>
        <Button variant="ghost" size="sm" onClick={fetchJobs} disabled={loading || isDeleting}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[50px]"></TableHead>
              <TableHead>Archivo</TableHead>
              <TableHead className="text-center">Chunks</TableHead>
              <TableHead className="text-center">Nodos Totales</TableHead>
              <TableHead className="text-center">Relaciones Totales</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobs.length === 0 && !loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No hay registros de ingesta.
                </TableCell>
              </TableRow>
            ) : (
              fileNames.map((fileName) => {
                const fileJobs = groupedJobs[fileName];
                const isExpanded = expandedFiles[fileName];

                // Buscar si existe un job con chunk_id 'TOTAL'
                const totalJob = fileJobs.find(job => String(job.chunk_id).toUpperCase() === 'TOTAL');

                // Si existe el job TOTAL, usamos sus valores. Si no, calculamos la suma (excluyendo cualquier posible fila llamada TOTAL si la lógica falló antes, aunque aquí asumimos que si no lo encontramos con find, es seguro sumar).
                // Nota: Si el backend envía 'TOTAL' y nosotros sumamos ciegamente, duplicamos. Por eso preferimos el totalJob.
                const totalNodes = totalJob ? (totalJob.nodes || 0) : fileJobs.reduce((acc, job) => acc + (job.nodes || 0), 0);
                const totalRelations = totalJob ? (totalJob.relations || 0) : fileJobs.reduce((acc, job) => acc + (job.relations || 0), 0);

                return (
                  <Fragment key={fileName}>
                    <TableRow
                      className="cursor-pointer hover:bg-muted/30 group"
                      onClick={() => toggleFile(fileName)}
                    >
                      <TableCell>
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </TableCell>
                      <TableCell className="font-medium flex items-center gap-2">
                        <FileText className="w-4 h-4 text-primary" />
                        {fileName}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className="font-mono">
                          {totalJob ? (fileJobs.length - 1) : fileJobs.length}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center text-muted-foreground">{totalNodes}</TableCell>
                      <TableCell className="text-center text-muted-foreground">{totalRelations}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => handleDeleteFile(fileName, e)}
                          title="Eliminar historial de este archivo"
                          disabled={isDeleting}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>

                    {/* ... Child rows ... */}

                    {isExpanded && fileJobs.map((job, index) => (
                      <TableRow key={`job-${job.chunk_id}-${index}`} className="bg-muted/10 border-b-0">
                        <TableCell></TableCell>
                        <TableCell className="pl-10 flex items-center gap-2">
                          <Layers className="w-3 h-3 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">Chunk {job.chunk_id}</span>
                        </TableCell>
                        <TableCell className="text-center text-xs text-muted-foreground">{job.file_size || '-'}</TableCell>
                        <TableCell className="text-center text-sm">{job.nodes}</TableCell>
                        <TableCell className="text-center text-sm">{job.relations}</TableCell>
                        <TableCell className="text-right">
                           {getStatusBadge(job.status)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </Fragment>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
