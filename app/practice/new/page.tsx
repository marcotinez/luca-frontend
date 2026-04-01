"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DashboardNavbar } from "@/components/DashboardNavbar";
import { CreateTestForm } from "@/components/learning/CreateTestForm";
import { createPracticeTest, getPracticeTests } from "@/lib/learning.api";
import { getRegistrationTaxonomy } from "@/lib/auth.api";
import { apiErrorMessage, formatDateTime } from "@/lib/learning.utils";
import { normalizeRuntimeTaxonomy, type RuntimeTaxonomy } from "@/lib/taxonomy.utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { PracticeTestCreateRequest, PracticeTestSummaryResponse } from "@/types";

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
        setTests(testsResponse.slice(0, 8));
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

  const handleCreateTest = async (payload: PracticeTestCreateRequest) => {
    try {
      setLoading(true);
      const test = await createPracticeTest(payload);
      toast.success("Test creado correctamente");
      router.push(`/practice/test/${test.id}`);
    } catch (error) {
      const message = apiErrorMessage(error, "No se pudo crear el test");
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background pb-14">
        <DashboardNavbar />
        <main className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-10 sm:px-6 lg:grid-cols-5 lg:px-8">
          <section className="lg:col-span-3">
            <CreateTestForm
              loading={loading || loadingTaxonomy}
              onSubmit={handleCreateTest}
              categories={taxonomy.categories}
              subtopicsByCategory={taxonomy.subtopicsByCategory}
            />
          </section>

          <section className="lg:col-span-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Mis tests</CardTitle>
                <Button variant="ghost" onClick={() => router.push("/dashboard")}>
                  Dashboard
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {loadingTests ? (
                  <p className="text-sm text-muted-foreground">Cargando...</p>
                ) : tests.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No tienes tests todavía. Crea uno para comenzar.
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
                        <p className="text-xs text-muted-foreground">
                          {test.correct_answers}/{test.total_questions} correctas
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground sm:text-right">{formatDateTime(test.created_at)}</p>
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
