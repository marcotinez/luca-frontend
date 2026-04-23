"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowRight, CheckCircle2, Flame, Loader2 } from "lucide-react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getPracticeTest, submitPracticeTestAnswer } from "@/lib/learning.api";
import { apiErrorMessage } from "@/lib/learning.utils";
import type { PracticeTestDetailResponse } from "@/types";
import { TestProgressBar } from "@/components/learning/TestProgressBar";
import { QuestionCard } from "@/components/learning/QuestionCard";
import { AlternativesList } from "@/components/learning/AlternativesList";
import { AnswerFeedbackPanel } from "@/components/learning/AnswerFeedbackPanel";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

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
  const [showExitModal, setShowExitModal] = useState(false);
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
    void loadTest();
  }, [loadTest]);

  const currentQuestion = useMemo(() => test?.current_question || null, [test]);

  const selectedAlternative = useMemo(() => {
    if (!currentQuestion || selectedOptionId == null) return null;
    return currentQuestion.alternatives.find((option) => option.option_id === selectedOptionId) ?? null;
  }, [currentQuestion, selectedOptionId]);

  const correctOptionLabel = useMemo(() => {
    if (!feedback || !currentQuestion) return undefined;
    const correctIndex = currentQuestion.alternatives.findIndex(
      (option) => option.option_id === feedback.correctOptionId,
    );
    return correctIndex >= 0 ? String.fromCharCode(65 + correctIndex) : undefined;
  }, [feedback, currentQuestion]);

  const handleSelectOption = (optionId: number) => {
    if (!currentQuestion || submitting || feedback) return;
    const isValidOption = currentQuestion.alternatives.some((option) => option.option_id === optionId);
    if (!isValidOption) {
      toast.error("La opción seleccionada no es válida para esta pregunta.");
      return;
    }

    setSelectedOptionId(optionId);
  };

  const handleConfirmAnswer = async () => {
    if (!test || !currentQuestion || submitting || selectedOptionId == null) return;

    setSubmitting(true);
    const elapsedSeconds = Math.max(1, Math.round((Date.now() - questionStartRef.current) / 1000));

    try {
      const response = await submitPracticeTestAnswer(test.id, {
        selected_option_id: selectedOptionId,
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

  const displayedFeedback = useMemo(() => {
    if (!feedback) return "";
    if (feedback.isCorrect) return feedback.feedback;
    return feedback.feedback.replace(/^\s*Correcto[.:]?\s*/i, "").trim();
  }, [feedback]);

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

  const handleConfirmExit = () => {
    setShowExitModal(false);
    router.push("/dashboard");
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-grid-soft pb-14">
        <main className="mx-auto max-w-5xl space-y-5 px-4 py-8 sm:px-6 lg:px-8">


          {loading ? (
            <Card>
              <CardContent className="flex items-center gap-2 p-4 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Cargando test...
              </CardContent>
            </Card>
          ) : !test || !currentQuestion ? (
            <Card>
              <CardHeader>
                <CardTitle>Error de estado</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">Este test no tiene pregunta actual disponible.</p>
                <Button onClick={loadTest}>Reintentar</Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <TestProgressBar
                answered={test.answered_questions}
                total={test.total_questions}
                onExit={() => setShowExitModal(true)}
              />
              <section className="animate-enter-up-delay rounded-2xl border border-border/70 bg-card/80 p-4 shadow-sm">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <Badge variant={currentStreak > 0 ? "default" : "secondary"} className="gap-1.5 px-2.5 py-1">
                    <Flame className="h-3.5 w-3.5" />
                    Racha evaluación: {currentStreak}
                  </Badge>
                  <Badge variant="outline" className="px-2.5 py-1">
                    Mejor racha: {bestStreak}
                  </Badge>
                </div>
              </section>

              <QuestionCard question={currentQuestion} />

              <AlternativesList
                alternatives={currentQuestion.alternatives}
                disabled={submitting || !!feedback}
                selectedOptionId={selectedOptionId}
                onSelect={handleSelectOption}
              />

              {!feedback ? (
                <div className="flex justify-end">
                  <Button
                    onClick={handleConfirmAnswer}
                    disabled={submitting || selectedOptionId == null}
                    className="rounded-xl px-5"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Confirmando...
                      </>
                    ) : (
                      <>
                        Confirmar respuesta
                        <CheckCircle2 className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              ) : null}

              {feedback ? (
                <div className="animate-enter-up space-y-3">
                  {selectedAlternative ? (
                    <article className="rounded-2xl border border-border/70 bg-card/80 p-4 shadow-sm sm:p-5">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                        Tu respuesta
                      </p>
                      <p className="text-sm leading-relaxed text-foreground sm:text-[15px]">
                        {selectedAlternative.text}
                      </p>
                    </article>
                  ) : null}
                  <AnswerFeedbackPanel
                    isCorrect={feedback.isCorrect}
                    feedback={displayedFeedback}
                    correctOptionLabel={correctOptionLabel}
                    correctAnswerText={
                      feedback.isCorrect
                        ? undefined
                        : currentQuestion.alternatives.find(
                            (option) => option.option_id === feedback.correctOptionId,
                          )?.text
                    }
                  />
                  <div className="flex justify-end">
                    <Button onClick={handleNextQuestion} disabled={!pendingNextTest} className="rounded-xl px-5">
                      {pendingNextTest?.status === "completed" ? "Ver resultado" : "Siguiente pregunta"}
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : null}
            </>
          )}
        </main>
      </div>
      <Dialog open={showExitModal} onOpenChange={setShowExitModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>¿Salir de la evaluación?</DialogTitle>
            <DialogDescription>
              Si sales ahora, volverás al dashboard y tendrás que retomar después desde esta evaluación.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 pt-2 sm:flex-row">
            <Button variant="outline" onClick={() => setShowExitModal(false)} className="flex-1">
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleConfirmExit} className="flex-1">
              Salir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ProtectedRoute>
  );
}
