'use client';

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { MoveRight, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ThemeToggle";

export function Navbar() {
  const [mounted, setMounted] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const isLoginPage = pathname === '/login';
  const isRegisterPage = pathname === '/register';
  const isPublicPage = pathname === '/';

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

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

        {/* Desktop and Mobile Actions */}
        <div className="flex items-center gap-2 sm:gap-4">
          {mounted ? <ThemeToggle compact /> : null}

          {/* Desktop Links */}
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

          {/* Mobile Menu Button */}
          {!isLoginPage && !isRegisterPage && isPublicPage && (
            <Button
              variant="ghost"
              size="icon"
              className="sm:hidden"
              onClick={toggleMenu}
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </Button>
          )}
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <div
        className={cn(
          "sm:hidden fixed inset-x-0 bg-background border-b border-border transition-all duration-300 ease-in-out transform",
          isMenuOpen ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0 pointer-events-none"
        )}
        style={{ top: '64px' }}
      >
        <div className="px-4 py-6 space-y-4">
          <Button variant="outline" className="w-full justify-start h-12 text-lg" asChild onClick={() => setIsMenuOpen(false)}>
            <Link href="/login">Iniciar Sesión</Link>
          </Button>
          <Button className="w-full justify-start h-12 text-lg font-bold" asChild onClick={() => setIsMenuOpen(false)}>
            <Link href="/register">
              Comenzar Gratis
              <MoveRight className="ml-2 w-5 h-5" />
            </Link>
          </Button>
        </div>
      </div>
    </nav>
  );
}
