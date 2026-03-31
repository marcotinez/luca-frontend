'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Difficulty } from '@/types';
import {
  getGenerationConfig,
  getGenerationJob,
  GenerationConfigResponse,
  GenerationJobState,
  GenerationQuestionRequest,
  GenerationQuestionResponse,
  startGenerationJob,
} from '@/lib/prompt-generation.api';
import { addOpenAILog } from '@/lib/openai-logs.storage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Loader2, Settings2, Sparkles, RotateCcw, BrainCircuit, FileText, WandSparkles } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import { cn } from '@/lib/utils';

const QUESTION_COUNT_OPTIONS = ['1', '5', '10', '15', '20'];
const SEMANTIC_LIMIT_OPTIONS = ['5', '10', '15', '20'];
const GENERATOR_STATE_STORAGE_KEY = 'admin_generador_state_v1';
const MODEL_OPTIONS = ['gpt-5.4-nano', 'gpt-5-nano', 'gpt-5-mini', 'o4-mini'] as const;
const JOB_POLL_INTERVAL_MS = 800;
const STAGE_LABELS: Record<string, string> = {
  queued: 'En cola',
  starting: 'Iniciando',
  semantic_search: 'Buscando contexto semántico',
  semantic_search_done: 'Contexto listo',
  prompt_ready: 'Preparando instrucciones',
  llm_attempt_1: 'Generando preguntas (intento 1)',
  llm_attempt_2: 'Reintentando por calidad (intento 2)',
  llm_attempt_3: 'Último intento de generación',
  validation_passed: 'Validación superada',
  saving_questions: 'Guardando preguntas',
  completed: 'Completado',
  failed: 'Error',
};
const FIXED_OUTPUT_SCHEMA: Record<string, unknown> = {
  type: 'object',
  additionalProperties: false,
  properties: {
    questions: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          question: { type: 'string' },
          alternatives: {
            type: 'array',
            minItems: 4,
            maxItems: 4,
            items: {
              type: 'object',
              additionalProperties: false,
              properties: {
                text: { type: 'string' },
                is_correct: { type: 'boolean' },
                feedback: { type: 'string' },
              },
              required: ['text', 'is_correct', 'feedback'],
            },
          },
          pedagogic_metadata: {
            type: 'object',
            additionalProperties: false,
            properties: {
              rag_reference: { type: 'string' },
              complete_explanation: { type: 'string' },
            },
            required: ['rag_reference', 'complete_explanation'],
          },
        },
        required: ['question', 'alternatives', 'pedagogic_metadata'],
      },
    },
  },
  required: ['questions'],
};

function getErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const statusCode = error.response?.status;
    const backendMessage = error.response?.data?.detail || error.response?.data?.message;

    if (statusCode === 400 && backendMessage) {
      return backendMessage;
    }

    if (statusCode === 500) {
      return backendMessage || 'Error interno del flujo de generación. Verifica configuración de OpenAI y contacta soporte interno.';
    }

    return backendMessage || 'No se pudo generar la pregunta';
  }

  return 'No se pudo generar la pregunta';
}

function getStageLabel(stage: string | undefined) {
  if (!stage) return '';
  return STAGE_LABELS[stage] || stage;
}

function getDifficultyTone(difficulty: Difficulty) {
  if (difficulty === Difficulty.FACIL) {
    return 'border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700';
  }
  if (difficulty === Difficulty.MEDIO) {
    return 'border-amber-500 bg-amber-500 text-white hover:bg-amber-600';
  }
  return 'border-rose-600 bg-rose-600 text-white hover:bg-rose-700';
}

