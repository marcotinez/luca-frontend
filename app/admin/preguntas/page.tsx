'use client';

import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";
import { getQuestions, deleteQuestion, createQuestion, updateQuestion } from "@/lib/questions.api";
import { QuestionResponse, QuestionCreate, FinancialTopic, Difficulty, Status, SubTopic } from "@/types";

// Mapeo de categorías a sus subtópicos
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


// Design Components
import { Trash2, MoreVertical, Search, RefreshCcw, Plus, Pencil, CheckCircle2, XCircle, Clock } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";

//////////////////////////////////////////

export default function PreguntasPage() {
  const [preguntas, setPreguntas] = useState<QuestionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Estados para Creación/Edición
  const [isQuestionDialogOpen, setIsQuestionDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<QuestionResponse | null>(null);

  const alternativeSchema = z.object({
    text: z.string().min(1, "El texto es requerido"),
    is_correct: z.boolean(),
    feedback: z.string().min(1, "El feedback es requerido"),
  });

  const questionSchema = z.object({
    category: z.nativeEnum(FinancialTopic, { message: "Categoría requerida" }),
    subtopic: z.nativeEnum(SubTopic, { message: "Subtópico requerido" }),
    difficulty: z.nativeEnum(Difficulty, { message: "Dificultad requerida" }),
    question: z.string().min(10, "La pregunta debe tener al menos 10 caracteres"),
    alternatives: z.array(alternativeSchema)
      .length(4, "Debe haber exactamente 4 alternativas")
      .refine(
        (alts) => alts.filter(a => a.is_correct).length === 1,
        "Debe haber exactamente 1 alternativa correcta"
      ),
    rag_reference: z.string().min(1, "La referencia RAG es requerida"),
    complete_explanation: z.string().min(10, "La explicación debe tener al menos 10 caracteres"),
    status: z.nativeEnum(Status, { message: "Estado requerido" }),
  });

  type QuestionFormValues = z.infer<typeof questionSchema>;

  const form = useForm<QuestionFormValues>({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      category: FinancialTopic.PLANIFICACION,
      subtopic: SubTopic.GASTOS_FIJOS_VARIABLES,
      difficulty: Difficulty.FACIL,
      question: "",
      alternatives: [
        { text: "", is_correct: false, feedback: "" },
        { text: "", is_correct: false, feedback: "" },
        { text: "", is_correct: false, feedback: "" },
        { text: "", is_correct: false, feedback: "" },
      ],
      rag_reference: "",
      complete_explanation: "",
      status: Status.EN_REVISION,
    }
  });

  const fetchPreguntas = async () => {
    try {
      setLoading(true);
      const statusFilter = filterStatus ? (filterStatus as Status) : undefined;
      const data = await getQuestions(0, 100, filterCategory || undefined, statusFilter);
      setPreguntas(data);
    } catch (error) {
      toast.error("Error al cargar las preguntas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPreguntas();
  }, [filterCategory, filterStatus]);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteQuestion(deleteId);
      toast.success("Pregunta eliminada");
      fetchPreguntas();
    } catch (error) {
      toast.error("Error al eliminar la pregunta");
    } finally {
      setDeleteId(null);
    }
  };

  const handleSaveQuestion = async (values: QuestionFormValues) => {
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

      if (editingQuestion) {
        await updateQuestion(editingQuestion.id, questionData);
        toast.success("Pregunta actualizada");
      } else {
        await createQuestion(questionData);
        toast.success("Pregunta creada");
      }
      setIsQuestionDialogOpen(false);
      fetchPreguntas();
    } catch (error) {
      toast.error("Error al guardar pregunta");
    }
  };

  const filteredPreguntas = preguntas.filter(p =>
    p.question.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: Status) => {
    switch (status) {
      case Status.ACEPTADA:
        return <Badge className="bg-green-600 hover:bg-green-700"><CheckCircle2 className="w-3 h-3 mr-1" />Aceptada</Badge>;
      case Status.RECHAZADA:
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Rechazada</Badge>;
      case Status.EN_REVISION:
        return <Badge className="bg-yellow-600 hover:bg-yellow-700"><Clock className="w-3 h-3 mr-1" />En Revisión</Badge>;
    }
  };

  const getDifficultyBadge = (difficulty: Difficulty) => {
    switch (difficulty) {
      case Difficulty.FACIL:
        return <Badge className="bg-green-100 text-green-800 border-green-300 hover:bg-green-200">Fácil</Badge>;
      case Difficulty.MEDIO:
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-200">Medio</Badge>;
      case Difficulty.DIFICIL:
        return <Badge className="bg-red-100 text-red-800 border-red-300 hover:bg-red-200">Difícil</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Preguntas</h1>
          <p className="text-muted-foreground">Administra el banco de preguntas de educación financiera.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchPreguntas} disabled={loading}>
            <RefreshCcw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          <Button variant="default" onClick={() => {
            setEditingQuestion(null);
            form.reset({
              category: FinancialTopic.PLANIFICACION,
              subtopic: SubTopic.GASTOS_FIJOS_VARIABLES,
              difficulty: Difficulty.FACIL,
              question: "",
              alternatives: [
                { text: "", is_correct: false, feedback: "" },
                { text: "", is_correct: false, feedback: "" },
                { text: "", is_correct: false, feedback: "" },
                { text: "", is_correct: false, feedback: "" },
              ],
              rag_reference: "",
              complete_explanation: "",
              status: Status.EN_REVISION,
            });
            setIsQuestionDialogOpen(true);
          }}>
            <Plus className="w-4 h-4 mr-2" />
            Nueva Pregunta
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>Listado de Preguntas</CardTitle>
              <CardDescription>Total: {preguntas.length} preguntas en el banco.</CardDescription>
            </div>
            <div className="flex flex-col md:flex-row gap-2">
              <div className="relative w-full md:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar pregunta..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={filterCategory || "all"} onValueChange={(val) => setFilterCategory(val === "all" ? "" : val)}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Todas las categorías" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {Object.values(FinancialTopic).map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterStatus || "all"} onValueChange={(val) => setFilterStatus(val === "all" ? "" : val)}>
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value={Status.ACEPTADA}>Aceptada</SelectItem>
                  <SelectItem value={Status.RECHAZADA}>Rechazada</SelectItem>
                  <SelectItem value={Status.EN_REVISION}>En Revisión</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-left font-medium py-4 px-2">Pregunta</th>
                  <th className="text-left font-medium py-4 px-2">Categoría</th>
                  <th className="text-left font-medium py-4 px-2">Dificultad</th>
                  <th className="text-left font-medium py-4 px-2">Estado</th>
                  <th className="text-left font-medium py-4 px-2">Fecha</th>
                  <th className="text-right font-medium py-4 px-2">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-muted-foreground">
                      Cargando preguntas...
                    </td>
                  </tr>
                ) : filteredPreguntas.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-muted-foreground">
                      No se encontraron preguntas.
                    </td>
                  </tr>
                ) : (
                  filteredPreguntas.map((p) => (
                    <tr key={p.id} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                      <td className="py-4 px-2 max-w-md">
                        <span className="font-medium text-foreground line-clamp-2">{p.question}</span>
                        <span className="text-xs text-muted-foreground block mt-1">{p.subtopic}</span>
                      </td>
                      <td className="py-4 px-2">
                        <span className="text-xs">{p.category}</span>
                      </td>
                      <td className="py-4 px-2">
                        {getDifficultyBadge(p.difficulty)}
                      </td>
                      <td className="py-4 px-2">
                        {getStatusBadge(p.status)}
                      </td>
                      <td className="py-4 px-2">
                        <span className="text-xs text-muted-foreground">
                          {new Date(p.created_at).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="py-4 px-2 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => {
                              setEditingQuestion(p);
                              form.reset({
                                category: p.category as FinancialTopic,
                                subtopic: p.subtopic as SubTopic,
                                difficulty: p.difficulty,
                                question: p.question,
                                alternatives: p.alternatives,
                                rag_reference: p.pedagogic_metadata.rag_reference,
                                complete_explanation: p.pedagogic_metadata.complete_explanation,
                                status: p.status,
                              });
                              setIsQuestionDialogOpen(true);
                            }}>
                              <Pencil className="w-4 h-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive focus:bg-destructive/5"
                              onClick={() => setDeleteId(p.id)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar pregunta?</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente la pregunta
              del banco de preguntas.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete}>Confirmar Eliminación</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isQuestionDialogOpen} onOpenChange={setIsQuestionDialogOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">{editingQuestion ? "Editar Pregunta" : "Nueva Pregunta"}</DialogTitle>
            <DialogDescription>
              {editingQuestion ? "Modifica los datos de la pregunta." : "Completa todos los campos para crear una nueva pregunta."}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSaveQuestion)} className="space-y-6 pt-4">

              {/* Sección 1: Información Básica */}
              <div className="space-y-4 p-4 bg-muted/30 rounded-lg border border-border">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Información Básica</h3>

                {/* Primera fila: Categoría y Subtópico */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => {
                      const selectedCategory = form.watch("category");
                      return (
                        <FormItem>
                          <FormLabel>Categoría</FormLabel>
                          <Select
                            onValueChange={(value) => {
                              field.onChange(value);
                              // Resetear subtópico al cambiar categoría
                              const newCategory = value as FinancialTopic;
                              const availableSubtopics = CATEGORY_SUBTOPICS[newCategory];
                              if (availableSubtopics && availableSubtopics.length > 0) {
                                form.setValue("subtopic", availableSubtopics[0]);
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
                              {Object.values(FinancialTopic).map(cat => (
                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
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
                      const selectedCategory = form.watch("category");
                      const availableSubtopics = selectedCategory
                        ? CATEGORY_SUBTOPICS[selectedCategory as FinancialTopic] || []
                        : [];

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
                              {availableSubtopics.map(sub => (
                                <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />
                </div>

                {/* Segunda fila: Dificultad y Estado */}
                <div className="grid grid-cols-2 gap-4">
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
              {/* Sección 2: Pregunta */}
              <div className="space-y-4 p-4 bg-muted/30 rounded-lg border border-border">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Pregunta</h3>
                <FormField
                  control={form.control}
                  name="question"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea
                          placeholder="Escribe la pregunta aquí..."
                          className="min-h-[100px] text-base"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Sección 3: Alternativas */}
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
                                      // Desmarcar todas las demás
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
                              <span className={`font-semibold text-sm ${isCorrect ? 'text-green-700 dark:text-green-400' : 'text-muted-foreground'}`}>
                                Opción {String.fromCharCode(65 + index)}
                              </span>
                              {isCorrect && (
                                <Badge className="bg-green-600 text-xs">Correcta</Badge>
                              )}
                            </div>

                            <FormField
                              control={form.control}
                              name={`alternatives.${index}.text`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input
                                      placeholder="Texto de la alternativa"
                                      {...field}
                                      className="font-medium"
                                    />
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

              {/* Sección 4: Metadatos Pedagógicos */}
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
                        <Textarea
                          placeholder="Explicación detallada del concepto..."
                          className="min-h-[100px]"
                          {...field}
                        />
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
                  {form.formState.isSubmitting ? "Guardando..." : editingQuestion ? "Actualizar Pregunta" : "Crear Pregunta"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
