"use client";

import { useMemo, useState } from "react";
import type {
  CreateCategoryPracticeTestRequest,
  CreateRecommendedPracticeTestRequest,
  PracticeDifficulty,
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

interface CreateTestFormProps {
  onSubmitCategory: (payload: CreateCategoryPracticeTestRequest) => Promise<void>;
  onSubmitRecommended: (payload: CreateRecommendedPracticeTestRequest) => Promise<void>;
  loading?: boolean;
  categories: string[];
}

type TestMode = "category" | "recommended";

const difficultyOptions: PracticeDifficulty[] = ["Fácil", "Medio", "Difícil"];

export function CreateTestForm({
  onSubmitCategory,
  onSubmitRecommended,
  loading = false,
  categories,
}: CreateTestFormProps) {
  const [mode, setMode] = useState<TestMode>("category");
  const [questionCount, setQuestionCount] = useState(5);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<string>("");
  const [difficulty, setDifficulty] = useState<string>("all");

  const canSubmit = useMemo(() => {
    if (loading || questionCount < 1 || questionCount > 20) {
      return false;
    }

    if (mode === "category" && !category) {
      return false;
    }

    return true;
  }, [category, loading, mode, questionCount]);

  const commonPayload = {
    question_count: questionCount,
    difficulty: difficulty !== "all" ? (difficulty as PracticeDifficulty) : undefined,
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
        ) : null}

        <div className="space-y-2">
          <Label htmlFor="title">Título (opcional)</Label>
          <Input
            id="title"
            value={title}
            maxLength={100}
            placeholder={
              mode === "category"
                ? "Evaluación de Planificación"
                : "Evaluación recomendada"
            }
            onChange={(event) => setTitle(event.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="question-count">Cantidad de preguntas (1-20)</Label>
            <Input
              id="question-count"
              type="number"
              min={1}
              max={20}
              value={questionCount}
              onChange={(event) => setQuestionCount(Number(event.target.value))}
            />
          </div>

          <div className="space-y-2">
            <Label>Dificultad (opcional)</Label>
            <Select value={difficulty} onValueChange={setDifficulty}>
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
