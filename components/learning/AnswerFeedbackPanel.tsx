"use client";

import { Badge } from "@/components/ui/badge";
import { CircleCheckBig, CircleX, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";

interface AnswerFeedbackPanelProps {
  isCorrect: boolean;
  feedback: string;
  correctOptionLabel?: string;
}

export function AnswerFeedbackPanel({
  isCorrect,
  feedback,
  correctOptionLabel,
}: AnswerFeedbackPanelProps) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-3xl border shadow-sm",
        isCorrect ? "border-emerald-500/30 bg-emerald-500/8" : "border-rose-500/30 bg-rose-500/8",
      )}
    >
      <div className="flex items-center gap-2 border-b border-current/10 px-5 py-3 text-sm sm:px-6">
        {isCorrect ? (
          <>
            <CircleCheckBig className="h-5 w-5 text-emerald-600" />
            <Badge className="bg-emerald-600 hover:bg-emerald-600">Respuesta correcta</Badge>
          </>
        ) : (
          <>
            <CircleX className="h-5 w-5 text-rose-600" />
            <Badge variant="destructive">Respuesta incorrecta</Badge>
          </>
        )}
      </div>

      <div className="space-y-3 px-5 py-4 sm:px-6">
        <p className="text-sm leading-relaxed text-foreground">{feedback}</p>
        {!isCorrect && correctOptionLabel ? (
          <p className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Lightbulb className="h-3.5 w-3.5" />
            Respuesta correcta: opción {correctOptionLabel}
          </p>
        ) : null}
      </div>
    </section>
  );
}
