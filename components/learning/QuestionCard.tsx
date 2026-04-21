"use client";

import type { PracticeTestQuestionPublic } from "@/types";
import { Badge } from "@/components/ui/badge";

interface QuestionCardProps {
  question: PracticeTestQuestionPublic;
}

export function QuestionCard({ question }: QuestionCardProps) {
  return (
    <article className="animate-enter-up overflow-hidden rounded-3xl border border-border/70 bg-card shadow-sm backdrop-blur">
      <div className="space-y-4 px-5 py-6 sm:px-6 sm:py-7">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <Badge variant="secondary" className="bg-primary/5">{question.category}</Badge>
          <Badge variant="outline">{question.subtopic}</Badge>
          <Badge variant="outline">{question.difficulty}</Badge>
        </div>
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/80">Pregunta activa</p>
          <h2 className="text-xl font-black leading-relaxed tracking-tight sm:text-2xl">{question.prompt}</h2>
        </div>
      </div>
    </article>
  );
}
