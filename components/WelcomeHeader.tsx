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
    <div className="relative overflow-hidden rounded-3xl bg-card border border-border p-8 mb-10 shadow-sm text-center md:text-left">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
        <Sparkles className="w-24 h-24 sm:w-32 sm:h-32 text-primary rotate-12" />
      </div>

      <div className="flex flex-col md:flex-row gap-8 items-center relative z-10">
        <div className="relative">
          <Avatar className="w-20 h-20 sm:w-24 sm:h-24 border-4 border-muted shadow-xl">
            <AvatarFallback className="bg-muted text-muted-foreground text-2xl sm:text-3xl font-black">
              ??
            </AvatarFallback>
          </Avatar>
        </div>

        <div className="flex-1 space-y-2">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-foreground">
              ¡Hola, [Usuario]!
            </h1>
            <Badge variant="outline" className="px-2 py-0.5 font-bold text-[10px] sm:text-sm tracking-wide uppercase">
              NIVEL [X]
            </Badge>
          </div>
          <p className="text-muted-foreground text-base sm:text-lg font-medium opacity-80">
            [Mensaje de bienvenida genérico para la maqueta]
          </p>
        </div>

        <div className="flex items-center gap-4 bg-muted/30 p-4 rounded-2xl border border-dashed border-muted min-w-[200px] justify-center">
          <div className="bg-muted p-2 rounded-xl">
            <Flame className="w-6 h-6 text-muted-foreground" />
          </div>
          <div className="text-left">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground leading-none mb-1">DÍAS ACTIVOS</p>
            <p className="text-xl font-black text-foreground">[X] DÍAS</p>
          </div>
        </div>
      </div>
    </div>
  );
}
