'use client';

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import dynamic from 'next/dynamic';
import { getIngestionRun, retryIngestionRun, startIngestion } from "@/lib/ingestion.api";
import { getGraphStats } from "@/lib/graph.api";
import { wipeGraph } from "@/lib/admin.api";
import type { IngestionRun, IngestionStatus } from "@/types/ingestion.types";
import { JobsHistoryTable } from '@/components/ingestion/JobsHistoryTable';
import { BackupManager } from '@/components/admin/BackupManager';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  ArrowLeft,
  Database,
  GitBranch,
  History,
  ListOrdered,
  LoaderCircle,
  Trash2,
} from "lucide-react";
import { toast } from 'sonner';
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const IngestionConfigurator = dynamic(
  () => import('@/components/ingestion/IngestionConfigurator').then((module) => module.IngestionConfigurator),
  {
    ssr: false,
    loading: () => (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Nueva Ingesta</CardTitle>
          <CardDescription>Cargando configurador de PDF...</CardDescription>
        </CardHeader>
      </Card>
    ),
  }
);

const POLLING_INTERVAL_MS = 2500;
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
  if (status === "FINISHED") {
    return 100;
  }

  if (totalChunks <= 0) {
    return status === "PARTIAL" ? 100 : 0;
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

function deriveLiveStats(run: IngestionRun) {
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
    processedChunks:
      derivedProcessedChunks > 0
        ? derivedProcessedChunks
        : Math.max(run.processed_chunks, processedChunkIds.size),
    totalChunks:
      derivedTotalChunks > 0
        ? derivedTotalChunks
        : Math.max(run.total_chunks, processedChunkIds.size, maxChunkSeen),
    totalNodes: Math.max(run.total_nodes, derivedNodes),
    totalRelations: Math.max(run.total_relations, derivedRelations),
    totalErrors: Math.max(run.errors.length, derivedErrorEvents),
  };
}

