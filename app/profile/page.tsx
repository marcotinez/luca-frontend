'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import withAuth from '@/components/auth/withAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { User } from '@/types';
import { ArrowLeft, Mail, Calendar, GraduationCap, User as UserIcon, Tag, Sparkles } from 'lucide-react';

interface ProfileProps {
  user: User;
}

function ProfilePage({ user }: ProfileProps) {
  const router = useRouter();

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] p-6 sm:p-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
        >
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500 bg-clip-text text-transparent mb-2">Mi Perfil</h1>
            <p className="text-muted-foreground text-lg">Gestiona tu información personal y preferencias</p>
          </div>
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard')}
            className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl border border-emerald-500/20 shadow-2xl hover:bg-primary/10 hover:border-emerald-500/50 transition-all duration-300 ease-in-out"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al Dashboard
          </Button>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid gap-6 lg:grid-cols-3"
        >
          {/* Profile Card */}
          <motion.div variants={item} className="lg:col-span-1">
            <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-3xl border border-emerald-500/40 shadow-2xl border-emerald-500/30 h-full">
              <CardContent className="pt-6 flex flex-col items-center text-center space-y-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.2 }}
                  className="flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white text-4xl font-bold shadow-2xl"
                >
                  {user.email.charAt(0).toUpperCase()}
                </motion.div>
                <div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500 bg-clip-text text-transparent mb-1">
                    {user.email.split('@')[0]}
                  </h2>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
                <div className="w-full pt-4 border-t border-emerald-500/30 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Miembro desde</span>
                    <span className="font-medium">{new Date(user.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Progreso</span>
                    <span className="font-medium bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500 bg-clip-text text-transparent">10%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Information Cards */}
          <motion.div variants={item} className="lg:col-span-2 space-y-6">
            <Card className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl border border-emerald-500/20 shadow-2xl border-emerald-500/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserIcon className="h-5 w-5 text-emerald-500" />
                  Información Personal
                </CardTitle>
                <CardDescription>Tus datos básicos de perfil</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl border border-emerald-500/20 shadow-2xl p-4 rounded-lg space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      <span>Correo Electrónico</span>
                    </div>
                    <p className="text-lg font-medium">{user.email}</p>
                  </div>

                  <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl border border-emerald-500/20 shadow-2xl p-4 rounded-lg space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <UserIcon className="h-4 w-4" />
                      <span>Edad</span>
                    </div>
                    <p className="text-lg font-medium">{user.profile?.age} años</p>
                  </div>

                  <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl border border-emerald-500/20 shadow-2xl p-4 rounded-lg space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <GraduationCap className="h-4 w-4" />
                      <span>Nivel Educacional</span>
                    </div>
                    <p className="text-lg font-medium">{user.profile?.education_level}</p>
                  </div>

                  <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl border border-emerald-500/20 shadow-2xl p-4 rounded-lg space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>Fecha de Registro</span>
                    </div>
                    <p className="text-lg font-medium">{new Date(user.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl border border-emerald-500/20 shadow-2xl border-emerald-500/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="h-5 w-5 text-accent" />
                  Intereses Financieros
                </CardTitle>
                <CardDescription>Áreas de tu interés en educación financiera</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {user.profile?.interests?.map((interest, index) => (
                    <motion.span
                      key={interest}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl border border-emerald-500/20 shadow-2xl inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-500/20 to-teal-500/20 px-4 py-2 text-sm font-medium border border-emerald-500/30 hover:border-emerald-500/50 hover:scale-105 transition-all duration-300 ease-in-out cursor-default"
                    >
                      <Sparkles className="h-3 w-3 text-emerald-500" />
                      {interest}
                    </motion.span>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Action Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-3xl border border-emerald-500/40 shadow-2xl border-emerald-500/30 overflow-hidden">
            <CardContent className="p-8 text-center">
              <div className="relative z-10">
                <h3 className="text-2xl font-bold bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500 bg-clip-text text-transparent mb-2">
                  ¿Quieres actualizar tu perfil?
                </h3>
                <p className="text-muted-foreground mb-6">
                  Mantén tu información actualizada para recibir recomendaciones personalizadas
                </p>
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:shadow-lg hover:scale-105 transition-all duration-300 ease-in-out"
                >
                  Editar Perfil
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

export default withAuth(ProfilePage);
