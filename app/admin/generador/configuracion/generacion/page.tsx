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
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ArrowLeft, Loader2, Save, Settings2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  decodeEscapedSequences,
  getConfigErrorMessage,
  LARGE_TEXTAREA_CLASSNAME,
  REQUIRED_PLACEHOLDERS,
  validateTemplatePlaceholders,
} from '../_lib/common';

type PromptModalKey = 'stem' | 'distractor' | 'judge' | null;
const LARGE_MODAL_CLASSNAME =
  'max-h-[92vh] !w-[96vw] !max-w-[1800px] sm:!max-w-[1800px] overflow-y-auto p-6 sm:p-8';

type GenerationPromptDraft = {
  generation_stem_system_prompt: string;
  generation_stem_user_prompt_template: string;
  generation_distractor_system_prompt: string;
  generation_distractor_user_prompt_template: string;
  generation_judge_system_prompt: string;
  generation_judge_user_prompt_template: string;
};

const EMPTY_DRAFT: GenerationPromptDraft = {
  generation_stem_system_prompt: '',
  generation_stem_user_prompt_template: '',
  generation_distractor_system_prompt: '',
  generation_distractor_user_prompt_template: '',
  generation_judge_system_prompt: '',
  generation_judge_user_prompt_template: '',
};

function clonePromptDraftFromConfig(config: GenerationConfigResponse): GenerationPromptDraft {
  return {
    generation_stem_system_prompt: decodeEscapedSequences(config.generation_stem_system_prompt),
    generation_stem_user_prompt_template: decodeEscapedSequences(config.generation_stem_user_prompt_template),
    generation_distractor_system_prompt: decodeEscapedSequences(config.generation_distractor_system_prompt),
    generation_distractor_user_prompt_template: decodeEscapedSequences(config.generation_distractor_user_prompt_template),
    generation_judge_system_prompt: decodeEscapedSequences(config.generation_judge_system_prompt),
    generation_judge_user_prompt_template: decodeEscapedSequences(config.generation_judge_user_prompt_template),
  };
}

function PromptFieldCard({
  title,
  variable,
  description,
  value,
  onChange,
  placeholderKey,
}: {
  title: string;
  variable: string;
  description: string;
  value: string;
  onChange: (value: string) => void;
  placeholderKey?: keyof typeof REQUIRED_PLACEHOLDERS;
}) {
  const missing = placeholderKey
    ? validateTemplatePlaceholders(value, REQUIRED_PLACEHOLDERS[placeholderKey])
    : [];

  return (
    <div className="space-y-3 rounded-lg border bg-card/50 p-4">
      <div className="space-y-1">
        <p className="text-sm font-semibold">
          {title} <span className="text-muted-foreground">({variable})</span>
        </p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={10}
        className={LARGE_TEXTAREA_CLASSNAME}
      />
      {placeholderKey ? (
        <p className="text-xs text-muted-foreground">
          {missing.length === 0
            ? 'Placeholders completos.'
            : `Faltan placeholders: ${missing.map((item) => `{${item}}`).join(', ')}`}
        </p>
      ) : null}
    </div>
  );
}

function StageRow({
  title,
  description,
  variables,
  onEdit,
}: {
  title: string;
  description: string;
  variables: string[];
  onEdit: () => void;
}) {
  return (
    <div className="grid gap-3 rounded-lg border p-4 md:grid-cols-[220px_1fr_auto] md:items-center">
      <div className="space-y-1">
        <p className="font-semibold">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {variables.map((item) => (
          <Badge key={item} variant="outline">
            {item}
          </Badge>
        ))}
      </div>
      <Button onClick={onEdit}>Editar</Button>
    </div>
  );
}