export default function IngestaPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isUploading, setIsUploading] = useState(false);
  const [retryLoading, setRetryLoading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [currentRunId, setCurrentRunId] = useState<string | null>(null);
  const [currentRun, setCurrentRun] = useState<IngestionRun | null>(null);
  const [monitorError, setMonitorError] = useState<string | null>(null);
  const [stats, setStats] = useState<{ total_nodes: number; total_relationships: number } | null>(null);
  const [isWipeDialogOpen, setIsWipeDialogOpen] = useState(false);
  const [isWipingGraph, setIsWipingGraph] = useState(false);
  const executionCardRef = useRef<HTMLDivElement | null>(null);

  const fetchGraphStats = useCallback(() => {
    getGraphStats().then((s) => setStats(s)).catch(() => {});
  }, []);

  const syncRunIdInUrl = useCallback((runId: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (runId) {
      params.set("run_id", runId);
    } else {
      params.delete("run_id");
    }
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [pathname, router, searchParams]);

  const reloadRuns = useCallback(async () => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  const startPollingRun = useCallback((runId: string) => {
    setCurrentRunId(runId);
    setCurrentRun(null);
    setMonitorError(null);
    syncRunIdInUrl(runId);
  }, [syncRunIdInUrl]);

  useEffect(() => {
    fetchGraphStats();
  }, [fetchGraphStats]);

  useEffect(() => {
    const runIdFromQuery = searchParams.get("run_id");
    if (!runIdFromQuery) {
      return;
    }

    setCurrentRunId(runIdFromQuery);
    setCurrentRun(null);
    setMonitorError(null);
  }, []);

  const handleUpload = useCallback(async (file: File, chunks: number) => {
    setIsUploading(true);
    setMonitorError(null);

    try {
      const result = await startIngestion(file, chunks);
      await reloadRuns();
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
  }, [reloadRuns]);

  const handleSelectRun = useCallback((runId: string) => {
    startPollingRun(runId);
  }, [startPollingRun]);

  const handleBackToHistory = useCallback(() => {
    setCurrentRunId(null);
    setCurrentRun(null);
    setMonitorError(null);
    syncRunIdInUrl(null);
    void reloadRuns();
  }, [reloadRuns, syncRunIdInUrl]);

  const handleConfirmWipeGraph = useCallback(async () => {
    try {
      setIsWipingGraph(true);
      const result = await wipeGraph();
      toast.success(result.message);
      setIsWipeDialogOpen(false);
      await fetchGraphStats();
      setCurrentRunId(null);
      setCurrentRun(null);
      setMonitorError(null);
      syncRunIdInUrl(null);
      await reloadRuns();
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error
          ? error.message
          : "No se pudo vaciar el grafo.",
      );
    } finally {
      setIsWipingGraph(false);
    }
  }, [fetchGraphStats, reloadRuns, syncRunIdInUrl]);

  const handleDatabaseChanged = useCallback(async () => {
    await fetchGraphStats();
    setCurrentRunId(null);
    setCurrentRun(null);
    setMonitorError(null);
    syncRunIdInUrl(null);
    await reloadRuns();
  }, [fetchGraphStats, reloadRuns, syncRunIdInUrl]);

  const handleRetryRun = useCallback(async (runId: string) => {
    try {
      setRetryLoading(true);
      const retry = await retryIngestionRun(runId);
      toast.success("Retry encolado");
      startPollingRun(retry.run_id);
      await reloadRuns();
    } catch (error) {
      const detail = error instanceof Error ? error.message : "No se pudo reintentar.";
      if (
        detail.includes("no tiene archivo fuente persistido para retry")
        || detail.includes("No se encontró el archivo fuente para retry")
      ) {
        toast.error("Este run es antiguo y no soporta retry automático. Sube el PDF nuevamente.");
        return;
      }
      if (detail.includes("Run de ingesta no encontrado")) {
        toast.error("Run de ingesta no encontrado.");
        return;
      }
      toast.error(detail);
    } finally {
      setRetryLoading(false);
    }
  }, [reloadRuns, startPollingRun]);

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

  useEffect(() => {
    if (!currentRunId) return;

    const frameId = requestAnimationFrame(() => {
      executionCardRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    });

    return () => cancelAnimationFrame(frameId);
  }, [currentRunId]);

  const progressValue = useMemo(() => {
    if (!currentRun) {
      return 0;
    }

    const liveStats = deriveLiveStats(currentRun);
    return getProgress(
      liveStats.processedChunks,
      liveStats.totalChunks,
      currentRun.status,
    );
  }, [currentRun]);

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
    return deriveLiveStats(currentRun);
  }, [currentRun]);

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
          <Button
            size="sm"
            onClick={() => setIsWipeDialogOpen(true)}
            disabled={isWipingGraph}
            className="ml-0 sm:ml-2 bg-red-600 hover:bg-red-700 text-white dark:bg-red-900/45 dark:hover:bg-red-900/65 dark:text-red-100"
          >
            {isWipingGraph ? (
              <LoaderCircle className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4 mr-2" />
            )}
            Vaciar Grafo
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-8">
        <IngestionConfigurator
          onUpload={handleUpload}
          isUploading={isUploading}
        />

        <Card className="h-full" ref={executionCardRef}>
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2">
                  {currentRunId ? <LoaderCircle className="w-5 h-5" /> : <History className="w-5 h-5" />}
                  {currentRunId ? "Seguimiento de la ejecución" : "Historial de Ingesta"}
                </CardTitle>
                <CardDescription>
                  {currentRunId ? (
                    <>
                      Estado en vivo para <span className="font-mono">{currentRunId}</span>
                    </>
                  ) : (
                    "Ejecuciones registradas por el pipeline de ingesta. Selecciona una para ver su seguimiento."
                  )}
                </CardDescription>
              </div>

              {currentRunId && (
                <Button variant="outline" size="sm" onClick={handleBackToHistory}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Volver al historial
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {currentRunId ? (
              <div className="space-y-5">
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
                        {currentRun.retry_of_run_id && (
                          <span className="text-xs text-muted-foreground">
                            Retry de: <span className="font-mono">{currentRun.retry_of_run_id}</span>
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm">{progressValue}%</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRetryRun(currentRun.run_id)}
                          disabled={
                            retryLoading
                            || currentRun.status === "RUNNING"
                            || currentRun.status === "QUEUED"
                            || (currentRun.status !== "PARTIAL" && currentRun.status !== "FAILED")
                          }
                        >
                          {retryLoading ? "Reintentando..." : "Reintentar"}
                        </Button>
                      </div>
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
                        <p className="text-xs text-muted-foreground">Relaciones</p>
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
              </div>
            ) : (
              <JobsHistoryTable
                refreshTrigger={refreshTrigger}
                currentRunId={currentRunId}
                onSelectRun={handleSelectRun}
              />
            )}
          </CardContent>
        </Card>

        <BackupManager onDatabaseChanged={handleDatabaseChanged} />
      </div>

      <Dialog open={isWipeDialogOpen} onOpenChange={setIsWipeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Vaciar grafo e historial de ingesta?</DialogTitle>
            <DialogDescription>
              Esta acción eliminará todo el contenido del grafo y también borrará el historial de ingesta almacenado.
              No se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-md border border-red-300/60 bg-red-50 text-red-700 p-3 text-sm dark:border-red-900/40 dark:bg-red-950/25 dark:text-red-200">
            Esta operación reinicializa constraints e índices, elimina el historial de ingesta y no restaura ningún backup.
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setIsWipeDialogOpen(false)}
              disabled={isWipingGraph}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmWipeGraph}
              disabled={isWipingGraph}
              className="bg-red-600 hover:bg-red-700 text-white dark:bg-red-900/45 dark:hover:bg-red-900/65 dark:text-red-100"
            >
              {isWipingGraph ? (
                <>
                  <LoaderCircle className="w-4 h-4 mr-2 animate-spin" />
                  Vaciando...
                </>
              ) : (
                "Sí, vaciar grafo e historial"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
