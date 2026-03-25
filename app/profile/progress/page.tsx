"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { DashboardNavbar } from "@/components/DashboardNavbar";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import { getLearningProfile } from "@/lib/users.api";
import { apiErrorMessage } from "@/lib/learning.utils";
import type { UserLearningProfile } from "@/types";
import { LearningStatsHeader } from "@/components/learning/LearningStatsHeader";
import { DomainProgressList } from "@/components/learning/DomainProgressList";
import { PracticeHistoryTable } from "@/components/learning/PracticeHistoryTable";
import { RecentAccuracyChart } from "@/components/learning/RecentAccuracyChart";

export default function ProfileProgressPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserLearningProfile | null>(
    user?.learning_profile || null,
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const run = async () => {
      setLoading(true);
      try {
        const response = await getLearningProfile(user.id);
        setProfile(response);
      } catch (error) {
        toast.error(apiErrorMessage(error, "No se pudo cargar el progreso"));
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [user]);

  if (!user) return null;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background pb-14">
        <DashboardNavbar />
        <main className="mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
          <section>
            <h1 className="text-3xl font-black tracking-tight">Progreso de aprendizaje</h1>
            <p className="text-sm text-muted-foreground">
              Seguimiento detallado por tema e historial de práctica.
            </p>
          </section>

          <LearningStatsHeader
            totalPracticeMinutes={profile?.total_practice_minutes || 0}
            lastPracticeAt={profile?.last_practice_at || null}
            totalXp={user.gamification.total_xp}
            domainCount={profile?.domain_knowledge.length || 0}
          />

          {loading ? (
            <p className="text-sm text-muted-foreground">Cargando progreso...</p>
          ) : (
            <>
              <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <DomainProgressList domains={profile?.domain_knowledge || []} />
                <RecentAccuracyChart summary={user.practice_history_summary || []} />
              </section>
              <PracticeHistoryTable history={profile?.practice_history || []} />
            </>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
