"use client";

import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Flame, Gauge } from "lucide-react";

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
    <section className="animate-enter-up rounded-2xl border border-border/70 bg-card/80 p-4 shadow-sm backdrop-blur sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold text-foreground">Progreso: {answered}/{total}</p>
          <Badge variant={streak > 0 ? "default" : "secondary"} className="gap-1 px-2.5 py-0.5">
            <Flame className="h-3.5 w-3.5" />
            Racha: {streak}
          </Badge>
          <Badge variant="outline" className="gap-1 px-2.5 py-0.5">
            <Gauge className="h-3.5 w-3.5" />
            Mejor: {bestStreak}
          </Badge>
        </div>
        <p className="font-semibold text-muted-foreground">{progress}%</p>
      </div>
      <Progress value={progress} className="mt-3 h-2.5" />
    </section>
  );
}
