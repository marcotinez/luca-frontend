'use client';

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Flame, Star } from "lucide-react";

interface WelcomeHeaderProps {
  email: string;
  totalXp: number;
  currentStreak: number;
}

export function WelcomeHeader({ email, totalXp, currentStreak }: WelcomeHeaderProps) {
  const name = email?.split('@')[0];
  const initials = email?.substring(0, 2).toUpperCase() || 'LU';
  const level = Math.floor((totalXp || 0) / 100) + 1;

  return (
    <div className="relative overflow-hidden rounded-3xl bg-card border border-border p-8 mb-10 shadow-sm">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
        <Sparkles className="w-32 h-32 text-primary rotate-12" />
      </div>

      <div className="flex flex-col md:flex-row gap-8 items-start md:items-center relative z-10">
        <div className="relative">
          <Avatar className="w-24 h-24 border-4 border-primary/20 shadow-xl">
            <AvatarFallback className="bg-primary/5 text-primary text-3xl font-black">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground p-1.5 rounded-full shadow-lg border-2 border-card">
            <Star className="w-5 h-5 fill-current" />
          </div>
        </div>

        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-foreground">
              ¡Hola, {name}! <span className="animate-wave inline-block">👋</span>
            </h1>
            <Badge variant="secondary" className="px-3 py-1 bg-primary/10 text-primary border-primary/20 font-bold text-sm tracking-wide uppercase">
              NIVEL {level}
            </Badge>
          </div>
          <p className="text-muted-foreground text-lg font-medium opacity-80">
            Tu camino hacia la maestría financiera continúa hoy.
          </p>
        </div>

        <div className="flex flex-col gap-3 min-w-[180px]">
          <div className="flex items-center gap-3 bg-secondary/50 p-3 rounded-2xl border border-secondary/20">
            <div className="bg-orange-500/10 p-2 rounded-xl">
              <Flame className="w-6 h-6 text-orange-500 fill-orange-500/20" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground leading-none mb-1">RACHA ACTUAL</p>
              <p className="text-xl font-black text-foreground">{currentStreak} Días</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
