"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowRight, Clock3, FileText, Plus } from "lucide-react";
import { DashboardNavbar } from "@/components/DashboardNavbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import { getLearningProfile } from "@/lib/users.api";
import { getPracticeTests } from "@/lib/learning.api";
import { apiErrorMessage, formatDateTime } from "@/lib/learning.utils";
import type { PracticeTestSummaryResponse, UserLearningProfile } from "@/types";
import { LearningStatsHeader } from "./LearningStatsHeader";
import { DomainProgressList } from "./DomainProgressList";
import { RecentAccuracyChart } from "./RecentAccuracyChart";

export function StudentDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [learningProfile, setLearningProfile] = useState<UserLearningProfile | null>(
    user?.learning_profile || null,
  );
  const [summary, setSummary] = useState(user?.practice_history_summary || []);
  const [tests, setTests] = useState<PracticeTestSummaryResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      setLoading(true);
      try {
        const [profile, testList] = await Promise.all([
          getLearningProfile(user.id),
          getPracticeTests(),
        ]);
        setLearningProfile(profile);
        setTests(testList.slice(0, 6));
        setSummary(user.practice_history_summary || []);
      } catch (error) {
        toast.error(apiErrorMessage(error, "No se pudo cargar el dashboard de aprendizaje"));
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  const inProgressTests = useMemo(
    () => tests.filter((test) => test.status !== "completed").length,
    [tests],
  );

  if (!user) return null;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-grid-soft pb-20">
        <DashboardNavbar />
        <main className="mx-auto max-w-7xl space-y-7 px-4 py-8 sm:px-6 lg:px-8">
          <section className="animate-enter-up rounded-2xl border border-border/70 bg-card/70 p-5 shadow-sm backdrop-blur sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary/80">
                  Panel de práctica
                </p>
                <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
                  Dashboard de aprendizaje
                </h1>
                <p className="max-w-2xl text-sm text-muted-foreground">
                  Revisa tu progreso por tema, detecta brechas y arranca un nuevo test cuando lo
                  necesites.
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <Badge variant="secondary" className="gap-1.5 px-3 py-1">
                    <FileText className="h-3.5 w-3.5" />
                    Tests activos: {inProgressTests}
                  </Badge>
                  <Badge variant="outline" className="gap-1.5 px-3 py-1">
                    <Clock3 className="h-3.5 w-3.5" />
                    Datos actualizados
                  </Badge>
                </div>
              </div>
              <Button
                size="lg"
                className="h-11 rounded-xl px-5"
                onClick={() => router.push("/practice/new")}
              >
                <Plus className="h-4 w-4" />
                Comenzar práctica
              </Button>
            </div>
          </section>

          <LearningStatsHeader
            totalPracticeMinutes={learningProfile?.total_practice_minutes || 0}
            lastPracticeAt={learningProfile?.last_practice_at || null}
            totalXp={user.gamification.total_xp}
            domainCount={learningProfile?.domain_knowledge?.length || 0}
          />

          <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <DomainProgressList domains={learningProfile?.domain_knowledge || []} />
            <RecentAccuracyChart summary={summary} />
          </section>

          <section className="animate-enter-up-delay">
            <Card className="border-border/70 bg-card/80 shadow-sm backdrop-blur">
              <CardHeader className="flex flex-row items-center justify-between border-b border-border/60 pb-4">
                <div>
                  <CardTitle className="text-lg">Tests recientes</CardTitle>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Abre un test para continuar o revisar su resultado.
                  </p>
                </div>
                <Button variant="ghost" className="rounded-lg" onClick={() => router.push("/practice/new")}>
                  Nuevo test
                </Button>
              </CardHeader>
              <CardContent className="space-y-2 p-4 sm:p-5">
                {loading ? (
                  <p className="text-sm text-muted-foreground">Cargando tests...</p>
                ) : tests.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No hay tests todavía. Crea uno para empezar.
                  </p>
                ) : (
                  tests.map((test) => (
                    <button
                      key={test.id}
                      type="button"
                      className="group flex w-full items-center justify-between gap-3 rounded-xl border border-border/60 bg-background/80 px-3 py-3 text-left transition-all hover:-translate-y-0.5 hover:border-primary/35 hover:bg-background"
                      onClick={() =>
                        router.push(
                          test.status === "completed"
                            ? `/practice/test/${test.id}/result`
                            : `/practice/test/${test.id}`,
                        )
                      }
                    >
                      <div className="space-y-1">
                        <p className="font-semibold text-foreground">{test.title || "Test sin título"}</p>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span>
                            {test.correct_answers}/{test.total_questions} correctas
                          </span>
                          <span className="h-1 w-1 rounded-full bg-muted-foreground/50" />
                          <span>{formatDateTime(test.created_at)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={test.status === "completed" ? "default" : "secondary"}>
                          {test.status === "completed" ? "Completado" : "En curso"}
                        </Badge>
                        <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                      </div>
                    </button>
                  ))
                )}
              </CardContent>
            </Card>
          </section>
        </main>
      </div>
    </ProtectedRoute>
  );
}
