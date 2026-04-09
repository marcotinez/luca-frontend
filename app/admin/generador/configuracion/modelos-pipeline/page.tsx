'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  GenerationConfigPatchRequest,
  GenerationConfigResponse,
  getGenerationConfig,
  patchGenerationConfig,
} from '@/lib/prompt-generation.api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Loader2, Plus, Save, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { getConfigErrorMessage, LARGE_TEXTAREA_CLASSNAME } from '../_lib/common';

type ModelsPipelineDraft = {
  llm_default_model: string;
  llm_models: Record<string, string>;
  embedding_default_model: string;
  embedding_models: Record<string, string>;
  question_type_catalog: string[];
  rubric_config_json: string;
  llm_providers_json: string;
};

const REQUIRED_LLM_COMPONENTS = [
  'ingestion_generation',
  'ingestion_refinement',
  'ingestion_taxonomy',
  'question_generation',
  'question_judge',
] as const;

const REQUIRED_EMBEDDING_COMPONENTS = ['ingestion_entities', 'semantic_search_query'] as const;

const EMPTY_DRAFT: ModelsPipelineDraft = {
  llm_default_model: '',
  llm_models: REQUIRED_LLM_COMPONENTS.reduce<Record<string, string>>((acc, key) => {
    acc[key] = '';
    return acc;
  }, {}),
  embedding_default_model: '',
  embedding_models: REQUIRED_EMBEDDING_COMPONENTS.reduce<Record<string, string>>((acc, key) => {
    acc[key] = '';
    return acc;
  }, {}),
  question_type_catalog: [],
  rubric_config_json: '{\n  "weights": {},\n  "pass_threshold": 0\n}',
  llm_providers_json: '{\n  "default": {\n    "base_url": "",\n    "generation_model": "",\n    "judge_model": ""\n  }\n}',
};

function parseJsonObject(value: string, fieldLabel: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(value || '{}') as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error(`${fieldLabel} debe ser un objeto JSON.`);
    }
    return parsed as Record<string, unknown>;
  } catch {
    throw new Error(`${fieldLabel} no es un JSON válido.`);
  }
}

function toStringNumberMap(value: Record<string, unknown>, fieldLabel: string): Record<string, number> {
  const output: Record<string, number> = {};
  for (const [key, rawValue] of Object.entries(value)) {
    const numeric = Number(rawValue);
    if (!Number.isFinite(numeric)) {
      throw new Error(`${fieldLabel}: '${key}' debe ser numérico.`);
    }
    output[key] = numeric;
  }
  return output;
}

function toPrettyJson(value: unknown): string {
  return JSON.stringify(value ?? {}, null, 2);
}

function cloneDraftFromConfig(config: GenerationConfigResponse): ModelsPipelineDraft {
  return {
    llm_default_model: config.llm_default_model,
    llm_models: REQUIRED_LLM_COMPONENTS.reduce<Record<string, string>>((acc, key) => {
      acc[key] = config.llm_models[key] || '';
      return acc;
    }, {}),
    embedding_default_model: config.embedding_default_model,
    embedding_models: REQUIRED_EMBEDDING_COMPONENTS.reduce<Record<string, string>>((acc, key) => {
      acc[key] = config.embedding_models[key] || '';
      return acc;
    }, {}),
    question_type_catalog: config.question_type_catalog,
    rubric_config_json: toPrettyJson(config.rubric_config),
    llm_providers_json: toPrettyJson(config.llm_providers),
  };
}

