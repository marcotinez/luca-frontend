'use client';

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Moon, Sun, MoveRight } from "lucide-react";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";

export function Navbar() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const isLoginPage = pathname === '/login';
  const isRegisterPage = pathname === '/register';
  const isPublicPage = pathname === '/';

  return (
    <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold italic">L</span>
          </div>
          <span className="text-xl font-bold tracking-tight">Luca</span>
        </Link>

        {/* Desktop Actions */}
        <div className="flex items-center gap-4">
          {mounted && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="rounded-full"
            >
              {theme === "dark" ? (
                <Sun className="w-5 h-5 text-amber-400" />
              ) : (
                <Moon className="w-5 h-5 text-muted-foreground" />
              )}
            </Button>
          )}

          <div className="hidden sm:flex items-center gap-2">
            {!isLoginPage && !isRegisterPage && isPublicPage && (
              <>
                <Button variant="ghost" asChild>
                  <Link href="/login">Iniciar Sesión</Link>
                </Button>
                <Button asChild className="font-bold">
                  <Link href="/register">
                    Comenzar Gratis
                    <MoveRight className="ml-2 w-4 h-4" />
                  </Link>
                </Button>
              </>
            )}

            {isLoginPage && (
              <Button variant="outline" asChild>
                <Link href="/register">Crear Cuenta</Link>
              </Button>
            )}

            {isRegisterPage && (
              <Button variant="outline" asChild>
                <Link href="/login">Ya tengo cuenta</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
