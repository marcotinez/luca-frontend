'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, FileText, X, RefreshCw, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { IngestionConfig } from '@/types/ingestion.types';

interface FileUploaderProps {
  onUpload: (file: File, config: IngestionConfig, force: boolean) => void;
  isUploading?: boolean;
  disabled?: boolean;
}

export function FileUploader({ onUpload, isUploading = false, disabled = false }: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [forceReprocess, setForceReprocess] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Config options
  const [displayName, setDisplayName] = useState('');
  const [chunkSize, setChunkSize] = useState(5);
  const [startPage, setStartPage] = useState('');
  const [endPage, setEndPage] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type === 'application/pdf') {
      setSelectedFile(files[0]);
    }
  }, [disabled]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0 && files[0].type === 'application/pdf') {
      setSelectedFile(files[0]);
    }
  }, []);

  const handleClearFile = useCallback(() => {
    setSelectedFile(null);
    setDisplayName('');
    setStartPage('');
    setEndPage('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  const handleUpload = useCallback(() => {
    if (selectedFile) {
      const config: IngestionConfig = {
        display_name: displayName || undefined,
        chunk_size: chunkSize,
        start_page: startPage ? parseInt(startPage) : undefined,
        end_page: endPage ? parseInt(endPage) : undefined,
      };
      onUpload(selectedFile, config, forceReprocess);
    }
  }, [selectedFile, displayName, chunkSize, startPage, endPage, forceReprocess, onUpload]);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-4">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
        className={cn(
          "relative border-2 border-dashed rounded-xl p-8 transition-all duration-200 cursor-pointer",
          "flex flex-col items-center justify-center gap-4 min-h-[180px]",
          isDragging && "border-primary bg-primary/5 scale-[1.02]",
          !isDragging && "border-border hover:border-primary/50 hover:bg-accent/50",
          disabled && "opacity-50 cursor-not-allowed",
          selectedFile && "border-primary/30 bg-primary/5"
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled}
        />

        {!selectedFile ? (
          <>
            <div className={cn(
              "w-16 h-16 rounded-full flex items-center justify-center transition-colors",
              isDragging ? "bg-primary/20" : "bg-accent"
            )}>
              <Upload className={cn("w-8 h-8", isDragging ? "text-primary" : "text-muted-foreground")} />
            </div>
            <div className="text-center">
              <p className="text-lg font-medium">
                {isDragging ? "Suelta el archivo aquí" : "Arrastra un PDF aquí"}
              </p>
              <p className="text-sm text-muted-foreground mt-1">o haz clic para seleccionar</p>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-4 w-full max-w-md">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <FileText className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{selectedFile.name}</p>
              <p className="text-sm text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleClearFile(); }} disabled={isUploading}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {selectedFile && (
        <div className="space-y-4">
          {/* Opciones Avanzadas Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-muted-foreground gap-2"
          >
            <Settings2 className="w-4 h-4" />
            {showAdvanced ? 'Ocultar opciones' : 'Opciones avanzadas'}
          </Button>

          {/* Panel de Opciones Avanzadas */}
          {showAdvanced && (
            <div className="p-4 border rounded-lg bg-accent/30 space-y-4">
              {/* Nombre personalizado */}
              <div className="space-y-2">
                <Label htmlFor="display-name">Nombre personalizado</Label>
                <Input
                  id="display-name"
                  placeholder="Ej: Informe Financiero Q4"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  disabled={isUploading}
                />
              </div>

              {/* Chunk Size */}
              <div className="space-y-2">
                <Label htmlFor="chunk-size">Páginas por chunk</Label>
                <Input
                  id="chunk-size"
                  type="number"
                  min={1}
                  max={50}
                  value={chunkSize}
                  onChange={(e) => setChunkSize(Math.max(1, Math.min(50, parseInt(e.target.value) || 5)))}
                  disabled={isUploading}
                />
                <p className="text-xs text-muted-foreground">Cantidad de páginas a procesar por cada llamada al LLM (1-50)</p>
              </div>

              {/* Rango de Páginas */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start-page">Página inicial</Label>
                  <Input
                    id="start-page"
                    type="number"
                    min={1}
                    placeholder="1"
                    value={startPage}
                    onChange={(e) => setStartPage(e.target.value)}
                    disabled={isUploading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end-page">Página final</Label>
                  <Input
                    id="end-page"
                    type="number"
                    min={1}
                    placeholder="Última"
                    value={endPage}
                    onChange={(e) => setEndPage(e.target.value)}
                    disabled={isUploading}
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Deja en blanco para procesar todo el documento</p>
            </div>
          )}

          {/* Footer con checkbox y botón */}
          <div className="flex items-center justify-between gap-4 pt-2">
            <div className="flex items-center gap-2">
              <Checkbox
                id="force-reprocess"
                checked={forceReprocess}
                onCheckedChange={(checked) => setForceReprocess(checked === true)}
                disabled={isUploading}
              />
              <label htmlFor="force-reprocess" className="text-sm text-muted-foreground cursor-pointer">
                Forzar reprocesamiento
              </label>
            </div>
            <Button onClick={handleUpload} disabled={isUploading || disabled} className="gap-2">
              {isUploading ? <><RefreshCw className="w-4 h-4 animate-spin" />Subiendo...</> : <><Upload className="w-4 h-4" />Iniciar Ingesta</>}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
