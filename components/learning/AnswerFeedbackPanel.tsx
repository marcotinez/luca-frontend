"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CircleCheckBig, CircleX } from "lucide-react";

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
    <Card
      className={
        isCorrect
          ? "border-emerald-500/30 bg-emerald-500/5"
          : "border-red-500/30 bg-red-500/5"
      }
    >
      <CardContent className="space-y-3 p-4">
        <div className="flex items-center gap-2">
          {isCorrect ? (
            <>
              <CircleCheckBig className="h-5 w-5 text-emerald-600" />
              <Badge className="bg-emerald-600 hover:bg-emerald-600">Correcta</Badge>
            </>
          ) : (
            <>
              <CircleX className="h-5 w-5 text-red-600" />
              <Badge variant="destructive">Incorrecta</Badge>
            </>
          )}
        </div>
        <p className="text-sm leading-relaxed text-foreground">{feedback}</p>
        {!isCorrect && correctOptionLabel && (
          <p className="text-xs text-muted-foreground">
            Respuesta correcta: opción {correctOptionLabel}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
