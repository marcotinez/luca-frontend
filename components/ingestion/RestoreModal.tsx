'use client';

import { useState, useRef } from 'react';
import { restoreDatabase } from '@/lib/ingestion.api';
import type { RestoreResponse } from '@/types/ingestion.types';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertTriangle, Database, FileCode, Upload, X, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RestoreModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRestoreComplete?: () => void;
}

export function RestoreModal({ open, onOpenChange, onRestoreComplete }: RestoreModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [clearDb, setClearDb] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [result, setResult] = useState<RestoreResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.name.endsWith('.cypher') || file.name.endsWith('.txt')) {
        setSelectedFile(file);
        setError(null);
      } else {
        setError('Selecciona un archivo .cypher o .txt');
      }
    }
  };

  const handleRestore = async () => {
    if (!selectedFile || (clearDb && !confirmClear)) return;
    setIsRestoring(true);
    setError(null);
    try {
      const response = await restoreDatabase(selectedFile, clearDb);
      setResult(response);
      if (response.status === 'success') onRestoreComplete?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsRestoring(false);
    }
  };

  const handleClose = () => {
    if (!isRestoring) {
      setSelectedFile(null);
      setClearDb(false);
      setConfirmClear(false);
      setResult(null);
      setError(null);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Database className="w-5 h-5" />Restaurar Base de Datos</DialogTitle>
          <DialogDescription>Importa un archivo Cypher para restaurar el grafo.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg flex gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <p className="text-sm text-muted-foreground">Esta acción modificará la base de datos. Asegúrate de tener respaldo.</p>
          </div>

          {!selectedFile ? (
            <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center gap-2 cursor-pointer hover:border-primary/50">
              <input ref={fileInputRef} type="file" accept=".cypher,.txt" onChange={handleFileSelect} className="hidden" />
              <Upload className="w-8 h-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Seleccionar archivo .cypher</p>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-3 border rounded-lg bg-accent/30">
              <FileCode className="w-5 h-5 text-primary" />
              <span className="flex-1 truncate">{selectedFile.name}</span>
              <Button variant="ghost" size="icon" onClick={() => setSelectedFile(null)}><X className="w-4 h-4" /></Button>
            </div>
          )}

          <div className="space-y-3 p-3 border border-red-500/20 rounded-lg bg-red-500/5">
            <div className="flex items-center gap-2">
              <Checkbox id="clear-db" checked={clearDb} onCheckedChange={(c) => { setClearDb(c === true); if (!c) setConfirmClear(false); }} />
              <label htmlFor="clear-db" className="text-sm font-medium text-red-600 dark:text-red-400 cursor-pointer">Borrar BD antes de importar</label>
            </div>
            {clearDb && (
              <div className="pl-6">
                <div className="flex items-center gap-2">
                  <Checkbox id="confirm" checked={confirmClear} onCheckedChange={(c) => setConfirmClear(c === true)} />
                  <label htmlFor="confirm" className="text-xs text-red-600 dark:text-red-400 cursor-pointer">Confirmo el borrado</label>
                </div>
              </div>
            )}
          </div>

          {error && <div className="p-3 bg-red-500/10 rounded-lg flex items-center gap-2"><XCircle className="w-4 h-4 text-red-500" /><p className="text-sm text-red-600">{error}</p></div>}
          {result && (
            <div className={cn("p-3 rounded-lg flex items-center gap-2", result.status === 'success' ? "bg-emerald-500/10" : "bg-red-500/10")}>
              {result.status === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-red-500" />}
              <p className="text-sm">{result.message}</p>
            </div>
          )}
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose} disabled={isRestoring}>{result ? 'Cerrar' : 'Cancelar'}</Button>
          {!result && <Button onClick={handleRestore} disabled={!selectedFile || (clearDb && !confirmClear) || isRestoring} variant={clearDb ? "destructive" : "default"}>
            {isRestoring ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Restaurando...</> : 'Restaurar'}
          </Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
