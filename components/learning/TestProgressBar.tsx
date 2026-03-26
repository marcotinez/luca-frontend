"use client";

import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Flame } from "lucide-react";

interface TestProgressBarProps {
  answered: number;
  total: number;
  streak?: number;
  bestStreak?: number;
}

export function TestProgressBar({ answered, total, streak = 0, bestStreak = 0 }: TestProgressBarProps) {
  const safeTotal = total <= 0 ? 1 : total;
  const progress = Math.min(100, Math.round((answered / safeTotal) * 100));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-foreground">
            Progreso: {answered}/{total}
          </p>
          <Badge variant={streak > 0 ? "default" : "secondary"} className="gap-1">
            <Flame className="h-3.5 w-3.5" />
            Racha: {streak}
          </Badge>
          <Badge variant="outline">Mejor: {bestStreak}</Badge>
        </div>
        <p className="text-muted-foreground">{progress}%</p>
      </div>
      <Progress value={progress} />
    </div>
  );
}
