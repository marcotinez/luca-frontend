"use client";

import { useEffect, useMemo, useState } from "react";
import type {
  CreateCategoryPracticeTestRequest,
  CreateRecommendedPracticeTestRequest,
  PracticeAvailabilityResponse,
  PracticeTestDifficulty,
} from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { getPracticeTestAvailability } from "@/lib/learning.api";

interface CreateTestFormProps {
  onSubmitCategory: (payload: CreateCategoryPracticeTestRequest) => Promise<void>;
  onSubmitRecommended: (payload: CreateRecommendedPracticeTestRequest) => Promise<void>;
  loading?: boolean;
  categories: string[];
  subtopicsByCategory: Record<string, string[]>;
}

type TestMode = "category" | "recommended";

const difficultyOptions: PracticeTestDifficulty[] = ["Fácil", "Medio"];

export function CreateTestForm({
  onSubmitCategory,
  onSubmitRecommended,
  loading = false,
  categories,
  subtopicsByCategory,
}: CreateTestFormProps) {
  const [mode, setMode] = useState<TestMode>("category");
  const [questionCount, setQuestionCount] = useState(5);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<string>("");
  const [subtopic, setSubtopic] = useState<string>("all");
  const [difficulty, setDifficulty] = useState<"all" | PracticeTestDifficulty>("all");
  const [availability, setAvailability] = useState<PracticeAvailabilityResponse | null>(null);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);

  const categorySubtopics = useMemo(() => {
    if (!category) {
      return [];
    }
    return subtopicsByCategory[category] ?? [];
  }, [category, subtopicsByCategory]);

  useEffect(() => {
    if (subtopic !== "all" && !categorySubtopics.includes(subtopic)) {
      setSubtopic("all");
    }
  }, [categorySubtopics, subtopic]);

  useEffect(() => {
    let cancelled = false;
    const loadAvailability = async () => {
      if (mode !== "category" || !category || questionCount < 1 || questionCount > 20) {
        setAvailability(null);
        return;
      }
      setAvailabilityLoading(true);
      try {
        const response = await getPracticeTestAvailability({
          category,
          subtopic: subtopic !== "all" ? subtopic : undefined,
          difficulty: difficulty !== "all" ? difficulty : undefined,
          question_count: questionCount,
        });
        if (!cancelled) {
          setAvailability(response);
        }
      } catch {
        if (!cancelled) {
          setAvailability(null);
        }
      } finally {
        if (!cancelled) {
          setAvailabilityLoading(false);
        }
      }
    };
    void loadAvailability();
    return () => {
      cancelled = true;
    };
  }, [mode, category, subtopic, difficulty, questionCount]);

  const canSubmit = useMemo(() => {
    if (loading || questionCount < 1 || questionCount > 20) {
      return false;
    }

    if (mode === "category" && !category) {
      return false;
    }

    if (mode === "category" && availability && !availability.enough_for_requested) {
      return false;
    }

    return true;
  }, [availability, category, loading, mode, questionCount]);

  const commonPayload = {
    question_count: questionCount,
    difficulty: difficulty !== "all" ? difficulty : undefined,
    title: title.trim() || undefined,
  };

  const handleSubmit = () => {
    if (!canSubmit) {
      return;
    }

    if (mode === "category") {
      void onSubmitCategory({
        ...commonPayload,
        category,
        subtopic: subtopic !== "all" ? subtopic : undefined,
      });
      return;
    }

    void onSubmitRecommended(commonPayload);
  };

  return (
    <Card className="border-border/70 bg-card/85 shadow-sm">
      <CardHeader className="space-y-4 border-b border-border/60 pb-5">
        <div className="space-y-1">
          <CardTitle className="text-xl">Crear evaluación</CardTitle>
          <CardDescription>
            Elige si quieres una evaluación enfocada en una categoría o una recomendada según tu desempeño.
          </CardDescription>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => setMode("category")}
            className={`flex-1 rounded-2xl border px-4 py-4 text-left transition-colors ${
              mode === "category"
                ? "border-primary bg-primary/8"
                : "border-border/60 bg-background/70 hover:bg-muted/50"
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <p className="font-semibold">Evaluación por categoría</p>
              {mode === "category" ? <Badge>Activa</Badge> : null}
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Se centra en la categoría elegida y prioriza los subtópicos donde tienes más espacio para mejorar.
            </p>
          </button>

          <button
            type="button"
            onClick={() => setMode("recommended")}
            className={`flex-1 rounded-2xl border px-4 py-4 text-left transition-colors ${
              mode === "recommended"
                ? "border-primary bg-primary/8"
                : "border-border/60 bg-background/70 hover:bg-muted/50"
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <p className="font-semibold">Evaluación recomendada</p>
              {mode === "recommended" ? <Badge>Activa</Badge> : null}
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Se recomienda según tu desempeño y se enfoca principalmente en lo que más necesitas reforzar.
            </p>
          </button>
        </div>
      </CardHeader>

      <CardContent className="space-y-5 p-5">
        {mode === "category" ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Categoría</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona una categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((topic) => (
                    <SelectItem key={topic} value={topic}>
                      {topic}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Subtópico (opcional)</Label>
              <Select value={subtopic} onValueChange={setSubtopic} disabled={!category}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Todos los subtópicos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {categorySubtopics.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        ) : null}



        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Cantidad de preguntas</Label>
            <Select value={String(questionCount)} onValueChange={(value) => setQuestionCount(Number(value))}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecciona la cantidad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 preguntas</SelectItem>
                <SelectItem value="10">10 preguntas</SelectItem>
                <SelectItem value="15">15 preguntas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Dificultad (opcional)</Label>
            <Select value={difficulty} onValueChange={(value) => setDifficulty(value as "all" | PracticeTestDifficulty)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Todas las dificultades" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {difficultyOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {mode === "category" && category ? (
          <div
            className={`rounded-xl border px-3 py-2 text-sm ${
              availability?.enough_for_requested
                ? "border-emerald-500/40 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300"
                : "border-amber-500/40 bg-amber-500/5 text-amber-700 dark:text-amber-300"
            }`}
          >
            {availabilityLoading ? (
              <p>Validando disponibilidad de preguntas...</p>
            ) : availability ? (
              <>
                <p>
                  Disponibles con filtros actuales: <strong>{availability.available_total}</strong>.
                </p>
                {!availability.enough_for_requested && availability.suggestions.length > 0 ? (
                  <p className="mt-1 text-xs">
                    Sugerencias: {availability.suggestions
                      .map((item) => `${item.category}${item.subtopic ? ` / ${item.subtopic}` : ""} (${item.available})`)
                      .join(" • ")}
                  </p>
                ) : null}
              </>
            ) : (
              <p>No fue posible validar disponibilidad en este momento.</p>
            )}
          </div>
        ) : null}

        <Button
          className="w-full"
          disabled={!canSubmit}
          onClick={handleSubmit}
        >
          {loading
            ? "Creando evaluación..."
            : mode === "category"
              ? "Crear evaluación por categoría"
              : "Crear evaluación recomendada"}
        </Button>
      </CardContent>
    </Card>
  );
}
