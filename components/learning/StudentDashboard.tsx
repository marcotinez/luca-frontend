"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { DashboardNavbar } from "@/components/DashboardNavbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
        setTests(testList.slice(0, 5));
        setSummary(user.practice_history_summary || []);
      } catch (error) {
        toast.error(apiErrorMessage(error, "No se pudo cargar el dashboard de aprendizaje"));
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  if (!user) return null;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background pb-20">
        <DashboardNavbar />
        <main className="mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
          <section className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-3xl font-black tracking-tight">Dashboard de aprendizaje</h1>
              <p className="text-sm text-muted-foreground">
                Monitorea tus avances y lanza un nuevo test cuando quieras.
              </p>
            </div>
            <Button onClick={() => router.push("/practice/new")}>Comenzar práctica</Button>
          </section>

          <LearningStatsHeader
            totalPracticeMinutes={learningProfile?.total_practice_minutes || 0}
            lastPracticeAt={learningProfile?.last_practice_at || null}
            totalXp={user.gamification.total_xp}
            domainCount={learningProfile?.domain_knowledge?.length || 0}
          />

          <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <DomainProgressList domains={learningProfile?.domain_knowledge || []} />
            <RecentAccuracyChart summary={summary} />
          </section>

          <section>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Tests recientes</CardTitle>
                <Button variant="ghost" onClick={() => router.push("/practice/new")}>
                  Nuevo test
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
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
                      className="flex w-full items-center justify-between rounded-xl border border-border/60 bg-background p-3 text-left transition-colors hover:bg-muted/40"
                      onClick={() =>
                        router.push(
                          test.status === "completed"
                            ? `/practice/test/${test.id}/result`
                            : `/practice/test/${test.id}`,
                        )
                      }
                    >
                      <div>
                        <p className="font-semibold">{test.title || "Test sin título"}</p>
                        <p className="text-xs text-muted-foreground">
                          {test.correct_answers}/{test.total_questions} correctas
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground">{formatDateTime(test.created_at)}</p>
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
