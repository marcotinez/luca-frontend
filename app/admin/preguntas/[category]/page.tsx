'use client';

import Link from 'next/link';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Difficulty, QuestionCreate, QuestionResponse, Status } from '@/types';
import { deleteQuestion, listQuestions, updateQuestion } from '@/lib/questions.api';
import { getGenerationConfig } from '@/lib/config.api';
import { readStorage, writeStorage } from '@/lib/client-storage';
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
import { CheckCircle2, ChevronLeft, ChevronRight, Clock, RefreshCcw, Table2, XCircle } from 'lucide-react';
import { toast } from 'sonner';

const PAGE_SIZE = 20;
const FETCH_BATCH_SIZE = 100;
const FETCH_MAX_ITEMS = 1200;
const STORAGE_SELECTION_PREFIX = 'admin:questions:selected:';

type ViewMode = 'list' | 'review';
type SortDir = 'desc' | 'asc';

type FiltersState = {
  subtopic: string;
  status: '' | Status;
  difficulty: '' | Difficulty;
  createdDay: string;
  sortDir: SortDir;
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

function getSelectionStorageKey(category: string) {
  return `${STORAGE_SELECTION_PREFIX}${category}`;
}

function parseDate(input: string) {
  const dt = new Date(input);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

function formatDateTime(value: string) {
  const dt = parseDate(value);
  if (!dt) return 'Fecha inválida';
  return dt.toLocaleString('es-CL', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function isSameLocalDay(isoDate: string, day: string) {
  if (!day) return true;
  const dt = parseDate(isoDate);
  if (!dt) return false;
  const [y, m, d] = day.split('-').map((v) => Number(v));
  if (!y || !m || !d) return true;
  return dt.getFullYear() === y && dt.getMonth() + 1 === m && dt.getDate() === d;
}

export default function PreguntasPorCategoriaPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const params = useParams<{ category: string }>();
  const routeCategory = useMemo(() => decodeURIComponent(params.category || ''), [params.category]);

  const [taxonomy, setTaxonomy] = useState<RuntimeTaxonomy>({ categories: [], subtopicsByCategory: {} });
  const [allItems, setAllItems] = useState<QuestionResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isQuestionDialogOpen, setIsQuestionDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<QuestionResponse | null>(null);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<Status>(Status.EN_REVISION);
  const [isApplyingBulk, setIsApplyingBulk] = useState(false);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [isSavingReviewAction, setIsSavingReviewAction] = useState(false);

  const [filters, setFilters] = useState<FiltersState>({
    subtopic: '',
    status: '',
    difficulty: '',
    createdDay: '',
    sortDir: 'desc',
  });

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [page, setPage] = useState(1);

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

  const updateUrlState = useCallback(
    (next: {
      mode?: ViewMode;
      subtopic?: string;
      status?: '' | Status;
      difficulty?: '' | Difficulty;
      day?: string;
      sort?: SortDir;
      page?: number;
    }) => {
      const current = new URLSearchParams(searchParams.toString());

      const mode = next.mode ?? viewMode;
      const subtopic = next.subtopic ?? filters.subtopic;
      const status = next.status ?? filters.status;
      const difficulty = next.difficulty ?? filters.difficulty;
      const day = next.day ?? filters.createdDay;
      const sort = next.sort ?? filters.sortDir;
      const nextPage = next.page ?? page;

      current.set('mode', mode);
      if (subtopic) current.set('subtopic', subtopic);
      else current.delete('subtopic');

      if (status) current.set('status', status);
      else current.delete('status');

      if (difficulty) current.set('difficulty', difficulty);
      else current.delete('difficulty');

      if (day) current.set('day', day);
      else current.delete('day');

      current.set('sort', sort);
      current.set('page', String(Math.max(1, nextPage)));
      router.replace(`${pathname}?${current.toString()}`);
    },
    [filters.createdDay, filters.difficulty, filters.status, filters.subtopic, filters.sortDir, page, pathname, router, searchParams, viewMode]
  );

  useEffect(() => {
    const modeParam = searchParams.get('mode');
    const subtopicParam = searchParams.get('subtopic') || '';
    const statusParam = searchParams.get('status');
    const difficultyParam = searchParams.get('difficulty');
    const dayParam = searchParams.get('day') || '';
    const sortParam = searchParams.get('sort');
    const pageParam = Number(searchParams.get('page') || '1');

    const nextMode: ViewMode = modeParam === 'review' ? 'review' : 'list';
    const nextStatus =
      statusParam === Status.ACEPTADA || statusParam === Status.RECHAZADA || statusParam === Status.EN_REVISION
        ? statusParam
        : '';
    const nextDifficulty =
      difficultyParam === Difficulty.FACIL || difficultyParam === Difficulty.MEDIO || difficultyParam === Difficulty.DIFICIL
        ? difficultyParam
        : '';

    setViewMode(nextMode);
    setPage(Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1);
    setFilters((prev) => ({
      ...prev,
      subtopic: subtopicParam,
      status: nextStatus,
      difficulty: nextDifficulty,
      createdDay: dayParam,
      sortDir: sortParam === 'asc' ? 'asc' : 'desc',
    }));
  }, [searchParams]);

  useEffect(() => {
    if (!routeCategory) return;
    const storageKey = getSelectionStorageKey(routeCategory);
    const saved = readStorage<string[]>(storageKey, [], (value) =>
      Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === 'string') : []
    );
    setSelectedQuestionIds(new Set(saved));
  }, [routeCategory]);

  useEffect(() => {
    if (!routeCategory) return;
    writeStorage(getSelectionStorageKey(routeCategory), Array.from(selectedQuestionIds));
  }, [routeCategory, selectedQuestionIds]);

  const fetchQuestions = useCallback(async () => {
    if (!routeCategory) return;

    try {
      setLoading(true);
      setError(null);

      const loaded: QuestionResponse[] = [];
      let skip = 0;

      while (loaded.length < FETCH_MAX_ITEMS) {
        const chunk = await listQuestions({
          category: routeCategory,
          skip,
          limit: FETCH_BATCH_SIZE,
        });

        loaded.push(...chunk);

        if (chunk.length < FETCH_BATCH_SIZE) break;
        skip += FETCH_BATCH_SIZE;
      }

      setAllItems(loaded);
    } catch {
      const message = 'No se pudo cargar el listado de preguntas.';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [routeCategory]);

  useEffect(() => {
    void fetchQuestions();
  }, [fetchQuestions]);

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

  const filteredSortedItems = useMemo(() => {
    const filtered = allItems.filter((item) => {
      if (filters.subtopic && item.subtopic !== filters.subtopic) return false;
      if (filters.status && item.status !== filters.status) return false;
      if (filters.difficulty && item.difficulty !== filters.difficulty) return false;
      if (!isSameLocalDay(item.created_at, filters.createdDay)) return false;
      return true;
    });

    return filtered.slice().sort((a, b) => {
      const at = parseDate(a.created_at)?.getTime() ?? 0;
      const bt = parseDate(b.created_at)?.getTime() ?? 0;
      return filters.sortDir === 'desc' ? bt - at : at - bt;
    });
  }, [allItems, filters.createdDay, filters.difficulty, filters.sortDir, filters.status, filters.subtopic]);

  const reviewItems = useMemo(
    () => filteredSortedItems.filter((item) => item.status === Status.EN_REVISION),
    [filteredSortedItems]
  );

  const totalPages = Math.max(1, Math.ceil(filteredSortedItems.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageStart = (safePage - 1) * PAGE_SIZE;
  const visibleItems = filteredSortedItems.slice(pageStart, pageStart + PAGE_SIZE);

  useEffect(() => {
    if (page !== safePage) {
      setPage(safePage);
      updateUrlState({ page: safePage });
    }
  }, [page, safePage, updateUrlState]);

  useEffect(() => {
    if (viewMode !== 'review') {
      setReviewIndex(0);
      return;
    }
    if (reviewItems.length === 0) {
      setReviewIndex(0);
      return;
    }
    setReviewIndex((prev) => Math.min(prev, reviewItems.length - 1));
  }, [reviewItems.length, viewMode]);

  const allVisibleSelected = visibleItems.length > 0 && visibleItems.every((item) => selectedQuestionIds.has(item.id));
  const someVisibleSelected = visibleItems.some((item) => selectedQuestionIds.has(item.id));

  const selectedItems = useMemo(
    () => allItems.filter((item) => selectedQuestionIds.has(item.id)),
    [allItems, selectedQuestionIds]
  );

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
        for (const item of visibleItems) next.add(item.id);
      } else {
        for (const item of visibleItems) next.delete(item.id);
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
    if (selectedItems.length === 0) {
      toast.warning('Selecciona al menos una pregunta.');
      return;
    }

    try {
      setIsApplyingBulk(true);
      await Promise.all(
        selectedItems.map((item) =>
          updateQuestion(item.id, {
            status: bulkStatus,
          })
        )
      );
      toast.success(`Estado actualizado en ${selectedItems.length} pregunta(s).`);
      await fetchQuestions();
    } catch {
      toast.error('No se pudo actualizar el estado del lote.');
    } finally {
      setIsApplyingBulk(false);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedItems.length === 0) {
      toast.warning('Selecciona al menos una pregunta.');
      return;
    }
    if (!window.confirm(`¿Eliminar ${selectedItems.length} pregunta(s)? Esta acción no se puede deshacer.`)) {
      return;
    }
    try {
      setIsApplyingBulk(true);
      await Promise.all(selectedItems.map((item) => deleteQuestion(item.id)));
      setSelectedQuestionIds(new Set());
      toast.success(`Eliminadas ${selectedItems.length} pregunta(s).`);
      await fetchQuestions();
    } catch {
      toast.error('No se pudo eliminar el lote seleccionado.');
    } finally {
      setIsApplyingBulk(false);
    }
  };

  const handleReviewDecision = async (status: Status.ACEPTADA | Status.RECHAZADA) => {
    const current = reviewItems[reviewIndex];
    if (!current) return;

    try {
      setIsSavingReviewAction(true);
      await updateQuestion(current.id, { status });
      toast.success(status === Status.ACEPTADA ? 'Pregunta aceptada' : 'Pregunta rechazada');
      await fetchQuestions();
      setReviewIndex((prev) => Math.max(0, Math.min(prev, reviewItems.length - 2)));
    } catch {
      toast.error('No se pudo actualizar el estado de la pregunta');
    } finally {
      setIsSavingReviewAction(false);
    }
  };

  const handleClearSelection = () => {
    setSelectedQuestionIds(new Set());
  };

  const handleModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    updateUrlState({ mode, page: 1 });
  };

  const handleSubtopicChange = (value: string) => {
    const next = value === 'all' ? '' : value;
    setFilters((prev) => ({ ...prev, subtopic: next }));
    setPage(1);
    updateUrlState({ subtopic: next, page: 1 });
  };

  const handleStatusChange = (value: string) => {
    const next = value === 'all' ? '' : (value as Status);
    setFilters((prev) => ({ ...prev, status: next }));
    setPage(1);
    updateUrlState({ status: next, page: 1 });
  };

  const handleDifficultyChange = (value: string) => {
    const next = value === 'all' ? '' : (value as Difficulty);
    setFilters((prev) => ({ ...prev, difficulty: next }));
    setPage(1);
    updateUrlState({ difficulty: next, page: 1 });
  };

  const handleCreatedDayChange = (value: string) => {
    setFilters((prev) => ({ ...prev, createdDay: value }));
    setPage(1);
    updateUrlState({ day: value, page: 1 });
  };

  const handleSortChange = (value: string) => {
    const next: SortDir = value === 'asc' ? 'asc' : 'desc';
    setFilters((prev) => ({ ...prev, sortDir: next }));
    setPage(1);
    updateUrlState({ sort: next, page: 1 });
  };

  const currentReviewQuestion = reviewItems[reviewIndex] || null;

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Preguntas de categoría {routeCategory}</h1>
          <p className="text-muted-foreground mt-1">Gestión unificada de filtros, selección multi-página y revisión.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline">
            <Link href="/admin/preguntas">Volver a categorías</Link>
          </Button>
          <Button variant="outline" onClick={() => void fetchQuestions()} disabled={loading}>
            <RefreshCcw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle>Gestión de preguntas</CardTitle>
              <CardDescription>
                Total cargadas: {allItems.length} · Filtradas: {filteredSortedItems.length} · Seleccionadas: {selectedQuestionIds.size}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant={viewMode === 'list' ? 'default' : 'outline'} onClick={() => handleModeChange('list')}>
                <Table2 className="mr-2 h-4 w-4" />
                Lista
              </Button>
              <Button variant={viewMode === 'review' ? 'default' : 'outline'} onClick={() => handleModeChange('review')}>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Revisión
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-6">
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

            <div className="space-y-2">
              <Label>Día de generación</Label>
              <Input type="date" value={filters.createdDay} onChange={(event) => handleCreatedDayChange(event.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Orden</Label>
              <Select value={filters.sortDir} onValueChange={handleSortChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">Fecha creación (nueva → antigua)</SelectItem>
                  <SelectItem value="asc">Fecha creación (antigua → nueva)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Selección</Label>
              <Button variant="outline" className="w-full" onClick={handleClearSelection}>
                Limpiar selección
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {viewMode === 'list' ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3">
                <div className="text-sm text-muted-foreground">
                  Página {safePage}/{totalPages} · Mostrando {visibleItems.length} de {filteredSortedItems.length}
                </div>
                <div className="flex flex-wrap items-center gap-2">
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

              <div className="overflow-x-auto">
                <table className="w-full min-w-[980px] text-sm">
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
                      <th className="py-3 px-2 text-left font-medium">Fecha y hora</th>
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
                    ) : visibleItems.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-muted-foreground">
                          No se encontraron preguntas para los filtros actuales.
                        </td>
                      </tr>
                    ) : (
                      visibleItems.map((question) => (
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
                          <td className="py-3 px-2 text-xs text-muted-foreground">{formatDateTime(question.created_at)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    const nextPage = Math.max(1, safePage - 1);
                    setPage(nextPage);
                    updateUrlState({ page: nextPage });
                  }}
                  disabled={safePage <= 1 || loading}
                >
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    const nextPage = Math.min(totalPages, safePage + 1);
                    setPage(nextPage);
                    updateUrlState({ page: nextPage });
                  }}
                  disabled={safePage >= totalPages || loading}
                >
                  Siguiente
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              {loading ? (
                <p className="text-sm text-muted-foreground">Cargando cola de revisión...</p>
              ) : !currentReviewQuestion ? (
                <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
                  No hay preguntas en revisión para los filtros actuales.
                </div>
              ) : (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3">
                    <p className="text-sm text-muted-foreground">
                      Revisión {reviewIndex + 1} de {reviewItems.length}
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setReviewIndex((prev) => Math.max(0, prev - 1))}
                        disabled={reviewIndex <= 0}
                      >
                        <ChevronLeft className="mr-2 h-4 w-4" />
                        Anterior
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setReviewIndex((prev) => Math.min(reviewItems.length - 1, prev + 1))}
                        disabled={reviewIndex >= reviewItems.length - 1}
                      >
                        Siguiente
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="rounded-lg border p-5 space-y-5">
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2">
                        {statusBadge(currentReviewQuestion.status)}
                        {difficultyBadge(currentReviewQuestion.difficulty)}
                        <Badge variant="outline">{currentReviewQuestion.category}</Badge>
                        <Badge variant="outline">{currentReviewQuestion.subtopic}</Badge>
                      </div>
                      <h3 className="text-xl font-semibold leading-8">{currentReviewQuestion.question}</h3>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Alternativas y feedback</h4>
                      {currentReviewQuestion.alternatives.map((alternative, index) => (
                        <div
                          key={`${currentReviewQuestion.id}-${index}`}
                          className={`rounded-lg border p-4 ${alternative.is_correct ? 'border-green-400 bg-green-50/40 dark:bg-green-950/20' : ''}`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-medium">{String.fromCharCode(65 + index)}. {alternative.text}</p>
                            {alternative.is_correct ? <Badge className="bg-green-600">Correcta</Badge> : null}
                          </div>
                          <p className="mt-2 text-sm text-muted-foreground">{alternative.feedback}</p>
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <div className="rounded-md border p-3">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">ID</p>
                        <p className="text-sm font-medium break-all">{currentReviewQuestion.id}</p>
                      </div>
                      <div className="rounded-md border p-3">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Creada</p>
                        <p className="text-sm font-medium">{formatDateTime(currentReviewQuestion.created_at)}</p>
                      </div>
                      <div className="rounded-md border p-3 md:col-span-2">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Referencia RAG</p>
                        <p className="text-sm font-medium">{currentReviewQuestion.pedagogic_metadata.rag_reference}</p>
                      </div>
                      <div className="rounded-md border p-3 md:col-span-2">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Explicación completa</p>
                        <p className="text-sm leading-6">{currentReviewQuestion.pedagogic_metadata.complete_explanation}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-end gap-2 border-t pt-4">
                      <Button
                        variant="destructive"
                        onClick={() => void handleReviewDecision(Status.RECHAZADA)}
                        disabled={isSavingReviewAction}
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Rechazar
                      </Button>
                      <Button
                        onClick={() => void handleReviewDecision(Status.ACEPTADA)}
                        disabled={isSavingReviewAction}
                      >
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Aceptar
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
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
                            <SelectItem value={Difficulty.FACIL}>Fácil</SelectItem>
                            <SelectItem value={Difficulty.MEDIO}>Medio</SelectItem>
                            <SelectItem value={Difficulty.DIFICIL}>Difícil</SelectItem>
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
