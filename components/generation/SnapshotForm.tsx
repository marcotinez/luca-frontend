'use client';

import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Difficulty } from '@/types';
import { GenerationConfigResponse } from '@/lib/config.api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Loader2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatQuestionTypeLabel } from './labels';

const DIFFICULTY_OPTIONS: Difficulty[] = [Difficulty.FACIL, Difficulty.MEDIO, Difficulty.DIFICIL];

type SnapshotDraft = {
  category: string;
  subtopic: string;
  targetDifficulties: Difficulty[];
  questionTypes: string[];
  includeEntities: boolean;
  includeRelations: boolean;
};

interface SnapshotFormProps {
  config: GenerationConfigResponse | null;
  loadingConfig: boolean;
  creating: boolean;
  onCreate: (draft: SnapshotDraft) => void;
}

export function SnapshotForm({ config, loadingConfig, creating, onCreate }: SnapshotFormProps) {
  const [draft, setDraft] = useState<SnapshotDraft>({
    category: '',
    subtopic: '__ALL__',
    targetDifficulties: [Difficulty.FACIL, Difficulty.MEDIO],
    questionTypes: [],
    includeEntities: true,
    includeRelations: true,
  });
  const [hardDifficultyPendingConfirm, setHardDifficultyPendingConfirm] = useState(false);

  const availableCategories = useMemo(() => config?.categories || [], [config]);
  const availableSubtopics = useMemo(
    () => (draft.category ? config?.subtopics[draft.category] || [] : []),
    [config, draft.category]
  );
  const availableQuestionTypes = useMemo(() => config?.question_type_catalog || [], [config]);
  const canCreateSnapshot = Boolean(draft.category) && draft.targetDifficulties.length > 0;

  const handleCreate = () => {
    if (!canCreateSnapshot) {
      toast.error('Completa categoría y al menos una dificultad.');
      return;
    }
    onCreate(draft);
    setHardDifficultyPendingConfirm(false);
  };

  return (
    <Card className="overflow-hidden border-2 shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          Crear Snapshot
        </CardTitle>
        <CardDescription>
          Define el alcance operativo con bloques separados y legibles. Algunas unidades pueden quedar en ok
          automáticamente por reutilización de preguntas existentes.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {loadingConfig ? (
          <div className="rounded-md border border-dashed p-5 text-sm text-muted-foreground">Cargando configuración...</div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 rounded-2xl border bg-muted/20 p-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Categoría</Label>
                <Select
                  value={draft.category}
                  onValueChange={(value) => setDraft((prev) => ({ ...prev, category: value, subtopic: '__ALL__' }))}
                >
                  <SelectTrigger className="h-12 border-2 bg-background">
                    <SelectValue placeholder="Selecciona categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCategories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Subtópico</Label>
                <Select
                  value={draft.subtopic}
                  onValueChange={(value) => setDraft((prev) => ({ ...prev, subtopic: value }))}
                  disabled={!draft.category}
                >
                  <SelectTrigger className="h-12 border-2 bg-background">
                    <SelectValue placeholder="Selecciona subtópico" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__ALL__">Toda la categoría</SelectItem>
                    {availableSubtopics.map((subtopic) => (
                      <SelectItem key={subtopic} value={subtopic}>
                        {subtopic}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="rounded-2xl border bg-card p-4 shadow-sm">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold">Dificultades objetivo</h3>
                  <p className="text-xs text-muted-foreground">Selecciona el rango de complejidad para el snapshot.</p>
                </div>
                <Badge variant="outline">{draft.targetDifficulties.length} seleccionadas</Badge>
              </div>
              <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                {DIFFICULTY_OPTIONS.map((difficulty) => {
                  const checked = draft.targetDifficulties.includes(difficulty);
                  return (
                    <label
                      key={difficulty}
                      className={cn(
                        'flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm transition-colors',
                        checked ? 'border-primary bg-primary/5 shadow-sm' : 'hover:bg-muted/40'
                      )}
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(nextValue) => {
                          const shouldInclude = Boolean(nextValue);
                          if (difficulty === Difficulty.DIFICIL && shouldInclude && !checked) {
                            if (!hardDifficultyPendingConfirm) {
                              setHardDifficultyPendingConfirm(true);
                              toast.info('Haz click nuevamente en "Difícil" para confirmar su inclusión.');
                              return;
                            }
                            setHardDifficultyPendingConfirm(false);
                          }
                          if (difficulty !== Difficulty.DIFICIL || !shouldInclude) {
                            setHardDifficultyPendingConfirm(false);
                          }
                          setDraft((prev) => {
                            const next = shouldInclude
                              ? [...prev.targetDifficulties, difficulty]
                              : prev.targetDifficulties.filter((item) => item !== difficulty);
                            return { ...prev, targetDifficulties: Array.from(new Set(next)) };
                          });
                        }}
                      />
                      <div className="flex flex-1 items-center justify-between gap-2">
                        <span className="font-medium">{difficulty}</span>
                        {checked ? <Badge variant="secondary">Activo</Badge> : null}
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl border bg-card p-4 shadow-sm">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold">Tipos de pregunta</h3>
                  <p className="text-xs text-muted-foreground">
                    Define qué variantes admite el snapshot. Es opcional; si no eliges ninguna, el backend usa su valor por defecto.
                  </p>
                </div>
                <Badge variant="outline">{availableQuestionTypes.length} disponibles</Badge>
              </div>

              {availableQuestionTypes.length === 0 ? (
                <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
                  No hay catálogo cargado. El backend usará su configuración por defecto.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                  {availableQuestionTypes.map((questionType) => {
                    const checked = draft.questionTypes.includes(questionType);
                    return (
                      <label
                        key={questionType}
                        className={cn(
                          'flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-sm transition-colors',
                          checked ? 'border-primary bg-primary/5 shadow-sm' : 'hover:bg-muted/40'
                        )}
                        title={questionType}
                      >
                        <Checkbox
                          className="mt-0.5"
                          checked={checked}
                          onCheckedChange={(nextValue) => {
                            const shouldInclude = Boolean(nextValue);
                            setDraft((prev) => ({
                              ...prev,
                              questionTypes: shouldInclude
                                ? [...prev.questionTypes, questionType]
                                : prev.questionTypes.filter((item) => item !== questionType),
                            }));
                          }}
                        />
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-medium">{formatQuestionTypeLabel(questionType)}</span>
                            {checked ? <Badge variant="secondary">Incluido</Badge> : null}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="rounded-2xl border bg-card p-4 shadow-sm">
              <div className="mb-4">
                <h3 className="text-sm font-semibold">Entidades y relaciones</h3>
                <p className="text-xs text-muted-foreground">
                  Ajusta si el snapshot debe considerar ambos componentes del grafo. Son opciones independientes de los tipos de pregunta.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                <label
                  className={cn(
                    'flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm transition-colors',
                    draft.includeEntities ? 'border-primary bg-primary/5 shadow-sm' : 'hover:bg-muted/40'
                  )}
                >
                  <Checkbox
                    checked={draft.includeEntities}
                    onCheckedChange={(value) => setDraft((prev) => ({ ...prev, includeEntities: Boolean(value) }))}
                  />
                  <span className="font-medium">Incluir entidades</span>
                </label>
                <label
                  className={cn(
                    'flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm transition-colors',
                    draft.includeRelations ? 'border-primary bg-primary/5 shadow-sm' : 'hover:bg-muted/40'
                  )}
                >
                  <Checkbox
                    checked={draft.includeRelations}
                    onCheckedChange={(value) => setDraft((prev) => ({ ...prev, includeRelations: Boolean(value) }))}
                  />
                  <span className="font-medium">Incluir relaciones</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleCreate} disabled={!canCreateSnapshot || creating}>
                {creating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                Crear snapshot
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
