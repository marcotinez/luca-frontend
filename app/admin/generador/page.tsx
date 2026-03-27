'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Difficulty } from '@/types';
import {
  getGenerationJob,
  GenerationJobState,
  GenerationQuestionRequest,
  GenerationQuestionResponse,
  startGenerationJob,
} from '@/lib/prompt-generation.api';
import { addOpenAILog, getOpenAILogs } from '@/lib/openai-logs.storage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Loader2, Sparkles, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const QUESTION_COUNT_OPTIONS = Array.from({ length: 20 }, (_, i) => String(i + 1));
const SEMANTIC_LIMIT_OPTIONS = Array.from({ length: 20 }, (_, i) => String(i + 1));
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

export default function GeneradorPreguntasPage() {
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.FACIL);
  const [userInput, setUserInput] = useState('');
  const [questionCount, setQuestionCount] = useState(1);

  const [semanticLimit, setSemanticLimit] = useState(5);
  const [semanticDepth, setSemanticDepth] = useState<1 | 2>(1);
  const [model, setModel] = useState<string>('gpt-5.4-nano');

  const [job, setJob] = useState<GenerationJobState | null>(null);
  const [lastRequestPayload, setLastRequestPayload] = useState<GenerationQuestionRequest | null>(null);
  const [result, setResult] = useState<GenerationQuestionResponse | null>(null);
  const [hasHydratedState, setHasHydratedState] = useState(false);
  const pollTimerRef = useRef<number | null>(null);

  const canGenerate = useMemo(() => {
    return userInput.trim().length > 0 && !!difficulty;
  }, [userInput, difficulty]);

  const displayedGeneratedCount = result ? result.questions.length : 0;
  const isGenerating = job?.status === 'queued' || job?.status === 'running';

  const stopPolling = () => {
    if (pollTimerRef.current) {
      window.clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  };

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
      } else {
        const latestLog = getOpenAILogs()[0];
        if (latestLog?.response) {
          setResult(latestLog.response);
        }
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
      questionCount,
      semanticLimit,
      semanticDepth,
      model,
      job,
      lastRequestPayload,
      result,
    };

    window.localStorage.setItem(GENERATOR_STATE_STORAGE_KEY, JSON.stringify(persistedState));
  }, [hasHydratedState, difficulty, userInput, questionCount, semanticLimit, semanticDepth, model, job, lastRequestPayload, result]);

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
    setQuestionCount(1);
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
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Generador de Preguntas</h1>
          <p className="text-muted-foreground mt-1">
            Genera preguntas con OpenAI + búsqueda semántica para revisión admin.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Formulario de generación</CardTitle>
          <CardDescription>Define el tema, dificultad y parámetros de generación.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Nivel de dificultad</Label>
              <Select
                value={difficulty}
                onValueChange={(value) => setDifficulty(value as Difficulty)}
              >
                <SelectTrigger className="h-12 border-2">
                  <SelectValue placeholder="Selecciona un nivel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={Difficulty.FACIL}>{Difficulty.FACIL}</SelectItem>
                  <SelectItem value={Difficulty.MEDIO}>{Difficulty.MEDIO}</SelectItem>
                  <SelectItem value={Difficulty.DIFICIL}>{Difficulty.DIFICIL}</SelectItem>
                </SelectContent>
              </Select>
            </div>

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

          <div className="space-y-2">
            <Label>Tema o contexto de la pregunta</Label>
            <Textarea
              value={userInput}
              onChange={(event) => setUserInput(event.target.value)}
              rows={5}
              placeholder="Ej: Quiero preguntas sobre presupuesto para estudiantes universitarios"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-center gap-3 bg-muted/20 rounded-lg px-4 py-3 border border-dashed">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">Resultados semánticos</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Número de coincidencias usadas para construir contexto
                </p>
              </div>
              <Select
                value={String(semanticLimit)}
                onValueChange={(value) => setSemanticLimit(Number(value))}
              >
                <SelectTrigger className="w-[100px] h-12 border-2 shrink-0">
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

            <div className="flex items-center gap-3 bg-muted/20 rounded-lg px-4 py-3 border border-dashed">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">Profundidad semántica</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {semanticDepth === 1 ? 'Contexto directo' : 'Contexto con vecinos'}
                </p>
              </div>
              <div className="flex rounded-md border border-border overflow-hidden shrink-0">
                {[1, 2].map((depthOption) => (
                  <button
                    key={depthOption}
                    onClick={() => setSemanticDepth(depthOption as 1 | 2)}
                    type="button"
                    className={`w-9 h-9 text-sm font-semibold transition-all ${
                      semanticDepth === depthOption
                        ? 'bg-foreground text-background'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
                    }`}
                  >
                    {depthOption}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {job && (
            <div className="space-y-2 border border-border rounded-md p-4 bg-muted/20">
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
                <span className="text-sm text-muted-foreground">job_id: {job.job_id}</span>
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

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Resultado de generación</CardTitle>
            <CardDescription>Preguntas creadas y guardadas con estado en revisión.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">
                Preguntas generadas: {displayedGeneratedCount}
              </Badge>
            </div>

            <div className="space-y-6">
              <Accordion type="multiple" className="w-full border border-border rounded-md px-4">
                {result.questions.map((question, questionIndex) => (
                  <AccordionItem key={question.id} value={`question-${question.id}`}>
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex flex-wrap items-center gap-2 pr-3">
                        <Badge variant="outline">#{questionIndex + 1}</Badge>
                        <Badge variant="outline">{question.difficulty}</Badge>
                        <span className="text-sm text-muted-foreground line-clamp-1">
                          {question.question}
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4">
                      <div>
                        <h3 className="font-semibold mb-2">Pregunta</h3>
                        <p className="text-muted-foreground">{question.question}</p>
                      </div>

                      <div>
                        <h3 className="font-semibold mb-2">Alternativas</h3>
                        <div className="space-y-2">
                          {question.alternatives.map((alternative, alternativeIndex) => (
                            <div key={`${question.id}-${alternativeIndex}`} className="border border-border rounded-md p-3">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant={alternative.is_correct ? 'default' : 'secondary'}>
                                  {alternative.is_correct ? 'Correcta' : 'Incorrecta'}
                                </Badge>
                              </div>
                              <p className="font-medium">{alternative.text}</p>
                              <p className="text-sm text-muted-foreground mt-1">Feedback: {alternative.feedback}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h3 className="font-semibold">Metadata pedagógica</h3>
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium text-foreground">rag_reference:</span>{' '}
                          {question.pedagogic_metadata.rag_reference}
                        </p>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          <span className="font-medium text-foreground">complete_explanation:</span>{' '}
                          {question.pedagogic_metadata.complete_explanation}
                        </p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-muted-foreground">
              <p>
                <span className="font-medium text-foreground">semantic_total:</span> {result.semantic_total}
              </p>
              <p>
                <span className="font-medium text-foreground">used_model:</span> {result.used_model}
              </p>
              <p>
                <span className="font-medium text-foreground">primera pregunta creada:</span>{' '}
                {result.questions[0] ? new Date(result.questions[0].created_at).toLocaleString('es-CL') : '-'}
              </p>
            </div>

            <Accordion type="single" collapsible className="w-full border border-border rounded-md px-4">
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
