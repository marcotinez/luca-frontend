'use client';

import { useEffect, useMemo, useState } from 'react';
import { Difficulty, FinancialTopic, SubTopic } from '@/types';
import {
  generateQuestion,
  GenerationQuestionResponse,
  getLatestPrompts,
  LatestPromptsResponse,
} from '@/lib/prompt-generation.api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, AlertTriangle, RefreshCcw } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const CATEGORY_SUBTOPICS: Record<FinancialTopic, SubTopic[]> = {
  [FinancialTopic.PLANIFICACION]: [
    SubTopic.GASTOS_FIJOS_VARIABLES,
    SubTopic.PRESUPUESTO_MENSUAL,
    SubTopic.METAS_FINANCIERAS,
    SubTopic.CONTROL_GASTOS,
  ],
  [FinancialTopic.CREDITO]: [
    SubTopic.QUE_ES_CREDITO,
    SubTopic.TIPOS_CREDITO,
    SubTopic.TASA_INTERES,
    SubTopic.HISTORIAL_CREDITICIO,
    SubTopic.DEUDAS_RESPONSABLES,
  ],
  [FinancialTopic.ECONOMIA]: [
    SubTopic.INFLACION,
    SubTopic.OFERTA_DEMANDA,
    SubTopic.IMPUESTOS_BASICOS,
    SubTopic.ECONOMIA_PERSONAL,
  ],
  [FinancialTopic.PRIMER_EMPLEO]: [
    SubTopic.CONTRATO_TRABAJO,
    SubTopic.LIQUIDACION_SUELDO,
    SubTopic.AFP_SALUD,
    SubTopic.DERECHOS_LABORALES,
    SubTopic.FINIQUITO,
  ],
  [FinancialTopic.AHORRO]: [
    SubTopic.HABITO_AHORRO,
    SubTopic.FONDO_EMERGENCIA,
    SubTopic.INSTRUMENTOS_AHORRO,
    SubTopic.INVERSION_BASICA,
    SubTopic.RIESGO_RENTABILIDAD,
  ],
  [FinancialTopic.PRODUCTOS_BANCARIOS]: [
    SubTopic.CUENTA_CORRIENTE_VISTA,
    SubTopic.TARJETAS_DEBITO_CREDITO,
    SubTopic.SEGURIDAD_BANCARIA,
    SubTopic.FRAUDES_ESTAFAS,
    SubTopic.BANCA_DIGITAL,
  ],
};

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

function hasDifficultyPrompt(latestPrompts: LatestPromptsResponse | null, difficulty: Difficulty) {
  if (!latestPrompts) return false;
  if (difficulty === Difficulty.FACIL) return !!latestPrompts.facil;
  if (difficulty === Difficulty.MEDIO) return !!latestPrompts.medio;
  return !!latestPrompts.dificil;
}

function getDifficultyPromptsStatus(latestPrompts: LatestPromptsResponse | null) {
  if (!latestPrompts) {
    return {
      facil: false,
      medio: false,
      dificil: false,
    };
  }

  return {
    facil: !!latestPrompts.facil,
    medio: !!latestPrompts.medio,
    dificil: !!latestPrompts.dificil,
  };
}

