'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import withAuth from '@/components/auth/withAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { User } from '@/types';
import { Wallet, TrendingUp, User as UserIcon, Shield, ArrowRight, Target, Zap, BookOpen } from 'lucide-react';

interface DashboardProps {
  user: User;
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

function DashboardPage({ user }: DashboardProps) {
  const router = useRouter();

  return (
    <div className="min-h-[calc(100vh-4rem)] p-6 sm:p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
        >
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500 bg-clip-text text-transparent mb-2">
              Hola, {user.email.split('@')[0]} 👋
            </h1>
            <p className="text-muted-foreground text-lg">Bienvenido de nuevo a tu panel financiero.</p>
          </div>
          <div className="flex gap-3">
             {user.is_superuser && (
                <Button
                  variant="outline"
                  onClick={() => router.push('/admin')}
                  className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl border border-emerald-500/20 shadow-2xl hover:bg-primary/10 hover:border-emerald-500/50 transition-all duration-300 ease-in-out"
                >
                  <Shield className="mr-2 h-4 w-4" />
                  Panel Admin
                </Button>
             )}
          </div>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-4"
        >
          {/* Stats Cards */}
          <motion.div variants={item}>
            <Card className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl border border-emerald-500/20 shadow-2xl transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-2xl border-emerald-500/20 h-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Progreso Total</CardTitle>
                <Target className="h-5 w-5 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500 bg-clip-text text-transparent">10%</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Completado este mes
                </p>
                <div className="mt-3 h-2 w-full rounded-full bg-muted/30">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '10%' }}
                    transition={{ duration: 1, delay: 0.5 }}
                    className="h-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={item}>
            <Card className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl border border-emerald-500/20 shadow-2xl transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-2xl border-emerald-500/20 h-full cursor-pointer" onClick={() => router.push('/profile')}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tu Perfil</CardTitle>
                <UserIcon className="h-5 w-5 text-accent" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{user.profile?.age} años</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {user.profile?.education_level}
                </p>
                <div className="mt-3 flex flex-wrap gap-1">
                  {user.profile?.interests?.slice(0, 2).map(i => (
                    <span key={i} className="inline-flex items-center rounded-full bg-gradient-to-r from-emerald-500/20 to-teal-500/20 px-2 py-1 text-xs font-medium border border-emerald-500/20">
                      {i.split(' ')[0]}
                    </span>
                  ))}
                  {(user.profile?.interests?.length || 0) > 2 && (
                    <span className="inline-flex items-center rounded-full bg-gradient-to-r from-emerald-500/20 to-teal-500/20 px-2 py-1 text-xs font-medium border border-emerald-500/20">
                      +{user.profile!.interests!.length - 2}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={item}>
            <Card className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl border border-emerald-500/20 shadow-2xl transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-2xl h-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Salud Financiera</CardTitle>
                <TrendingUp className="h-5 w-5 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-muted-foreground">--</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Puntaje no calculado
                </p>
                <Button variant="link" className="mt-2 p-0 h-auto text-emerald-500 hover:text-emerald-500/80">
                  Calcular ahora →
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={item}>
            <Card className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl border border-emerald-500/20 shadow-2xl transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-2xl h-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Lecciones</CardTitle>
                <BookOpen className="h-5 w-5 text-teal-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">0/24</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Módulos completados
                </p>
                <Button variant="link" className="mt-2 p-0 h-auto text-emerald-500 hover:text-emerald-500/80">
                  Comenzar →
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Main Progress Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-3xl border border-emerald-500/40 shadow-2xl border-emerald-500/30 overflow-hidden">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Zap className="h-6 w-6 text-emerald-500" />
                <span className="bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500 bg-clip-text text-transparent">Tu Camino de Aprendizaje</span>
              </CardTitle>
              <CardDescription className="text-base">
                Completa tu perfil y comienza tu primera lección para avanzar en tu educación financiera
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Progreso general</span>
                  <span className="text-muted-foreground">10%</span>
                </div>
                <div className="h-3 w-full rounded-full bg-muted/30 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '10%' }}
                    transition={{ duration: 1.5, delay: 0.5 }}
                    className="h-3 rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500 bg-[length:200%_auto] animate-shimmer shadow-lg"
                  />
                </div>
              </div>
              <Button
                className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-teal-500 hover:shadow-lg hover:scale-105 transition-all duration-300 ease-in-out"
                onClick={() => router.push('/profile')}
              >
                Continuar Aprendizaje <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl border border-emerald-500/20 shadow-2xl border-emerald-500/20">
            <CardHeader>
              <CardTitle className="text-xl">Herramientas Rápidas</CardTitle>
              <CardDescription>Accesos directos a funciones comunes</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
               <Button variant="outline" className="h-28 flex-col gap-3 bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl border border-emerald-500/20 shadow-2xl hover:bg-primary/10 hover:border-emerald-500/50 hover:scale-105 transition-all duration-300 ease-in-out group">
                  <Wallet className="h-8 w-8 text-emerald-500 group-hover:scale-110 transition-all duration-300 ease-in-out" />
                  <span className="font-medium">Presupuesto</span>
               </Button>
               <Button variant="outline" className="h-28 flex-col gap-3 bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl border border-emerald-500/20 shadow-2xl hover:bg-accent/10 hover:border-emerald-500/50 hover:scale-105 transition-all duration-300 ease-in-out group">
                  <TrendingUp className="h-8 w-8 text-accent group-hover:scale-110 transition-all duration-300 ease-in-out" />
                  <span className="font-medium">Metas</span>
               </Button>
               <Button variant="outline" className="h-28 flex-col gap-3 bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl border border-emerald-500/20 shadow-2xl hover:bg-primary/10 hover:border-emerald-500/50 hover:scale-105 transition-all duration-300 ease-in-out group">
                  <Target className="h-8 w-8 text-emerald-500 group-hover:scale-110 transition-all duration-300 ease-in-out" />
                  <span className="font-medium">Objetivos</span>
               </Button>
               <Button variant="outline" className="h-28 flex-col gap-3 bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl border border-emerald-500/20 shadow-2xl hover:bg-accent/10 hover:border-emerald-500/50 hover:scale-105 transition-all duration-300 ease-in-out group">
                  <BookOpen className="h-8 w-8 text-teal-500 group-hover:scale-110 transition-all duration-300 ease-in-out" />
                  <span className="font-medium">Recursos</span>
               </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

export default withAuth(DashboardPage);
