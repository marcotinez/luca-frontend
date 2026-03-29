'use client';

import { useState, useCallback, useEffect, useMemo } from "react";
import { getIngestionRun, startIngestion } from "@/lib/ingestion.api";
import { getGraphStats } from "@/lib/graph.api";
import type { IngestionRun, IngestionStatus } from "@/types/ingestion.types";
import { IngestionConfigurator } from '@/components/ingestion/IngestionConfigurator';
import { JobsHistoryTable } from '@/components/ingestion/JobsHistoryTable';
import { BackupManager } from '@/components/admin/BackupManager';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertCircle,
  Database,
  GitBranch,
  History,
  ListOrdered,
  LoaderCircle,
} from "lucide-react";
import { toast } from 'sonner';

const POLLING_INTERVAL_MS = 1500;
const FINAL_STATUSES: IngestionStatus[] = ["FINISHED", "PARTIAL", "FAILED"];
const CHUNK_FINISHED_REGEX =
  /chunk\s+(\d+)\s+finalizado:\s+(\d+)\s+nodos,\s+(\d+)\s+relaciones/i;
const CHUNKING_COMPLETED_REGEX = /chunking\s+completado:\s+(\d+)\s+chunks/i;
const PROCESSING_CHUNK_REGEX = /procesando\s+chunk\s+(\d+)/i;
const PIPELINE_CHUNKS_REGEX = /chunks=(\d+)\/(\d+)/i;

function getProgress(
  processedChunks: number,
  totalChunks: number,
  status: IngestionStatus,
): number {
  if (totalChunks <= 0) {
    return status === "FINISHED" || status === "PARTIAL" ? 100 : 0;
  }

  return Math.min(100, Math.round((processedChunks / totalChunks) * 100));
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

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleString("es-CL", {
    dateStyle: "short",
    timeStyle: "medium",
  });
}

function deriveLiveStats(run: IngestionRun, requestedChunks?: number) {
  const processedChunkIds = new Set<number>();
  let derivedNodes = 0;
  let derivedRelations = 0;
  let derivedErrorEvents = 0;
  let derivedTotalChunks = 0;
  let derivedProcessedChunks = 0;
  let maxChunkSeen = 0;

  for (const event of run.events ?? []) {
    if (event.level === "ERROR") {
      derivedErrorEvents += 1;
    }

    const chunkingMatch = event.message.match(CHUNKING_COMPLETED_REGEX);
    if (chunkingMatch) {
      const chunkCount = Number(chunkingMatch[1]);
      if (!Number.isNaN(chunkCount)) {
        derivedTotalChunks = Math.max(derivedTotalChunks, chunkCount);
      }
    }

    const processingMatch = event.message.match(PROCESSING_CHUNK_REGEX);
    if (processingMatch) {
      const chunkId = Number(processingMatch[1]);
      if (!Number.isNaN(chunkId)) {
        maxChunkSeen = Math.max(maxChunkSeen, chunkId);
      }
    }

    const pipelineMatch = event.message.match(PIPELINE_CHUNKS_REGEX);
    if (pipelineMatch) {
      const processed = Number(pipelineMatch[1]);
      const total = Number(pipelineMatch[2]);
      if (!Number.isNaN(processed)) {
        derivedProcessedChunks = Math.max(derivedProcessedChunks, processed);
      }
      if (!Number.isNaN(total)) {
        derivedTotalChunks = Math.max(derivedTotalChunks, total);
      }
    }

    const match = event.message.match(CHUNK_FINISHED_REGEX);
    if (!match) {
      continue;
    }

    const chunkId = Number(match[1]);
    const nodes = Number(match[2]);
    const relations = Number(match[3]);

    if (!Number.isNaN(chunkId)) {
      processedChunkIds.add(chunkId);
      maxChunkSeen = Math.max(maxChunkSeen, chunkId);
    }
    if (!Number.isNaN(nodes)) {
      derivedNodes += nodes;
    }
    if (!Number.isNaN(relations)) {
      derivedRelations += relations;
    }
  }

  return {
    processedChunks: Math.max(
      run.processed_chunks,
      processedChunkIds.size,
      derivedProcessedChunks,
    ),
    totalChunks: Math.max(
      run.total_chunks,
      derivedTotalChunks,
      maxChunkSeen,
      requestedChunks ?? 0,
    ),
    totalNodes: Math.max(run.total_nodes, derivedNodes),
    totalRelations: Math.max(run.total_relations, derivedRelations),
    totalErrors: Math.max(run.errors.length, derivedErrorEvents),
  };
}

