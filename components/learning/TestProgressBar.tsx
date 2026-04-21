"use client";

import { Badge } from "@/components/ui/badge";
import { Flame, Gauge, Sparkles } from "lucide-react";

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
    <section className="animate-enter-up overflow-hidden rounded-3xl border border-border/70 bg-card shadow-sm backdrop-blur">
      <div className="border-b border-border/60 px-5 py-4 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary/80">Evaluación en curso</p>
            <p className="mt-1 text-lg font-black">{answered} de {total} preguntas</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={streak > 0 ? "default" : "secondary"} className="gap-1 px-2.5 py-1">
              <Flame className="h-3.5 w-3.5" />
              Racha {streak}
            </Badge>
          </div>
        </div>
      </div>

      <div className="px-5 py-4 sm:px-6">
        <div className="flex items-center gap-4">
          <div className="h-3 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-sm font-semibold">{progress}%</span>
        </div>
      </div>
    </section>
  );
}
