'use client';

import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthContext';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Sparkles, Home } from 'lucide-react';

export function Navbar() {
  const { user, logout } = useAuth();

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
      className="sticky top-0 z-50 w-full bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-emerald-500/30 shadow-xl border-b border-emerald-500/10"
    >
      <div className="px-6 sm:px-8">
        <div className="mx-auto max-w-7xl flex h-20 items-center justify-between">
        <Link
          href={user ? "/dashboard" : "/"}
          className="flex items-center gap-2 group"
        >
          <motion.div
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500"
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.6 }}
          >
            <Sparkles className="h-5 w-5 text-white" />
          </motion.div>
          <span className="text-2xl font-bold bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500 bg-clip-text text-transparent group-hover:opacity-80 transition-opacity">
            Luca
          </span>
        </Link>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              <Button
                variant="ghost"
                asChild
                className="hover:bg-emerald-500/10 hover:text-emerald-500 transition-all duration-300 ease-in-out"
              >
                <Link href="/dashboard">Dashboard</Link>
              </Button>
              <Button
                variant="ghost"
                asChild
                className="hover:bg-emerald-500/10 hover:text-emerald-500 transition-all duration-300 ease-in-out"
              >
                <Link href="/profile">Perfil</Link>
              </Button>
              <Button
                onClick={logout}
                variant="outline"
                className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl border border-emerald-500/20 shadow-2xl hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50 transition-all duration-300 ease-in-out"
              >
                Cerrar Sesión
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" asChild className="hover:bg-emerald-500/10 hover:text-emerald-500 transition-all duration-300 ease-in-out">
                <Link href="/login">Iniciar Sesión</Link>
              </Button>
              <Button asChild className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 ease-in-out">
                <Link href="/register">Registrarse</Link>
              </Button>
            </>
          )}
        </div>
      </div>
      </div>
    </motion.nav>
  );
}
