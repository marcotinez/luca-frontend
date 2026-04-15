'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  GenerationConfigPatchRequest,
  GenerationConfigResponse,
  ModelCatalogItem,
  getGenerationConfig,
  getModelCatalog,
  patchGenerationConfig,
} from '@/lib/prompt-generation.api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Loader2, Plus, Save, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { getConfigErrorMessage, LARGE_TEXTAREA_CLASSNAME } from '../_lib/common';

type ModelsPipelineDraft = {
  llm_default_model: string;
  llm_models: Record<string, string>;
  llm_model_sections: string[];
  question_type_catalog: string[];
  rubric_config_json: string;
};

const NO_DEFAULT_VALUE = '__NO_DEFAULT__';

const EMPTY_DRAFT: ModelsPipelineDraft = {
  llm_default_model: '',
  llm_models: {},
  llm_model_sections: [],
  question_type_catalog: [],
  rubric_config_json: '{\n  "weights": {},\n  "pass_threshold": 0\n}',
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

function resolveSections(explicitSections: string[], modelsBySection: Record<string, string>): string[] {
  if (explicitSections.length > 0) {
    return explicitSections;
  }
  return Object.keys(modelsBySection);
}

function cloneDraftFromConfig(config: GenerationConfigResponse): ModelsPipelineDraft {
  const llmSections = resolveSections(config.llm_model_sections, config.llm_models);

  return {
    llm_default_model: config.llm_default_model,
    llm_model_sections: llmSections,
    llm_models: llmSections.reduce<Record<string, string>>((acc, key) => {
      acc[key] = config.llm_models[key] || config.llm_default_model || '';
      return acc;
    }, {}),
    question_type_catalog: config.question_type_catalog,
    rubric_config_json: toPrettyJson(config.rubric_config),
  };
}

function normalizeModelMap(sections: string[], map: Record<string, string>): Record<string, string> {
  return sections.reduce<Record<string, string>>((acc, section) => {
    acc[section] = (map[section] || '').trim();
    return acc;
  }, {});
}

function hasChanged<T>(original: T, current: T): boolean {
  return JSON.stringify(original) !== JSON.stringify(current);
}

function modelLabel(model: ModelCatalogItem): string {
  const publisher = model.publisher?.trim();
  return publisher ? `${model.display_name} (${publisher})` : model.display_name;
}

function applyDefaultModelToAllSections(sections: string[], modelKey: string): Record<string, string> {
  return sections.reduce<Record<string, string>>((acc, section) => {
    acc[section] = modelKey;
    return acc;
  }, {});
}

export default function ConfiguracionModelosPipelinePage() {
  const [config, setConfig] = useState<GenerationConfigResponse | null>(null);
  const [draft, setDraft] = useState<ModelsPipelineDraft>(EMPTY_DRAFT);
  const [allModels, setAllModels] = useState<ModelCatalogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [questionTypeInput, setQuestionTypeInput] = useState('');

  const llmOptions = useMemo(() => allModels.filter((model) => model.type === 'llm'), [allModels]);

  const isDirty = useMemo(() => {
    if (!config) return false;
    return JSON.stringify(cloneDraftFromConfig(config)) !== JSON.stringify(draft);
  }, [config, draft]);

  const loadConfig = useCallback(async () => {
    try {
      setIsLoading(true);
      const [configResponse, modelCatalogResponse] = await Promise.all([getGenerationConfig(), getModelCatalog()]);
      setConfig(configResponse);
      setDraft(cloneDraftFromConfig(configResponse));
      setAllModels(modelCatalogResponse.models);
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
    if (allModels.length === 0) {
      toast.error('No hay catálogo de modelos disponible. No se puede guardar.');
      return;
    }

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

      const normalizedLlmModels = normalizeModelMap(draft.llm_model_sections, draft.llm_models);
      if (!draft.llm_default_model.trim()) {
        const missingSections = draft.llm_model_sections.filter((section) => !normalizedLlmModels[section]);
        if (missingSections.length > 0) {
          throw new Error(
            `Sin modelo default debes completar todos los modelos por sección. Faltan: ${missingSections.join(', ')}`
          );
        }
      }

      const payload: GenerationConfigPatchRequest = {
        llm_default_model: draft.llm_default_model.trim(),
        llm_models: normalizedLlmModels,
        question_type_catalog: draft.question_type_catalog,
        rubric_config: {
          weights: rubricWeights,
          pass_threshold: passThreshold,
        },
      };

      if (config) {
        const normalizedOriginalLlm = normalizeModelMap(
          resolveSections(config.llm_model_sections, config.llm_models),
          config.llm_models
        );
        const patch: GenerationConfigPatchRequest = {};
        if (hasChanged(config.llm_default_model, payload.llm_default_model)) patch.llm_default_model = payload.llm_default_model;
        if (hasChanged(normalizedOriginalLlm, payload.llm_models)) patch.llm_models = payload.llm_models;
        if (hasChanged(config.question_type_catalog, payload.question_type_catalog)) {
          patch.question_type_catalog = payload.question_type_catalog;
        }
        if (hasChanged(config.rubric_config, payload.rubric_config)) patch.rubric_config = payload.rubric_config;

        if (Object.keys(patch).length === 0) {
          toast.info('No hay cambios para guardar.');
          return;
        }

        setIsSaving(true);
        const updated = await patchGenerationConfig(patch);
        setConfig(updated);
        setDraft(cloneDraftFromConfig(updated));
        toast.success('Modelos y pipeline actualizados');
        return;
      }

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
          <CardDescription>Modelos por sección usando el catálogo real del backend.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">Cargando configuración...</div>
          ) : (
            <>
              {allModels.length === 0 ? (
                <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
                  No hay modelos disponibles en `GET /api/v1/models`. El guardado está bloqueado.
                </div>
              ) : null}

              <div className="space-y-2">
                <Label>Modelo LLM por defecto (llm_default_model)</Label>
                <Select
                  value={draft.llm_default_model || NO_DEFAULT_VALUE}
                  onValueChange={(value) =>
                    setDraft((prev) => {
                      if (value === NO_DEFAULT_VALUE) {
                        return { ...prev, llm_default_model: '' };
                      }

                      return {
                        ...prev,
                        llm_default_model: value,
                        llm_models: applyDefaultModelToAllSections(prev.llm_model_sections, value),
                      };
                    })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecciona un modelo LLM" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_DEFAULT_VALUE}>No default</SelectItem>
                    {llmOptions.map((model) => (
                      <SelectItem key={model.key} value={model.key}>
                        {modelLabel(model)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3 rounded-md border p-4">
                <p className="text-sm font-medium">Modelos LLM por sección</p>
                {draft.llm_model_sections.map((section) => (
                  <div key={section} className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Label>{section}</Label>
                      {llmOptions.some(
                        (candidate) =>
                          candidate.key === draft.llm_models[section] &&
                          typeof candidate.capabilities?.vision === 'boolean' &&
                          candidate.capabilities.vision === true
                      ) ? (
                        <Badge variant="secondary">vision</Badge>
                      ) : null}
                    </div>
                    <Select
                      value={draft.llm_models[section] || draft.llm_default_model || undefined}
                      onValueChange={(value) =>
                        setDraft((prev) => ({
                          ...prev,
                          llm_models: {
                            ...prev.llm_models,
                            [section]: value,
                          },
                        }))
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecciona modelo" />
                      </SelectTrigger>
                      <SelectContent>
                        {llmOptions.map((model) => (
                          <SelectItem key={model.key} value={model.key}>
                            {modelLabel(model)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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

              <div className="space-y-2 rounded-md border p-4">
                <Label>Rúbrica (rubric_config)</Label>
                <Textarea
                  value={draft.rubric_config_json}
                  onChange={(event) => setDraft((prev) => ({ ...prev, rubric_config_json: event.target.value }))}
                  rows={8}
                  className={LARGE_TEXTAREA_CLASSNAME}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-wrap justify-end gap-2 border-t pt-4">
        <Button variant="outline" onClick={handleRestore} disabled={!isDirty || isSaving || isLoading}>
          Restaurar valores cargados
        </Button>
        <Button onClick={handleSave} disabled={!isDirty || isSaving || isLoading || allModels.length === 0}>
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Guardar cambios
        </Button>
      </div>
    </div>
  );
}
