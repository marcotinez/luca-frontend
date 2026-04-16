'use client';

import Link from 'next/link';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { Difficulty, QuestionCreate, QuestionResponse, Status } from '@/types';
import { deleteQuestion, listQuestions, updateQuestion } from '@/lib/questions.api';
import { getGenerationConfig } from '@/lib/prompt-generation.api';
import { normalizeRuntimeTaxonomy, type RuntimeTaxonomy } from '@/lib/taxonomy.utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CheckCircle2, ChevronLeft, ChevronRight, Clock, RefreshCcw, XCircle } from 'lucide-react';
import { toast } from 'sonner';

const DEFAULT_LIMIT = 20;

type FiltersState = {
  subtopic: string;
  status: '' | Status;
  difficulty: '' | Difficulty;
};

const alternativeSchema = z.object({
  text: z.string().min(1, 'El texto es requerido'),
  is_correct: z.boolean(),
  feedback: z.string().min(1, 'El feedback es requerido'),
});

const questionSchema = z.object({
  category: z.string().min(1, 'Categoría requerida'),
  subtopic: z.string().min(1, 'Subtópico requerido'),
  difficulty: z.nativeEnum(Difficulty, { message: 'Dificultad requerida' }),
  question: z.string().min(10, 'La pregunta debe tener al menos 10 caracteres'),
  alternatives: z
    .array(alternativeSchema)
    .length(4, 'Debe haber exactamente 4 alternativas')
    .refine((alts) => alts.filter((a) => a.is_correct).length === 1, 'Debe haber exactamente 1 alternativa correcta'),
  rag_reference: z.string().min(1, 'La referencia RAG es requerida'),
  complete_explanation: z.string().min(10, 'La explicación debe tener al menos 10 caracteres'),
  status: z.nativeEnum(Status, { message: 'Estado requerido' }),
});

type QuestionFormValues = z.infer<typeof questionSchema>;

function statusBadge(status: Status) {
  if (status === Status.ACEPTADA) return <Badge className="bg-green-600 hover:bg-green-700">Aceptada</Badge>;
  if (status === Status.RECHAZADA) return <Badge variant="destructive">Rechazada</Badge>;
  return <Badge className="bg-yellow-600 hover:bg-yellow-700">En revisión</Badge>;
}

function difficultyBadge(difficulty: Difficulty) {
  if (difficulty === Difficulty.FACIL)
    return <Badge className="bg-green-100 text-green-800 border-green-300 hover:bg-green-200">Fácil</Badge>;
  if (difficulty === Difficulty.MEDIO)
    return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-200">Medio</Badge>;
  return <Badge className="bg-red-100 text-red-800 border-red-300 hover:bg-red-200">Difícil</Badge>;
}

