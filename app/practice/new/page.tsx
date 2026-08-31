"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { RouteGuard } from "@/components/auth/RouteGuard";
import { DashboardNavbar } from "@/components/DashboardNavbar";
import { CreateTestForm } from "@/components/learning/CreateTestForm";
import {
  createCategoryPracticeTest,
  createRecommendedPracticeTest,
  getPracticeTests,
} from "@/lib/learning.api";
import { getRegistrationTaxonomy } from "@/lib/auth.api";
import {
  apiErrorMessage,
  buildNextPracticeTitle,
  formatDateTime,
  resolveLearningApiErrorMessage,
} from "@/lib/learning.utils";
import { normalizeRuntimeTaxonomy, type RuntimeTaxonomy } from "@/lib/taxonomy.utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type {
  CreateCategoryPracticeTestRequest,
  CreateRecommendedPracticeTestRequest,
  PracticeTestSummaryResponse,
} from "@/types";

export default function NewPracticeTestPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [tests, setTests] = useState<PracticeTestSummaryResponse[]>([]);
  const [loadingTests, setLoadingTests] = useState(true);
  const [taxonomy, setTaxonomy] = useState<RuntimeTaxonomy>({ categories: [], subtopicsByCategory: {} });
  const [loadingTaxonomy, setLoadingTaxonomy] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoadingTests(true);
      setLoadingTaxonomy(true);
      try {
        const [testsResponse, taxonomyResponse] = await Promise.all([
          getPracticeTests(),
          getRegistrationTaxonomy(),
        ]);
        setTests(testsResponse);
        setTaxonomy(
          normalizeRuntimeTaxonomy({
            categories: taxonomyResponse.categories,
            subtopics: taxonomyResponse.subtopics,
          }),
        );
      } catch (error) {
        toast.error(apiErrorMessage(error, "No se pudieron cargar los datos de práctica"));
      } finally {
        setLoadingTests(false);
        setLoadingTaxonomy(false);
      }
    };
    loadData();
  }, []);

  const handleCreateCategoryTest = async (payload: CreateCategoryPracticeTestRequest) => {
    try {
      setLoading(true);
      const resolvedPayload: CreateCategoryPracticeTestRequest = {
        ...payload,
        title: payload.title?.trim() || buildNextPracticeTitle(tests, "category"),
      };
      const test = await createCategoryPracticeTest(resolvedPayload);
      toast.success("Evaluación por categoría creada");
      router.push(`/practice/test/${test.id}`);
    } catch (error) {
      toast.error(resolveLearningApiErrorMessage(error, "No se pudo crear la evaluación por categoría"));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRecommendedTest = async (
    payload: CreateRecommendedPracticeTestRequest,
  ) => {
    try {
      setLoading(true);
      const resolvedPayload: CreateRecommendedPracticeTestRequest = {
        ...payload,
        title: payload.title?.trim() || buildNextPracticeTitle(tests, "recommended"),
      };
      const test = await createRecommendedPracticeTest(resolvedPayload);
      toast.success("Evaluación recomendada creada");
      router.push(`/practice/test/${test.id}`);
    } catch (error) {
      toast.error(resolveLearningApiErrorMessage(error, "No se pudo crear la evaluación recomendada"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <RouteGuard access="authenticated">
      <div className="min-h-screen bg-background pb-14">
        <DashboardNavbar />
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <section className="animate-enter-up overflow-hidden rounded-3xl border border-border/70 bg-card/90 shadow-sm backdrop-blur mb-6 p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/80">Práctica y aprendizaje</p>
              <h1 className="mt-1 text-3xl font-black tracking-tight">Nueva Evaluación</h1>
              <p className="mt-2 text-sm text-muted-foreground">Configura una evaluación a tu medida o recibe una recomendada.</p>
            </div>
            <Button variant="outline" onClick={() => router.push("/dashboard")} className="shrink-0">
              Volver al Inicio
            </Button>
          </section>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-5 animate-enter-up">
            <section className="lg:col-span-3">
              <CreateTestForm
                loading={loading || loadingTaxonomy}
                onSubmitCategory={handleCreateCategoryTest}
                onSubmitRecommended={handleCreateRecommendedTest}
                categories={taxonomy.categories}
                subtopicsByCategory={taxonomy.subtopicsByCategory}
              />
            </section>

            <section className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Mis tests</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {loadingTests ? (
                  <p className="text-sm text-muted-foreground">Cargando...</p>
                ) : tests.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No tienes tests todavía. Crea uno para comenzar.
                  </p>
                ) : (
                  tests.slice(0, 8).map((test) => (
                    <button
                      key={test.id}
                      type="button"
                      className="flex w-full flex-col items-start gap-2 rounded-xl border border-border/60 p-3 text-left hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between"
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
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span>{test.correct_answers}/{test.total_questions} correctas</span>
                          {test.selection_mode ? (
                            <Badge variant="outline" className="h-5">
                              {test.selection_mode === "recommended" ? "Recomendada" : "Por categoría"}
                            </Badge>
                          ) : null}
                          {test.target_category ? <span>{test.target_category}</span> : null}
                          {test.target_subtopic ? <span>{test.target_subtopic}</span> : null}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground sm:text-right">{formatDateTime(test.created_at)}</p>
                    </button>
                  ))
                )}
              </CardContent>
            </Card>
          </section>
          </div>
        </main>
      </div>
    </RouteGuard>
  );
}
