"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CreateTestForm } from "@/components/learning/CreateTestForm";
import {
  createCategoryPracticeTest,
  createRecommendedPracticeTest,
  getPracticeTests,
} from "@/lib/learning.api";
import { getRegistrationTaxonomy } from "@/lib/auth.api";
import { apiErrorMessage, formatDateTime } from "@/lib/learning.utils";
import { normalizeRuntimeTaxonomy, type RuntimeTaxonomy } from "@/lib/taxonomy.utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type {
  CreateCategoryPracticeTestRequest,
  CreateRecommendedPracticeTestRequest,
  PracticeTestSummaryResponse,
} from "@/types";

export default function AdminEvaluacionesPage() {
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
        setTests(testsResponse.slice(0, 12));
        setTaxonomy(
          normalizeRuntimeTaxonomy({
            categories: taxonomyResponse.categories,
            subtopics: taxonomyResponse.subtopics,
          }),
        );
      } catch (error) {
        toast.error(apiErrorMessage(error, "No se pudieron cargar los datos de tests"));
      } finally {
        setLoadingTests(false);
        setLoadingTaxonomy(false);
      }
    };
    void loadData();
  }, []);

  const resolveDetailErrorMessage = (error: unknown, fallback: string) => {
    const detail = (error as any)?.response?.data?.detail;
    if (detail && typeof detail === "object" && typeof detail.message === "string") {
      const suggestions = Array.isArray(detail.suggestions)
        ? detail.suggestions
          .slice(0, 3)
          .map((item: any) => `${item.category}${item.subtopic ? ` / ${item.subtopic}` : ""} (${item.available})`)
          .join(" • ")
        : "";
      return suggestions ? `${detail.message} ${suggestions}` : detail.message;
    }
    return apiErrorMessage(error, fallback);
  };

  const handleCreateCategoryTest = async (payload: CreateCategoryPracticeTestRequest) => {
    try {
      setLoading(true);
      const test = await createCategoryPracticeTest(payload);
      toast.success("Test por categoría creado");
      router.push(`/practice/test/${test.id}`);
    } catch (error) {
      toast.error(resolveDetailErrorMessage(error, "No se pudo crear el test por categoría"));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRecommendedTest = async (
    payload: CreateRecommendedPracticeTestRequest,
  ) => {
    try {
      setLoading(true);
      const test = await createRecommendedPracticeTest(payload);
      toast.success("Test adaptativo creado");
      router.push(`/practice/test/${test.id}`);
    } catch (error) {
      toast.error(resolveDetailErrorMessage(error, "No se pudo crear el test adaptativo"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Gestión de tests</h1>
        <p className="text-muted-foreground mt-1">
          Crea diagnósticos/evaluaciones por categoría o adaptativas según desempeño.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        <section className="xl:col-span-3">
          <CreateTestForm
            loading={loading || loadingTaxonomy}
            onSubmitCategory={handleCreateCategoryTest}
            onSubmitRecommended={handleCreateRecommendedTest}
            categories={taxonomy.categories}
            subtopicsByCategory={taxonomy.subtopicsByCategory}
          />
        </section>

        <section className="xl:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tests recientes</CardTitle>
              <CardDescription>Últimos tests disponibles para seguimiento rápido.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {loadingTests ? (
                <p className="text-sm text-muted-foreground">Cargando...</p>
              ) : tests.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No hay tests aún. Crea uno para comenzar.
                </p>
              ) : (
                tests.map((test) => (
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
                            {test.selection_mode === "recommended" ? "Adaptativo" : "Por categoría"}
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
    </div>
  );
}