export default function GeneradorPreguntasPage() {
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.FACIL);
  const [userInput, setUserInput] = useState('');
  const [category, setCategory] = useState('');
  const [subtopic, setSubtopic] = useState('');
  const [questionCount, setQuestionCount] = useState(5);

  const [semanticLimit, setSemanticLimit] = useState(5);
  const [semanticDepth, setSemanticDepth] = useState<1 | 2>(1);
  const [model, setModel] = useState<string>('gpt-5.4-nano');

  const [job, setJob] = useState<GenerationJobState | null>(null);
  const [lastRequestPayload, setLastRequestPayload] = useState<GenerationQuestionRequest | null>(null);
  const [result, setResult] = useState<GenerationQuestionResponse | null>(null);
  const [hasHydratedState, setHasHydratedState] = useState(false);
  const [config, setConfig] = useState<GenerationConfigResponse | null>(null);
  const pollTimerRef = useRef<number | null>(null);

  const availableCategories = useMemo(() => config?.categories || [], [config]);
  const availableSubtopics = useMemo(() => {
    return category ? config?.subtopics?.[category] || [] : [];
  }, [category, config]);

  const canGenerate = useMemo(() => {
    if (!category || !subtopic) return false;
    if (!availableSubtopics.includes(subtopic)) return false;
    return userInput.trim().length > 0 && !!difficulty;
  }, [userInput, difficulty, category, subtopic, availableSubtopics]);

  const displayedGeneratedCount = result ? result.questions.length : 0;
  const isGenerating = job?.status === 'queued' || job?.status === 'running';
  const stopPolling = () => {
    if (pollTimerRef.current) {
      window.clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  };

  const loadGenerationConfig = useCallback(async () => {
    try {
      const response = await getGenerationConfig();
      setConfig(response);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }, []);

  const applyCompletedResult = (
    currentJob: GenerationJobState,
    requestPayload: GenerationQuestionRequest | null
  ) => {
    const completedResult = currentJob.result;
    if (completedResult?.questions) {
      setResult(completedResult);
      toast.success(`${completedResult.questions.length} pregunta(s) generada(s) y guardada(s) en revisión`);
      if (requestPayload) {
        addOpenAILog({ request: requestPayload, response: completedResult });
      }
    } else {
      toast.error('El job finalizó sin resultado de preguntas');
    }
  };

  const pollJob = async (jobId: string, requestPayload: GenerationQuestionRequest | null) => {
    try {
      const state = await getGenerationJob(jobId);
      setJob(state);

      if (state.status === 'completed') {
        stopPolling();
        applyCompletedResult(state, requestPayload);
      } else if (state.status === 'failed') {
        stopPolling();
        toast.error(state.error || state.message || 'La generación falló');
      }
    } catch {
      stopPolling();
      toast.error('No se pudo consultar el progreso del job');
    }
  };

  const startPolling = (jobId: string, requestPayload: GenerationQuestionRequest | null) => {
    stopPolling();
    pollTimerRef.current = window.setInterval(() => {
      void pollJob(jobId, requestPayload);
    }, JOB_POLL_INTERVAL_MS);
  };

  useEffect(() => {
    void loadGenerationConfig();
  }, [loadGenerationConfig]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const rawState = window.localStorage.getItem(GENERATOR_STATE_STORAGE_KEY);
      if (!rawState) {
        setHasHydratedState(true);
        return;
      }

      const parsedState = JSON.parse(rawState) as {
        difficulty?: Difficulty;
        userInput?: string;
        category?: string;
        subtopic?: string;
        questionCount?: number;
        semanticLimit?: number;
        semanticDepth?: 1 | 2;
        model?: string;
        job?: GenerationJobState | null;
        lastRequestPayload?: GenerationQuestionRequest | null;
        result?: GenerationQuestionResponse | null;
      };

      if (parsedState.difficulty) setDifficulty(parsedState.difficulty);
      if (typeof parsedState.userInput === 'string') setUserInput(parsedState.userInput);
      if (typeof parsedState.category === 'string') setCategory(parsedState.category);
      if (typeof parsedState.subtopic === 'string') setSubtopic(parsedState.subtopic);
      if (typeof parsedState.questionCount === 'number') setQuestionCount(parsedState.questionCount);
      if (typeof parsedState.semanticLimit === 'number') setSemanticLimit(parsedState.semanticLimit);
      if (parsedState.semanticDepth === 1 || parsedState.semanticDepth === 2) setSemanticDepth(parsedState.semanticDepth);
      if (typeof parsedState.model === 'string' && MODEL_OPTIONS.includes(parsedState.model as (typeof MODEL_OPTIONS)[number])) {
        setModel(parsedState.model);
      }
      if (parsedState.job) setJob(parsedState.job);
      if (parsedState.lastRequestPayload) setLastRequestPayload(parsedState.lastRequestPayload);
      if (parsedState.result) {
        setResult(parsedState.result);
      }
    } catch {
      window.localStorage.removeItem(GENERATOR_STATE_STORAGE_KEY);
    } finally {
      setHasHydratedState(true);
    }
  }, []);

  useEffect(() => {
    if (!hasHydratedState || !job) return;
    if (job.status === 'queued' || job.status === 'running') {
      startPolling(job.job_id, lastRequestPayload);
    }
  }, [hasHydratedState, job?.job_id, job?.status]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!hasHydratedState || typeof window === 'undefined') return;

    const persistedState = {
      difficulty,
      userInput,
      category,
      subtopic,
      questionCount,
      semanticLimit,
      semanticDepth,
      model,
      job,
      lastRequestPayload,
      result,
    };

    window.localStorage.setItem(GENERATOR_STATE_STORAGE_KEY, JSON.stringify(persistedState));
  }, [hasHydratedState, difficulty, userInput, category, subtopic, questionCount, semanticLimit, semanticDepth, model, job, lastRequestPayload, result]);

  useEffect(() => {
    if (availableCategories.length === 0) {
      if (category) setCategory('');
      if (subtopic) setSubtopic('');
      return;
    }

    if (!category || !availableCategories.includes(category)) {
      const firstCategory = availableCategories[0];
      setCategory(firstCategory);
      const firstSubtopic = (config?.subtopics?.[firstCategory] || [])[0] || '';
      setSubtopic(firstSubtopic);
      return;
    }

    const subtopicsForCategory = config?.subtopics?.[category] || [];
    if (!subtopic || !subtopicsForCategory.includes(subtopic)) {
      setSubtopic(subtopicsForCategory[0] || '');
    }
  }, [availableCategories, config, category, subtopic]);

  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, []);

  const handleGenerate = async () => {
    if (!canGenerate) {
      toast.error('Completa los campos antes de generar');
      return;
    }

    try {
      stopPolling();
      const requestPayload: GenerationQuestionRequest = {
        user_input: userInput.trim(),
        category,
        subtopic,
        difficulty,
        question_count: questionCount,
        semantic_limit: semanticLimit,
        semantic_depth: semanticDepth,
        model,
        output_schema: FIXED_OUTPUT_SCHEMA,
      };

      setLastRequestPayload(requestPayload);
      const createdJob = await startGenerationJob(requestPayload);
      setJob(createdJob);
      setResult(null);
      toast.success('Generación iniciada');

      if (createdJob.status === 'completed') {
        applyCompletedResult(createdJob, requestPayload);
      } else if (createdJob.status === 'failed') {
        toast.error(createdJob.error || createdJob.message || 'La generación falló al iniciar');
      } else {
        startPolling(createdJob.job_id, requestPayload);
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleClearGeneratorState = () => {
    stopPolling();
    setDifficulty(Difficulty.FACIL);
    setUserInput('');
    setCategory('');
    setSubtopic('');
    setQuestionCount(5);
    setSemanticLimit(5);
    setSemanticDepth(1);
    setModel('gpt-5.4-nano');
    setJob(null);
    setLastRequestPayload(null);
    setResult(null);

    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(GENERATOR_STATE_STORAGE_KEY);
    }

    toast.success('Estado de generación limpiado');
  };

  return (
    <div className="space-y-8 p-4 sm:p-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl flex items-center gap-3">
            <WandSparkles className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
            Generador de Preguntas
          </h1>
          <p className="text-muted-foreground mt-1">
            Redacta el contexto, ajusta la recuperación semántica y genera lotes para revisión admin.
          </p>
        </div>
        <div className="ml-auto flex w-full flex-col items-start gap-3 sm:w-auto sm:items-end">
          <Button asChild size="lg" className="shadow-sm">
            <Link href="/admin/generador/configuracion">
              <Settings2 className="w-4 h-4 mr-2" />
              Ir a configuraciones
            </Link>
          </Button>
          <div className="flex items-center gap-2 flex-wrap sm:justify-end">
            {config?.updated_at && (
              <Badge variant="outline">
                Config actualizada: {new Date(config.updated_at).toLocaleString('es-CL')}
              </Badge>
            )}
            {config?.taxonomy_version && (
              <Badge variant="outline">Taxonomía: {config.taxonomy_version}</Badge>
            )}
            {config && (
              <Badge variant="outline">
                Catálogo: {config.categories.length} categorías
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Contexto de generación
            </CardTitle>
            <CardDescription>
              Define tema, catálogo y nivel pedagógico desde una misma superficie.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Categoría</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="h-12 border-2">
                    <SelectValue placeholder="Selecciona categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCategories.map((categoryOption) => (
                      <SelectItem key={categoryOption} value={categoryOption}>
                        {categoryOption}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Subtópico</Label>
                <Select
                  value={subtopic}
                  onValueChange={setSubtopic}
                  disabled={!category || availableSubtopics.length === 0}
                >
                  <SelectTrigger className="h-12 border-2">
                    <SelectValue placeholder="Selecciona subtópico" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSubtopics.map((subtopicOption) => (
                      <SelectItem key={subtopicOption} value={subtopicOption}>
                        {subtopicOption}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3">
              <Label>Tema o contexto de la pregunta</Label>
              <Textarea
                value={userInput}
                onChange={(event) => setUserInput(event.target.value)}
                rows={9}
                placeholder="Ej: Quiero preguntas sobre presupuesto para estudiantes universitarios, enfocadas en decisiones cotidianas, errores frecuentes y análisis de alternativas."
                className="min-h-[240px] resize-y text-base leading-7"
              />
            </div>

            <div className="space-y-3">
              <Label>Dificultad</Label>
              <div className="flex flex-wrap gap-2">
                {[Difficulty.FACIL, Difficulty.MEDIO, Difficulty.DIFICIL].map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setDifficulty(level)}
                    className={cn(
                      'rounded-full border px-4 py-2 text-sm font-medium transition-colors',
                      difficulty === level
                        ? getDifficultyTone(level)
                        : 'border-border bg-background text-foreground hover:bg-muted'
                    )}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            {category && availableSubtopics.length === 0 && (
              <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
                La categoría seleccionada no tiene subtópicos. Agrega al menos uno en la configuración.
              </p>
            )}

          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <BrainCircuit className="w-5 h-5 text-primary" />
                Parámetros y ejecución
              </CardTitle>
              <CardDescription>
                Ajusta volumen, modelo y profundidad antes de generar.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-5">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Cantidad de preguntas</Label>
                  <Select
                    value={String(questionCount)}
                    onValueChange={(value) => setQuestionCount(Number(value))}
                  >
                    <SelectTrigger className="h-12 border-2">
                      <SelectValue placeholder="Selecciona cantidad" />
                    </SelectTrigger>
                    <SelectContent>
                      {QUESTION_COUNT_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Modelo de generación</Label>
                  <Select value={model} onValueChange={setModel}>
                    <SelectTrigger className="h-12 border-2">
                      <SelectValue placeholder="Selecciona modelo" />
                    </SelectTrigger>
                    <SelectContent>
                      {MODEL_OPTIONS.map((modelOption) => (
                        <SelectItem key={modelOption} value={modelOption}>
                          {modelOption}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="rounded-xl border bg-muted/20 p-4 space-y-4">
                <div>
                  <p className="text-sm font-medium">Resultados semánticos</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Número de coincidencias usadas para construir contexto.
                  </p>
                </div>
                <Select
                  value={String(semanticLimit)}
                  onValueChange={(value) => setSemanticLimit(Number(value))}
                >
                  <SelectTrigger className="h-12 border-2 bg-background">
                    <SelectValue placeholder="Límite" />
                  </SelectTrigger>
                  <SelectContent>
                    {SEMANTIC_LIMIT_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

                <div className="rounded-xl border bg-muted/20 p-4 space-y-3">
                <div>
                  <p className="text-sm font-medium">Profundidad semántica</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {semanticDepth === 1
                      ? 'Recupera sólo el vecindario inmediato del concepto.'
                      : 'Extiende la búsqueda hacia un segundo anillo de conexiones.'}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[1, 2].map((depthOption) => (
                    <button
                      key={depthOption}
                      onClick={() => setSemanticDepth(depthOption as 1 | 2)}
                      type="button"
                      className={cn(
                        'rounded-lg border px-4 py-3 text-sm font-medium transition-colors',
                        semanticDepth === depthOption
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border bg-background hover:bg-muted'
                      )}
                    >
                      <div className="space-y-1 text-left">
                        <p>{depthOption === 1 ? 'Directo' : 'Expandido'}</p>
                        <p className="text-xs font-normal leading-5 opacity-80">
                          {depthOption === 1
                            ? 'Contexto inmediato'
                            : 'Contexto ampliado'}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
                <div className="rounded-lg border bg-background/70 p-3 text-xs leading-6 text-muted-foreground">
                  {semanticDepth === 1 ? (
                    <p>
                      <span className="font-medium text-foreground">Directo:</span> toma el concepto encontrado y
                      usa sólo sus conexiones inmediatas. Sirve cuando quieres un contexto más acotado, centrado en
                      la entidad principal y en las relaciones que salen o llegan directamente a ella.
                    </p>
                  ) : (
                    <p>
                      <span className="font-medium text-foreground">Expandido:</span> parte del mismo contexto
                      inmediato, pero además sigue las conexiones de las entidades vecinas para incorporar un segundo
                      nivel de relación. Eso entrega una red semántica más amplia y útil cuando el tema necesita más
                      contexto alrededor.
                    </p>
                  )}
                </div>
              </div>

              {job && (
                <div className="space-y-3 border rounded-xl p-4 bg-muted/20">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {job.status === 'queued'
                          ? 'En cola'
                          : job.status === 'running'
                            ? 'En progreso'
                            : job.status === 'completed'
                              ? 'Completado'
                              : 'Error'}
                      </Badge>
                      <Badge variant="outline">{job.progress}%</Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">job_id: {job.job_id}</span>
                  </div>
                  <Progress value={Math.max(0, Math.min(100, job.progress || 0))} />
                  <p className="text-sm text-muted-foreground">
                    {job.message || getStageLabel(job.stage)}
                  </p>
                  {job.status === 'failed' && job.error && (
                    <p className="text-sm text-destructive">{job.error}</p>
                  )}
                </div>
              )}

              <div className="flex flex-wrap gap-2 justify-between">
                <Button variant="outline" onClick={handleClearGeneratorState} disabled={isGenerating}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Limpiar
                </Button>
                <Button onClick={handleGenerate} disabled={!canGenerate || isGenerating}>
                  {isGenerating ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4 mr-2" />
                  )}
                  Generar preguntas
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {result && (
        <Card>
          <CardHeader className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="space-y-1">
              <CardTitle className="text-xl flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Resultado de generación
              </CardTitle>
              <CardDescription>Preguntas creadas y guardadas con estado en revisión.</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">Preguntas: {displayedGeneratedCount}</Badge>
              <Badge variant="outline">Semantic total: {result.semantic_total}</Badge>
              <Badge variant="outline">{result.used_model}</Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="rounded-xl border bg-muted/20 p-4">
                <p className="text-xs text-muted-foreground">Generadas</p>
                <p className="mt-2 text-2xl font-semibold">{displayedGeneratedCount}</p>
              </div>
              <div className="rounded-xl border bg-muted/20 p-4">
                <p className="text-xs text-muted-foreground">Modelo usado</p>
                <p className="mt-2 text-base font-semibold">{result.used_model}</p>
              </div>
              <div className="rounded-xl border bg-muted/20 p-4">
                <p className="text-xs text-muted-foreground">Primera creación</p>
                <p className="mt-2 text-sm font-semibold">
                  {result.questions[0] ? new Date(result.questions[0].created_at).toLocaleString('es-CL') : '-'}
                </p>
              </div>
            </div>

            <Accordion type="multiple" className="w-full rounded-md border px-4">
              {result.questions.map((question, questionIndex) => (
                <AccordionItem key={question.id} value={`question-${question.id}`}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex flex-wrap items-center gap-2 pr-3 text-left">
                      <Badge variant="outline">#{questionIndex + 1}</Badge>
                      <span className={cn('rounded-full border px-3 py-1 text-xs font-medium', getDifficultyTone(question.difficulty as Difficulty))}>
                        {question.difficulty}
                      </span>
                      <span className="text-sm text-muted-foreground line-clamp-1">
                        {question.question}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-2">Pregunta</h3>
                      <p className="text-muted-foreground leading-7">{question.question}</p>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-2">Alternativas</h3>
                      <div className="grid gap-3 xl:grid-cols-2">
                        {question.alternatives.map((alternative, alternativeIndex) => (
                          <div key={`${question.id}-${alternativeIndex}`} className="border border-border rounded-xl p-4 bg-muted/20">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant={alternative.is_correct ? 'default' : 'secondary'}>
                                {alternative.is_correct ? 'Correcta' : 'Incorrecta'}
                              </Badge>
                            </div>
                            <p className="font-medium leading-6">{alternative.text}</p>
                            <p className="text-sm text-muted-foreground mt-2 leading-6">{alternative.feedback}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-xl border bg-muted/20 p-4 space-y-2">
                      <h3 className="font-semibold">Metadata pedagógica</h3>
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">rag_reference:</span>{' '}
                        {question.pedagogic_metadata.rag_reference}
                      </p>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-6">
                        <span className="font-medium text-foreground">complete_explanation:</span>{' '}
                        {question.pedagogic_metadata.complete_explanation}
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>

            <Accordion type="single" collapsible className="w-full rounded-md border px-4">
              <AccordionItem value="raw-output">
                <AccordionTrigger className="hover:no-underline">
                  <span className="font-semibold">Raw Output</span>
                </AccordionTrigger>
                <AccordionContent>
                  <pre className="text-xs bg-muted/50 border border-border rounded-md p-3 overflow-x-auto">
                    {result.raw_output}
                  </pre>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
