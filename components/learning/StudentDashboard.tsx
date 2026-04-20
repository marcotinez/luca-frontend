"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowRight,
  BarChart3,
  Compass,
  Flame,
  Gauge,
  PlayCircle,
  Plus,
  Sparkles,
  Target,
} from "lucide-react";
import { DashboardNavbar } from "@/components/DashboardNavbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import { getLearningProfile } from "@/lib/users.api";
import { createPracticeTest, getAdaptiveStats, getPracticeTests } from "@/lib/learning.api";
import { apiErrorMessage, formatPracticeMinutes, toPercent } from "@/lib/learning.utils";
import type { AdaptiveStatsResponse, PracticeTestSummaryResponse, UserLearningProfile } from "@/types";

function scoreTone(score: number): string {
  if (score < 40) return "text-red-500";
  if (score < 70) return "text-amber-500";
  return "text-emerald-500";
}

export function StudentDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [learningProfile, setLearningProfile] = useState<UserLearningProfile | null>(
    user?.learning_profile || null,
  );
  const [summary, setSummary] = useState(user?.practice_history_summary || []);
  const [tests, setTests] = useState<PracticeTestSummaryResponse[]>([]);
  const [adaptiveStats, setAdaptiveStats] = useState<AdaptiveStatsResponse | null>(null);
  const [creatingTopic, setCreatingTopic] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      try {
        const [profile, testList, stats] = await Promise.all([
          getLearningProfile(user.id),
          getPracticeTests(),
          getAdaptiveStats(),
        ]);
        setLearningProfile(profile);
        setTests(testList);
        setSummary(user.practice_history_summary || []);
        setAdaptiveStats(stats);
      } catch (error) {
        toast.error(apiErrorMessage(error, "No se pudo cargar el dashboard de aprendizaje"));
      }
    };

    void loadData();
  }, [user]);

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

  const topProgress = useMemo(() => {
    return [...(learningProfile?.domain_knowledge || [])]
      .filter((item) => item.attempts > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  }, [learningProfile?.domain_knowledge]);

  const lowProgress = useMemo(() => {
    return [...(learningProfile?.domain_knowledge || [])]
      .filter((item) => item.attempts > 0)
      .sort((a, b) => a.score - b.score)
      .slice(0, 3);
  }, [learningProfile?.domain_knowledge]);

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
      const detail = (error as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail;
      const categoryInvalid = typeof detail === "string" && detail.includes("no está habilitada");
      if (categoryInvalid) {
        try {
          const fallback = await createPracticeTest({ question_count: 5, title: "Diagnóstico general" });
          toast.success("Se creó un diagnóstico general");
          router.push(`/practice/test/${fallback.id}`);
          return;
        } catch (fallbackError) {
          toast.error(apiErrorMessage(fallbackError, "No se pudo crear el diagnóstico general"));
          return;
        }
      }
      toast.error(apiErrorMessage(error, "No se pudo crear la prueba diagnóstica"));
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
          <section className="animate-enter-up overflow-hidden rounded-3xl border border-border/70 bg-background/80 shadow-sm backdrop-blur">
            <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1.35fr_1fr]">
              <div className="space-y-5">
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/80">Panel del estudiante</p>
                  <h1 className="text-3xl font-black tracking-tight sm:text-4xl">{`Hola, ${userName}.`}</h1>
                  <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
                    Crea tus diagnósticos, sigue donde quedaste y mantén tu ritmo de práctica sin perder foco.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-2xl border border-border/60 bg-card/80 p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Racha actual</p>
                    <p className="mt-2 flex items-center gap-2 text-2xl font-black"><Flame className="h-5 w-5 text-orange-500" />{currentStreak}</p>
                  </div>
                  <div className="rounded-2xl border border-border/60 bg-card/80 p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Tests completados</p>
                    <p className="mt-2 text-2xl font-black">{completedTests}</p>
                  </div>
                  <div className="rounded-2xl border border-border/60 bg-card/80 p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Pendientes</p>
                    <p className="mt-2 text-2xl font-black">{activeTests.length}</p>
                  </div>
                  <div className="rounded-2xl border border-border/60 bg-card/80 p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Tiempo total</p>
                    <p className="mt-2 text-2xl font-black">{formatPracticeMinutes(learningProfile?.total_practice_minutes || 0)}</p>
                  </div>
                </div>
              </div>

              <aside className="rounded-3xl border border-primary/20 bg-primary/8 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary/80">Ajuste adaptativo</p>
                <h2 className="mt-2 text-xl font-black">Siguiente mejor foco</h2>
                <div className="mt-4 space-y-2 text-sm">
                  <p className="flex items-center justify-between gap-3 border-b border-primary/15 pb-2">
                    <span className="text-muted-foreground">Categoría</span>
                    <span className="font-semibold">{adaptiveStats?.current_focus_category || "Sin foco"}</span>
                  </p>
                  <p className="flex items-center justify-between gap-3 border-b border-primary/15 pb-2">
                    <span className="text-muted-foreground">Dificultad</span>
                    <span className="font-semibold">{adaptiveStats?.current_focus_difficulty || "Medio"}</span>
                  </p>
                  <p className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Tests adaptativos</span>
                    <span className="font-semibold">{adaptiveStats?.recommended_tests || 0}</span>
                  </p>
                </div>
                <Button className="mt-5 w-full justify-between rounded-xl" onClick={() => router.push("/practice/new")}> 
                  Crear evaluación personalizada
                  <Plus className="h-4 w-4" />
                </Button>
              </aside>
            </div>
          </section>

          <section className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
            <div className="animate-enter-up rounded-3xl border border-border/70 bg-card/80 p-5 shadow-sm backdrop-blur sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-black">Zona de acción rápida</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Empieza un diagnóstico o continúa un test en curso.</p>
                </div>
                <Button variant="outline" className="rounded-xl" onClick={() => router.push("/profile/progress")}> 
                  Ver progreso
                  <BarChart3 className="h-4 w-4" />
                </Button>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => handleCreateDiagnostic()}
                  disabled={creatingTopic !== null}
                  className="group rounded-2xl border border-border/70 bg-background/75 p-4 text-left transition hover:-translate-y-0.5 hover:border-primary/40"
                >
                  <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Diagnóstico general</p>
                  <p className="mt-2 text-base font-semibold">Comenzar ahora</p>
                  <p className="mt-1 text-sm text-muted-foreground">5 preguntas para definir tu punto de partida.</p>
                  <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary">{creatingTopic === "general" ? "Creando..." : "Iniciar"}<ArrowRight className="h-4 w-4" /></span>
                </button>

                <button
                  type="button"
                  onClick={() => router.push("/practice/new")}
                  className="group rounded-2xl border border-border/70 bg-background/75 p-4 text-left transition hover:-translate-y-0.5 hover:border-primary/40"
                >
                  <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Tu evaluación</p>
                  <p className="mt-2 text-base font-semibold">Crear test personalizado</p>
                  <p className="mt-1 text-sm text-muted-foreground">Elige categoría, subtópico y dificultad.</p>
                  <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary">Configurar<ArrowRight className="h-4 w-4" /></span>
                </button>
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
                      <span>{topic}</span>
                      <PlayCircle className="h-4 w-4 text-primary" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="animate-enter-up space-y-5">
              <div className="rounded-3xl border border-border/70 bg-card/80 p-5 shadow-sm backdrop-blur sm:p-6">
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

              <div className="rounded-3xl border border-border/70 bg-card/80 p-5 shadow-sm backdrop-blur sm:p-6">
                <h3 className="text-lg font-black">Pulso de rendimiento</h3>
                <div className="mt-4 grid gap-2">
                  {(summary.length > 0 ? summary.slice(0, 4) : []).map((item) => (
                    <div key={item.topic} className="flex items-center justify-between rounded-xl border border-border/65 bg-background/70 px-3 py-2 text-sm">
                      <span className="truncate pr-2">{item.topic}</span>
                      <span className={`font-semibold ${scoreTone(toPercent(item.recent_accuracy))}`}>{toPercent(item.recent_accuracy)}%</span>
                    </div>
                  ))}
                  {summary.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-border/60 bg-background/70 p-3 text-sm text-muted-foreground">Aún no hay datos suficientes para calcular precisión por tema.</p>
                  ) : null}
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-5 lg:grid-cols-2">
            <div className="animate-enter-up rounded-3xl border border-border/70 bg-card/80 p-5 shadow-sm backdrop-blur sm:p-6">
              <div className="mb-4 flex items-center gap-2">
                <Compass className="h-5 w-5 text-emerald-500" />
                <h3 className="text-lg font-black">Fortalezas actuales</h3>
              </div>
              <div className="space-y-2">
                {topProgress.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Completa tus primeros tests para ver fortalezas.</p>
                ) : (
                  topProgress.map((item) => (
                    <div key={item.topic} className="rounded-xl border border-border/65 bg-background/70 px-3 py-2 text-sm">
                      <div className="flex items-center justify-between gap-2">
                        <span>{item.topic}</span>
                        <span className="font-semibold text-emerald-500">{Math.round(item.score)}%</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="animate-enter-up rounded-3xl border border-border/70 bg-card/80 p-5 shadow-sm backdrop-blur sm:p-6">
              <div className="mb-4 flex items-center gap-2">
                <Target className="h-5 w-5 text-amber-500" />
                <h3 className="text-lg font-black">Temas por reforzar</h3>
              </div>
              <div className="space-y-2">
                {lowProgress.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Aún no hay suficientes intentos para sugerir refuerzo.</p>
                ) : (
                  lowProgress.map((item) => (
                    <div key={item.topic} className="rounded-xl border border-border/65 bg-background/70 px-3 py-2 text-sm">
                      <div className="flex items-center justify-between gap-2">
                        <span>{item.topic}</span>
                        <span className={`font-semibold ${scoreTone(item.score)}`}>{Math.round(item.score)}%</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <Button className="mt-4 w-full justify-between rounded-xl" variant="outline" onClick={() => router.push("/practice/new")}> 
                Practicar con foco adaptativo
                <Sparkles className="h-4 w-4" />
              </Button>
            </div>
          </section>
        </main>
      </div>
    </ProtectedRoute>
  );
}
