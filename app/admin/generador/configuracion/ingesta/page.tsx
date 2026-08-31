'use client';

import {
  GenerationConfigPatchRequest,
  GenerationConfigResponse,
} from '@/lib/config.api';
import { useConfigSection } from '@/hooks/useConfigSection';
import { usePromptPlaceholders } from '@/hooks/usePromptPlaceholders';
import { GuardedLink } from '@/components/generation/GuardedLink';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ArrowLeft, Loader2, Save, Settings2 } from 'lucide-react';
import { toast } from 'sonner';
import { PromptEditorField } from '../_components/prompt-editor-field';
import { decodeEscapedSequences, LARGE_TEXTAREA_CLASSNAME, validateTemplatePlaceholders } from '../_lib/common';

type IngestionDraft = {
  ingestion_extraction_system_prompt: string;
  ingestion_extraction_user_prompt_template: string;
  ingestion_refinement_system_prompt: string;
  ingestion_refinement_user_prompt_template: string;
  ingestion_taxonomy_classification_system_prompt: string;
  ingestion_taxonomy_classification_user_prompt_template: string;
};

function cloneDraftFromConfig(config: GenerationConfigResponse): IngestionDraft {
  return {
    ingestion_extraction_system_prompt: decodeEscapedSequences(config.ingestion_extraction_system_prompt),
    ingestion_extraction_user_prompt_template: decodeEscapedSequences(config.ingestion_extraction_user_prompt_template),
    ingestion_refinement_system_prompt: decodeEscapedSequences(config.ingestion_refinement_system_prompt),
    ingestion_refinement_user_prompt_template: decodeEscapedSequences(config.ingestion_refinement_user_prompt_template),
    ingestion_taxonomy_classification_system_prompt: decodeEscapedSequences(
      config.ingestion_taxonomy_classification_system_prompt
    ),
    ingestion_taxonomy_classification_user_prompt_template: decodeEscapedSequences(
      config.ingestion_taxonomy_classification_user_prompt_template
    ),
  };
}

function buildPatch(draft: IngestionDraft, config: GenerationConfigResponse): GenerationConfigPatchRequest {
  const original = cloneDraftFromConfig(config);
  const patch: GenerationConfigPatchRequest = {};
  (Object.keys(draft) as (keyof IngestionDraft)[]).forEach((key) => {
    const trimmed = draft[key].trim();
    if (trimmed !== original[key].trim()) {
      patch[key] = trimmed;
    }
  });
  return patch;
}

function TemplatePlaceholders({ template, requiredKeys }: { template: string; requiredKeys: string[] }) {
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
        {missing.length === 0 ? 'Placeholders completos.' : `Faltan: ${missing.map((key) => `{${key}}`).join(', ')}`}
      </p>
    </div>
  );
}

