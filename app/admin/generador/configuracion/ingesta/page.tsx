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
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ArrowLeft, Loader2, Save, Settings2 } from 'lucide-react';
import { toast } from 'sonner';
import { PromptEditorField } from '../_components/prompt-editor-field';
import {
  decodeEscapedSequences,
  getConfigErrorMessage,
  LARGE_TEXTAREA_CLASSNAME,
  REQUIRED_PLACEHOLDERS,
  validateTemplatePlaceholders,
} from '../_lib/common';

type IngestionDraft = {
  ingestion_extraction_system_prompt: string;
  ingestion_extraction_user_prompt_template: string;
  ingestion_refinement_system_prompt: string;
  ingestion_refinement_user_prompt_template: string;
  ingestion_taxonomy_classification_system_prompt: string;
  ingestion_taxonomy_classification_user_prompt_template: string;
};

const EMPTY_DRAFT: IngestionDraft = {
  ingestion_extraction_system_prompt: '',
  ingestion_extraction_user_prompt_template: '',
  ingestion_refinement_system_prompt: '',
  ingestion_refinement_user_prompt_template: '',
  ingestion_taxonomy_classification_system_prompt: '',
  ingestion_taxonomy_classification_user_prompt_template: '',
};

function cloneDraftFromConfig(config: GenerationConfigResponse): IngestionDraft {
  return {
    ingestion_extraction_system_prompt: decodeEscapedSequences(
      config.ingestion_extraction_system_prompt
    ),
    ingestion_extraction_user_prompt_template: decodeEscapedSequences(
      config.ingestion_extraction_user_prompt_template
    ),
    ingestion_refinement_system_prompt: decodeEscapedSequences(
      config.ingestion_refinement_system_prompt
    ),
    ingestion_refinement_user_prompt_template: decodeEscapedSequences(
      config.ingestion_refinement_user_prompt_template
    ),
    ingestion_taxonomy_classification_system_prompt: decodeEscapedSequences(
      config.ingestion_taxonomy_classification_system_prompt
    ),
    ingestion_taxonomy_classification_user_prompt_template: decodeEscapedSequences(
      config.ingestion_taxonomy_classification_user_prompt_template
    ),
  };
}

type TemplatePlaceholdersProps = {
  template: string;
  requiredKeys: readonly string[];
};

