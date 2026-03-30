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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DatabaseBackup,
  RotateCcw,
  Plus,
  RefreshCw,
} from "lucide-react";
import { toast } from 'sonner';
import { getBackups, createBackup, restoreBackup, type BackupFile } from '@/lib/admin.api';

interface BackupManagerProps {
  onDatabaseChanged?: () => void | Promise<void>;
}

export function BackupManager({ onDatabaseChanged }: BackupManagerProps) {
  const [backups, setBackups] = useState<BackupFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [backupToRestore, setBackupToRestore] = useState<string | null>(null);

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
    try {
      setProcessing(true);
      const result = await restoreBackup(filename);
      toast.success(result.message);
      await onDatabaseChanged?.();
      setBackupToRestore(null);
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
                        onClick={() => setBackupToRestore(backup.filename)}
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

      <Dialog open={!!backupToRestore} onOpenChange={(open) => !open && setBackupToRestore(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Restaurar backup?</DialogTitle>
            <DialogDescription>
              Esta acción eliminará todos los datos actuales y restaurará el backup seleccionado.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-md border border-amber-300/60 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/25 dark:text-amber-200">
            Backup seleccionado:{" "}
            <span className="font-mono">{backupToRestore}</span>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setBackupToRestore(null)}
              disabled={processing}
            >
              Cancelar
            </Button>
            <Button
              onClick={() => backupToRestore && handleRestoreBackup(backupToRestore)}
              disabled={processing || !backupToRestore}
              className="bg-orange-600 hover:bg-orange-700 text-white dark:bg-orange-900/45 dark:hover:bg-orange-900/65 dark:text-orange-100"
            >
              {processing ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Restaurando...
                </>
              ) : (
                "Sí, restaurar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