export default function IngestaPage() {
  const [isUploading, setIsUploading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [currentRunId, setCurrentRunId] = useState<string | null>(null);
  const [currentRun, setCurrentRun] = useState<IngestionRun | null>(null);
  const [monitorError, setMonitorError] = useState<string | null>(null);
  const [requestedChunksByRun, setRequestedChunksByRun] = useState<
    Record<string, number>
  >({});
  const [stats, setStats] = useState<{ total_nodes: number; total_relationships: number } | null>(null);

  useEffect(() => {
    getGraphStats().then((s) => setStats(s)).catch(() => {});
  }, []);

  const handleUpload = useCallback(async (file: File, chunks: number) => {
    setIsUploading(true);
    setMonitorError(null);

    try {
      const result = await startIngestion(file, chunks);
      setCurrentRunId(result.run_id);
      setCurrentRun(null);
      setRequestedChunksByRun((prev) => ({ ...prev, [result.run_id]: chunks }));
      setRefreshTrigger((prev) => prev + 1);
      toast.success(result.message || "Ingesta encolada exitosamente.");
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error
          ? error.message
          : "No se pudo iniciar la ingesta.",
      );
    } finally {
      setIsUploading(false);
    }
  }, []);

  const handleSelectRun = useCallback((runId: string) => {
    setCurrentRunId(runId);
    setMonitorError(null);
  }, []);

  useEffect(() => {
    if (!currentRunId) {
      return;
    }

    let isCancelled = false;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const pollRunStatus = async () => {
      try {
        const run = await getIngestionRun(currentRunId);
        if (isCancelled) {
          return;
        }

        setCurrentRun(run);
        setMonitorError(null);

        if (FINAL_STATUSES.includes(run.status)) {
          if (intervalId) {
            clearInterval(intervalId);
          }

          setRefreshTrigger((prev) => prev + 1);
        }
      } catch (error) {
        if (isCancelled) {
          return;
        }

        setMonitorError(
          error instanceof Error
            ? error.message
            : "No se pudo actualizar el estado de ingesta.",
        );
      }
    };

    pollRunStatus();
    intervalId = setInterval(pollRunStatus, POLLING_INTERVAL_MS);

    return () => {
      isCancelled = true;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [currentRunId]);

  const progressValue = useMemo(() => {
    if (!currentRun) {
      return 0;
    }

    const requestedChunks = currentRunId
      ? requestedChunksByRun[currentRunId]
      : undefined;
    const liveStats = deriveLiveStats(currentRun, requestedChunks);
    return getProgress(
      liveStats.processedChunks,
      liveStats.totalChunks,
      currentRun.status,
    );
  }, [currentRun, currentRunId, requestedChunksByRun]);

  const orderedEvents = useMemo(() => {
    if (!currentRun?.events) {
      return [];
    }

    return [...currentRun.events].sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
  }, [currentRun]);

  const latestErrorEvent = useMemo(() => {
    return orderedEvents.find((event) => event.level === "ERROR");
  }, [orderedEvents]);

  const liveStats = useMemo(() => {
    if (!currentRun) {
      return null;
    }
    const requestedChunks = currentRunId
      ? requestedChunksByRun[currentRunId]
      : undefined;
    return deriveLiveStats(currentRun, requestedChunks);
  }, [currentRun, currentRunId, requestedChunksByRun]);

  return (
    <div className="space-y-8 p-4 sm:p-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl flex items-center gap-3">
            <Database className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
            Ingesta de Documentos
          </h1>
          <p className="text-muted-foreground mt-1">
            Sube PDFs, configura chunks y monitorea cada corrida de ingesta en
            tiempo real.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="gap-1.5 text-sm py-1 px-3">
            <Database className="w-3.5 h-3.5" />
            {(stats?.total_nodes ?? 0).toLocaleString()} nodos
          </Badge>
          <Badge variant="outline" className="gap-1.5 text-sm py-1 px-3">
            <GitBranch className="w-3.5 h-3.5" />
            {(stats?.total_relationships ?? 0).toLocaleString()} relaciones
          </Badge>
        </div>
      </div>

      <div className="flex flex-col gap-8">
        <IngestionConfigurator
          onUpload={handleUpload}
          isUploading={isUploading}
        />

        {currentRunId && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LoaderCircle className="w-5 h-5" />
                Seguimiento de la ejecución
              </CardTitle>
              <CardDescription>
                Estado en vivo para{" "}
                <span className="font-mono">{currentRunId}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {monitorError && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {monitorError}
                </div>
              )}

              {!currentRun ? (
                <div className="text-sm text-muted-foreground">
                  Cargando estado de la corrida...
                </div>
              ) : (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {getStatusBadge(currentRun.status)}
                      <span className="text-xs text-muted-foreground">
                        Actualizado: {formatDate(currentRun.updated_at)}
                      </span>
                    </div>
                    <span className="font-mono text-sm">{progressValue}%</span>
                  </div>

                  <Progress value={progressValue} className="h-2" />

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="rounded-lg border p-3">
                      <p className="text-xs text-muted-foreground">Chunks</p>
                      <p className="text-xl font-semibold">
                        {liveStats?.processedChunks ?? 0}/
                        {liveStats?.totalChunks ?? 0}
                      </p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-xs text-muted-foreground">Nodos</p>
                      <p className="text-xl font-semibold">
                        {liveStats?.totalNodes ?? 0}
                      </p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-xs text-muted-foreground">
                        Relaciones
                      </p>
                      <p className="text-xl font-semibold">
                        {liveStats?.totalRelations ?? 0}
                      </p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-xs text-muted-foreground">Errores</p>
                      <p className="text-xl font-semibold">
                        {liveStats?.totalErrors ?? 0}
                      </p>
                    </div>
                  </div>

                  {latestErrorEvent && (
                    <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-300">
                      <p className="font-medium">Ultimo evento con error</p>
                      <p>{latestErrorEvent.message}</p>
                    </div>
                  )}

                  {currentRun.errors.length > 0 && (
                    <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
                      <p className="font-medium text-sm mb-2">
                        Errores reportados
                      </p>
                      <ul className="space-y-1 text-sm text-muted-foreground list-disc pl-5">
                        {currentRun.errors.map((error, index) => (
                          <li key={`${error}-${index}`}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="space-y-2">
                    <h4 className="text-sm font-medium flex items-center gap-2">
                      <ListOrdered className="w-4 h-4" />
                      Timeline de Eventos
                    </h4>
                    <ScrollArea className="h-64 rounded-lg border p-3">
                      <div className="space-y-3">
                        {orderedEvents.length === 0 ? (
                          <p className="text-sm text-muted-foreground">
                            Aun no hay eventos registrados.
                          </p>
                        ) : (
                          orderedEvents.map((event, index) => (
                            <div
                              key={`${event.timestamp}-${event.step}-${index}`}
                              className="border-b pb-2 last:border-b-0 last:pb-0"
                            >
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <div className="flex items-center gap-2">
                                  <Badge
                                    variant={
                                      event.level === "ERROR"
                                        ? "destructive"
                                        : event.level === "WARNING"
                                          ? "secondary"
                                          : "outline"
                                    }
                                  >
                                    {event.level}
                                  </Badge>
                                  <span className="font-mono text-xs text-muted-foreground">
                                    {event.step}
                                  </span>
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {formatDate(event.timestamp)}
                                </span>
                              </div>
                              <p className="text-sm">{event.message}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        <Card className="h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              Historial de Ingesta
            </CardTitle>
            <CardDescription>
              Ejecuciones registradas por el pipeline de ingesta. Puedes seleccionar una para
              ver su seguimiento.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <JobsHistoryTable
              refreshTrigger={refreshTrigger}
              currentRunId={currentRunId}
              onSelectRun={handleSelectRun}
            />
          </CardContent>
        </Card>

        <BackupManager />
      </div>
    </div>
  );
}
