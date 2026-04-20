"use client";

import type { PracticeTestQuestionPublic } from "@/types";
import { Badge } from "@/components/ui/badge";

interface QuestionCardProps {
  question: PracticeTestQuestionPublic;
}

export function QuestionCard({ question }: QuestionCardProps) {
  return (
    <article className="animate-enter-up overflow-hidden rounded-3xl border border-border/70 bg-card/85 shadow-sm backdrop-blur">
      <div className="border-b border-border/60 px-5 py-4 sm:px-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{question.category}</Badge>
          <Badge variant="outline">{question.subtopic}</Badge>
          <Badge variant="outline">{question.difficulty}</Badge>
        </div>
      </div>

      <div className="space-y-3 px-5 py-6 sm:px-6 sm:py-7">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/80">Pregunta activa</p>
        <h2 className="text-xl font-black leading-relaxed tracking-tight sm:text-2xl">{question.prompt}</h2>
        <p className="text-sm text-muted-foreground">Elige la alternativa que consideres correcta. Recibirás feedback inmediato al responder.</p>
      </div>
    </article>
  );
}