function TemplatePlaceholders({ template, requiredKeys }: TemplatePlaceholdersProps) {
  const missing = validateTemplatePlaceholders(template, requiredKeys);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {requiredKeys.map((key) => (
          <Badge key={key} variant={missing.includes(key) ? 'destructive' : 'outline'}>
            {`{${key}}`}
          </Badge>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        {missing.length === 0
          ? 'Placeholders completos.'
          : `Faltan: ${missing.map((key) => `{${key}}`).join(', ')}`}
      </p>
    </div>
  );
}

export default function ConfiguracionIngestaPage() {
  const [config, setConfig] = useState<GenerationConfigResponse | null>(null);
  const [draft, setDraft] = useState<IngestionDraft>(EMPTY_DRAFT);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

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

  const handleFieldChange = (field: keyof IngestionDraft, value: string) => {
    setDraft((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleRestore = () => {
    if (!config) return;
    setDraft(cloneDraftFromConfig(config));
    toast.success('Cambios descartados');
  };

  const handleSave = async () => {
    const payload: GenerationConfigPatchRequest = {
      ingestion_extraction_system_prompt: draft.ingestion_extraction_system_prompt.trim(),
      ingestion_extraction_user_prompt_template:
        draft.ingestion_extraction_user_prompt_template.trim(),
      ingestion_refinement_system_prompt: draft.ingestion_refinement_system_prompt.trim(),
      ingestion_refinement_user_prompt_template:
        draft.ingestion_refinement_user_prompt_template.trim(),
      ingestion_taxonomy_classification_system_prompt:
        draft.ingestion_taxonomy_classification_system_prompt.trim(),
      ingestion_taxonomy_classification_user_prompt_template:
        draft.ingestion_taxonomy_classification_user_prompt_template.trim(),
    };

    try {
      setIsSaving(true);
      const updated = await patchGenerationConfig(payload);
      setConfig(updated);
      setDraft(cloneDraftFromConfig(updated));
      toast.success('Configuración de ingesta actualizada');
    } catch (error) {
      toast.error(getConfigErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Configuración de la ingesta</h1>
          <p className="text-muted-foreground">Prompts para extracción, refinamiento y clasificación.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {config?.updated_at && (
            <Badge variant="outline">
              Última actualización: {new Date(config.updated_at).toLocaleString('es-CL')}
            </Badge>
          )}
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
          <CardTitle>Editor de configuración</CardTitle>
          <CardDescription>Ajusta únicamente variables de ingesta.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoading ? (
            <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
              Cargando configuración...
            </div>
          ) : (
            <Accordion
              type="multiple"
              className="rounded-lg border"
            >
              <AccordionItem value="ingestion-extraction" className="px-4">
                <AccordionTrigger className="text-base hover:no-underline">Extracción</AccordionTrigger>
                <AccordionContent className="space-y-4 pb-6">
                  <PromptEditorField
                    label="Prompt de sistema para extracción"
                    description="Define cómo extraer entidades y relaciones desde el contenido fuente."
                    value={draft.ingestion_extraction_system_prompt}
                    onChange={(value) => handleFieldChange('ingestion_extraction_system_prompt', value)}
                    rows={18}
                    className={LARGE_TEXTAREA_CLASSNAME}
                  />
                  <PromptEditorField
                    label="Plantilla de usuario para extracción"
                    description="Estructura del mensaje con variables como archivo y bloque de texto. Se muestra bloqueada para edición."
                    value={draft.ingestion_extraction_user_prompt_template}
                    readOnly
                    rows={18}
                    className={LARGE_TEXTAREA_CLASSNAME}
                    footer={
                      <TemplatePlaceholders
                        template={draft.ingestion_extraction_user_prompt_template}
                        requiredKeys={REQUIRED_PLACEHOLDERS.ingestion_extraction_user_prompt_template}
                      />
                    }
                  />
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="ingestion-refinement" className="px-4">
                <AccordionTrigger className="text-base hover:no-underline">Refinamiento</AccordionTrigger>
                <AccordionContent className="space-y-4 pb-6">
                  <PromptEditorField
                    label="Prompt de sistema para refinamiento"
                    description="Limpia y normaliza entidades/relaciones extraídas antes de clasificar."
                    value={draft.ingestion_refinement_system_prompt}
                    onChange={(value) => handleFieldChange('ingestion_refinement_system_prompt', value)}
                    rows={18}
                    className={LARGE_TEXTAREA_CLASSNAME}
                  />
                  <PromptEditorField
                    label="Plantilla de usuario para refinamiento"
                    description="Mensaje con estructuras JSON de entrada para aplicar refinamiento. Se muestra bloqueada para edición."
                    value={draft.ingestion_refinement_user_prompt_template}
                    readOnly
                    rows={18}
                    className={LARGE_TEXTAREA_CLASSNAME}
                    footer={
                      <TemplatePlaceholders
                        template={draft.ingestion_refinement_user_prompt_template}
                        requiredKeys={REQUIRED_PLACEHOLDERS.ingestion_refinement_user_prompt_template}
                      />
                    }
                  />
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="ingestion-classification" className="px-4">
                <AccordionTrigger className="text-base hover:no-underline">
                  Clasificación taxonómica
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pb-6">
                  <PromptEditorField
                    label="Prompt de sistema para clasificación taxonómica"
                    description="Reglas para asignar etiquetas de categoría y subtópico en la taxonomía."
                    value={draft.ingestion_taxonomy_classification_system_prompt}
                    onChange={(value) =>
                      handleFieldChange('ingestion_taxonomy_classification_system_prompt', value)
                    }
                    rows={18}
                    className={LARGE_TEXTAREA_CLASSNAME}
                  />
                  <PromptEditorField
                    label="Plantilla de usuario para clasificación taxonómica"
                    description="Incluye taxonomía, límites de etiquetas y datos refinados para clasificar. Se muestra bloqueada para edición."
                    value={draft.ingestion_taxonomy_classification_user_prompt_template}
                    readOnly
                    rows={18}
                    className={LARGE_TEXTAREA_CLASSNAME}
                    footer={
                      <TemplatePlaceholders
                        template={draft.ingestion_taxonomy_classification_user_prompt_template}
                        requiredKeys={
                          REQUIRED_PLACEHOLDERS.ingestion_taxonomy_classification_user_prompt_template
                        }
                      />
                    }
                  />
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}

          <div className="flex flex-wrap justify-end gap-2 border-t pt-4">
            <Button variant="outline" onClick={handleRestore} disabled={!isDirty || isSaving || isLoading}>
              Restaurar valores cargados
            </Button>
            <Button onClick={handleSave} disabled={!isDirty || isSaving || isLoading}>
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Guardar cambios
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/70">
        <CardHeader>
          <CardTitle className="text-base">Navegación rápida</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/generador/configuracion/generacion">
              <Settings2 className="mr-2 h-4 w-4" />
              Ir a generación
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/generador/configuracion/taxonomia">
              <Settings2 className="mr-2 h-4 w-4" />
              Ir a taxonomía
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
