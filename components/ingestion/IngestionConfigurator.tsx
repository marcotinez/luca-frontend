'use client';

import { useState, useCallback, useEffect } from 'react';
import { Upload, FileText, Settings, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useDropzone } from 'react-dropzone';

interface IngestionConfiguratorProps {
  onUpload: (file: File, chunks: number) => Promise<void>;
  isUploading: boolean;
}

export function IngestionConfigurator({ onUpload, isUploading }: IngestionConfiguratorProps) {
  const [file, setFile] = useState<File | null>(null);
  const [totalPages, setPages] = useState<number>(0);
  const [chunks, setChunks] = useState<number>(1);
  const [pagesPerChunk, setPagesPerChunk] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [isReadingPdf, setIsReadingPdf] = useState(false);
  const [lastSubmittedFileKey, setLastSubmittedFileKey] = useState<string | null>(null);

  const fileKey = file
    ? `${file.name}:${file.size}:${file.lastModified}`
    : null;
  const isCurrentFileAlreadySubmitted =
    fileKey !== null && lastSubmittedFileKey === fileKey;

  // Recalcular páginas por chunk y chunks reales cuando cambian las páginas totales o la cantidad de chunks deseada
  useEffect(() => {
    if (totalPages > 0 && chunks > 0) {
      // Lógica exacta del backend:
      // const pagesPerChunk = Math.ceil(pages.length / totalChunksDesired);
      const calculatedPagesPerChunk = Math.ceil(totalPages / chunks);
      setPagesPerChunk(calculatedPagesPerChunk);
    } else {
      setPagesPerChunk(0);
    }
  }, [totalPages, chunks]);

  // Calcular el número real de chunks resultante
  const actualTotalChunks = totalPages > 0 && pagesPerChunk > 0
    ? Math.ceil(totalPages / pagesPerChunk)
    : 0;

  // pdfjs-dist se mantiene: no es solo un contador de páginas, maneja la
  // configuración interactiva de chunks ANTES de subir (el conteo del backend
  // solo existe después de procesar, demasiado tarde para este slider). Se
  // carga en diferido — este import dinámico es el único en el proyecto.
  const loadPdfModule = useCallback(async () => {
    const pdfjsLib = await import('pdfjs-dist');
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
    return pdfjsLib;
  }, []);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setError(null);
    const selectedFile = acceptedFiles[0];
    if (!selectedFile) return;

    if (selectedFile.type !== 'application/pdf') {
      setError('Por favor, sube un archivo PDF válido.');
      return;
    }

    setFile(selectedFile);
    setIsReadingPdf(true);

    try {
      const pdfjsLib = await loadPdfModule();
      const arrayBuffer = await selectedFile.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      setPages(pdf.numPages);
      setChunks(1); // Reset chunks to 1 initially or a default sane value
    } catch (err) {
      console.error('Error reading PDF:', err);
      setError('Error al leer el archivo PDF. Asegúrate de que no esté corrupto.');
      setFile(null);
      setPages(0);
    } finally {
      setIsReadingPdf(false);
    }
  }, [loadPdfModule]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    multiple: false,
    disabled: isUploading || isReadingPdf
  });

  const handleSubmit = () => {
    if (!file) return;
    if (isCurrentFileAlreadySubmitted) return;
    onUpload(file, chunks)
      .then(() => {
        setLastSubmittedFileKey(fileKey);
      })
      .catch(() => {
        // El manejo de error ya ocurre en la capa superior.
      });
  };

  const handleRemoveFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFile(null);
    setPages(0);
    setChunks(1);
    setError(null);
    setLastSubmittedFileKey(null);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Nueva Ingesta
        </CardTitle>
        <CardDescription>
          Sube un PDF y configura cómo se dividirá para su procesamiento.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        <div className={`grid gap-6 ${file ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
          {/* Left Column: Dropzone / File Preview */}
          <div
            {...getRootProps()}
            className={`
              relative border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all
              ${isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'}
              ${(isUploading || isReadingPdf) ? 'opacity-50 pointer-events-none' : ''}
              ${file ? 'h-full min-h-[300px] border-primary/50' : 'h-64'}
            `}
          >
            <input {...getInputProps()} />

            {file ? (
              <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-300">
                <div className="w-20 h-20 bg-red-100 dark:bg-red-900/20 rounded-2xl flex items-center justify-center">
                   <FileText className="w-10 h-10 text-red-600 dark:text-red-400" />
                </div>
                <div className="space-y-1">
                  <p className="font-semibold text-lg max-w-[200px] truncate" title={file.name}>{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                     {totalPages > 0 ? `${totalPages} páginas` : 'Leyendo...'}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveFile}
                  className="mt-2 text-muted-foreground hover:text-destructive"
                >
                  Cambiar archivo
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-2">
                  <Upload className="w-8 h-8 text-muted-foreground/50" />
                </div>
                <p className="font-medium text-lg">Arrastra tu PDF aquí</p>
                <p className="text-sm">o haz clic para seleccionar</p>
              </div>
            )}
          </div>

          {/* Right Column: Configuration */}
          {file && (
            <div className="flex flex-col justify-center space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <Settings className="w-4 h-4 text-primary" />
                  <h3 className="font-medium text-lg">Configuración</h3>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="chunks">Chunks Deseados</Label>
                      <span className="text-xs font-mono bg-muted px-2 py-1 rounded">{chunks}</span>
                    </div>
                    <Input
                      id="chunks"
                      type="range"
                      min={1}
                      max={50} // Limite hardcodeado razonable, el usuario pidió limitación.
                      value={chunks}
                      onChange={(e) => setChunks(Math.max(1, Number(e.target.value)))}
                      disabled={isUploading || totalPages === 0}
                      className="cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>1</span>
                      <span>{totalPages}</span>
                    </div>
                  </div>

                  <div className="p-4 bg-muted/30 rounded-lg space-y-3 border">
                    <Label className="text-muted-foreground">Resumen de Procesamiento</Label>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                      <div>
                         <p className="text-2xl font-bold text-foreground">{pagesPerChunk}</p>
                         <p className="text-xs text-muted-foreground">Páginas / Chunk</p>
                      </div>
                      <div>
                         <p className="text-2xl font-bold text-foreground">{actualTotalChunks}</p>
                         <p className="text-xs text-muted-foreground">Chunks Reales</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <Button
                  onClick={handleSubmit}
                  className="w-full h-12 text-base shadow-lg hover:shadow-xl transition-all"
                  disabled={isUploading || isCurrentFileAlreadySubmitted}
                >
                  {isUploading ? (
                     <span className="flex items-center gap-2">
                       <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                       Procesando Documento...
                     </span>
                  ) : isCurrentFileAlreadySubmitted ? (
                    'PDF ya enviado'
                  ) : (
                    'Iniciar Ingesta'
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleRemoveFile}
                  disabled={isUploading}
                  className="w-full mt-2"
                >
                  Limpiar
                </Button>
                {isCurrentFileAlreadySubmitted && (
                  <p className="text-center text-xs text-muted-foreground mt-3">
                    Este PDF ya fue enviado manualmente. Presiona Limpiar para habilitar otro envío.
                  </p>
                )}
                <p className="text-center text-xs text-muted-foreground mt-3">
                  El documento será dividido y procesado según la configuración.
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
