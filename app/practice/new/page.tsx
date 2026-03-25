"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DashboardNavbar } from "@/components/DashboardNavbar";
import { CreateTestForm } from "@/components/learning/CreateTestForm";
import { createPracticeTest, getPracticeTests } from "@/lib/learning.api";
import { apiErrorMessage, formatDateTime } from "@/lib/learning.utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { PracticeTestCreateRequest, PracticeTestSummaryResponse } from "@/types";

export default function NewPracticeTestPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [tests, setTests] = useState<PracticeTestSummaryResponse[]>([]);
  const [loadingTests, setLoadingTests] = useState(true);

  useEffect(() => {
    const loadTests = async () => {
      setLoadingTests(true);
      try {
        const response = await getPracticeTests();
        setTests(response.slice(0, 8));
      } catch (error) {
        toast.error(apiErrorMessage(error, "No se pudieron cargar los tests recientes"));
      } finally {
        setLoadingTests(false);
      }
    };
    loadTests();
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
            <CreateTestForm loading={loading} onSubmit={handleCreateTest} />
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
                      className="flex w-full items-center justify-between rounded-xl border border-border/60 p-3 text-left hover:bg-muted/40"
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
