"use client";

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
    <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <article
          key={stat.label}
          className="animate-enter-up rounded-2xl border border-border/70 bg-card/85 p-4 shadow-sm backdrop-blur"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {stat.label}
              </p>
              <p className="text-lg font-black tracking-tight text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.subLabel}</p>
            </div>
            <div className="rounded-xl border border-primary/25 bg-primary/10 p-2 text-primary">
              <stat.icon className="h-4.5 w-4.5" />
            </div>
          </div>
        </article>
      ))}
    </section>
  );
}
