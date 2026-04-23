"use client";

import { CircleCheckBig, CircleX } from "lucide-react";
import { cn } from "@/lib/utils";

interface AnswerFeedbackPanelProps {
  isCorrect: boolean;
  feedback: string;
  correctOptionLabel?: string;
  correctAnswerText?: string;
}

export function AnswerFeedbackPanel({
  isCorrect,
  feedback,
  correctOptionLabel,
  correctAnswerText,
}: AnswerFeedbackPanelProps) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-3xl border shadow-sm",
        isCorrect ? "border-emerald-500/35 bg-emerald-500/5" : "border-rose-500/35 bg-rose-500/5",
      )}
    >
      <div
        className={cn(
          "grid gap-4 px-4 py-5 sm:grid-cols-[auto_1fr] sm:items-center sm:gap-5 sm:px-6 sm:py-6",
          isCorrect ? "text-emerald-700" : "text-rose-700",
        )}
      >
        {isCorrect ? (
          <CircleCheckBig className="h-12 w-12 sm:h-14 sm:w-14" />
        ) : (
          <CircleX className="h-12 w-12 sm:h-14 sm:w-14" />
        )}

        <div className="space-y-2 sm:space-y-3">
          <p className="text-lg font-bold leading-tight text-foreground">
            {isCorrect ? "Correcto" : "Incorrecto"}
          </p>
          <p className="text-sm leading-relaxed text-foreground sm:text-[15px]">{feedback}</p>
        </div>
      </div>

      {!isCorrect && (correctOptionLabel || correctAnswerText) ? (
        <div className="border-t border-rose-500/20 bg-rose-500/5 px-4 py-3 sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-rose-700/90">Respuesta correcta</p>
          <p className="mt-1 text-sm leading-relaxed text-foreground">
            {correctOptionLabel ? `Opción ${correctOptionLabel}` : ""}
            {correctOptionLabel && correctAnswerText ? ": " : ""}
            {correctAnswerText}
          </p>
        </div>
      ) : null}
    </section>
  );
}
