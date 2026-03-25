"use client";

import type { PracticeTestQuestionPublic } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface QuestionCardProps {
  question: PracticeTestQuestionPublic;
}

export function QuestionCard({ question }: QuestionCardProps) {
  return (
    <Card>
      <CardHeader className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{question.category}</Badge>
          <Badge variant="outline">{question.difficulty}</Badge>
          <Badge variant="outline">{question.subtopic}</Badge>
        </div>
        <CardTitle className="text-xl leading-relaxed">{question.prompt}</CardTitle>
      </CardHeader>
      <CardContent />
    </Card>
  );
}
