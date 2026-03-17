'use client';

import { useEffect, useMemo, useState } from 'react';
import { Difficulty } from '@/types';
import {
  createPromptEntry,
  getLatestPrompts,
  getPromptHistory,
  PromptEntry,
  PromptLayer,
} from '@/lib/prompt-generation.api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, Save, RotateCcw, History, FileText } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const LAYERS: { value: PromptLayer; label: string }[] = [
  { value: 'base', label: 'Prompt base de generación' },
  { value: 'difficulty', label: 'Prompt por dificultad' },
  { value: 'feedback_incorrect', label: 'Feedback por respuesta incorrecta' },
  { value: 'feedback_session_final', label: 'Feedback final de sesión' },
];

const DIFFICULTIES: Difficulty[] = [Difficulty.FACIL, Difficulty.MEDIO, Difficulty.DIFICIL];

function getErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.detail || error.response?.data?.message || fallback;
  }
  return fallback;
}

function formatDate(value: string) {
  return new Date(value).toLocaleString('es-CL');
}

function getLayerLabel(layer: PromptLayer) {
  return LAYERS.find((layerItem) => layerItem.value === layer)?.label || layer;
}

export default function BancoPromptsPage() {
  const [layer, setLayer] = useState<PromptLayer>('base');
  const [difficulty, setDifficulty] = useState<Difficulty | ''>('');
  const [content, setContent] = useState('');
  const [note, setNote] = useState('');
  const [limit, setLimit] = useState(20);

  const [latestPrompts, setLatestPrompts] = useState<Record<string, PromptEntry | null> | null>(null);
  const [history, setHistory] = useState<PromptEntry[]>([]);

  const [loadingLatest, setLoadingLatest] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [saving, setSaving] = useState(false);

  const needsDifficulty = layer === 'difficulty';

  const selectedLatest = useMemo(() => {
    if (!latestPrompts) return null;
    if (layer === 'base') return latestPrompts.base;
    if (layer === 'feedback_incorrect') return latestPrompts.feedback_incorrect;
    if (layer === 'feedback_session_final') return latestPrompts.feedback_session_final;

    if (difficulty === Difficulty.FACIL) return latestPrompts.facil;
    if (difficulty === Difficulty.MEDIO) return latestPrompts.medio;
    if (difficulty === Difficulty.DIFICIL) return latestPrompts.dificil;
    return null;
  }, [latestPrompts, layer, difficulty]);

  const fetchLatest = async () => {
    try {
      setLoadingLatest(true);
      const data = await getLatestPrompts();
      setLatestPrompts(data);
    } catch (error) {
      toast.error(getErrorMessage(error, 'No se pudieron cargar los prompts activos'));
    } finally {
      setLoadingLatest(false);
    }
  };

  const fetchHistory = async () => {
    if (needsDifficulty && !difficulty) {
      setHistory([]);
      return;
    }

    try {
      setLoadingHistory(true);
      const data = await getPromptHistory({
        layer,
        difficulty: needsDifficulty ? (difficulty as Difficulty) : undefined,
        limit,
      });
      setHistory(data);
    } catch (error) {
      toast.error(getErrorMessage(error, 'No se pudo cargar el historial'));
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchLatest();
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [layer, difficulty, limit]);

  const resetForm = () => {
    setContent('');
    setNote('');
  };

  const savePrompt = async () => {
    if (needsDifficulty && !difficulty) {
      toast.error('Debes seleccionar dificultad para la capa difficulty');
      return;
    }

    if (!content.trim()) {
      toast.error('El contenido del prompt es obligatorio');
      return;
    }

    const payload = {
      layer,
      difficulty: needsDifficulty ? (difficulty as Difficulty) : null,
      content: content.trim(),
      note: note.trim() || null,
    };

    try {
      setSaving(true);
      await createPromptEntry(payload);

      toast.success('Prompt guardado correctamente');
      resetForm();
      await Promise.all([fetchLatest(), fetchHistory()]);
    } catch (error) {
      toast.error(getErrorMessage(error, 'No se pudo guardar el prompt'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Editor de prompts</h1>
        <p className="text-muted-foreground mt-1">
          Administra versiones de prompts por capa y revisa su historial.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Editor de Prompt
            </CardTitle>
            <CardDescription>
              Cada guardado crea una nueva versión activa del prompt seleccionado.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Capa</Label>
                <Select
                  value={layer}
                  onValueChange={(value) => {
                    setLayer(value as PromptLayer);
                    if (value !== 'difficulty') setDifficulty('');
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona capa" />
                  </SelectTrigger>
                  <SelectContent>
                    {LAYERS.map((layerItem) => (
                      <SelectItem key={layerItem.value} value={layerItem.value}>
                        {layerItem.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Dificultad</Label>
                <Select
                  value={difficulty || 'none'}
                  onValueChange={(value) => setDifficulty(value === 'none' ? '' : (value as Difficulty))}
                  disabled={!needsDifficulty}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={needsDifficulty ? 'Selecciona dificultad' : 'No aplica'} />
                  </SelectTrigger>
                  <SelectContent>
                    {!needsDifficulty && <SelectItem value="none">No aplica</SelectItem>}
                    {DIFFICULTIES.map((difficultyItem) => (
                      <SelectItem key={difficultyItem} value={difficultyItem}>
                        {difficultyItem}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Contenido del prompt</Label>
              <Textarea
                value={content}
                onChange={(event) => setContent(event.target.value)}
                rows={10}
                placeholder="Escribe aquí el prompt..."
              />
            </div>

            <div className="space-y-2">
              <Label>Nota (opcional)</Label>
              <Input
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Ej: Ajuste tono pedagógico"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button onClick={savePrompt} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Guardar versión
              </Button>
              <Button variant="outline" onClick={resetForm}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Limpiar
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Prompt Activo</CardTitle>
            <CardDescription>Última versión de la capa seleccionada.</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingLatest ? (
              <div className="text-muted-foreground text-sm">Cargando prompts activos...</div>
            ) : !selectedLatest ? (
              <div className="text-muted-foreground text-sm">No existe prompt activo para esta selección.</div>
            ) : (
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{getLayerLabel(selectedLatest.layer)}</Badge>
                  {selectedLatest.difficulty && <Badge>{selectedLatest.difficulty}</Badge>}
                </div>
                <p className="text-muted-foreground whitespace-pre-wrap line-clamp-8">{selectedLatest.content}</p>
                <div className="text-xs text-muted-foreground">
                  <p>Creado por: {selectedLatest.created_by}</p>
                  <p>Fecha: {formatDate(selectedLatest.created_at)}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5" />
                Historial de Versiones
              </CardTitle>
              <CardDescription>Versiones por capa y dificultad.</CardDescription>
            </div>

            <div className="flex items-center gap-2">
              <Label className="text-sm">Límite</Label>
              <Select value={String(limit)} onValueChange={(value) => setLimit(Number(value))}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                  <SelectItem value="200">200</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-left font-medium py-3 px-2">Fecha</th>
                  <th className="text-left font-medium py-3 px-2">Usuario</th>
                  <th className="text-left font-medium py-3 px-2">Nota</th>
                  <th className="text-left font-medium py-3 px-2">Contenido</th>
                </tr>
              </thead>
              <tbody>
                {loadingHistory ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-muted-foreground">
                      Cargando historial...
                    </td>
                  </tr>
                ) : history.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-muted-foreground">
                      Sin versiones para la selección actual.
                    </td>
                  </tr>
                ) : (
                  history.map((entry) => (
                    <tr key={entry.id} className="border-b border-border/50 align-top">
                      <td className="py-3 px-2 whitespace-nowrap">{formatDate(entry.created_at)}</td>
                      <td className="py-3 px-2 whitespace-nowrap">{entry.created_by}</td>
                      <td className="py-3 px-2">{entry.note || '-'}</td>
                      <td className="py-3 px-2 max-w-2xl">
                        <span className="line-clamp-2 text-muted-foreground">{entry.content}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
