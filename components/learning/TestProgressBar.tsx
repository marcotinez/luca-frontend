"use client";

import { Progress } from "@/components/ui/progress";

interface TestProgressBarProps {
  answered: number;
  total: number;
}

export function TestProgressBar({ answered, total }: TestProgressBarProps) {
  const safeTotal = total <= 0 ? 1 : total;
  const progress = Math.min(100, Math.round((answered / safeTotal) * 100));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <p className="font-semibold text-foreground">
          Progreso: {answered}/{total}
        </p>
        <p className="text-muted-foreground">{progress}%</p>
      </div>
      <Progress value={progress} />
    </div>
  );
}
