'use client';

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, TrendingUp, ShieldCheck, BookOpen, Sparkles, Zap, Target } from "lucide-react";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export default function Home() {
  return (
    <div className="min-h-screen">
      <main>
        {/* Hero Section */}
        <div className="relative isolate px-6 pt-14 lg:px-8 overflow-hidden">
          {/* Animated gradient orbs */}
          <div className="absolute inset-0 -z-10">
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 90, 0],
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: "linear"
              }}
              className="absolute left-[10%] top-[10%] h-[500px] w-[500px] rounded-full bg-gradient-to-br from-primary/30 to-accent/20 blur-3xl"
            />
            <motion.div
              animate={{
                scale: [1.2, 1, 1.2],
                rotate: [90, 0, 90],
              }}
              transition={{
                duration: 25,
                repeat: Infinity,
                ease: "linear"
              }}
              className="absolute right-[10%] top-[20%] h-[600px] w-[600px] rounded-full bg-gradient-to-bl from-accent/30 to-primary/20 blur-3xl"
            />
            <motion.div
              animate={{
                scale: [1, 1.3, 1],
                x: [0, 100, 0],
              }}
              transition={{
                duration: 30,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute left-[40%] bottom-[10%] h-[400px] w-[400px] rounded-full bg-gradient-to-tr from-primary/20 to-accent/30 blur-3xl"
            />
          </div>

          <div className="mx-auto max-w-3xl py-32 sm:py-48 lg:py-56">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={containerVariants}
              className="text-center"
            >
              <motion.div variants={itemVariants} className="mb-8 flex justify-center">
                <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl border border-emerald-500/20 shadow-2xl inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium">
                  <Sparkles className="h-4 w-4 text-emerald-500" />
                  <span className="bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500 bg-clip-text text-transparent">Tu tutor financiero personal</span>
                </div>
              </motion.div>

              <motion.h1
                variants={itemVariants}
                className="text-5xl font-bold tracking-tight text-foreground sm:text-7xl mb-6"
              >
                Tu camino hacia la{" "}
                <span className="bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500 bg-clip-text text-transparent animate-shimmer bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500 bg-[length:200%_auto]">
                  libertad financiera
                </span>
              </motion.h1>

              <motion.p
                variants={itemVariants}
                className="mt-6 text-lg leading-8 text-muted-foreground max-w-2xl mx-auto"
              >
                Luca es tu tutor financiero personal impulsado por IA. Aprende, planifica y alcanza tus metas con herramientas diseñadas para ti. Educación financiera simple, efectiva y a tu ritmo.
              </motion.p>

              <motion.div
                variants={itemVariants}
                className="mt-10 flex items-center justify-center gap-x-6"
              >
                <Link href="/register">
                  <Button size="lg" className="gap-2 text-lg h-14 px-8 bg-gradient-to-r from-emerald-500 to-teal-500 hover:shadow-2xl hover:scale-105 transition-all duration-300 ease-in-out glow-primary">
                    Comenzar Ahora <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button variant="outline" size="lg" className="text-lg h-14 px-8 bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl border border-emerald-500/20 shadow-2xl hover:bg-primary/10 transition-all duration-300 ease-in-out">
                    Ya tengo cuenta
                  </Button>
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </div>



        {/* Features Section */}
        <div className="mx-auto max-w-7xl px-6 lg:px-8 pb-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mx-auto max-w-2xl lg:text-center mb-16"
          >
            <h2 className="text-base font-semibold leading-7 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500 bg-clip-text text-transparent text-lg">Aprende y Crece</h2>
            <p className="mt-2 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              Todo lo que necesitas para dominar tus finanzas
            </p>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              Herramientas poderosas diseñadas para ayudarte a alcanzar la libertad financiera
            </p>
          </motion.div>

          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <dl className="grid max-w-xl grid-cols-1 gap-8 lg:max-w-none lg:grid-cols-2 xl:grid-cols-4">
              {[
                {
                  name: 'Educación Personalizada',
                  description: 'Contenido adaptado a tu nivel de conocimiento y objetivos financieros.',
                  icon: BookOpen,
                  gradient: 'from-emerald-500 to-teal-500',
                },
                {
                  name: 'Seguimiento de Metas',
                  description: 'Define tus objetivos y sigue tu progreso paso a paso con herramientas visuales.',
                  icon: TrendingUp,
                  gradient: 'from-teal-500 to-cyan-500',
                },
                {
                  name: 'Seguridad Garantizada',
                  description: 'Tus datos están protegidos con los más altos estándares de seguridad.',
                  icon: ShieldCheck,
                  gradient: 'from-green-500 to-emerald-500',
                },
                {
                  name: 'Progreso Verificado',
                  description: 'Aprende junto a otros usuarios y comparte tus experiencias y logros.',
                  icon: CheckCircle2,
                  gradient: 'from-cyan-500 to-teal-500',
                },
              ].map((feature, index) => (
                <motion.div
                  key={feature.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  viewport={{ once: true }}
                  className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl border border-emerald-500/20 shadow-2xl p-8 transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-2xl group"
                >
                  <div className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${feature.gradient} mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 ease-in-out shadow-lg`}>
                    <feature.icon className="h-7 w-7 text-white" aria-hidden="true" />
                  </div>
                  <dt className="text-xl font-semibold leading-7 text-foreground mb-3">
                    {feature.name}
                  </dt>
                  <dd className="text-base leading-7 text-muted-foreground">
                    {feature.description}
                  </dd>
                </motion.div>
              ))}
            </dl>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mx-auto max-w-7xl px-6 lg:px-8 pb-24">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-3xl border border-emerald-500/40 shadow-2xl rounded-3xl p-12 text-center relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />
            <div className="relative z-10">
              <h2 className="text-4xl font-bold text-foreground mb-4">
                ¿Listo para transformar tus finanzas?
              </h2>
              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                Únete a miles de usuarios que ya están construyendo su futuro financiero con Luca
              </p>
              <Link href="/register">
                <Button size="lg" className="gap-2 text-lg h-14 px-10 bg-gradient-to-r from-emerald-500 to-teal-500 hover:shadow-2xl hover:scale-105 transition-all duration-300 ease-in-out glow-primary">
                  Comenzar Gratis <Sparkles className="h-5 w-5" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
