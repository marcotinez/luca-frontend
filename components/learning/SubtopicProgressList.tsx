"use client";

import type { SubtopicKnowledge } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { scoreColorClasses, scoreTone } from "@/lib/learning.utils";

interface SubtopicProgressListProps {
  subtopics: SubtopicKnowledge[];
}

export function SubtopicProgressList({ subtopics }: SubtopicProgressListProps) {
  return (
    <Card className="border-border/70 bg-card/85 shadow-sm backdrop-blur">
      <CardHeader className="border-b border-border/60 pb-4">
        <CardTitle className="text-lg">Progreso por subtópico</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 p-4 sm:p-5">
        {subtopics.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aún no hay subtópicos medidos.
          </p>
        ) : (
          subtopics.map((item) => (
            <div key={`${item.topic}-${item.subtopic}`} className="rounded-xl border border-border/60 bg-background/75 p-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-foreground">{item.subtopic}</p>
                  <p className="text-xs text-muted-foreground">{item.topic}</p>
                </div>
                <p className={`text-sm font-bold ${scoreTone(item.score)}`}>
                  {Math.round(item.score)}%
                </p>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full transition-all duration-500 ${scoreColorClasses(item.score)}`}
                  style={{ width: `${Math.max(0, Math.min(100, item.score))}%` }}
                />
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                <span>{item.correct_attempts}/{item.attempts} correctas</span>
                <span>{item.attempts} intentos</span>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
