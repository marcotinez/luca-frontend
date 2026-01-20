'use client';

import { useEffect, useRef } from 'react';
import { useIngestionJob } from '@/hooks/useIngestionJob';
import type { IngestionJob, IngestionStatus } from '@/types/ingestion.types';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Loader2, CheckCircle2, XCircle, SkipForward, Clock, Zap, Network, Sparkles, Coins, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface IngestionTrackerProps {
  jobId: string | null;
  initialJob?: IngestionJob | null;
}

const statusConfig: Record<IngestionStatus, { label: string; color: string; icon: React.ReactNode; bgColor: string }> = {
  PENDING: { label: 'En Cola', color: 'text-amber-600 dark:text-amber-400', bgColor: 'bg-amber-500/10', icon: <Clock className="w-4 h-4" /> },
  PROCESSING: { label: 'Procesando', color: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-500/10', icon: <Loader2 className="w-4 h-4 animate-spin" /> },
  COMPLETED: { label: 'Completado', color: 'text-emerald-600 dark:text-emerald-400', bgColor: 'bg-emerald-500/10', icon: <CheckCircle2 className="w-4 h-4" /> },
  COMPLETED_WITH_ERRORS: { label: 'Parcial', color: 'text-amber-600 dark:text-amber-400', bgColor: 'bg-amber-500/10', icon: <AlertCircle className="w-4 h-4" /> },
  ERROR: { label: 'Error', color: 'text-red-600 dark:text-red-400', bgColor: 'bg-red-500/10', icon: <XCircle className="w-4 h-4" /> },
  SKIPPED: { label: 'Omitido', color: 'text-slate-600 dark:text-slate-400', bgColor: 'bg-slate-500/10', icon: <SkipForward className="w-4 h-4" /> }
};

function StatBox({ label, value, icon }: { label: string; value: number | string; icon: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-1 p-3 rounded-lg bg-accent/50">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <span className="text-xl font-bold tabular-nums">{value}</span>
    </div>
  );
}

export function IngestionTracker({ jobId, initialJob }: IngestionTrackerProps) {
  const { job: polledJob, isPolling } = useIngestionJob(jobId);
  const job = polledJob || initialJob;
  const processedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!job || !isPolling) return;

    // Evitar notificaciones duplicadas para el mismo job/estado
    const jobKey = `${job._id}-${job.status}`;
    if (processedRef.current === jobKey) return;

    if (job.status === 'ERROR') {
      toast.error(`Error en la ingesta: ${job.error_message || 'Error desconocido'}`);
      processedRef.current = jobKey;
    } else if (job.status === 'COMPLETED_WITH_ERRORS') {
      toast.warning(`Ingesta completada parcialmente. ${job.failed_chunks} chunks fallaron.`);
      processedRef.current = jobKey;
    } else if (job.status === 'COMPLETED') {
      toast.success('Ingesta completada exitosamente');
      processedRef.current = jobKey;
    }
  }, [job, isPolling]);

  if (!job) return null;

  const status = statusConfig[job.status];
  const percent = job.total_chunks > 0 ? Math.round((job.processed_chunks / job.total_chunks) * 100) : 0;

  return (
    <Card className={cn("transition-all duration-300", isPolling && "ring-2 ring-primary/20")}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0", status.bgColor)}>
              <FileText className={cn("w-5 h-5", status.color)} />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-lg truncate">{job.display_name || job.file_name}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {job.display_name && <span className="text-xs">{job.file_name} • </span>}
                {job.total_pages > 0 && `${job.total_pages} páginas`}
                {(job.start_page || job.end_page) && ` (${job.start_page || 1}-${job.end_page || 'fin'})`}
                {job.total_chunks > 0 && ` • ${job.total_chunks} chunks`}
              </p>
            </div>
          </div>
          <Badge variant="outline" className={cn("gap-1.5 shrink-0", status.color, status.bgColor)}>
            {status.icon}{status.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progreso</span>
            <span className="font-medium tabular-nums">{percent}%</span>
          </div>
          <Progress value={percent} className="h-2" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatBox label="Entidades" value={job.entities_extracted || 0} icon={<Zap className="w-3.5 h-3.5" />} />
          <StatBox label="Relaciones" value={job.relationships_extracted || 0} icon={<Network className="w-3.5 h-3.5" />} />
          <StatBox label="Refinadas" value={job.refined_relationships || 0} icon={<Sparkles className="w-3.5 h-3.5" />} />
          <StatBox label="Total Tokens" value={job.total_tokens?.toLocaleString() || 0} icon={<Coins className="w-3.5 h-3.5" />} />

          {/* Métricas detalladas (solo si hay datos > 0) */}
          {(job.extraction_tokens > 0 || job.refinement_tokens > 0) && (
             <>
               <StatBox label="Extraction Tokens" value={job.extraction_tokens?.toLocaleString() || 0} icon={<Coins className="w-3.5 h-3.5 opacity-70" />} />
               <StatBox label="Refinement Tokens" value={job.refinement_tokens?.toLocaleString() || 0} icon={<Coins className="w-3.5 h-3.5 opacity-70" />} />
               <StatBox label="Chunks Proc." value={`${job.processed_chunks}/${job.total_chunks}`} icon={<FileText className="w-3.5 h-3.5" />} />
               <StatBox label="Chunks Fallidos" value={job.failed_chunks || 0} icon={<AlertCircle className="w-3.5 h-3.5 text-red-500" />} />
             </>
          )}
        </div>
        {job.status === 'ERROR' && job.error_message && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400"><strong>Error:</strong> {job.error_message}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
