import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { MoveRight, BrainCircuit, Trophy, Sparkles, BookOpen, Target, Zap } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />

      {/* Hero Section: Two Columns */}
      <section className="relative pt-32 pb-32 lg:pt-48 lg:pb-56 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">

            {/* Left Column: Content (7 cols) */}
            <div className="lg:col-span-7 text-left space-y-8 animate-in fade-in slide-in-from-left-8 duration-1000 z-10">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-black uppercase tracking-widest">
                <Zap className="w-4 h-4 fill-current" />
                <span>Educación Financiera 2.0</span>
              </div>

              <h1 className="text-6xl md:text-8xl lg:text-[100px] font-black tracking-tighter text-foreground leading-[0.85] lg:leading-[0.8]">
                Aprende <br />
                <span className="text-primary italic">Luca</span> a <br />
                Luca.
              </h1>

              <p className="text-xl md:text-2xl text-muted-foreground max-w-xl font-medium leading-relaxed">
                Luca es como ese amigo que sabe mucho de plata y te ayuda a ordenarte. Te arma una ruta solo para ti, sin palabras raras ni clases aburridas.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button asChild size="lg" className="h-16 px-10 text-xl font-black rounded-2xl shadow-2xl shadow-primary/20 hover:scale-105 transition-all">
                  <Link href="/register">
                    ¡Quiero empezar!
                    <MoveRight className="ml-3 w-6 h-6" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="h-16 px-10 text-xl font-bold rounded-2xl border-2 border-border hover:bg-accent transition-all">
                  <Link href="/login">Ya tengo cuenta</Link>
                </Button>
              </div>
            </div>

            {/* Right Column: Image/Mascot (5 cols) */}
            <div className="lg:col-span-5 relative group animate-in fade-in zoom-in duration-1000 delay-200 lg:-ml-12 mt-12 lg:mt-0">

              {/* Floating UI Widget 1: XP */}
              <div className="absolute -top-4 -left-4 bg-card/80 backdrop-blur-xl border border-border p-4 rounded-2xl shadow-2xl z-20 animate-bounce-slow">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center">
                    <Zap className="w-5 h-5 text-amber-500 fill-current" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-1">VAS VOLANDO</p>
                    <p className="text-lg font-black text-foreground">+500 XP</p>
                  </div>
                </div>
              </div>

              {/* Floating UI Widget 2: Mastery */}
              <div className="absolute -bottom-8 -right-4 bg-card/80 backdrop-blur-xl border border-border p-4 rounded-2xl shadow-2xl z-20 animate-float">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
                    <BrainCircuit className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-1">TEMA DOMINADO</p>
                    <p className="text-lg font-black text-foreground">Ahorro e Inversión</p>
                  </div>
                </div>
              </div>

              <div className="relative aspect-square w-full scale-110 lg:scale-[1.35] transform-gpu">
                <Image
                  src="/images/hero.png"
                  alt="Luca Mascot"
                  fill
                  className="object-contain"
                  priority
                />
              </div>

              {/* Decorative Geometric Element */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] border border-primary/5 rounded-full -z-10" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] border border-primary/5 rounded-full -z-10" />
            </div>
          </div>
        </div>
      </section>

      {/* Project Explanation: The "Memoria" Section */}
      <section className="py-24 bg-secondary/30 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16">

            <div className="md:col-span-1 space-y-4">
              <h2 className="text-4xl font-black text-foreground leading-tight tracking-tight">
                ¿Por qué nace <span className="text-primary italic">Luca</span>?
              </h2>
              <p className="text-muted-foreground font-medium">
                En Chile, el acceso a una educación financiera de calidad es limitado. Luca nace como una respuesta tecnológica para reducir las brechas de conocimiento y fomentar una cultura de bienestar económico desde temprana edad.
              </p>
            </div>

            <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                  <Target className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-black uppercase italic tracking-tighter">Aprendizaje Adaptativo</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Nuestra plataforma identifica tus fortalezas y debilidades en tiempo real, personalizando cada sesión para optimizar tu tiempo y asegurar que domines cada concepto.
                </p>
              </div>

              <div className="space-y-4">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                  <BrainCircuit className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-black uppercase italic tracking-tighter">Respaldo Factual</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Utilizamos un riguroso sistema de validación de contenidos para garantizar que toda la información entregada sea precisa y actualizada.
                </p>
              </div>

              <div className="space-y-4">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-black uppercase italic tracking-tighter">Metodología Ágil</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Transformamos conceptos complejos en actividades interactivas y rápidas, permitiéndote avanzar de forma constante y medir tu progreso mediante logros y experiencias.
                </p>
              </div>

              <div className="space-y-4">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                  <BookOpen className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-black uppercase italic tracking-tighter">Preparación Real</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Te entregamos herramientas prácticas para enfrentar decisiones financieras reales: desde la gestión de tu primer sueldo hasta la planificación de inversiones futuras.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid - Simplified for more impact */}
      <section className="py-32">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-5xl font-black mb-20 tracking-tight">Decisiones hoy, libertad mañana.</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="group space-y-6">
              <div className="aspect-video relative rounded-3xl overflow-hidden bg-blue-500/10 border-2 border-primary/5 p-8 flex items-center justify-center group-hover:border-primary/20 transition-all">
                <BrainCircuit className="w-16 h-16 text-primary" />
              </div>
              <h4 className="text-2xl font-black italic">Tutor Inteligente</h4>
              <p className="text-muted-foreground font-medium">Un compañero digital que entiende tu proceso y te guía paso a paso.</p>
            </div>

            <div className="group space-y-6">
              <div className="aspect-video relative rounded-3xl overflow-hidden bg-orange-500/10 border-2 border-primary/5 p-8 flex items-center justify-center group-hover:border-primary/20 transition-all">
                <Zap className="w-16 h-16 text-orange-500" />
              </div>
              <h4 className="text-2xl font-black italic">Sesiones Dinámicas</h4>
              <p className="text-muted-foreground font-medium">Contenido diseñado para ser consumido en cualquier momento, optimizando tu aprendizaje diario.</p>
            </div>

            <div className="group space-y-6">
              <div className="aspect-video relative rounded-3xl overflow-hidden bg-emerald-500/10 border-2 border-primary/5 p-8 flex items-center justify-center group-hover:border-primary/20 transition-all">
                <Trophy className="w-16 h-16 text-emerald-500" />
              </div>
              <h4 className="text-2xl font-black italic">Bienestar Financiero</h4>
              <p className="text-muted-foreground font-medium">Aprende a gestionar tus recursos para construir una vida financiera sólida y sin estrés.</p>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-12 mt-auto bg-card/30">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
              <span className="text-primary-foreground font-black italic text-lg">L</span>
            </div>
            <span className="font-black text-2xl tracking-tighter">Luca</span>
          </div>
          <p className="text-muted-foreground text-sm font-medium">© 2025 Memoria de Título: Educación Financiera Adaptativa.</p>
          <div className="flex gap-8">
            <Link href="#" className="text-sm font-bold text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest">LinkedIn</Link>
            <Link href="#" className="text-sm font-bold text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest">Privacidad</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
