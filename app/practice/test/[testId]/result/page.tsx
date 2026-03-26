"use client";

import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DashboardNavbar } from "@/components/DashboardNavbar";
import { Card, CardContent } from "@/components/ui/card";
import { getPracticeTest } from "@/lib/learning.api";
import { apiErrorMessage } from "@/lib/learning.utils";
import type { PracticeTestDetailResponse } from "@/types";
import { TestResultSummary } from "@/components/learning/TestResultSummary";
import { useAuth } from "@/hooks/useAuth";

export default function PracticeTestResultPage() {
  const params = useParams<{ testId: string }>();
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [test, setTest] = useState<PracticeTestDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const loadResult = useCallback(async () => {
    if (!params?.testId) return;
    setLoading(true);
    try {
      const response = await getPracticeTest(params.testId);
      if (response.status !== "completed") {
        router.replace(`/practice/test/${response.id}`);
        return;
      }
      setTest(response);
      await refreshUser();
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 403) {
        toast.error("No tienes permisos para ver este resultado");
        router.replace("/dashboard");
        return;
      }
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        toast.error("No se encontró el test");
        router.replace("/dashboard");
        return;
      }
      toast.error(apiErrorMessage(error, "No se pudo cargar el resultado"));
    } finally {
      setLoading(false);
    }
  }, [params?.testId, refreshUser, router]);

  useEffect(() => {
    loadResult();
  }, [loadResult]);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background pb-14">
        <DashboardNavbar />
        <main className="mx-auto max-w-3xl space-y-6 px-4 py-10 sm:px-6 lg:px-8">
          {loading ? (
            <Card>
              <CardContent className="p-4 text-sm text-muted-foreground">
                Cargando resultados...
              </CardContent>
            </Card>
          ) : test ? (
            <TestResultSummary
              title={test.title}
              correctAnswers={test.correct_answers}
              totalQuestions={test.total_questions}
              onViewProgress={() => router.push("/profile/progress")}
              onNewTest={() => router.push("/practice/new")}
            />
          ) : (
            <Card>
              <CardContent className="p-4 text-sm text-muted-foreground">
                No se pudo obtener la información del test.
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