export default function GeneradorPreguntasPage() {
  const [category, setCategory] = useState<FinancialTopic>(FinancialTopic.PLANIFICACION);
  const [subtopic, setSubtopic] = useState<SubTopic>(SubTopic.GASTOS_FIJOS_VARIABLES);
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.FACIL);
  const [userInput, setUserInput] = useState('');

  const [semanticLimit, setSemanticLimit] = useState(5);
  const [semanticDepth, setSemanticDepth] = useState<1 | 2>(1);
  const [model, setModel] = useState('gpt-4o-mini');

  const [latestPrompts, setLatestPrompts] = useState<LatestPromptsResponse | null>(null);
  const [loadingPrompts, setLoadingPrompts] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<GenerationQuestionResponse | null>(null);

  const subtopics = CATEGORY_SUBTOPICS[category] || [];

  useEffect(() => {
    if (!subtopics.includes(subtopic)) {
      setSubtopic(subtopics[0]);
    }
  }, [category]);

  const fetchLatestPrompts = async () => {
    try {
      setLoadingPrompts(true);
      const data = await getLatestPrompts();
      setLatestPrompts(data);
    } catch (error) {
      toast.error('No se pudieron cargar los prompts activos');
    } finally {
      setLoadingPrompts(false);
    }
  };

  useEffect(() => {
    fetchLatestPrompts();
  }, []);

  const promptBaseReady = !!latestPrompts?.base;
  const promptDifficultyReady = hasDifficultyPrompt(latestPrompts, difficulty);
  const canGenerateByPrompts = promptBaseReady && promptDifficultyReady;
  const difficultyPromptsStatus = getDifficultyPromptsStatus(latestPrompts);
  const hasAnyDifficultyPrompt =
    difficultyPromptsStatus.facil || difficultyPromptsStatus.medio || difficultyPromptsStatus.dificil;

  const canGenerate = useMemo(() => {
    return canGenerateByPrompts && userInput.trim().length > 0 && !!category && !!subtopic && !!difficulty;
  }, [canGenerateByPrompts, userInput, category, subtopic, difficulty]);

  const handleGenerate = async () => {
    if (!canGenerate) {
      toast.error('Completa los campos y verifica prompts activos antes de generar');
      return;
    }

    try {
      setIsGenerating(true);
      const response = await generateQuestion({
        user_input: userInput.trim(),
        category,
        subtopic,
        difficulty,
        semantic_limit: semanticLimit,
        semantic_depth: semanticDepth,
        model: model.trim() || 'gpt-4o-mini',
      });

      setResult(response);
      toast.success('Pregunta generada y guardada en revisión');
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

        <Button variant="outline" onClick={fetchLatestPrompts} disabled={loadingPrompts}>
          <RefreshCcw className={`w-4 h-4 mr-2 ${loadingPrompts ? 'animate-spin' : ''}`} />
          Refrescar prompts
        </Button>
      </div>

      <Card className={!canGenerateByPrompts ? 'border-yellow-500/40' : ''}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className={`w-5 h-5 ${canGenerateByPrompts ? 'text-green-600' : 'text-yellow-600'}`} />
            Estado de prompts requeridos
          </CardTitle>
          <CardDescription>
            Para generar: deben existir prompt `base` y prompt de la dificultad seleccionada.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Badge variant={promptBaseReady ? 'default' : 'destructive'}>
            base: {promptBaseReady ? 'OK' : 'Faltante'}
          </Badge>
          <Badge variant={promptDifficultyReady ? 'default' : 'destructive'}>
            difficulty seleccionada ({difficulty}): {promptDifficultyReady ? 'OK' : 'Faltante'}
          </Badge>
          <Badge variant={difficultyPromptsStatus.facil ? 'outline' : 'secondary'}>
            Fácil: {difficultyPromptsStatus.facil ? 'OK' : 'Sin prompt'}
          </Badge>
          <Badge variant={difficultyPromptsStatus.medio ? 'outline' : 'secondary'}>
            Medio: {difficultyPromptsStatus.medio ? 'OK' : 'Sin prompt'}
          </Badge>
          <Badge variant={difficultyPromptsStatus.dificil ? 'outline' : 'secondary'}>
            Difícil: {difficultyPromptsStatus.dificil ? 'OK' : 'Sin prompt'}
          </Badge>
          {!hasAnyDifficultyPrompt && (
            <p className="w-full text-sm text-muted-foreground">
              No hay prompts de dificultad activos actualmente.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Formulario de generación</CardTitle>
          <CardDescription>Selecciona categoría, subtópico, dificultad y contexto del usuario.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Categoría</Label>
              <Select
                value={category}
                onValueChange={(value) => setCategory(value as FinancialTopic)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona categoría" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(FinancialTopic).map((categoryItem) => (
                    <SelectItem key={categoryItem} value={categoryItem}>
                      {categoryItem}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Subtópico</Label>
              <Select
                value={subtopic}
                onValueChange={(value) => setSubtopic(value as SubTopic)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona subtópico" />
                </SelectTrigger>
                <SelectContent>
                  {subtopics.map((subtopicItem) => (
                    <SelectItem key={subtopicItem} value={subtopicItem}>
                      {subtopicItem}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Dificultad</Label>
              <Select
                value={difficulty}
                onValueChange={(value) => setDifficulty(value as Difficulty)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona dificultad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={Difficulty.FACIL}>{Difficulty.FACIL}</SelectItem>
                  <SelectItem value={Difficulty.MEDIO}>{Difficulty.MEDIO}</SelectItem>
                  <SelectItem value={Difficulty.DIFICIL}>{Difficulty.DIFICIL}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>user_input</Label>
            <Textarea
              value={userInput}
              onChange={(event) => setUserInput(event.target.value)}
              rows={5}
              placeholder="Ej: Quiero una pregunta sobre presupuesto para universitarios"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Cantidad de resultados semánticos (1..20)</Label>
              <Input
                type="number"
                min={1}
                max={20}
                value={semanticLimit}
                onChange={(event) => {
                  const value = Number(event.target.value);
                  if (Number.isNaN(value)) return;
                  setSemanticLimit(Math.max(1, Math.min(20, value)));
                }}
              />
            </div>

            <div className="space-y-2">
              <Label>Profundidad del contexto semántico (1..2)</Label>
              <Select
                value={String(semanticDepth)}
                onValueChange={(value) => setSemanticDepth(Number(value) as 1 | 2)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1</SelectItem>
                  <SelectItem value="2">2</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>model</Label>
              <Input value={model} onChange={(event) => setModel(event.target.value)} placeholder="gpt-4o-mini" />
            </div>
          </div>

          <Button onClick={handleGenerate} disabled={!canGenerate || isGenerating}>
            {isGenerating ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 mr-2" />
            )}
            Generar pregunta
          </Button>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Resultado de generación</CardTitle>
            <CardDescription>Pregunta creada y guardada con estado en revisión.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex flex-wrap gap-2">
              <Badge>{result.question.status}</Badge>
              <Badge variant="outline">{result.question.category}</Badge>
              <Badge variant="outline">{result.question.subtopic}</Badge>
              <Badge variant="outline">{result.question.difficulty}</Badge>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Pregunta</h3>
              <p className="text-muted-foreground">{result.question.question}</p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Alternativas</h3>
              <div className="space-y-2">
                {result.question.alternatives.map((alternative, index) => (
                  <div key={`${alternative.text}-${index}`} className="border border-border rounded-md p-3">
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
                {result.question.pedagogic_metadata.rag_reference}
              </p>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                <span className="font-medium text-foreground">complete_explanation:</span>{' '}
                {result.question.pedagogic_metadata.complete_explanation}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-muted-foreground">
              <p>
                <span className="font-medium text-foreground">semantic_total:</span> {result.semantic_total}
              </p>
              <p>
                <span className="font-medium text-foreground">used_model:</span> {result.used_model}
              </p>
              <p>
                <span className="font-medium text-foreground">created_at:</span>{' '}
                {new Date(result.question.created_at).toLocaleString('es-CL')}
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-1">raw_output</h3>
              <pre className="text-xs bg-muted/50 border border-border rounded-md p-3 overflow-x-auto">
                {result.raw_output}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
