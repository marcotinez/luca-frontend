"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DashboardNavbar } from "@/components/DashboardNavbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getPracticeTest, submitPracticeTestAnswer } from "@/lib/learning.api";
import { apiErrorMessage } from "@/lib/learning.utils";
import type { PracticeTestDetailResponse } from "@/types";
import { TestProgressBar } from "@/components/learning/TestProgressBar";
import { QuestionCard } from "@/components/learning/QuestionCard";
import { AlternativesList } from "@/components/learning/AlternativesList";
import { AnswerFeedbackPanel } from "@/components/learning/AnswerFeedbackPanel";

export default function PracticeTestRunnerPage() {
  const params = useParams<{ testId: string }>();
  const router = useRouter();
  const [test, setTest] = useState<PracticeTestDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedOptionId, setSelectedOptionId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{
    isCorrect: boolean;
    feedback: string;
    correctOptionId: number;
  } | null>(null);
  const [pendingNextTest, setPendingNextTest] = useState<PracticeTestDetailResponse | null>(null);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const questionStartRef = useRef<number>(Date.now());
  const nullQuestionRetryRef = useRef(0);

  const loadTest = useCallback(async () => {
    if (!params?.testId) return;
    setLoading(true);
    try {
      const response = await getPracticeTest(params.testId);
      if (response.status === "completed") {
        router.replace(`/practice/test/${response.id}/result`);
        return;
      }
      if (!response.current_question) {
        if (nullQuestionRetryRef.current === 0) {
          nullQuestionRetryRef.current = 1;
          await loadTest();
          return;
        }
        toast.error("El test está en un estado inconsistente. Intenta recargar.");
      }
      setTest(response);
      setSelectedOptionId(null);
      setFeedback(null);
      setPendingNextTest(null);
      setCurrentStreak(0);
      setBestStreak(0);
      questionStartRef.current = Date.now();
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 403) {
        toast.error("No tienes permisos para abrir este test");
        router.replace("/dashboard");
        return;
      }
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        toast.error("El test no existe");
        router.replace("/dashboard");
        return;
      }
      toast.error(apiErrorMessage(error, "No se pudo cargar el test"));
    } finally {
      setLoading(false);
    }
  }, [params?.testId, router]);

  useEffect(() => {
    loadTest();
  }, [loadTest]);

  const currentQuestion = useMemo(() => test?.current_question || null, [test]);

  const handleSelectOption = async (optionId: number) => {
    if (!test || !currentQuestion || submitting) return;

    setSelectedOptionId(optionId);
    setSubmitting(true);
    const elapsedSeconds = Math.max(1, Math.round((Date.now() - questionStartRef.current) / 1000));

    try {
      const response = await submitPracticeTestAnswer(test.id, {
        selected_option_id: optionId,
        response_time_seconds: elapsedSeconds,
      });
      setFeedback({
        isCorrect: response.is_correct,
        feedback: response.feedback,
        correctOptionId: response.correct_option_id,
      });
      if (response.is_correct) {
        setCurrentStreak((prev) => {
          const next = prev + 1;
          setBestStreak((bestPrev) => Math.max(bestPrev, next));
          return next;
        });
      } else {
        setCurrentStreak(0);
      }
      setPendingNextTest(response.test);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        if (status === 400) {
          toast.error("Este test ya fue completado. Te llevamos al resultado.");
          router.replace(`/practice/test/${test.id}/result`);
          return;
        }
        if (status === 422) {
          toast.error("La opción enviada no es válida. Refrescando estado del test.");
          await loadTest();
          return;
        }
      }
      toast.error(apiErrorMessage(error, "No se pudo registrar la respuesta"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleNextQuestion = () => {
    if (!pendingNextTest) return;
    if (pendingNextTest.status === "completed") {
      router.replace(`/practice/test/${pendingNextTest.id}/result`);
      return;
    }
    setTest(pendingNextTest);
    setPendingNextTest(null);
    setFeedback(null);
    setSelectedOptionId(null);
    questionStartRef.current = Date.now();
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background pb-14">
        <DashboardNavbar />
        <main className="mx-auto max-w-4xl space-y-6 px-4 py-10 sm:px-6 lg:px-8">
          <section className="space-y-1">
            <h1 className="text-2xl font-black tracking-tight">Runner de práctica</h1>
            <p className="text-sm text-muted-foreground">
              Responde cada pregunta y avanza manualmente cuando quieras.
            </p>
          </section>

          {loading ? (
            <Card>
              <CardContent className="p-4 text-sm text-muted-foreground">Cargando test...</CardContent>
            </Card>
          ) : !test || !currentQuestion ? (
            <Card>
              <CardHeader>
                <CardTitle>Error de estado</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Este test no tiene pregunta actual disponible.
                </p>
                <Button onClick={loadTest}>Reintentar</Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <TestProgressBar
                answered={test.answered_questions}
                total={test.total_questions}
                streak={currentStreak}
                bestStreak={bestStreak}
              />
              <QuestionCard question={currentQuestion} />
              <AlternativesList
                alternatives={currentQuestion.alternatives}
                disabled={submitting || !!feedback}
                selectedOptionId={selectedOptionId}
                onSelect={handleSelectOption}
              />
              {feedback ? (
                <div className="space-y-3">
                  <AnswerFeedbackPanel
                    isCorrect={feedback.isCorrect}
                    feedback={feedback.feedback}
                    correctOptionId={feedback.correctOptionId}
                  />
                  <div className="flex justify-end">
                    <Button
                      onClick={handleNextQuestion}
                      disabled={!pendingNextTest}
                    >
                      {pendingNextTest?.status === "completed" ? "Ver resultado" : "Siguiente pregunta"}
                    </Button>
                  </div>
                </div>
              ) : null}
            </>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
