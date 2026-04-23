"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowRight,
  Flame,
  PlayCircle,
  Plus,
} from "lucide-react";
import { DashboardNavbar } from "@/components/DashboardNavbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import { getLearningProfile } from "@/lib/users.api";
import { createPracticeTest, getPracticeTestAvailability, getPracticeTests } from "@/lib/learning.api";
import {
  apiErrorMessage,
  formatPracticeMinutes,
  getCompletedDiagnosticCategories,
  INITIAL_DIAGNOSTIC_CATEGORIES,
} from "@/lib/learning.utils";
import { readStorage, writeStorage } from "@/lib/client-storage";
import type { PracticeTestSummaryResponse, UserLearningProfile } from "@/types";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function StudentDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [learningProfile, setLearningProfile] = useState<UserLearningProfile | null>(
    user?.learning_profile || null,
  );
  const [summary, setSummary] = useState(user?.practice_history_summary || []);
  const [tests, setTests] = useState<PracticeTestSummaryResponse[]>([]);
  const [creatingTopic, setCreatingTopic] = useState<string | null>(null);
  const [diagnosticAvailability, setDiagnosticAvailability] = useState<Record<string, boolean>>({});
  const [showUnlockModal, setShowUnlockModal] = useState(false);

  const unlockModalStorageKey = user ? `diagnostic-unlock-shown:${user.id}` : null;

  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      try {
        const [profile, testList, availabilityRows] = await Promise.all([
          getLearningProfile(user.id),
          getPracticeTests(),
          Promise.all(
            INITIAL_DIAGNOSTIC_CATEGORIES.map(async (category) => {
              try {
                const availability = await getPracticeTestAvailability({ category, question_count: 5 });
                return [category, availability.available_total > 0] as const;
              } catch {
                return [category, false] as const;
              }
            }),
          ),
        ]);
        setLearningProfile(profile);
        setTests(testList);
        setSummary(user.practice_history_summary || []);
        setDiagnosticAvailability(Object.fromEntries(availabilityRows));
        const completedDiagnosticCategories = getCompletedDiagnosticCategories(testList);
        const diagnosticsCompleted = completedDiagnosticCategories.length >= INITIAL_DIAGNOSTIC_CATEGORIES.length;
        if (diagnosticsCompleted && unlockModalStorageKey) {
          const alreadyShown = readStorage<boolean>(unlockModalStorageKey, false);
          if (!alreadyShown) {
            setShowUnlockModal(true);
            writeStorage(unlockModalStorageKey, true);
          }
        }
      } catch (error) {
        toast.error(apiErrorMessage(error, "No se pudo cargar el dashboard de aprendizaje"));
      }
    };

    void loadData();
  }, [unlockModalStorageKey, user]);

  const activeTests = useMemo(() => tests.filter((test) => test.status !== "completed"), [tests]);
  const completedTests = useMemo(() => tests.filter((test) => test.status === "completed").length, [tests]);

  const recommendedTopics = useMemo(() => {
    const topics = user?.profile.interests || [];
    return topics
      .map((topic) => topic.trim())
      .filter((topic, index, arr) => topic.length > 0 && index === arr.findIndex((item) => item.toLowerCase() === topic.toLowerCase()));
  }, [user?.profile.interests]);

  const weakestTopics = useMemo(() => {
    const fromSummary = [...summary]
      .filter((item) => item.total_seen > 0)
      .sort((a, b) => a.recent_accuracy - b.recent_accuracy)
      .slice(0, 3)
      .map((item) => item.topic);

    if (fromSummary.length > 0) return fromSummary;

    return [...(learningProfile?.domain_knowledge || [])]
      .filter((item) => item.attempts > 0)
      .sort((a, b) => a.score - b.score)
      .slice(0, 3)
      .map((item) => item.topic);
  }, [learningProfile?.domain_knowledge, summary]);

  const suggestedTopics = useMemo(() => {
    const mix = [...weakestTopics, ...recommendedTopics];
    return mix.filter((topic, index) => mix.indexOf(topic) === index).slice(0, 4);
  }, [recommendedTopics, weakestTopics]);

  const userEmail = user?.email || "estudiante";
  const currentStreak = user?.gamification.current_streak || 0;

  const userName = useMemo(() => {
    const emailName = userEmail.split("@")[0] || "estudiante";
    return emailName
      .split(/[._-]/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  }, [userEmail]);

  const diagnosticByCategory = useMemo(() => {
    return INITIAL_DIAGNOSTIC_CATEGORIES.map((category) => {
      const categoryTests = tests.filter(
        (test) => test.target_category === category && test.selection_mode === "category",
      );
      const active = categoryTests.find((test) => test.status !== "completed") || null;
      const completed = categoryTests.some((test) => test.status === "completed");
      return {
        category,
        active,
        completed,
        status: completed ? "completed" : active ? "in_progress" : "pending",
      };
    });
  }, [tests]);

  const completedDiagnosticsCount = useMemo(
    () => diagnosticByCategory.filter((item) => item.completed).length,
    [diagnosticByCategory],
  );

  const isDiagnosticPhase = completedDiagnosticsCount < INITIAL_DIAGNOSTIC_CATEGORIES.length;

  const handleCreateDiagnostic = async (topic?: string) => {
    try {
      setCreatingTopic(topic || "general");
      const test = await createPracticeTest({
        question_count: 5,
        category: topic,
        title: topic ? `Diagnóstico: ${topic}` : "Diagnóstico general",
      });
      toast.success("Diagnóstico creado");
      router.push(`/practice/test/${test.id}`);
    } catch (error) {
      toast.error(apiErrorMessage(error, "No se pudo crear el diagnóstico para esta categoría"));
    } finally {
      setCreatingTopic(null);
    }
  };

  if (!user) return null;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-grid-soft pb-20">
        <DashboardNavbar />
        <main className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">

          {isDiagnosticPhase ? (
            <div className="space-y-6 animate-enter-up mt-4">
              <section className="overflow-hidden rounded-3xl border border-border/70 bg-card/90 shadow-sm backdrop-blur p-6 sm:p-8">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/80">Panel del estudiante</p>
                <h1 className="mt-2 flex items-center gap-2 text-3xl font-black tracking-tight sm:text-4xl">
                  Hola <span className="inline-block animate-wave origin-[70%_70%]">👋</span>
                </h1>
                <p className="mt-2 text-sm text-muted-foreground sm:text-base max-w-2xl">
                  Vamos paso a paso: completa esta primera etapa para desbloquear tus evaluaciones personalizadas.
                </p>
              </section>

              <section className="overflow-hidden rounded-3xl border border-border/70 bg-card/90 shadow-sm backdrop-blur p-6 sm:p-8">
                <div className="mb-6 space-y-3">
                  <h2 className="text-2xl font-black tracking-tight sm:text-3xl">Evaluaciones de diagnóstico</h2>
                  <p className="max-w-3xl text-sm text-muted-foreground sm:text-base">
                    Para personalizar tus próximas evaluaciones, completa los 3 diagnósticos iniciales (uno por categoría).
                  </p>
                  <div className="inline-flex items-center gap-2 rounded-xl border border-primary/35 bg-primary/10 px-4 py-2">
                    <span className="text-xs font-bold uppercase tracking-[0.14em] text-primary/90">Progreso diagnóstico</span>
                    <span className="text-lg font-black text-primary">
                      {completedDiagnosticsCount}/{INITIAL_DIAGNOSTIC_CATEGORIES.length}
                    </span>
                  </div>
                </div>
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {diagnosticByCategory.map(({ category, status, active, completed }) => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => {
                        if (completed) return;
                        if (active) {
                          router.push(`/practice/test/${active.id}`);
                          return;
                        }
                        void handleCreateDiagnostic(category);
                      }}
                      disabled={creatingTopic !== null}
                      className="group relative overflow-hidden rounded-3xl border border-border/60 bg-card/60 p-6 text-left transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:bg-card hover:shadow-xl hover:shadow-primary/5"
                    >
                      <div className="relative z-10 flex flex-col h-full justify-between">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-[0.15em] text-primary/80">Diagnóstico</p>
                          <p className="mt-2 text-xl font-black leading-tight text-foreground">{category}</p>
                          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">5 preguntas clave para definir tu punto de partida en esta área.</p>
                          <div className="mt-3">
                            {status === "completed" ? (
                              <Badge className="bg-emerald-600">Completado</Badge>
                            ) : status === "in_progress" ? (
                              <Badge variant="secondary">En curso</Badge>
                            ) : !diagnosticAvailability[category] ? (
                              <Badge variant="destructive">Sin preguntas por ahora</Badge>
                            ) : (
                              <Badge variant="outline">Pendiente</Badge>
                            )}
                          </div>
                        </div>
                        <div className="mt-6">
                          <span className="inline-flex items-center gap-2 text-sm font-bold text-primary bg-primary/10 px-4 py-2.5 rounded-full group-hover:bg-primary/20 transition-colors">
                            {completed
                              ? "Completado"
                              : active
                                ? "Continuar"
                                : !diagnosticAvailability[category]
                                  ? "Intentar"
                                  : creatingTopic === category
                                    ? "Creando..."
                                    : "Comenzar"}
                            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            </div>
          ) : (
            <>
              <section className="animate-enter-up overflow-hidden rounded-3xl border border-border/70 bg-card/90 shadow-sm backdrop-blur">
                <div className="p-6 sm:p-8">
                  <div className="space-y-5">
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/80">Panel del estudiante</p>
                      <h1 className="flex items-center gap-2 text-3xl font-black tracking-tight sm:text-4xl">
                        Hola <span className="inline-block animate-wave origin-[70%_70%]">👋</span>
                      </h1>
                      <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
                        Sigue donde quedaste y mantén tu ritmo de práctica sin perder foco.
                      </p>
                    </div>

                    <div className="inline-block rounded-2xl border border-border/60 bg-card/80 p-4 min-w-[200px]">
                      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Racha actual</p>
                      <p className="mt-2 flex items-center gap-2 text-2xl font-black"><Flame className="h-5 w-5 text-orange-500" />{currentStreak} días</p>
                    </div>
                  </div>
                </div>
              </section>

              <section className="animate-enter-up mt-6">
                <div 
                  onClick={() => router.push("/practice/new")}
                  className="cursor-pointer group relative overflow-hidden rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-background p-8 transition-all hover:border-primary/60 hover:shadow-lg hover:shadow-primary/10"
                >
                  <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                      <h2 className="text-3xl font-black text-foreground">Crear nueva evaluación</h2>
                      <p className="mt-2 text-lg text-muted-foreground max-w-xl">
                        Pon a prueba tus conocimientos generando un test a tu medida o deja que te recomendemos uno.
                      </p>
                    </div>
                    <Button size="lg" className="rounded-full px-8 py-6 text-lg font-bold group-hover:scale-105 transition-transform shadow-md">
                      Comenzar <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </div>
                  <div className="absolute -right-12 -top-12 h-64 w-64 rounded-full bg-primary/5 blur-3xl group-hover:bg-primary/10 transition-colors" />
                </div>
              </section>

              <section className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
                <div className="animate-enter-up rounded-3xl border border-border/70 bg-card/80 p-5 shadow-sm backdrop-blur sm:p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-black">Acción rápida</h2>
                      <p className="mt-1 text-sm text-muted-foreground">Empieza un test sugerido inmediatamente.</p>
                    </div>
                  </div>

                  <div className="mt-5 space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Sugerencias por tema</p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {(suggestedTopics.length > 0 ? suggestedTopics : ["Diagnóstico general"]).map((topic) => (
                        <button
                          key={topic}
                          type="button"
                          onClick={() => (topic === "Diagnóstico general" ? handleCreateDiagnostic() : handleCreateDiagnostic(topic))}
                          disabled={creatingTopic !== null}
                          className="flex items-center justify-between rounded-xl border border-border/65 bg-background/70 px-3 py-2 text-left text-sm transition hover:border-primary/40"
                        >
                          <span className="truncate pr-2">{topic}</span>
                          <PlayCircle className="h-4 w-4 text-primary shrink-0" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="animate-enter-up rounded-3xl border border-border/70 bg-card/80 p-5 shadow-sm backdrop-blur sm:p-6">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-lg font-black">Continuar tests</h3>
                    <Badge variant="outline">{activeTests.length}</Badge>
                  </div>
                  <div className="mt-4 space-y-2">
                    {activeTests.length === 0 ? (
                      <p className="rounded-xl border border-dashed border-border/60 bg-background/70 p-3 text-sm text-muted-foreground">No tienes evaluaciones pendientes.</p>
                    ) : (
                      activeTests.slice(0, 4).map((test) => (
                        <button
                          key={test.id}
                          type="button"
                          onClick={() => router.push(`/practice/test/${test.id}`)}
                          className="w-full rounded-xl border border-border/65 bg-background/70 p-3 text-left transition hover:border-primary/40"
                        >
                          <p className="text-sm font-semibold">{test.title || "Evaluación en curso"}</p>
                          <p className="mt-1 text-xs text-muted-foreground">{test.answered_questions}/{test.total_questions} respondidas</p>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </section>
            </>
          )}

        </main>
      </div>
      <Dialog open={showUnlockModal} onOpenChange={setShowUnlockModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Bienvenido a la plataforma</DialogTitle>
            <DialogDescription>
              Terminaste tus diagnósticos iniciales. Se desbloqueó la creación de evaluaciones personalizadas.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-2xl border border-border/70 bg-card/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary/80">Nuevo desbloqueo</p>
            <p className="mt-1 text-sm text-foreground">Ya puedes crear evaluaciones por categoría o recomendadas según tu progreso.</p>
          </div>
          <DialogFooter className="pt-2">
            <Button onClick={() => setShowUnlockModal(false)} className="w-full sm:w-auto">
              Entendido
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ProtectedRoute>
  );
}
