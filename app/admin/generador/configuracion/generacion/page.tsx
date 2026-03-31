'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  GENERATION_DIFFICULTY_KEYS,
  GenerationConfigPatchRequest,
  GenerationConfigResponse,
  GenerationDifficultyKey,
  getGenerationConfig,
  patchGenerationConfig,
} from '@/lib/prompt-generation.api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ArrowLeft, Loader2, Plus, Save, Settings2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { PromptEditorField } from '../_components/prompt-editor-field';
import {
  decodeEscapedSequences,
  DIFFICULTY_PROMPT_FIELD_MAP,
  getConfigErrorMessage,
  hasRemovedGenerationPlaceholder,
  LARGE_TEXTAREA_CLASSNAME,
  MAX_TERMS_PER_LIST,
  normalizeGenerationTemplate,
  normalizeName,
  REQUIRED_PLACEHOLDERS,
  validateTemplatePlaceholders,
} from '../_lib/common';

type GenerationDraft = {
  general_prompt: string;
  facil_prompt: string;
  medio_prompt: string;
  dificil_prompt: string;
  generation_user_prompt_template: string;
  generation_difficulty_semantic_instructions: Record<string, string>;
  generation_output_rules_template: string[];
};

const EMPTY_DRAFT: GenerationDraft = {
  general_prompt: '',
  facil_prompt: '',
  medio_prompt: '',
  dificil_prompt: '',
  generation_user_prompt_template: '',
  generation_difficulty_semantic_instructions: GENERATION_DIFFICULTY_KEYS.reduce<Record<string, string>>((acc, key) => {
    acc[key] = '';
    return acc;
  }, {}),
  generation_output_rules_template: [],
};

function cloneDraftFromConfig(config: GenerationConfigResponse): GenerationDraft {
  return {
    general_prompt: decodeEscapedSequences(config.general_prompt),
    facil_prompt: decodeEscapedSequences(config.facil_prompt),
    medio_prompt: decodeEscapedSequences(config.medio_prompt),
    dificil_prompt: decodeEscapedSequences(config.dificil_prompt),
    generation_user_prompt_template: normalizeGenerationTemplate(
      decodeEscapedSequences(config.generation_user_prompt_template)
    ),
    generation_difficulty_semantic_instructions: GENERATION_DIFFICULTY_KEYS.reduce<Record<string, string>>((acc, key) => {
      acc[key] = decodeEscapedSequences(
        config.generation_difficulty_semantic_instructions[key] || ''
      );
      return acc;
    }, {}),
    generation_output_rules_template: config.generation_output_rules_template.map((item) =>
      decodeEscapedSequences(item)
    ),
  };
}

type ListEditorProps = {
  label: string;
  items: string[];
  placeholder: string;
  inputValue: string;
  onInputChange: (value: string) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
  maxItems?: number;
};

