"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Clock3, Sparkles, TimerReset, TrendingUp } from "lucide-react";
import { formatDateTime, formatPracticeMinutes } from "@/lib/learning.utils";

interface LearningStatsHeaderProps {
  totalPracticeMinutes: number;
  lastPracticeAt: string | null;
  totalXp: number;
  domainCount: number;
}

export function LearningStatsHeader({
  totalPracticeMinutes,
  lastPracticeAt,
  totalXp,
  domainCount,
}: LearningStatsHeaderProps) {
  const stats = [
    {
      label: "Tiempo total",
      value: formatPracticeMinutes(totalPracticeMinutes),
      subLabel: "Práctica acumulada",
      icon: Clock3,
    },
    {
      label: "Última práctica",
      value: formatDateTime(lastPracticeAt),
      subLabel: "Actividad más reciente",
      icon: TimerReset,
    },
    {
      label: "XP total",
      value: `${totalXp}`,
      subLabel: "Experiencia ganada",
      icon: Sparkles,
    },
    {
      label: "Temas medidos",
      value: `${domainCount}`,
      subLabel: "Dominios con score",
      icon: TrendingUp,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.label} className="border-border/70">
          <CardContent className="flex items-start justify-between p-5">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                {stat.label}
              </p>
              <p className="text-base font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.subLabel}</p>
            </div>
            <div className="rounded-xl bg-primary/10 p-2 text-primary">
              <stat.icon className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