export default function ConfiguracionIngestaPage() {
  const { config, draft, setDraft, isLoading, isSaving, isDirty, restore, save } = useConfigSection(
    cloneDraftFromConfig,
    buildPatch
  );
  const { placeholders } = usePromptPlaceholders();

  const handleFieldChange = (field: keyof IngestionDraft, value: string) => {
    setDraft((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const handleSave = async () => {
    if (!draft) return;

    const requiredPromptFields: Array<{ label: string; value: string }> = [
      { label: 'ingestion_extraction_system_prompt', value: draft.ingestion_extraction_system_prompt },
      { label: 'ingestion_extraction_user_prompt_template', value: draft.ingestion_extraction_user_prompt_template },
      { label: 'ingestion_refinement_system_prompt', value: draft.ingestion_refinement_system_prompt },
      { label: 'ingestion_refinement_user_prompt_template', value: draft.ingestion_refinement_user_prompt_template },
      {
        label: 'ingestion_taxonomy_classification_system_prompt',
        value: draft.ingestion_taxonomy_classification_system_prompt,
      },
      {
        label: 'ingestion_taxonomy_classification_user_prompt_template',
        value: draft.ingestion_taxonomy_classification_user_prompt_template,
      },
    ];

    const emptyField = requiredPromptFields.find((field) => field.value.trim().length === 0);
    if (emptyField) {
      toast.error(`El campo ${emptyField.label} no puede estar vacío.`);
      return;
    }

    const templateChecks: Array<{ path: string; label: string; value: string }> = [
      { path: 'ingestion.extraction_user_prompt_template', label: 'ingestion_extraction_user_prompt_template', value: draft.ingestion_extraction_user_prompt_template },
      { path: 'ingestion.refinement_user_prompt_template', label: 'ingestion_refinement_user_prompt_template', value: draft.ingestion_refinement_user_prompt_template },
      { path: 'ingestion.taxonomy_classification_user_prompt_template', label: 'ingestion_taxonomy_classification_user_prompt_template', value: draft.ingestion_taxonomy_classification_user_prompt_template },
    ];

    for (const check of templateChecks) {
      const required = placeholders[check.path];
      if (!required) continue;
      const missing = validateTemplatePlaceholders(check.value, required);
      if (missing.length > 0) {
        toast.error(`Faltan placeholders en ${check.label}: ${missing.map((key) => `{${key}}`).join(', ')}`);
        return;
      }
    }

    await save();
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
            <Badge variant="outline">Última actualización: {new Date(config.updated_at).toLocaleString('es-CL')}</Badge>
          )}
          <Button asChild variant="outline">
            <GuardedLink href="/admin/generador/configuracion" isDirty={isDirty}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a configuración
            </GuardedLink>
          </Button>
        </div>
      </div>

      <Card className="border-border/70">
        <CardHeader>
          <CardTitle>Editor de configuración</CardTitle>
          <CardDescription>Ajusta únicamente variables de ingesta.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoading || !draft ? (
            <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
              Cargando configuración...
            </div>
          ) : (
            <Accordion type="multiple" className="rounded-lg border">
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
                    description="Estructura del mensaje con variables como archivo y bloque de texto."
                    value={draft.ingestion_extraction_user_prompt_template}
                    onChange={(value) => handleFieldChange('ingestion_extraction_user_prompt_template', value)}
                    rows={18}
                    className={LARGE_TEXTAREA_CLASSNAME}
                    footer={
                      placeholders['ingestion.extraction_user_prompt_template'] ? (
                        <TemplatePlaceholders
                          template={draft.ingestion_extraction_user_prompt_template}
                          requiredKeys={placeholders['ingestion.extraction_user_prompt_template']}
                        />
                      ) : null
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
                    description="Mensaje con estructuras JSON de entrada para aplicar refinamiento."
                    value={draft.ingestion_refinement_user_prompt_template}
                    onChange={(value) => handleFieldChange('ingestion_refinement_user_prompt_template', value)}
                    rows={18}
                    className={LARGE_TEXTAREA_CLASSNAME}
                    footer={
                      placeholders['ingestion.refinement_user_prompt_template'] ? (
                        <TemplatePlaceholders
                          template={draft.ingestion_refinement_user_prompt_template}
                          requiredKeys={placeholders['ingestion.refinement_user_prompt_template']}
                        />
                      ) : null
                    }
                  />
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="ingestion-classification" className="px-4">
                <AccordionTrigger className="text-base hover:no-underline">Clasificación taxonómica</AccordionTrigger>
                <AccordionContent className="space-y-4 pb-6">
                  <PromptEditorField
                    label="Prompt de sistema para clasificación taxonómica"
                    description="Reglas para asignar etiquetas de categoría y subtópico en la taxonomía."
                    value={draft.ingestion_taxonomy_classification_system_prompt}
                    onChange={(value) => handleFieldChange('ingestion_taxonomy_classification_system_prompt', value)}
                    rows={18}
                    className={LARGE_TEXTAREA_CLASSNAME}
                  />
                  <PromptEditorField
                    label="Plantilla de usuario para clasificación taxonómica"
                    description="Incluye taxonomía, límites de etiquetas y datos refinados para clasificar."
                    value={draft.ingestion_taxonomy_classification_user_prompt_template}
                    onChange={(value) =>
                      handleFieldChange('ingestion_taxonomy_classification_user_prompt_template', value)
                    }
                    rows={18}
                    className={LARGE_TEXTAREA_CLASSNAME}
                    footer={
                      placeholders['ingestion.taxonomy_classification_user_prompt_template'] ? (
                        <TemplatePlaceholders
                          template={draft.ingestion_taxonomy_classification_user_prompt_template}
                          requiredKeys={placeholders['ingestion.taxonomy_classification_user_prompt_template']}
                        />
                      ) : null
                    }
                  />
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}

          <div className="flex flex-wrap justify-end gap-2 border-t pt-4">
            <Button variant="outline" onClick={restore} disabled={!isDirty || isSaving || isLoading}>
              Restaurar valores cargados
            </Button>
            <Button onClick={handleSave} disabled={!isDirty || isSaving || isLoading}>
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
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
            <GuardedLink href="/admin/generador/configuracion/generacion" isDirty={isDirty}>
              <Settings2 className="mr-2 h-4 w-4" />
              Ir a generación
            </GuardedLink>
          </Button>
          <Button asChild variant="outline" size="sm">
            <GuardedLink href="/admin/generador/configuracion/taxonomia" isDirty={isDirty}>
              <Settings2 className="mr-2 h-4 w-4" />
              Ir a taxonomía
            </GuardedLink>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
