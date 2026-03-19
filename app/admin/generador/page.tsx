'use client';

import { useMemo, useState } from 'react';
import { Difficulty } from '@/types';
import {
  generateQuestion,
  GenerationQuestionResponse,
} from '@/lib/prompt-generation.api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const QUESTION_COUNT_OPTIONS = Array.from({ length: 20 }, (_, i) => String(i + 1));
const SEMANTIC_LIMIT_OPTIONS = Array.from({ length: 20 }, (_, i) => String(i + 1));

function getErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const statusCode = error.response?.status;
    const backendMessage = error.response?.data?.detail || error.response?.data?.message;

    if (statusCode === 500) {
      return 'Error interno del flujo de generación. Verifica configuración de OpenAI y contacta soporte interno.';
    }

    if (statusCode === 400 && backendMessage) {
      return backendMessage;
    }

    return backendMessage || 'No se pudo generar la pregunta';
  }

  return 'No se pudo generar la pregunta';
}

export default function GeneradorPreguntasPage() {
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.FACIL);
  const [userInput, setUserInput] = useState('');
  const [questionCount, setQuestionCount] = useState(1);

  const [semanticLimit, setSemanticLimit] = useState(5);
  const [semanticDepth, setSemanticDepth] = useState<1 | 2>(1);
  const [model, setModel] = useState('gpt-4o-mini');

  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<GenerationQuestionResponse | null>(null);

  const canGenerate = useMemo(() => {
    return userInput.trim().length > 0 && !!difficulty;
  }, [userInput, difficulty]);

  const handleGenerate = async () => {
    if (!canGenerate) {
      toast.error('Completa los campos antes de generar');
      return;
    }

    try {
      setIsGenerating(true);
      const response = await generateQuestion({
        user_input: userInput.trim(),
        difficulty,
        question_count: questionCount,
        semantic_limit: semanticLimit,
        semantic_depth: semanticDepth,
        model: model.trim() || 'gpt-4o-mini',
      });

      setResult(response);
      toast.success(`${response.generated_count} pregunta(s) generada(s) y guardada(s) en revisión`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-8 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Generador de Preguntas</h1>
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
              <Input value={model} onChange={(event) => setModel(event.target.value)} placeholder="gpt-4o-mini" />
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

          <Button onClick={handleGenerate} disabled={!canGenerate || isGenerating}>
            {isGenerating ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 mr-2" />
            )}
            Generar preguntas
          </Button>
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
                generated_count: {result.generated_count}
              </Badge>
            </div>

            <div className="space-y-6">
              <Accordion type="multiple" className="w-full border border-border rounded-md px-4">
                {result.questions.map((question, questionIndex) => (
                  <AccordionItem key={question.id} value={`question-${question.id}`}>
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex flex-wrap items-center gap-2 pr-3">
                        <Badge variant="outline">#{questionIndex + 1}</Badge>
                        <Badge>{question.status}</Badge>
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
