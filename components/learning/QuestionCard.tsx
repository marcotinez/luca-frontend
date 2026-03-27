"use client";

import type { PracticeTestQuestionPublic } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface QuestionCardProps {
  question: PracticeTestQuestionPublic;
}

export function QuestionCard({ question }: QuestionCardProps) {
  return (
    <Card className="animate-enter-up border-border/70 bg-card/85 shadow-sm backdrop-blur">
      <CardHeader className="space-y-4 border-b border-border/60 pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{question.category}</Badge>
          <Badge variant="outline">{question.difficulty}</Badge>
          <Badge variant="outline">{question.subtopic}</Badge>
        </div>
        <CardTitle className="text-lg leading-relaxed sm:text-xl">{question.prompt}</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-3">
        <p className="text-xs text-muted-foreground">
          Selecciona una alternativa para recibir feedback inmediato.
        </p>
      </CardContent>
    </Card>
  );
}