export default function PreguntasPorCategoriaPage() {
  const params = useParams<{ category: string }>();
  const routeCategory = useMemo(() => decodeURIComponent(params.category || ''), [params.category]);

  const [taxonomy, setTaxonomy] = useState<RuntimeTaxonomy>({ categories: [], subtopicsByCategory: {} });
  const [items, setItems] = useState<QuestionResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isQuestionDialogOpen, setIsQuestionDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<QuestionResponse | null>(null);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<Status>(Status.EN_REVISION);
  const [isApplyingBulk, setIsApplyingBulk] = useState(false);

  const [filters, setFilters] = useState<FiltersState>({
    subtopic: '',
    status: '',
    difficulty: '',
  });

  const [pagination, setPagination] = useState({ skip: 0, limit: DEFAULT_LIMIT });

  const form = useForm<QuestionFormValues>({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      category: routeCategory,
      subtopic: '',
      difficulty: Difficulty.FACIL,
      question: '',
      alternatives: [
        { text: '', is_correct: false, feedback: '' },
        { text: '', is_correct: false, feedback: '' },
        { text: '', is_correct: false, feedback: '' },
        { text: '', is_correct: false, feedback: '' },
      ],
      rag_reference: '',
      complete_explanation: '',
      status: Status.EN_REVISION,
    },
  });

  const subtopics = useMemo(() => taxonomy.subtopicsByCategory[routeCategory] || [], [taxonomy, routeCategory]);
  const canGoPrev = pagination.skip > 0;
  const canGoNext = items.length === pagination.limit;
  const allVisibleSelected = items.length > 0 && items.every((item) => selectedQuestionIds.has(item.id));
  const someVisibleSelected = items.some((item) => selectedQuestionIds.has(item.id));

  const fetchQuestions = useCallback(async () => {
    if (!routeCategory) return;

    try {
      setLoading(true);
      setError(null);

      const data = await listQuestions({
        category: routeCategory,
        subtopic: filters.subtopic || undefined,
        status: filters.status || undefined,
        difficulty: filters.difficulty || undefined,
        skip: pagination.skip,
        limit: pagination.limit,
      });

      setItems(data);
    } catch {
      const message = 'No se pudo cargar el listado de preguntas.';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [filters.difficulty, filters.status, filters.subtopic, pagination.limit, pagination.skip, routeCategory]);

  useEffect(() => {
    void fetchQuestions();
  }, [fetchQuestions]);

  useEffect(() => {
    setSelectedQuestionIds((prev) => {
      if (prev.size === 0) return prev;
      const next = new Set<string>();
      const visibleIds = new Set(items.map((item) => item.id));
      for (const id of prev) {
        if (visibleIds.has(id)) next.add(id);
      }
      return next;
    });
  }, [items]);

  useEffect(() => {
    const loadTaxonomy = async () => {
      if (!routeCategory) return;
      try {
        const config = await getGenerationConfig();
        const normalized = normalizeRuntimeTaxonomy({
          categories: config.categories,
          subtopics: config.subtopics,
        });
        setTaxonomy(normalized);
      } catch {
        setTaxonomy({ categories: [], subtopicsByCategory: {} });
      }
    };

    void loadTaxonomy();
  }, [routeCategory]);

  const handleSubtopicChange = (value: string) => {
    setFilters((prev) => ({ ...prev, subtopic: value === 'all' ? '' : value }));
    setPagination((prev) => ({ ...prev, skip: 0 }));
  };

  const handleStatusChange = (value: string) => {
    setFilters((prev) => ({ ...prev, status: value === 'all' ? '' : (value as Status) }));
    setPagination((prev) => ({ ...prev, skip: 0 }));
  };

  const handleDifficultyChange = (value: string) => {
    setFilters((prev) => ({ ...prev, difficulty: value === 'all' ? '' : (value as Difficulty) }));
    setPagination((prev) => ({ ...prev, skip: 0 }));
  };

  const openEditQuestion = (question: QuestionResponse) => {
    setEditingQuestion(question);
    form.reset({
      category: question.category,
      subtopic: question.subtopic,
      difficulty: question.difficulty,
      question: question.question,
      alternatives: question.alternatives,
      rag_reference: question.pedagogic_metadata.rag_reference,
      complete_explanation: question.pedagogic_metadata.complete_explanation,
      status: question.status,
    });
    setIsQuestionDialogOpen(true);
  };

  const handleSaveQuestion = async (values: QuestionFormValues) => {
    if (!editingQuestion) return;

    try {
      const questionData: QuestionCreate = {
        category: values.category,
        subtopic: values.subtopic,
        difficulty: values.difficulty,
        question: values.question,
        alternatives: values.alternatives,
        pedagogic_metadata: {
          rag_reference: values.rag_reference,
          complete_explanation: values.complete_explanation,
        },
        status: values.status,
      };

      await updateQuestion(editingQuestion.id, questionData);
      toast.success('Pregunta actualizada');
      setIsQuestionDialogOpen(false);
      setEditingQuestion(null);
      await fetchQuestions();
    } catch {
      toast.error('Error al guardar pregunta');
    }
  };

  const handleToggleSelectAllVisible = (checked: boolean) => {
    setSelectedQuestionIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        for (const item of items) next.add(item.id);
      } else {
        for (const item of items) next.delete(item.id);
      }
      return next;
    });
  };

  const handleToggleQuestionSelection = (questionId: string, checked: boolean) => {
    setSelectedQuestionIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(questionId);
      else next.delete(questionId);
      return next;
    });
  };

  const handleApplyBulkStatus = async () => {
    const selected = items.filter((item) => selectedQuestionIds.has(item.id));
    if (selected.length === 0) {
      toast.warning('Selecciona al menos una pregunta.');
      return;
    }
    try {
      setIsApplyingBulk(true);
      await Promise.all(
        selected.map((item) =>
          updateQuestion(item.id, {
            status: bulkStatus,
          })
        )
      );
      toast.success(`Estado actualizado en ${selected.length} pregunta(s).`);
      await fetchQuestions();
    } catch {
      toast.error('No se pudo actualizar el estado del lote.');
    } finally {
      setIsApplyingBulk(false);
    }
  };

  const handleDeleteSelected = async () => {
    const selected = items.filter((item) => selectedQuestionIds.has(item.id));
    if (selected.length === 0) {
      toast.warning('Selecciona al menos una pregunta.');
      return;
    }
    if (!window.confirm(`¿Eliminar ${selected.length} pregunta(s)? Esta acción no se puede deshacer.`)) {
      return;
    }
    try {
      setIsApplyingBulk(true);
      await Promise.all(selected.map((item) => deleteQuestion(item.id)));
      setSelectedQuestionIds(new Set());
      toast.success(`Eliminadas ${selected.length} pregunta(s).`);
      await fetchQuestions();
    } catch {
      toast.error('No se pudo eliminar el lote seleccionado.');
    } finally {
      setIsApplyingBulk(false);
    }
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Preguntas de categoría {routeCategory}</h1>
          <p className="text-muted-foreground mt-1">
            Tabla paginada por backend con filtros por subtópico, estado y dificultad.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline">
            <Link href="/admin/preguntas">Volver a categorías</Link>
          </Button>
          <Button variant="outline" onClick={() => void fetchQuestions()} disabled={loading}>
            <RefreshCcw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          <Select value={bulkStatus} onValueChange={(value) => setBulkStatus(value as Status)}>
            <SelectTrigger className="w-[170px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={Status.EN_REVISION}>En revisión</SelectItem>
              <SelectItem value={Status.ACEPTADA}>Aceptada</SelectItem>
              <SelectItem value={Status.RECHAZADA}>Rechazada</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => void handleApplyBulkStatus()} disabled={isApplyingBulk}>
            Aplicar estado
          </Button>
          <Button variant="destructive" onClick={() => void handleDeleteSelected()} disabled={isApplyingBulk}>
            Eliminar seleccionadas
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Cambiar cualquier filtro reinicia la página (skip=0).</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="space-y-2">
            <Label>Subtópico</Label>
            <Select value={filters.subtopic || 'all'} onValueChange={handleSubtopicChange}>
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {subtopics.map((subtopic) => (
                  <SelectItem key={subtopic} value={subtopic}>
                    {subtopic}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Estado</Label>
            <Select value={filters.status || 'all'} onValueChange={handleStatusChange}>
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value={Status.EN_REVISION}>En revisión</SelectItem>
                <SelectItem value={Status.ACEPTADA}>Aceptada</SelectItem>
                <SelectItem value={Status.RECHAZADA}>Rechazada</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Dificultad</Label>
            <Select value={filters.difficulty || 'all'} onValueChange={handleDifficultyChange}>
              <SelectTrigger>
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value={Difficulty.FACIL}>Fácil</SelectItem>
                <SelectItem value={Difficulty.MEDIO}>Medio</SelectItem>
                <SelectItem value={Difficulty.DIFICIL}>Difícil</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <div>
            <CardTitle>Listado de preguntas</CardTitle>
            <CardDescription>
              Skip {pagination.skip} · Limit {pagination.limit} · Mostrando {items.length}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setPagination((prev) => ({ ...prev, skip: Math.max(0, prev.skip - prev.limit) }))}
              disabled={!canGoPrev || loading}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Anterior
            </Button>
            <Button
              variant="outline"
              onClick={() => setPagination((prev) => ({ ...prev, skip: prev.skip + prev.limit }))}
              disabled={!canGoNext || loading}
            >
              Siguiente
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-md border p-3">
            <p className="text-sm text-muted-foreground">
              Seleccionadas: <span className="font-medium text-foreground">{selectedQuestionIds.size}</span>
            </p>
            <p className="text-xs text-muted-foreground">Usa las acciones masivas en la barra superior.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="py-3 px-2 text-left font-medium w-[48px]">
                    <Checkbox
                      checked={allVisibleSelected ? true : someVisibleSelected ? 'indeterminate' : false}
                      onCheckedChange={(checked) => handleToggleSelectAllVisible(Boolean(checked))}
                      aria-label="Seleccionar todas las preguntas visibles"
                    />
                  </th>
                  <th className="py-3 px-2 text-left font-medium w-[460px]">Pregunta</th>
                  <th className="py-3 px-2 text-left font-medium">Dificultad</th>
                  <th className="py-3 px-2 text-left font-medium">Estado</th>
                  <th className="py-3 px-2 text-left font-medium">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-muted-foreground">
                      Cargando preguntas...
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-destructive">
                      {error}
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-muted-foreground">
                      No se encontraron preguntas para los filtros actuales.
                    </td>
                  </tr>
                ) : (
                  items.map((question) => (
                    <tr
                      key={question.id}
                      className="border-b border-border/50 hover:bg-muted/40 cursor-pointer"
                      onClick={() => openEditQuestion(question)}
                    >
                      <td className="py-3 px-2" onClick={(event) => event.stopPropagation()}>
                        <Checkbox
                          checked={selectedQuestionIds.has(question.id)}
                          onCheckedChange={(checked) => handleToggleQuestionSelection(question.id, Boolean(checked))}
                          aria-label={`Seleccionar pregunta ${question.id}`}
                        />
                      </td>
                      <td className="py-3 px-2">
                        <p className="font-medium leading-6 line-clamp-2 min-h-[3rem]">{question.question}</p>
                        <p className="text-xs text-muted-foreground mt-1">{question.subtopic}</p>
                      </td>
                      <td className="py-3 px-2">{difficultyBadge(question.difficulty)}</td>
                      <td className="py-3 px-2">{statusBadge(question.status)}</td>
                      <td className="py-3 px-2 text-xs text-muted-foreground">
                        {new Date(question.created_at).toLocaleDateString('es-CL')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isQuestionDialogOpen} onOpenChange={setIsQuestionDialogOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Editar Pregunta</DialogTitle>
            <DialogDescription>Modifica los datos de la pregunta.</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSaveQuestion)} className="space-y-6 pt-4">
              <div className="space-y-4 p-4 bg-muted/30 rounded-lg border border-border">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Información Básica</h3>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => {
                      const categoryOptions = field.value && !taxonomy.categories.includes(field.value)
                        ? [field.value, ...taxonomy.categories]
                        : taxonomy.categories;

                      return (
                        <FormItem>
                          <FormLabel>Categoría</FormLabel>
                          <Select
                            onValueChange={(value) => {
                              field.onChange(value);
                              const availableSubtopics = taxonomy.subtopicsByCategory[value] || [];
                              if (availableSubtopics && availableSubtopics.length > 0) {
                                form.setValue('subtopic', availableSubtopics[0]);
                              } else {
                                form.setValue('subtopic', '');
                              }
                            }}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecciona" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {categoryOptions.map((cat) => (
                                <SelectItem key={cat} value={cat}>
                                  {cat}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />

                  <FormField
                    control={form.control}
                    name="subtopic"
                    render={({ field }) => {
                      const selectedCategory = form.watch('category');
                      const availableSubtopics = selectedCategory
                        ? taxonomy.subtopicsByCategory[selectedCategory] || []
                        : [];
                      const subtopicOptions = field.value && !availableSubtopics.includes(field.value)
                        ? [field.value, ...availableSubtopics]
                        : availableSubtopics;

                      return (
                        <FormItem>
                          <FormLabel>Subtópico</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecciona un subtópico" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="max-h-[300px]">
                              {subtopicOptions.map((sub) => (
                                <SelectItem key={sub} value={sub}>
                                  {sub}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="difficulty"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dificultad</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value={Difficulty.FACIL}>
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                Fácil
                              </div>
                            </SelectItem>
                            <SelectItem value={Difficulty.MEDIO}>
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                                Medio
                              </div>
                            </SelectItem>
                            <SelectItem value={Difficulty.DIFICIL}>
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                Difícil
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estado</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value={Status.EN_REVISION}>
                              <div className="flex items-center gap-2">
                                <Clock className="w-3 h-3 text-yellow-600" />
                                En Revisión
                              </div>
                            </SelectItem>
                            <SelectItem value={Status.ACEPTADA}>
                              <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-3 h-3 text-green-600" />
                                Aceptada
                              </div>
                            </SelectItem>
                            <SelectItem value={Status.RECHAZADA}>
                              <div className="flex items-center gap-2">
                                <XCircle className="w-3 h-3 text-red-600" />
                                Rechazada
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="space-y-4 p-4 bg-muted/30 rounded-lg border border-border">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Pregunta</h3>
                <FormField
                  control={form.control}
                  name="question"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea placeholder="Escribe la pregunta aquí..." className="min-h-[100px] text-base" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4 p-4 bg-muted/30 rounded-lg border border-border">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Alternativas</h3>
                  <span className="text-xs text-muted-foreground">Marca la respuesta correcta</span>
                </div>

                <div className="space-y-3">
                  {[0, 1, 2, 3].map((index) => {
                    const isCorrect = form.watch(`alternatives.${index}.is_correct`);
                    return (
                      <div
                        key={index}
                        className={`relative border-2 rounded-lg p-4 space-y-3 transition-all ${
                          isCorrect
                            ? 'border-green-500 bg-green-50/50 dark:bg-green-950/20'
                            : 'border-border bg-background hover:border-muted-foreground/30'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <FormField
                            control={form.control}
                            name={`alternatives.${index}.is_correct`}
                            render={({ field }) => (
                              <FormItem className="flex items-center space-y-0 pt-2">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        [0, 1, 2, 3].forEach((i) => {
                                          if (i !== index) {
                                            form.setValue(`alternatives.${i}.is_correct`, false);
                                          }
                                        });
                                      }
                                      field.onChange(checked);
                                    }}
                                    className={isCorrect ? 'border-green-600 bg-green-600' : ''}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />

                          <div className="flex-1 space-y-3">
                            <div className="flex items-center gap-2">
                              <span
                                className={`font-semibold text-sm ${
                                  isCorrect ? 'text-green-700 dark:text-green-400' : 'text-muted-foreground'
                                }`}
                              >
                                Opción {String.fromCharCode(65 + index)}
                              </span>
                              {isCorrect && <Badge className="bg-green-600 text-xs">Correcta</Badge>}
                            </div>

                            <FormField
                              control={form.control}
                              name={`alternatives.${index}.text`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input placeholder="Texto de la alternativa" {...field} className="font-medium" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name={`alternatives.${index}.feedback`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Textarea
                                      placeholder="Explicación/feedback para esta alternativa"
                                      className="min-h-[70px] text-sm"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {form.formState.errors.alternatives?.root && (
                  <p className="text-sm font-medium text-destructive flex items-center gap-2">
                    <XCircle className="w-4 h-4" />
                    {form.formState.errors.alternatives.root.message}
                  </p>
                )}
              </div>

              <div className="space-y-4 p-4 bg-muted/30 rounded-lg border border-border">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Metadatos Pedagógicos</h3>

                <FormField
                  control={form.control}
                  name="rag_reference"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Referencia RAG</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: SERNAC Educación Financiera, Glosario Presupuesto" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="complete_explanation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Explicación Completa</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Explicación detallada del concepto..." className="min-h-[100px]" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter className="gap-2 sm:gap-0 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsQuestionDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? 'Guardando...' : 'Actualizar Pregunta'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
