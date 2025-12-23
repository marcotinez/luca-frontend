'use client';

import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from "next-themes";
import { User, LogOut, Sun, Moon, ChevronDown, Settings } from 'lucide-react';
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

export function DashboardNavbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const userInitials = user?.email?.substring(0, 2).toUpperCase() || 'LU';

  return (
    <>
      <header className="bg-card border-b border-border sticky top-0 z-40 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div
            className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => router.push('/inicio')}
          >
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold italic">L</span>
            </div>
            <span className="text-xl font-bold tracking-tight">Luca</span>
          </div>

          <div className="flex items-center gap-3">
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

                {/* 1. Perfil */}
                <DropdownMenuItem onClick={() => router.push('/perfil')} className="cursor-pointer py-2.5">
                  <User className="mr-2 h-4 w-4" />
                  <span>Perfil</span>
                </DropdownMenuItem>

                {/* 2. Dark Mode */}
                {mounted && (
                  <DropdownMenuItem
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                    className="cursor-pointer py-2.5"
                  >
                    {theme === "dark" ? (
                      <>
                        <Sun className="mr-2 h-4 w-4 text-amber-500" />
                        <span>Modo Claro</span>
                      </>
                    ) : (
                      <>
                        <Moon className="mr-2 h-4 w-4 text-slate-600" />
                        <span>Modo Oscuro</span>
                      </>
                    )}
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
