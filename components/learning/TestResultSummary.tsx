"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trophy, BarChart3 } from "lucide-react";
import type { PracticeTestSelectionMode } from "@/types";

interface TestResultSummaryProps {
  title?: string | null;
  selectionMode?: PracticeTestSelectionMode | null;
  targetCategory?: string | null;
  targetSubtopic?: string | null;
  correctAnswers: number;
  totalQuestions: number;
  onViewProgress: () => void;
  onNewTest: () => void;
}

export function TestResultSummary({
  title,
  selectionMode,
  targetCategory,
  targetSubtopic,
  correctAnswers,
  totalQuestions,
  onViewProgress,
  onNewTest,
}: TestResultSummaryProps) {
  const safeTotal = totalQuestions <= 0 ? 1 : totalQuestions;
  const percentage = Math.round((correctAnswers / safeTotal) * 100);

  return (
    <Card className="border-border/70">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Trophy className="h-5 w-5 text-amber-500" />
          Resultados del test
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {title ? <p className="text-sm text-muted-foreground">{title}</p> : null}
        {selectionMode || targetCategory || targetSubtopic ? (
          <div className="flex flex-wrap gap-2">
            {selectionMode ? (
              <Badge variant="outline">
                Modo: {selectionMode === "recommended" ? "Recomendado" : "Por categoría"}
              </Badge>
            ) : null}
            {targetCategory ? <Badge variant="secondary">{targetCategory}</Badge> : null}
            {targetSubtopic ? <Badge variant="secondary">{targetSubtopic}</Badge> : null}
          </div>
        ) : null}
        <div className="rounded-xl border border-border/60 bg-background/70 p-4">
          <p className="text-3xl font-black">{correctAnswers}/{totalQuestions}</p>
          <p className="text-sm text-muted-foreground">Puntaje bruto</p>
          <p className="mt-2 text-lg font-bold text-primary">{percentage}% de acierto</p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Button variant="outline" onClick={onViewProgress}>
            <BarChart3 className="mr-2 h-4 w-4" />
            Ver progreso
          </Button>
          <Button onClick={onNewTest}>Nuevo test</Button>
        </div>
      </CardContent>
    </Card>
  );
}
