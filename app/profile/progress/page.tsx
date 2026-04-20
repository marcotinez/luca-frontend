"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowRight, Clock3, Flame, Medal, Target } from "lucide-react";
import { DashboardNavbar } from "@/components/DashboardNavbar";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import { getLearningProfile } from "@/lib/users.api";
import { getPracticeTests } from "@/lib/learning.api";
import { apiErrorMessage, formatDateTime, formatPracticeMinutes, toPercent } from "@/lib/learning.utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { PracticeTestSummaryResponse, UserLearningProfile } from "@/types";

function scoreClass(score: number): string {
  if (score < 40) return "text-red-500";
  if (score < 70) return "text-amber-500";
  return "text-emerald-500";
}

export default function ProfileProgressPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<UserLearningProfile | null>(user?.learning_profile || null);
  const [tests, setTests] = useState<PracticeTestSummaryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const practiceHistorySummary = user?.practice_history_summary || [];

  useEffect(() => {
    if (!user) return;

    const run = async () => {
      setLoading(true);
      try {
        const [profileResponse, testsResponse] = await Promise.all([
          getLearningProfile(user.id),
          getPracticeTests(),
        ]);
        setProfile(profileResponse);
        setTests(testsResponse);
      } catch (error) {
        toast.error(apiErrorMessage(error, "No se pudo cargar el progreso"));
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, [user]);

  const completedTests = useMemo(() => tests.filter((item) => item.status === "completed"), [tests]);
  const pendingTests = useMemo(() => tests.filter((item) => item.status !== "completed"), [tests]);

  const strengths = useMemo(() => {
    return [...(profile?.domain_knowledge || [])]
      .filter((item) => item.attempts > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  }, [profile?.domain_knowledge]);

  const improvements = useMemo(() => {
    return [...(profile?.domain_knowledge || [])]
      .filter((item) => item.attempts > 0)
      .sort((a, b) => a.score - b.score)
      .slice(0, 3);
  }, [profile?.domain_knowledge]);

  const recentAttempts = useMemo(() => {
    return [...(profile?.practice_history || [])]
      .sort((a, b) => new Date(b.practiced_at).getTime() - new Date(a.practiced_at).getTime())
      .slice(0, 12);
  }, [profile?.practice_history]);

  if (!user) return null;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-grid-soft pb-16">
        <DashboardNavbar />
        <main className="mx-auto max-w-7xl space-y-7 px-4 py-8 sm:px-6 lg:px-8">
          <section className="animate-enter-up rounded-3xl border border-border/70 bg-background/80 p-6 shadow-sm backdrop-blur sm:p-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/80">Progreso</p>
                <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Tu avance en simple</h1>
                <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
                  Mira rápido qué estás haciendo bien, qué conviene reforzar y qué acción tomar ahora.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" className="rounded-xl" onClick={() => router.push("/practice/new")}>Nueva evaluación</Button>
                <Button className="rounded-xl" onClick={() => router.push("/dashboard")}>Inicio<ArrowRight className="h-4 w-4" /></Button>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <article className="rounded-2xl border border-border/60 bg-card/80 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Tiempo total</p>
                <p className="mt-2 text-2xl font-black">{formatPracticeMinutes(profile?.total_practice_minutes || 0)}</p>
              </article>
              <article className="rounded-2xl border border-border/60 bg-card/80 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Última práctica</p>
                <p className="mt-2 text-sm font-semibold">{formatDateTime(profile?.last_practice_at || null)}</p>
              </article>
              <article className="rounded-2xl border border-border/60 bg-card/80 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Completadas</p>
                <p className="mt-2 text-2xl font-black">{completedTests.length}</p>
              </article>
              <article className="rounded-2xl border border-border/60 bg-card/80 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Pendientes</p>
                <p className="mt-2 text-2xl font-black">{pendingTests.length}</p>
              </article>
            </div>
          </section>

          {loading ? (
            <p className="text-sm text-muted-foreground">Cargando progreso...</p>
          ) : (
            <>
              <section className="grid gap-5 lg:grid-cols-2">
                <div className="animate-enter-up rounded-3xl border border-border/70 bg-card/80 p-5 shadow-sm backdrop-blur sm:p-6">
                  <div className="mb-4 flex items-center gap-2">
                    <Medal className="h-5 w-5 text-emerald-500" />
                    <h2 className="text-lg font-black">Fortalezas</h2>
                  </div>
                  <div className="space-y-2">
                    {strengths.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Aún no hay datos suficientes.</p>
                    ) : (
                      strengths.map((item) => (
                        <div key={item.topic} className="rounded-xl border border-border/65 bg-background/75 px-3 py-2">
                          <div className="flex items-center justify-between gap-2 text-sm">
                            <span>{item.topic}</span>
                            <span className={`font-semibold ${scoreClass(item.score)}`}>{Math.round(item.score)}%</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="animate-enter-up rounded-3xl border border-border/70 bg-card/80 p-5 shadow-sm backdrop-blur sm:p-6">
                  <div className="mb-4 flex items-center gap-2">
                    <Target className="h-5 w-5 text-amber-500" />
                    <h2 className="text-lg font-black">Por reforzar</h2>
                  </div>
                  <div className="space-y-2">
                    {improvements.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Aún no hay datos suficientes.</p>
                    ) : (
                      improvements.map((item) => (
                        <div key={item.topic} className="rounded-xl border border-border/65 bg-background/75 px-3 py-2">
                          <div className="flex items-center justify-between gap-2 text-sm">
                            <span>{item.topic}</span>
                            <span className={`font-semibold ${scoreClass(item.score)}`}>{Math.round(item.score)}%</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </section>

              <section className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
                <div className="animate-enter-up rounded-3xl border border-border/70 bg-card/80 p-5 shadow-sm backdrop-blur sm:p-6">
                  <h2 className="text-lg font-black">Actividad reciente</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Tus últimas respuestas para tener contexto inmediato.</p>
                  <div className="mt-4 space-y-2">
                    {recentAttempts.length === 0 ? (
                      <p className="rounded-xl border border-dashed border-border/60 bg-background/70 p-3 text-sm text-muted-foreground">
                        Aún no hay práctica registrada.
                      </p>
                    ) : (
                      recentAttempts.map((entry, idx) => (
                        <div key={`${entry.practiced_at}-${idx}`} className="rounded-xl border border-border/65 bg-background/75 px-3 py-2">
                          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                            <div className="min-w-0">
                              <p className="truncate font-semibold">{entry.topic}</p>
                              <p className="text-xs text-muted-foreground">
                                {entry.subtopic || "Sin subtópico"} • {entry.difficulty || "-"}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={entry.is_correct ? "default" : "destructive"}>{entry.is_correct ? "Correcta" : "Incorrecta"}</Badge>
                              <span className="text-xs text-muted-foreground">{formatDateTime(entry.practiced_at)}</span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="animate-enter-up rounded-3xl border border-border/70 bg-card/80 p-5 shadow-sm backdrop-blur sm:p-6">
                  <h2 className="text-lg font-black">Estado de evaluaciones</h2>
                  <div className="mt-4 space-y-2">
                    {tests.length === 0 ? (
                      <p className="rounded-xl border border-dashed border-border/60 bg-background/70 p-3 text-sm text-muted-foreground">
                        No has creado evaluaciones todavía.
                      </p>
                    ) : (
                      tests.slice(0, 8).map((test) => {
                        const pct = test.total_questions > 0 ? Math.round((test.answered_questions / test.total_questions) * 100) : 0;
                        return (
                          <button
                            key={test.id}
                            type="button"
                            onClick={() => router.push(test.status === "completed" ? `/practice/test/${test.id}/result` : `/practice/test/${test.id}`)}
                            className="w-full rounded-xl border border-border/65 bg-background/75 p-3 text-left transition hover:border-primary/35"
                          >
                            <p className="text-sm font-semibold">{test.title || "Evaluación"}</p>
                            <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                              <span>{test.answered_questions}/{test.total_questions} preguntas</span>
                              <span>{pct}%</span>
                            </div>
                            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                              <div className="h-full bg-primary" style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} />
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>

                  <div className="mt-4 grid gap-2">
                    <Button className="justify-between rounded-xl" onClick={() => router.push("/practice/new")}>Crear evaluación<ArrowRight className="h-4 w-4" /></Button>
                    <Button variant="outline" className="justify-between rounded-xl" onClick={() => router.push("/dashboard")}>
                      Volver al inicio
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </section>

              <section className="animate-enter-up rounded-3xl border border-border/70 bg-card/80 p-5 shadow-sm backdrop-blur sm:p-6">
                <h2 className="text-lg font-black">Resumen rápido</h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">XP total</p>
                    <p className="mt-2 text-2xl font-black">{user.gamification.total_xp}</p>
                  </div>
                  <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Racha</p>
                    <p className="mt-2 flex items-center gap-2 text-2xl font-black"><Flame className="h-5 w-5 text-orange-500" />{user.gamification.current_streak}</p>
                  </div>
                  <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Precisión reciente</p>
                    <p className="mt-2 flex items-center gap-2 text-2xl font-black">
                      <Clock3 className="h-5 w-5 text-primary" />
                      {practiceHistorySummary.length > 0
                        ? `${Math.round(practiceHistorySummary.reduce((acc, item) => acc + toPercent(item.recent_accuracy), 0) / practiceHistorySummary.length)}%`
                        : "-"}
                    </p>
                  </div>
                </div>
              </section>
            </>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
