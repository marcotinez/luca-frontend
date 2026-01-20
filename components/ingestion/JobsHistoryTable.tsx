'use client';

import { useState, useEffect } from 'react';
import type { IngestionJob, IngestionStatus } from '@/types/ingestion.types';
import { getJobsHistory, deleteJob } from '@/lib/ingestion.api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileText, Loader2, CheckCircle2, XCircle, SkipForward, Clock, RefreshCw, Eye, Trash2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface JobsHistoryTableProps {
  onViewJob?: (job: IngestionJob) => void;
  refreshTrigger?: number;
}

const statusConfig: Record<IngestionStatus, { label: string; color: string; icon: React.ReactNode }> = {
  PENDING: { label: 'En Cola', color: 'text-amber-600 dark:text-amber-400 bg-amber-500/10', icon: <Clock className="w-3.5 h-3.5" /> },
  PROCESSING: { label: 'Procesando', color: 'text-blue-600 dark:text-blue-400 bg-blue-500/10', icon: <Loader2 className="w-3.5 h-3.5 animate-spin" /> },
  COMPLETED: { label: 'Completado', color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  COMPLETED_WITH_ERRORS: { label: 'Parcial', color: 'text-amber-600 dark:text-amber-400 bg-amber-500/10', icon: <AlertCircle className="w-3.5 h-3.5" /> },
  ERROR: { label: 'Error', color: 'text-red-600 dark:text-red-400 bg-red-500/10', icon: <XCircle className="w-3.5 h-3.5" /> },
  SKIPPED: { label: 'Omitido', color: 'text-slate-600 dark:text-slate-400 bg-slate-500/10', icon: <SkipForward className="w-3.5 h-3.5" /> }
};

export function JobsHistoryTable({ onViewJob, refreshTrigger }: JobsHistoryTableProps) {
  const [jobs, setJobs] = useState<IngestionJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const params = statusFilter !== 'all' ? { status: statusFilter as IngestionStatus } : {};
      const data = await getJobsHistory({ ...params, limit: 20 });
      setJobs(data);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchJobs(); }, [statusFilter, refreshTrigger]);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('¿Estás seguro de que quieres eliminar este historial?')) return;

    setDeletingId(id);
    try {
      await deleteJob(id);
      toast.success('Historial eliminado correctamente');
      fetchJobs();
    } catch (error) {
      toast.error('Error al eliminar el historial');
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateString: string): string => new Date(dateString).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Filtrar" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="COMPLETED">Completados</SelectItem>
            <SelectItem value="PROCESSING">En proceso</SelectItem>
            <SelectItem value="ERROR">Con errores</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={fetchJobs} disabled={loading} className="gap-2">
          <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />Actualizar
        </Button>
      </div>
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Archivo</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={4} className="h-32 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></TableCell></TableRow>
            ) : jobs.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="h-32 text-center text-muted-foreground">No hay documentos</TableCell></TableRow>
            ) : jobs.map((job) => {
              const status = statusConfig[job.status] || statusConfig['ERROR'];
              return (
                <TableRow key={job._id} className="group cursor-pointer hover:bg-muted/50" onClick={() => onViewJob?.(job)}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium truncate max-w-[200px]">{job.display_name || job.file_name}</span>
                      {job.display_name && <span className="text-xs text-muted-foreground truncate max-w-[200px]">{job.file_name}</span>}
                    </div>
                  </TableCell>
                  <TableCell><Badge variant="outline" className={cn("gap-1.5", status.color)}>{status.icon}{status.label}</Badge></TableCell>
                  <TableCell className="text-muted-foreground text-sm">{formatDate(job.created_at)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {onViewJob && <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onViewJob(job); }}><Eye className="w-4 h-4 text-muted-foreground hover:text-primary" /></Button>}
                      <Button variant="ghost" size="icon" onClick={(e) => handleDelete(e, job._id)} disabled={deletingId === job._id}>
                        {deletingId === job._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4 text-muted-foreground hover:text-red-500" />}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