function ListEditor({
  label,
  items,
  placeholder,
  inputValue,
  onInputChange,
  onAdd,
  onRemove,
  maxItems = MAX_TERMS_PER_LIST,
}: ListEditorProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <Label>{label}</Label>
        <span className="text-xs text-muted-foreground">
          {items.length}/{maxItems}
        </span>
      </div>

      <div className="flex gap-2">
        <Input
          value={inputValue}
          onChange={(event) => onInputChange(event.target.value)}
          placeholder={placeholder}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              onAdd();
            }
          }}
        />
        <Button type="button" variant="outline" onClick={onAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Agregar
        </Button>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sin elementos.</p>
      ) : (
        <div className="rounded-md border">
          {items.map((item, index) => (
            <div key={`${item}-${index}`} className="flex items-start justify-between gap-3 border-b p-3 last:border-b-0">
              <p className="text-sm whitespace-pre-wrap break-words">{item}</p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onRemove(index)}
                className="text-red-600 hover:text-red-700 dark:text-red-300"
              >
                <Trash2 className="mr-1 h-4 w-4" />
                Quitar
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TemplatePlaceholders({ template }: { template: string }) {
  const missing = validateTemplatePlaceholders(
    template,
    REQUIRED_PLACEHOLDERS.generation_user_prompt_template
  );

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {REQUIRED_PLACEHOLDERS.generation_user_prompt_template.map((key) => (
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

export default function ConfiguracionGeneracionPage() {
  const [config, setConfig] = useState<GenerationConfigResponse | null>(null);
  const [draft, setDraft] = useState<GenerationDraft>(EMPTY_DRAFT);
  const [selectedDifficulty, setSelectedDifficulty] = useState<GenerationDifficultyKey>('Fácil');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [outputRuleInput, setOutputRuleInput] = useState('');

  const selectedDifficultyPromptField = DIFFICULTY_PROMPT_FIELD_MAP[selectedDifficulty];

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

  const handlePromptChange = (
    field:
      | 'general_prompt'
      | 'facil_prompt'
      | 'medio_prompt'
      | 'dificil_prompt'
      | 'generation_user_prompt_template',
    value: string
  ) => {
    setDraft((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleDifficultyInstructionChange = (difficulty: GenerationDifficultyKey, value: string) => {
    setDraft((prev) => ({
      ...prev,
      generation_difficulty_semantic_instructions: {
        ...prev.generation_difficulty_semantic_instructions,
        [difficulty]: value,
      },
    }));
  };

  const handleAddOutputRule = () => {
    const candidate = outputRuleInput.trim();
    if (!candidate) return;

    const exists = draft.generation_output_rules_template.some(
      (rule) => normalizeName(rule) === normalizeName(candidate)
    );
    if (exists) {
      toast.error('La regla ya existe en la lista');
      return;
    }

    if (draft.generation_output_rules_template.length >= MAX_TERMS_PER_LIST) {
      toast.error(`Límite alcanzado (${MAX_TERMS_PER_LIST}) para reglas de salida`);
      return;
    }

    setDraft((prev) => ({
      ...prev,
      generation_output_rules_template: [...prev.generation_output_rules_template, candidate],
    }));
    setOutputRuleInput('');
  };

  const handleRemoveOutputRule = (index: number) => {
    setDraft((prev) => ({
      ...prev,
      generation_output_rules_template: prev.generation_output_rules_template.filter((_, idx) => idx !== index),
    }));
  };

  const handleRestore = () => {
    if (!config) return;
    setDraft(cloneDraftFromConfig(config));
    setOutputRuleInput('');
    toast.success('Cambios descartados');
  };

  const handleSave = async () => {
    const normalizedTemplate = normalizeGenerationTemplate(draft.generation_user_prompt_template.trim());

    if (hasRemovedGenerationPlaceholder(normalizedTemplate)) {
      toast.error('{variation_matrix_block} ya no existe en el backend y debe eliminarse del template.');
      return;
    }

    const payload: GenerationConfigPatchRequest = {
      general_prompt: draft.general_prompt.trim(),
      facil_prompt: draft.facil_prompt.trim(),
      medio_prompt: draft.medio_prompt.trim(),
      dificil_prompt: draft.dificil_prompt.trim(),
      generation_user_prompt_template: normalizedTemplate,
      generation_difficulty_semantic_instructions: GENERATION_DIFFICULTY_KEYS.reduce<Record<string, string>>((acc, key) => {
        acc[key] = draft.generation_difficulty_semantic_instructions[key]?.trim() || '';
        return acc;
      }, {}),
      generation_output_rules_template: draft.generation_output_rules_template
        .map((item) => item.trim())
        .filter((item) => Boolean(item)),
    };

    try {
      setIsSaving(true);
      const updated = await patchGenerationConfig(payload);
      setConfig(updated);
      setDraft(cloneDraftFromConfig(updated));
      toast.success('Configuración de generación actualizada');
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
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Configuración de la generación</h1>
          <p className="text-muted-foreground">Prompts y reglas del módulo de generación.</p>
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
          <CardDescription>Ajusta únicamente las variables de generación.</CardDescription>
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
              <AccordionItem value="generation-prompts" className="px-4">
                <AccordionTrigger className="text-base hover:no-underline">Prompts de generación</AccordionTrigger>
                <AccordionContent className="space-y-5 pb-6">
                  <PromptEditorField
                    label="Prompt general de generación"
                    description="Contexto base que se aplica a todas las preguntas generadas."
                    value={draft.general_prompt}
                    onChange={(value) => handlePromptChange('general_prompt', value)}
                    rows={18}
                    className={LARGE_TEXTAREA_CLASSNAME}
                  />

                  <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
                    <div className="space-y-3 rounded-lg border bg-muted/20 p-4">
                      <Label>Dificultad visible</Label>
                      <p className="text-xs text-muted-foreground">
                        Selecciona qué prompt específico quieres editar.
                      </p>
                      <div className="grid gap-2">
                        {GENERATION_DIFFICULTY_KEYS.map((difficulty) => {
                          const field = DIFFICULTY_PROMPT_FIELD_MAP[difficulty];
                          const count = draft[field].length;
                          return (
                            <Button
                              key={difficulty}
                              type="button"
                              variant={difficulty === selectedDifficulty ? 'default' : 'outline'}
                              onClick={() => setSelectedDifficulty(difficulty)}
                              className="justify-between"
                            >
                              <span>{difficulty}</span>
                              <span className="text-xs opacity-80">{count} chars</span>
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                    <PromptEditorField
                      label={`Prompt para dificultad ${selectedDifficulty}`}
                      description="Instrucciones específicas para esta dificultad."
                      value={draft[selectedDifficultyPromptField]}
                      onChange={(value) => handlePromptChange(selectedDifficultyPromptField, value)}
                      rows={18}
                      className={LARGE_TEXTAREA_CLASSNAME}
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="generation-template" className="px-4">
                <AccordionTrigger className="text-base hover:no-underline">Template de generación</AccordionTrigger>
                <AccordionContent className="pb-6">
                  <PromptEditorField
                    label="Plantilla de usuario para generación"
                    description="Plantilla principal que combina dificultad, contexto, plan semántico, reglas de salida e historial a evitar. Se muestra bloqueada para evitar ediciones accidentales."
                    value={draft.generation_user_prompt_template}
                    readOnly
                    rows={20}
                    className={LARGE_TEXTAREA_CLASSNAME}
                    footer={<TemplatePlaceholders template={draft.generation_user_prompt_template} />}
                  />
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="generation-strategy" className="px-4">
                <AccordionTrigger className="text-base hover:no-underline">
                  Instrucciones semánticas
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pb-6">
                  <p className="text-sm text-muted-foreground">
                    La variedad del lote depende del prompt por dificultad, del plan semántico por pregunta,
                    de las reglas de salida y del historial que se evita repetir.
                  </p>
                  <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
                    <div className="space-y-3 rounded-lg border bg-muted/20 p-4">
                      <Label>Dificultad para ajustes</Label>
                      <p className="text-xs text-muted-foreground">
                        Cambia la dificultad para editar su instrucción semántica.
                      </p>
                      <div className="grid gap-2">
                        {GENERATION_DIFFICULTY_KEYS.map((difficulty) => (
                          <Button
                            key={`${difficulty}-strategy`}
                            type="button"
                            variant={difficulty === selectedDifficulty ? 'default' : 'outline'}
                            onClick={() => setSelectedDifficulty(difficulty)}
                            className="justify-start"
                          >
                            {difficulty}
                          </Button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2 rounded-lg border p-4">
                      <Label>{`Instrucción semántica (${selectedDifficulty})`}</Label>
                      <p className="text-xs text-muted-foreground">
                        Describe el nivel cognitivo esperado para esta dificultad.
                      </p>
                      <Textarea
                        value={draft.generation_difficulty_semantic_instructions[selectedDifficulty] || ''}
                        onChange={(event) =>
                          handleDifficultyInstructionChange(selectedDifficulty, event.target.value)
                        }
                        rows={14}
                        className={LARGE_TEXTAREA_CLASSNAME}
                      />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="generation-output" className="px-4">
                <AccordionTrigger className="text-base hover:no-underline">Reglas de salida</AccordionTrigger>
                <AccordionContent className="pb-6">
                  <p className="mb-3 text-xs text-muted-foreground">
                    Lista de reglas globales que la salida debe cumplir siempre.
                  </p>
                  <ListEditor
                    label="Reglas de salida"
                    items={draft.generation_output_rules_template}
                    placeholder="Agregar regla de salida"
                    inputValue={outputRuleInput}
                    onInputChange={setOutputRuleInput}
                    onAdd={handleAddOutputRule}
                    onRemove={handleRemoveOutputRule}
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
    </div>
  );
}