export default function ConfiguracionGeneracionPage() {
  const [config, setConfig] = useState<GenerationConfigResponse | null>(null);
  const [draft, setDraft] = useState<GenerationPromptDraft>(EMPTY_DRAFT);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [promptModal, setPromptModal] = useState<PromptModalKey>(null);

  const isDirty = useMemo(() => {
    if (!config) return false;
    return JSON.stringify(clonePromptDraftFromConfig(config)) !== JSON.stringify(draft);
  }, [config, draft]);

  const loadConfig = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await getGenerationConfig();
      setConfig(response);
      setDraft(clonePromptDraftFromConfig(response));
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
    setDraft(clonePromptDraftFromConfig(config));
    toast.success('Cambios descartados');
  };

  const handleSave = async () => {
    const requiredPromptFields: Array<{ label: string; value: string }> = [
      { label: 'generation_stem_system_prompt', value: draft.generation_stem_system_prompt },
      { label: 'generation_stem_user_prompt_template', value: draft.generation_stem_user_prompt_template },
      { label: 'generation_distractor_system_prompt', value: draft.generation_distractor_system_prompt },
      { label: 'generation_distractor_user_prompt_template', value: draft.generation_distractor_user_prompt_template },
      { label: 'generation_judge_system_prompt', value: draft.generation_judge_system_prompt },
      { label: 'generation_judge_user_prompt_template', value: draft.generation_judge_user_prompt_template },
    ];

    const emptyField = requiredPromptFields.find((field) => field.value.trim().length === 0);
    if (emptyField) {
      toast.error(`El campo ${emptyField.label} no puede estar vacío.`);
      return;
    }

    const templateChecks: Array<{
      key: keyof typeof REQUIRED_PLACEHOLDERS;
      label: string;
      value: string;
    }> = [
      {
        key: 'generation_stem_user_prompt_template',
        label: 'generation_stem_user_prompt_template',
        value: draft.generation_stem_user_prompt_template,
      },
      {
        key: 'generation_distractor_user_prompt_template',
        label: 'generation_distractor_user_prompt_template',
        value: draft.generation_distractor_user_prompt_template,
      },
      {
        key: 'generation_judge_user_prompt_template',
        label: 'generation_judge_user_prompt_template',
        value: draft.generation_judge_user_prompt_template,
      },
    ];

    for (const check of templateChecks) {
      const missing = validateTemplatePlaceholders(check.value, REQUIRED_PLACEHOLDERS[check.key]);
      if (missing.length > 0) {
        toast.error(`Faltan placeholders en ${check.label}: ${missing.map((item) => `{${item}}`).join(', ')}`);
        return;
      }
    }

    const payload: GenerationConfigPatchRequest = {
      generation_stem_system_prompt: draft.generation_stem_system_prompt.trim(),
      generation_stem_user_prompt_template: draft.generation_stem_user_prompt_template.trim(),
      generation_distractor_system_prompt: draft.generation_distractor_system_prompt.trim(),
      generation_distractor_user_prompt_template: draft.generation_distractor_user_prompt_template.trim(),
      generation_judge_system_prompt: draft.generation_judge_system_prompt.trim(),
      generation_judge_user_prompt_template: draft.generation_judge_user_prompt_template.trim(),
    };

    try {
      setIsSaving(true);
      const updated = await patchGenerationConfig(payload);
      setConfig(updated);
      setDraft(clonePromptDraftFromConfig(updated));
      toast.success('Prompts de generación actualizados');
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
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Prompts de generación</h1>
          <p className="text-muted-foreground">Etapas del flujo en filas con edición por modal.</p>
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
          <CardTitle>Etapas de prompts</CardTitle>
          <CardDescription>Cada etapa se edita en su modal dedicado.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
              Cargando configuración...
            </div>
          ) : (
            <>
              <StageRow
                title="Etapa Stem"
                description="Genera enunciado y respuesta correcta."
                variables={['generation_stem_system_prompt', 'generation_stem_user_prompt_template']}
                onEdit={() => setPromptModal('stem')}
              />
              <StageRow
                title="Etapa Distractores"
                description="Genera alternativas incorrectas plausibles."
                variables={['generation_distractor_system_prompt', 'generation_distractor_user_prompt_template']}
                onEdit={() => setPromptModal('distractor')}
              />
              <StageRow
                title="Etapa Judge"
                description="Evalúa calidad y consistencia de alternativas."
                variables={['generation_judge_system_prompt', 'generation_judge_user_prompt_template']}
                onEdit={() => setPromptModal('judge')}
              />
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

      <Card className="border-border/70">
        <CardHeader>
          <CardTitle className="text-base">Navegación rápida</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/generador/configuracion/modelos-pipeline">
              <Settings2 className="mr-2 h-4 w-4" />
              Modelos y pipeline
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/generador/configuracion/ingesta">
              <Settings2 className="mr-2 h-4 w-4" />
              Ir a ingesta
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

      <Dialog open={promptModal === 'stem'} onOpenChange={(open) => setPromptModal(open ? 'stem' : null)}>
        <DialogContent className={LARGE_MODAL_CLASSNAME}>
          <DialogHeader>
            <DialogTitle>Editar Etapa Stem</DialogTitle>
            <DialogDescription>Generación de enunciado + respuesta correcta.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <PromptFieldCard
              title="Prompt de sistema de stem"
              variable="generation_stem_system_prompt"
              description="Instrucciones de sistema para la etapa stem."
              value={draft.generation_stem_system_prompt}
              onChange={(value) => setDraft((prev) => ({ ...prev, generation_stem_system_prompt: value }))}
            />
            <PromptFieldCard
              title="Template de usuario de stem"
              variable="generation_stem_user_prompt_template"
              description="Plantilla de usuario para contexto de generación en etapa stem."
              value={draft.generation_stem_user_prompt_template}
              onChange={(value) => setDraft((prev) => ({ ...prev, generation_stem_user_prompt_template: value }))}
              placeholderKey="generation_stem_user_prompt_template"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPromptModal(null)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={promptModal === 'distractor'} onOpenChange={(open) => setPromptModal(open ? 'distractor' : null)}>
        <DialogContent className={LARGE_MODAL_CLASSNAME}>
          <DialogHeader>
            <DialogTitle>Editar Etapa Distractores</DialogTitle>
            <DialogDescription>Generación de alternativas incorrectas plausibles.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <PromptFieldCard
              title="Prompt de sistema de distractores"
              variable="generation_distractor_system_prompt"
              description="Instrucciones de sistema para distractores."
              value={draft.generation_distractor_system_prompt}
              onChange={(value) => setDraft((prev) => ({ ...prev, generation_distractor_system_prompt: value }))}
            />
            <PromptFieldCard
              title="Template de usuario de distractores"
              variable="generation_distractor_user_prompt_template"
              description="Plantilla con pregunta, respuesta correcta y contexto semántico."
              value={draft.generation_distractor_user_prompt_template}
              onChange={(value) =>
                setDraft((prev) => ({ ...prev, generation_distractor_user_prompt_template: value }))
              }
              placeholderKey="generation_distractor_user_prompt_template"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPromptModal(null)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={promptModal === 'judge'} onOpenChange={(open) => setPromptModal(open ? 'judge' : null)}>
        <DialogContent className={LARGE_MODAL_CLASSNAME}>
          <DialogHeader>
            <DialogTitle>Editar Etapa Judge</DialogTitle>
            <DialogDescription>Evaluación final de calidad de alternativas.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <PromptFieldCard
              title="Prompt de sistema de judge"
              variable="generation_judge_system_prompt"
              description="Instrucciones de sistema para evaluación de calidad."
              value={draft.generation_judge_system_prompt}
              onChange={(value) => setDraft((prev) => ({ ...prev, generation_judge_system_prompt: value }))}
            />
            <PromptFieldCard
              title="Template de usuario de judge"
              variable="generation_judge_user_prompt_template"
              description="Plantilla con pregunta y alternativas para scoring."
              value={draft.generation_judge_user_prompt_template}
              onChange={(value) => setDraft((prev) => ({ ...prev, generation_judge_user_prompt_template: value }))}
              placeholderKey="generation_judge_user_prompt_template"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPromptModal(null)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
