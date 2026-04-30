'use client';

import { useEffect, useState } from "react";
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { User, LogOut, ChevronDown, ShieldCheck, Flame, House, BookOpen, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { getPracticeTests } from "@/lib/learning.api";
import { isDiagnosticPhaseFromTests } from "@/lib/learning.utils";

export function DashboardNavbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isDiagnosticPhase, setIsDiagnosticPhase] = useState(false);

  const userInitials = user?.email?.substring(0, 2).toUpperCase() || 'LU';
  const currentStreak = user?.gamification.current_streak || 0;
  const streakIsActive = currentStreak > 0;

  useEffect(() => {
    if (!user) return;
    let mounted = true;

    const loadPhase = async () => {
      try {
        const tests = await getPracticeTests();
        if (mounted) {
          setIsDiagnosticPhase(isDiagnosticPhaseFromTests(tests));
        }
      } catch {
        if (mounted) {
          setIsDiagnosticPhase(false);
        }
      }
    };

    void loadPhase();
    return () => {
      mounted = false;
    };
  }, [user]);

  return (
    <>
      <header className="bg-card border-b border-border sticky top-0 z-40 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => router.push('/dashboard')}
            >
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold italic">L</span>
              </div>
              <span className="text-xl font-bold tracking-tight">Luca</span>
            </div>

            {/* Racha al lado del logo */}
            <div
              className={`inline-flex h-8 items-center gap-1.5 rounded-full border px-2.5 text-sm font-bold transition-colors ${
                streakIsActive
                  ? "border-orange-200 bg-orange-50 text-orange-600 dark:border-orange-500/25 dark:bg-orange-500/10 dark:text-orange-400"
                  : "border-border bg-muted/30 text-muted-foreground"
              }`}
            >
              <Flame className={`h-4 w-4 ${streakIsActive ? "text-orange-500" : "text-muted-foreground"}`} />
              <span>{currentStreak}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle compact />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-auto gap-2 px-2 rounded-full hover:bg-accent transition-colors">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal border-b border-border/50 pb-2 mb-1">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.email?.split('@')[0]}</p>
                    <p className="text-xs leading-none text-muted-foreground truncate">
                      {user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>

                {/* Menú principal */}
                <DropdownMenuItem onClick={() => router.push('/dashboard')} className="cursor-pointer py-2.5">
                  <House className="mr-2 h-4 w-4" />
                  <span>Inicio</span>
                </DropdownMenuItem>

                {!isDiagnosticPhase ? (
                  <DropdownMenuItem onClick={() => router.push('/practice/new')} className="cursor-pointer py-2.5 my-1 bg-primary/10 text-primary focus:bg-primary/20 focus:text-primary rounded-md font-bold border border-primary/20 shadow-sm">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    <span>Crear Evaluación</span>
                  </DropdownMenuItem>
                ) : null}

                <DropdownMenuItem onClick={() => router.push('/perfil')} className="cursor-pointer py-2.5">
                  <User className="mr-2 h-4 w-4" />
                  <span>Progreso y Perfil</span>
                </DropdownMenuItem>

                <DropdownMenuItem onClick={() => router.push('/temario')} className="cursor-pointer py-2.5">
                  <BookOpen className="mr-2 h-4 w-4" />
                  <span>¿Qué aprenderás?</span>
                </DropdownMenuItem>

                {/* 1.5 Modo Administrador (Solo si es superuser) */}
                {user?.is_superuser && (
                  <DropdownMenuItem
                    onClick={() => router.push('/admin/usuarios')}
                    className="cursor-pointer py-2.5 text-emerald-600 dark:text-emerald-400 font-medium"
                  >
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    <span>Modo Administrador</span>
                  </DropdownMenuItem>
                )}

                <DropdownMenuSeparator />

                {/* 3. Cerrar Sesión */}
                <DropdownMenuItem
                  onClick={() => setShowLogoutModal(true)}
                  className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/5 py-2.5"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Cerrar Sesión</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <Dialog open={showLogoutModal} onOpenChange={setShowLogoutModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>¿Cerrar sesión?</DialogTitle>
            <DialogDescription>
              Estás a punto de salir de Luca. ¿Estás seguro de que quieres terminar tu sesión?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex sm:flex-row gap-2 pt-4">
            <Button variant="outline" onClick={() => setShowLogoutModal(false)} className="flex-1">
              Cancelar
            </Button>
            <Button variant="destructive" onClick={logout} className="flex-1">
              Sí, Cerrar Sesión
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
