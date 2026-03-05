'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DatabaseBackup,
  RotateCcw,
  Plus,
  RefreshCw,
  AlertTriangle
} from "lucide-react";
import { toast } from 'sonner';
import { getBackups, createBackup, restoreBackup, type BackupFile } from '@/lib/admin.api';

export function BackupManager() {
  const [backups, setBackups] = useState<BackupFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const fetchBackups = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getBackups();
      setBackups(data);
    } catch (error) {
      console.error("Error fetching backups:", error);
      toast.error("Error al cargar la lista de backups");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBackups();
  }, [fetchBackups]);

  const handleCreateBackup = async () => {
    try {
      setProcessing(true);
      const result = await createBackup();
      toast.success(result.message);
      fetchBackups(); // Refresh list
    } catch (error) {
      console.error("Error creating backup:", error);
      toast.error("Error al crear el backup");
    } finally {
      setProcessing(false);
    }
  };

  const handleRestoreBackup = async (filename: string) => {
    if (!confirm(`ADVERTENCIA CRÍTICA:\n\nRestaurar el backup "${filename}" eliminará TODOS los datos actuales de la base de datos.\n\n¿Estás absolutamente seguro de continuar?`)) {
      return;
    }

    try {
      setProcessing(true);
      const result = await restoreBackup(filename);
      toast.success(result.message);
    } catch (error) {
      console.error("Error restoring backup:", error);
      toast.error("Error al restaurar el backup");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Card className="h-full border-blue-100 dark:border-blue-900/20">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl">
              <DatabaseBackup className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Administración de Base de Datos
            </CardTitle>
            <CardDescription>
              Gestiona copias de seguridad y restauración del sistema.
            </CardDescription>
          </div>
          <Button
            onClick={handleCreateBackup}
            disabled={processing || loading}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {processing ? (
              <RefreshCw className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Plus className="w-4 h-4 mr-2" />
            )}
            Crear Backup
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border bg-card">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Archivo</TableHead>
                <TableHead>Tamaño</TableHead>
                <TableHead>Fecha de Creación</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {backups.length === 0 && !loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    No hay backups disponibles.
                  </TableCell>
                </TableRow>
              ) : (
                backups.map((backup) => (
                  <TableRow key={backup.filename}>
                    <TableCell className="font-mono text-sm">{backup.filename}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{backup.size}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {backup.created_at}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                        onClick={() => handleRestoreBackup(backup.filename)}
                        disabled={processing}
                        title="Restaurar este backup (Peligroso)"
                      >
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Restaurar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