export default function ConfiguracionModelosPipelinePage() {
  const [config, setConfig] = useState<GenerationConfigResponse | null>(null);
  const [draft, setDraft] = useState<ModelsPipelineDraft>(EMPTY_DRAFT);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [questionTypeInput, setQuestionTypeInput] = useState('');

  const isDirty = useMemo(() => {
    if (!config) return false;
    return JSON.stringify(cloneDraftFromConfig(config)) !== JSON.stringify(draft);
  }, [config, draft]);

  const loadConfig = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await getGenerationConfig();
      setConfig(response);
      setDraft(cloneDraftFromConfig(response));
    } catch (error) {
      toast.error(getConfigErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadConfig();
  }, [loadConfig]);

  const handleRestore = () => {
    if (!config) return;
    setDraft(cloneDraftFromConfig(config));
    setQuestionTypeInput('');
    toast.success('Cambios descartados');
  };

  const handleSave = async () => {
    const llmModels = REQUIRED_LLM_COMPONENTS.reduce<Record<string, string>>((acc, key) => {
      acc[key] = (draft.llm_models[key] || '').trim();
      return acc;
    }, {});
    const embeddingModels = REQUIRED_EMBEDDING_COMPONENTS.reduce<Record<string, string>>((acc, key) => {
      acc[key] = (draft.embedding_models[key] || '').trim();
      return acc;
    }, {});

    if (draft.question_type_catalog.length === 0) {
      toast.error('Debes configurar al menos un question_type_catalog.');
      return;
    }

    try {
      const parsedRubric = parseJsonObject(draft.rubric_config_json, 'rubric_config');
      const rubricWeights = toStringNumberMap(
        (parsedRubric.weights as Record<string, unknown>) || {},
        'rubric_config.weights'
      );
      const passThreshold = Number(parsedRubric.pass_threshold);
      if (!Number.isFinite(passThreshold)) {
        throw new Error('rubric_config.pass_threshold debe ser numérico.');
      }

      const payload: GenerationConfigPatchRequest = {
        llm_default_model: draft.llm_default_model.trim(),
        llm_models: llmModels,
        embedding_default_model: draft.embedding_default_model.trim(),
        embedding_models: embeddingModels,
        question_type_catalog: draft.question_type_catalog,
        rubric_config: {
          weights: rubricWeights,
          pass_threshold: passThreshold,
        },
        llm_providers: parseJsonObject(draft.llm_providers_json, 'llm_providers') as GenerationConfigResponse['llm_providers'],
      };

      setIsSaving(true);
      const updated = await patchGenerationConfig(payload);
      setConfig(updated);
      setDraft(cloneDraftFromConfig(updated));
      toast.success('Modelos y pipeline actualizados');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : getConfigErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Modelos y pipeline</h1>
          <p className="text-muted-foreground">Configuración activa para ingesta + generación V2.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {config?.updated_at ? (
            <Badge variant="outline">Última actualización: {new Date(config.updated_at).toLocaleString('es-CL')}</Badge>
          ) : null}
          <Button asChild variant="outline">
            <Link href="/admin/generador/configuracion">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a configuración
            </Link>
          </Button>
        </div>
      </div>

      <Card className="border-border/70">
        <CardHeader>
          <CardTitle>Configuración técnica mínima</CardTitle>
          <CardDescription>Sin parámetros legacy de pipeline.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">Cargando configuración...</div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Modelo LLM por defecto (llm_default_model)</Label>
                  <Input
                    value={draft.llm_default_model}
                    onChange={(event) => setDraft((prev) => ({ ...prev, llm_default_model: event.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Modelo embeddings por defecto (embedding_default_model)</Label>
                  <Input
                    value={draft.embedding_default_model}
                    onChange={(event) => setDraft((prev) => ({ ...prev, embedding_default_model: event.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-3 rounded-md border p-4">
                <p className="text-sm font-medium">Modelos LLM por función</p>
                {REQUIRED_LLM_COMPONENTS.map((component) => (
                  <div key={component} className="space-y-1">
                    <Label>{component}</Label>
                    <Input
                      value={draft.llm_models[component] || ''}
                      onChange={(event) =>
                        setDraft((prev) => ({
                          ...prev,
                          llm_models: {
                            ...prev.llm_models,
                            [component]: event.target.value,
                          },
                        }))
                      }
                    />
                  </div>
                ))}
              </div>

              <div className="space-y-3 rounded-md border p-4">
                <p className="text-sm font-medium">Modelos embedding por función</p>
                {REQUIRED_EMBEDDING_COMPONENTS.map((component) => (
                  <div key={component} className="space-y-1">
                    <Label>{component}</Label>
                    <Input
                      value={draft.embedding_models[component] || ''}
                      onChange={(event) =>
                        setDraft((prev) => ({
                          ...prev,
                          embedding_models: {
                            ...prev.embedding_models,
                            [component]: event.target.value,
                          },
                        }))
                      }
                    />
                  </div>
                ))}
              </div>

              <div className="space-y-2 rounded-md border p-4">
                <Label>Catálogo de tipos de pregunta (question_type_catalog)</Label>
                <div className="flex gap-2">
                  <Input
                    value={questionTypeInput}
                    onChange={(event) => setQuestionTypeInput(event.target.value)}
                    placeholder="Agregar question type"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const candidate = questionTypeInput.trim();
                      if (!candidate) return;
                      setDraft((prev) => ({
                        ...prev,
                        question_type_catalog: prev.question_type_catalog.includes(candidate)
                          ? prev.question_type_catalog
                          : [...prev.question_type_catalog, candidate],
                      }));
                      setQuestionTypeInput('');
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Agregar
                  </Button>
                </div>
                {draft.question_type_catalog.map((item, index) => (
                  <div key={`${item}-${index}`} className="flex items-center justify-between rounded-md border p-2 text-sm">
                    <span>{item}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      className="text-red-600 hover:text-red-700"
                      onClick={() =>
                        setDraft((prev) => ({
                          ...prev,
                          question_type_catalog: prev.question_type_catalog.filter((_, idx) => idx !== index),
                        }))
                      }
                    >
                      <Trash2 className="mr-1 h-4 w-4" />
                      Quitar
                    </Button>
                  </div>
                ))}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 rounded-md border p-4">
                  <Label>Rúbrica (rubric_config)</Label>
                  <Textarea
                    value={draft.rubric_config_json}
                    onChange={(event) => setDraft((prev) => ({ ...prev, rubric_config_json: event.target.value }))}
                    rows={8}
                    className={LARGE_TEXTAREA_CLASSNAME}
                  />
                </div>
                <div className="space-y-2 rounded-md border p-4">
                  <Label>Proveedores LLM (llm_providers)</Label>
                  <Textarea
                    value={draft.llm_providers_json}
                    onChange={(event) => setDraft((prev) => ({ ...prev, llm_providers_json: event.target.value }))}
                    rows={8}
                    className={LARGE_TEXTAREA_CLASSNAME}
                  />
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-wrap justify-end gap-2 border-t pt-4">
        <Button variant="outline" onClick={handleRestore} disabled={!isDirty || isSaving || isLoading}>
          Restaurar valores cargados
        </Button>
        <Button onClick={handleSave} disabled={!isDirty || isSaving || isLoading}>
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Guardar cambios
        </Button>
      </div>
    </div>
  );
}

