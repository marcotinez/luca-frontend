"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowRight, Flame, Plus } from "lucide-react";
import { DashboardNavbar } from "@/components/DashboardNavbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import { getLearningProfile } from "@/lib/users.api";
import { createPracticeTest, getAdaptiveStats, getPracticeTests } from "@/lib/learning.api";
import { apiErrorMessage } from "@/lib/learning.utils";
import type { AdaptiveStatsResponse, PracticeTestSummaryResponse, UserLearningProfile } from "@/types";

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
        setTests(testList.slice(0, 6));
        setSummary(user.practice_history_summary || []);
        setAdaptiveStats(stats);
      } catch (error) {
        toast.error(apiErrorMessage(error, "No se pudo cargar el dashboard de aprendizaje"));
      }
    };

    loadData();
  }, [user]);

  const activeTests = useMemo(
    () => tests.filter((test) => test.status !== "completed"),
    [tests],
  );

  const completedTests = useMemo(
    () => tests.filter((test) => test.status === "completed").length,
    [tests],
  );

  const isNewStudent = useMemo(() => {
    const hasPracticeHistory = summary.length > 0;
    const hasTrackedDomains = (learningProfile?.domain_knowledge?.length || 0) > 0;
    const hasPracticeTime = (learningProfile?.total_practice_minutes || 0) > 0;

    return !hasPracticeHistory && !hasTrackedDomains && !hasPracticeTime && completedTests === 0;
  }, [completedTests, learningProfile?.domain_knowledge?.length, learningProfile?.total_practice_minutes, summary.length]);

  const recommendedTopics = useMemo(() => {
    const topics = user?.profile.interests || [];

    return topics.filter((topic, index) => {
      const normalizedTopic = topic.trim().toLocaleLowerCase();

      return normalizedTopic.length > 0 && index === topics.findIndex((candidate) => candidate.trim().toLocaleLowerCase() === normalizedTopic);
    });
  }, [user?.profile.interests]);

  const weakestTopics = useMemo(() => {
    const fromSummary = [...summary]
      .filter((item) => item.total_seen > 0)
      .sort((a, b) => a.recent_accuracy - b.recent_accuracy)
      .slice(0, 3)
      .map((item) => item.topic);

    if (fromSummary.length > 0) {
      return fromSummary;
    }

    const fromDomains = [...(learningProfile?.domain_knowledge || [])]
      .filter((item) => item.attempts > 0)
      .sort((a, b) => a.score - b.score)
      .slice(0, 3)
      .map((item) => item.topic);

    return fromDomains;
  }, [learningProfile?.domain_knowledge, summary]);

  const suggestedTopics = useMemo(() => {
    const ordered = isNewStudent
      ? recommendedTopics
      : [...weakestTopics, ...recommendedTopics];

    return ordered.filter((topic, index) => ordered.indexOf(topic) === index).slice(0, 4);
  }, [isNewStudent, recommendedTopics, weakestTopics]);

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
        title: topic ? `Diagnóstico inicial: ${topic}` : "Diagnóstico inicial",
      });
      toast.success("Prueba diagnóstica creada");
      router.push(`/practice/test/${test.id}`);
    } catch (error) {
      const detail = (error as any)?.response?.data?.detail;
      const categoryInvalid = typeof detail === "string" && detail.includes("no está habilitada");
      if (categoryInvalid) {
        try {
          const fallback = await createPracticeTest({
            question_count: 5,
            title: "Diagnóstico inicial",
          });
          toast.success("Se creó diagnóstico general por cambios de taxonomía");
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
        <main className="mx-auto max-w-7xl space-y-7 px-4 py-8 sm:px-6 lg:px-8">
          <section className="animate-enter-up rounded-3xl border border-border/70 bg-card/80 shadow-sm backdrop-blur">
            <div className="grid grid-cols-1 gap-6 p-6 sm:p-8 lg:grid-cols-[1.5fr_0.85fr] lg:items-stretch">
              <div className="space-y-6">
                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary/80">
                    {isNewStudent ? "Bienvenida" : "Inicio"}
                  </p>
                  <div className="space-y-2">
                    <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
                      {`Hola, ${userName}.`}
                    </h1>
                    <p className="max-w-3xl text-sm text-muted-foreground sm:text-base">
                      {isNewStudent
                        ? "Realiza tus pruebas de diagnóstico para que Luca pueda personalizar mejor tu experiencia."
                        : "Encuentra recomendaciones útiles, inicia una nueva evaluación y revisa tu progreso cuando lo necesites."}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  {!isNewStudent ? (
                    <Button
                      size="lg"
                      className="h-11 w-full rounded-xl px-5 sm:w-auto"
                      onClick={() => router.push("/practice/new")}
                    >
                      <Plus className="h-4 w-4" />
                      Nueva evaluación
                    </Button>
                  ) : null}
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-11 w-full rounded-xl px-5 sm:w-auto"
                    onClick={() => router.push("/profile/progress")}
                  >
                    <span className="whitespace-nowrap">Ver progreso completo</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="hidden items-center justify-center lg:flex lg:justify-end">
                <div className="flex min-h-[200px] w-full max-w-[250px] flex-col items-center justify-center rounded-[1.75rem] border border-border/60 bg-background/85 px-5 py-6 text-center">
                  <div className="mb-4 rounded-[1.15rem] bg-orange-500/12 p-3.5 text-orange-500">
                    <Flame className="h-8 w-8" />
                  </div>
                  <p className="text-5xl font-black tracking-tight text-foreground">
                    {currentStreak}
                  </p>
                  <p className="mt-2 text-xs font-black uppercase tracking-[0.28em] text-muted-foreground">
                    Días racha
                  </p>
                </div>
              </div>
            </div>
          </section>

          {isNewStudent ? (
            <section className="grid grid-cols-1 gap-5 xl:grid-cols-[1.1fr_0.9fr]">
              <Card className="border-border/70 bg-card/80 shadow-sm backdrop-blur">
                <CardHeader className="border-b border-border/60 pb-4">
                  <CardTitle className="text-lg">Pruebas de diagnóstico</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Empieza por aquí para construir tu línea base en los temas que te interesan.
                  </p>
                </CardHeader>
                <CardContent className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 sm:p-5">
                  {recommendedTopics.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-border/60 bg-background/70 p-4 text-sm text-muted-foreground sm:col-span-2">
                      No hay temas seleccionados todavía. Puedes comenzar con un diagnóstico general.
                    </div>
                  ) : (
                    recommendedTopics.map((topic) => (
                      <article
                        key={topic}
                        className="rounded-2xl border border-border/60 bg-background/80 p-4"
                      >
                        <div className="space-y-3">
                          <div className="space-y-1">
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/80">
                              Diagnóstico inicial
                            </p>
                            <h3 className="font-semibold text-foreground">{topic}</h3>
                            <p className="text-sm text-muted-foreground">
                              Responde una prueba breve para medir tu nivel actual en esta categoría.
                            </p>
                          </div>
                          <Button
                            className="w-full justify-between rounded-xl"
                            disabled={creatingTopic !== null}
                            onClick={() => handleCreateDiagnostic(topic)}
                          >
                            {creatingTopic === topic ? "Creando..." : "Hacer diagnóstico"}
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </article>
                    ))
                  )}
                </CardContent>
              </Card>

              <div className="space-y-4">
                {adaptiveStats ? (
                  <Card className="border-border/70 bg-card/80 shadow-sm backdrop-blur">
                    <CardHeader className="border-b border-border/60 pb-4">
                      <CardTitle className="text-lg">Ajuste adaptativo</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        La app está ajustando las evaluaciones según tu rendimiento reciente.
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-2 p-4 sm:p-5 text-sm">
                      <p>
                        Foco actual:{" "}
                        <span className="font-semibold">
                          {adaptiveStats.current_focus_category || "Sin foco definido"}
                        </span>
                      </p>
                      <p>
                        Dificultad objetivo:{" "}
                        <span className="font-semibold">
                          {adaptiveStats.current_focus_difficulty || "Medio"}
                        </span>
                      </p>
                      <p className="text-muted-foreground">
                        Tests adaptativos realizados: {adaptiveStats.recommended_tests}
                      </p>
                    </CardContent>
                  </Card>
                ) : null}

                {activeTests.length > 0 ? (
                  <Card className="border-border/70 bg-card/80 shadow-sm backdrop-blur">
                    <CardHeader className="border-b border-border/60 pb-4">
                      <CardTitle className="text-lg">Continuidad</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Tienes diagnósticos pendientes para retomar.
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-3 p-4 sm:p-5">
                      {activeTests.slice(0, 2).map((test) => (
                        <button
                          key={test.id}
                          type="button"
                          className="flex w-full items-center justify-between rounded-2xl border border-border/60 bg-background/80 px-4 py-4 text-left transition-colors hover:border-primary/35"
                          onClick={() => router.push(`/practice/test/${test.id}`)}
                        >
                          <div className="space-y-1">
                            <p className="text-sm font-semibold">
                              {test.title || "Diagnóstico en curso"}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {test.answered_questions}/{test.total_questions} preguntas respondidas
                            </p>
                          </div>
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        </button>
                      ))}
                    </CardContent>
                  </Card>
                ) : null}
              </div>
            </section>
          ) : (
            <section className="grid grid-cols-1 gap-5 xl:grid-cols-[1.1fr_0.9fr]">
              <Card className="border-border/70 bg-card/80 shadow-sm backdrop-blur">
                <CardHeader className="border-b border-border/60 pb-4">
                  <CardTitle className="text-lg">Qué te conviene hacer ahora</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Te sugerimos evaluaciones breves según tus intereses y tus temas más débiles.
                  </p>
                </CardHeader>
                <CardContent className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 sm:p-5">
                  {suggestedTopics.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-border/60 bg-background/70 p-4 text-sm text-muted-foreground sm:col-span-2">
                      No hay categorías sugeridas todavía. Puedes empezar con una evaluación general.
                    </div>
                  ) : (
                    suggestedTopics.map((topic) => (
                      <article
                        key={topic}
                        className="rounded-2xl border border-border/60 bg-background/80 p-4"
                      >
                        <div className="space-y-3">
                          <div className="space-y-1">
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/80">
                              {weakestTopics.includes(topic) ? "Refuerzo sugerido" : "Evaluación sugerida"}
                            </p>
                            <h3 className="font-semibold text-foreground">{topic}</h3>
                            <p className="text-sm text-muted-foreground">
                              {weakestTopics.includes(topic)
                                ? "Conviene reforzar este tema con una práctica breve."
                                : "Responde una evaluación corta para medir tu nivel en esta categoría."}
                            </p>
                          </div>
                          <Button
                            className="w-full justify-between rounded-xl"
                            disabled={creatingTopic !== null}
                            onClick={() => handleCreateDiagnostic(topic)}
                          >
                            {creatingTopic === topic ? "Creando..." : "Iniciar evaluación"}
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </article>
                    ))
                  )}
                </CardContent>
              </Card>

              <div className="space-y-4">
                {activeTests.length > 0 ? (
                  <Card className="border-border/70 bg-card/80 shadow-sm backdrop-blur">
                    <CardHeader className="border-b border-border/60 pb-4">
                      <CardTitle className="text-lg">Continuidad</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Tienes evaluaciones pendientes para retomar.
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-3 p-4 sm:p-5">
                      {activeTests.slice(0, 2).map((test) => (
                        <button
                          key={test.id}
                          type="button"
                          className="flex w-full items-center justify-between rounded-2xl border border-border/60 bg-background/80 px-4 py-4 text-left transition-colors hover:border-primary/35"
                          onClick={() => router.push(`/practice/test/${test.id}`)}
                        >
                        <div className="space-y-1">
                          <p className="text-sm font-semibold">
                            {test.title || "Evaluación en curso"}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                            <span>{test.answered_questions}/{test.total_questions} preguntas respondidas</span>
                            {test.selection_mode ? (
                              <Badge variant="outline">
                                {test.selection_mode === "recommended" ? "Recomendada" : "Por categoría"}
                              </Badge>
                            ) : null}
                          </div>
                        </div>
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        </button>
                      ))}
                    </CardContent>
                  </Card>
                ) : null}
              </div>
            </section>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
