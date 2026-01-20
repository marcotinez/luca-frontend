'use client';

import { useState, useCallback } from 'react';
import type { IngestionJob, IngestionConfig } from '@/types/ingestion.types';
import { uploadDocument } from '@/lib/ingestion.api';
import { FileUploader } from '@/components/ingestion/FileUploader';
import { IngestionTracker } from '@/components/ingestion/IngestionTracker';
import { JobsHistoryTable } from '@/components/ingestion/JobsHistoryTable';
import { RestoreModal } from '@/components/ingestion/RestoreModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Database, Upload, History, FileText, AlertCircle } from 'lucide-react';

export default function IngestaPage() {
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [currentJob, setCurrentJob] = useState<IngestionJob | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleUpload = useCallback(async (file: File, config: IngestionConfig, force: boolean) => {
    setIsUploading(true);
    setUploadError(null);
    setCurrentJobId(null);
    setCurrentJob(null);

    try {
      const job = await uploadDocument(file, config, force);
      setCurrentJob(job);
      setCurrentJobId(job._id);
      if (['COMPLETED', 'SKIPPED', 'COMPLETED_WITH_ERRORS'].includes(job.status)) {
        setRefreshTrigger(prev => prev + 1);
      }
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Error al subir documento');
    } finally {
      setIsUploading(false);
    }
  }, []);

  const handleViewJob = useCallback((job: IngestionJob) => {
    setCurrentJob(job);
    setCurrentJobId(['PENDING', 'PROCESSING'].includes(job.status) ? job._id : null);
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Database className="w-8 h-8 text-primary" />
            Ingesta de Documentos
          </h1>
          <p className="text-muted-foreground mt-1">Sube documentos PDF para extraer y construir el grafo de conocimiento.</p>
        </div>
        <Button variant="outline" onClick={() => setShowRestoreModal(true)} className="gap-2 shrink-0">
          <Database className="w-4 h-4" />Restaurar BD
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Upload className="w-5 h-5" />Subir Documento</CardTitle>
              <CardDescription>Arrastra un PDF o haz clic para seleccionar.</CardDescription>
            </CardHeader>
            <CardContent>
              <FileUploader onUpload={handleUpload} isUploading={isUploading} disabled={isUploading} />
              {uploadError && (
                <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                  <p className="text-sm text-red-600 dark:text-red-400">{uploadError}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {(currentJob || currentJobId) && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <FileText className="w-4 h-4" />Proceso Actual
              </h3>
              <IngestionTracker jobId={currentJobId} initialJob={currentJob} />
            </div>
          )}
        </div>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><History className="w-5 h-5" />Historial</CardTitle>
            <CardDescription>Documentos procesados en la plataforma.</CardDescription>
          </CardHeader>
          <CardContent>
            <JobsHistoryTable onViewJob={handleViewJob} refreshTrigger={refreshTrigger} />
          </CardContent>
        </Card>
      </div>

      <RestoreModal open={showRestoreModal} onOpenChange={setShowRestoreModal} onRestoreComplete={() => setRefreshTrigger(prev => prev + 1)} />
    </div>
  );
}
