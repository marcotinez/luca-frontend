'use client';

import { useState, useCallback } from 'react';
import { uploadDocument } from '@/lib/ingestion.api';
import { IngestionConfigurator } from '@/components/ingestion/IngestionConfigurator';
import { JobsHistoryTable } from '@/components/ingestion/JobsHistoryTable';
import { BackupManager } from '@/components/admin/BackupManager';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Database, History, Upload } from 'lucide-react';
import { toast } from 'sonner';

export default function IngestaPage() {
  const [isUploading, setIsUploading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleUpload = useCallback(async (file: File, chunks: number) => {
    setIsUploading(true);
    try {
      const result = await uploadDocument(file, chunks);

      toast.success(result.message || "Archivo enviado exitosamente");

      // Actualizamos la tabla de historial
      setRefreshTrigger(prev => prev + 1);

    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : 'Error al subir documento');
    } finally {
      setIsUploading(false);
    }
  }, []);

  return (
    <div className="space-y-8 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Database className="w-8 h-8 text-primary" />
            Ingesta de Documentos
          </h1>
          <p className="text-muted-foreground mt-1">
            Sube documentos PDF, configura los chunks y visualiza el historial de procesamiento.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-8">
        {/* Panel de Carga (Ahora full width) */}
        <IngestionConfigurator onUpload={handleUpload} isUploading={isUploading} />

        {/* Panel de Historial (Ahora full width y abajo) */}
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              Historial de Ingesta
            </CardTitle>
            <CardDescription>
              Registro de chunks y trabajos procesados.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <JobsHistoryTable refreshTrigger={refreshTrigger} />
          </CardContent>
        </Card>

        {/* Panel de Administración de Base de Datos */}
        <BackupManager />
      </div>
    </div>
  );
}
