"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trophy, BarChart3, Smile, Frown, TrendingUp, TrendingDown, Sparkles, Target } from "lucide-react";
import type { AdaptiveContext, PracticeTestSelectionMode } from "@/types";

interface TestResultSummaryProps {
  title?: string | null;
  selectionMode?: PracticeTestSelectionMode | null;
  targetCategory?: string | null;
  targetSubtopic?: string | null;
  recommendationReason?: string | null;
  adaptiveContext?: AdaptiveContext | null;
  correctAnswers: number;
  totalQuestions: number;
  onViewProgress: () => void;
  onGoHome: () => void;
}

export function TestResultSummary({
  title,
  selectionMode,
  targetCategory,
  targetSubtopic,
  recommendationReason,
  adaptiveContext,
  correctAnswers,
  totalQuestions,
  onViewProgress,
  onGoHome,
}: TestResultSummaryProps) {
  const safeTotal = totalQuestions <= 0 ? 1 : totalQuestions;
  const percentage = Math.round((correctAnswers / safeTotal) * 100);
  const baseline = adaptiveContext?.basis_accuracy ?? null;
  const delta = baseline === null ? null : Math.round(percentage - baseline);
  const focusLabel = targetSubtopic || targetCategory || "tu foco actual";

  const performanceTone =
    percentage >= 85
      ? { title: "Excelente resultado", icon: Smile, color: "text-emerald-600", msg: "Mostraste dominio sólido en este test." }
      : percentage >= 65
        ? { title: "Buen avance", icon: Sparkles, color: "text-primary", msg: "Vas por buen camino, aún hay espacio para consolidar." }
        : { title: "Oportunidad clara de mejora", icon: Frown, color: "text-amber-600", msg: "Este resultado te muestra exactamente dónde reforzar." };

  const insightText =
    delta === null
      ? `Completaste este test en ${focusLabel}. Sigue practicando para construir tendencia.`
      : delta >= 8
        ? `Mejoraste en ${focusLabel}: +${delta} puntos vs tu base reciente.`
        : delta <= -8
          ? `Empeoraste en ${focusLabel}: ${delta} puntos vs tu base reciente.`
          : `Rendimiento estable en ${focusLabel}: ${delta >= 0 ? "+" : ""}${delta} puntos vs tu base reciente.`;

  const InsightIcon = delta === null ? Target : delta >= 0 ? TrendingUp : TrendingDown;
  const insightColor = delta === null ? "text-sky-600" : delta >= 0 ? "text-emerald-600" : "text-rose-600";
  const ToneIcon = performanceTone.icon;

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
        {recommendationReason || adaptiveContext?.reason ? (
          <div className="rounded-xl border border-primary/25 bg-primary/5 p-3 text-sm text-foreground">
            {recommendationReason || adaptiveContext?.reason}
          </div>
        ) : null}
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-border/60 bg-background/70 p-4">
            <p className="text-3xl font-black">{correctAnswers}/{totalQuestions}</p>
            <p className="text-sm text-muted-foreground">Puntaje bruto</p>
            <p className="mt-2 text-lg font-bold text-primary">{percentage}% de acierto</p>
          </div>
          <div className="rounded-xl border border-border/60 bg-background/70 p-4">
            <p className={`inline-flex items-center gap-2 text-base font-black ${performanceTone.color}`}>
              <ToneIcon className="h-4 w-4" />
              {performanceTone.title}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">{performanceTone.msg}</p>
            {baseline !== null ? (
              <p className="mt-3 text-xs text-muted-foreground">
                Base reciente: {Math.round(baseline)}% ({delta && delta !== 0 ? `${delta > 0 ? "+" : ""}${delta} pts` : "sin cambios relevantes"})
              </p>
            ) : null}
          </div>
        </div>

        <div className="rounded-xl border border-border/60 bg-background/70 p-4">
          <p className={`inline-flex items-center gap-2 text-sm font-semibold ${insightColor}`}>
            <InsightIcon className="h-4 w-4" />
            Insight de progreso
          </p>
          <p className="mt-2 text-sm">{insightText}</p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Button variant="outline" onClick={onViewProgress}>
            <BarChart3 className="mr-2 h-4 w-4" />
            Ver progreso
          </Button>
          <Button onClick={onGoHome}>Volver al inicio</Button>
        </div>
      </CardContent>
    </Card>
  );
}
