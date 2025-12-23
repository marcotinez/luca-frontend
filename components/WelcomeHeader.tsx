'use client';

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

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
    <div className="flex flex-col md:flex-row gap-6 mb-8 items-start md:items-center justify-between">
      <div className="flex items-center gap-4">
        <Avatar className="w-16 h-16 border-2 border-primary/20 shadow-sm">
          <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Hola, {name}</h1>
          <p className="text-muted-foreground text-lg">Bienvenido de vuelta a tu tablero personal.</p>
        </div>
      </div>
      <div className="flex gap-2">
        <Badge variant="secondary" className="px-3 py-1 text-sm font-medium shadow-sm">
          Nivel {level}
        </Badge>
        <Badge variant="outline" className="px-3 py-1 text-sm font-medium bg-background border-border shadow-sm">
          Racha: {currentStreak} días 🔥
        </Badge>
      </div>
    </div>
  );
}
