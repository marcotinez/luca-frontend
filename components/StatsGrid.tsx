'use client';

import { Zap, Trophy, Target } from "lucide-react";

interface StatsGridProps {
  totalXp: number;
  currentStreak: number;
  maxStreak: number;
  variant?: 'default' | 'compact';
}

export function StatsGrid({ totalXp, currentStreak, maxStreak, variant = 'default' }: StatsGridProps) {
  const stats = [
    {
      label: "XP Total",
      value: totalXp,
      icon: <Zap className={`w-8 h-8 ${variant === 'default' ? 'text-amber-500' : 'text-primary'}`} />,
      color: "amber",
      subLabel: "Experiencia"
    },
    {
      label: "Racha Actual",
      value: currentStreak,
      icon: <Trophy className={`w-8 h-8 ${variant === 'default' ? 'text-primary' : 'text-primary'}`} />,
      color: "primary",
      subLabel: "Días seguidos"
    },
    {
      label: "Racha Máxima",
      value: maxStreak,
      icon: <Target className={`w-8 h-8 ${variant === 'default' ? 'text-emerald-500' : 'text-primary'}`} />,
      color: "emerald",
      subLabel: "Récord personal"
    }
  ];

  if (variant === 'compact') {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-center">
        {stats.map((stat) => (
          <div key={stat.label}>
            <p className="text-2xl font-bold text-primary">{stat.value}</p>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">{stat.label}</p>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="bg-secondary/30 rounded-xl p-4 flex flex-col items-center text-center border border-secondary/20 hover:bg-secondary/40 transition-colors"
        >
          <div className="mb-2">{stat.icon}</div>
          <span className="text-2xl font-bold">{stat.value}</span>
          <span className="text-xs text-muted-foreground uppercase font-semibold">{stat.label}</span>
        </div>
      ))}
    </div>
  );
}
