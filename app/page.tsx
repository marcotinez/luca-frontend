import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { MoveRight, BrainCircuit, Trophy, Sparkles, BookOpen, Target, Zap, ChevronDown } from "lucide-react";

import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />

      {/* Hero Section: Two Columns */}
      <section className="relative min-h-screen flex flex-col justify-start lg:justify-center overflow-hidden pt-16">
        <div className="max-w-7xl mx-auto px-7 sm:px-6 lg:px-8 w-full pt-6 lg:pt-0 pb-28 sm:pb-24 lg:pb-0">
          <div className="flex flex-col-reverse lg:grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">

            {/* Left Column: Content (7 cols) */}
            <div className="lg:col-span-7 text-center lg:text-left space-y-4 sm:space-y-8 animate-in fade-in slide-in-from-left-8 duration-1000 z-10 w-full -mt-28 sm:-mt-20 lg:mt-0 lg:pl-10 xl:pl-16">
              <h1 className="text-4xl sm:text-5xl md:text-8xl lg:text-[100px] font-black tracking-tighter text-foreground leading-[0.9] lg:leading-[0.8]">
                Aprende <br />
                <span className="text-primary italic">Luca</span> a
                <br className="hidden lg:block" /> Luca.
              </h1>

              <p className="text-lg md:text-2xl text-muted-foreground max-w-xl mx-auto lg:mx-0 font-medium leading-relaxed">
                Luca es ese amigo que sabe mucho de finanzas y te ayuda a entender sobre economía sin tanto enredo. Te arma una ruta solo para ti, sin palabras raras ni clases aburridas.
              </p>

              <div className="flex flex-col-reverse sm:flex-row justify-center lg:justify-start gap-3 pt-2 pb-4 sm:pb-0">
                <Button asChild variant="outline" size="lg" className="h-12 lg:h-16 px-6 lg:px-10 text-base lg:text-xl font-bold rounded-2xl border-2 border-border hover:bg-accent transition-all w-full sm:w-auto">
                  <Link href="/login">Ya tengo cuenta</Link>
                </Button>
                <Button asChild size="lg" className="h-12 lg:h-16 px-6 lg:px-10 text-base lg:text-xl font-black rounded-2xl shadow-xl shadow-primary/20 hover:scale-105 transition-all w-full sm:w-auto">
                  <Link href="/register">
                    ¡Quiero empezar!
                    <MoveRight className="ml-2 w-5 h-5 lg:w-6 lg:h-6" />
                  </Link>
                </Button>
              </div>
            </div>

            {/* Right Column: Image/Mascot (5 cols) */}
            <div className="lg:col-span-5 relative group animate-in fade-in zoom-in duration-1000 delay-200 lg:-ml-12 -mt-4 sm:mt-0 lg:mt-0 mb-2 sm:mb-6 lg:mb-0 w-full max-w-[280px] sm:max-w-[320px] lg:max-w-none mx-auto">

              {/* Floating UI Widget 1: XP */}
              <div className="hidden lg:flex absolute -top-6 left-0 sm:-left-4 bg-card/80 backdrop-blur-xl border border-border p-3 sm:p-4 rounded-xl sm:rounded-2xl shadow-2xl z-20 animate-bounce-slow transform scale-90 sm:scale-100 origin-left">
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 bg-amber-500/20 rounded-lg sm:rounded-xl flex items-center justify-center">
                    <Zap className="w-4.5 h-4.5 sm:w-5 h-5 text-amber-500 fill-current" />
                  </div>
                  <div>
                    <p className="text-[9px] sm:text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-1">VAS VOLANDO</p>
                    <p className="font-black text-foreground text-base sm:text-lg">+500 XP</p>
                  </div>
                </div>
              </div>

              {/* Floating UI Widget 2: Mastery */}
              <div className="hidden lg:flex absolute -bottom-6 right-0 sm:-right-4 bg-card/80 backdrop-blur-xl border border-border p-3 sm:p-4 rounded-xl sm:rounded-2xl shadow-2xl z-20 animate-float transform scale-90 sm:scale-100 origin-right">
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 bg-primary/20 rounded-lg sm:rounded-xl flex items-center justify-center">
                    <BrainCircuit className="w-4.5 h-4.5 sm:w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-[9px] sm:text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-1">TEMA DOMINADO</p>
                    <p className="font-black text-foreground text-base sm:text-lg">Ahorro e Inversión</p>
                  </div>
                </div>
              </div>

              <div className="relative aspect-square w-full scale-100 sm:scale-110 lg:scale-[1.35] transform-gpu">
                <Image
                  src="/images/hero.png"
                  alt="Luca Mascot"
                  fill
                  className="object-contain"
                  priority
                  sizes="(max-width: 1024px) 100vw, 40vw"
                />

                {/* Mobile Bottom Fade */}
                <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background via-background/50 to-transparent lg:hidden" />
              </div>

              {/* Decorative Geometric Element */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] border border-primary/5 rounded-full -z-10" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] border border-primary/5 rounded-full -z-10" />
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <Link
          href="#features"
          className="absolute bottom-5 sm:bottom-8 lg:bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce hover:opacity-80 transition-opacity cursor-pointer z-20"
        >
          <span className="text-[10px] font-black tracking-[0.2em] text-muted-foreground/50 uppercase whitespace-nowrap">Desliza para explorar</span>
          <ChevronDown className="w-5 h-5 text-primary" />
        </Link>
      </section>

      {/* Project Explanation: The "Memoria" Section */}
      <section id="features" className="py-24 sm:py-32 bg-background relative overflow-hidden">
        {/* Background Decorations */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
          <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
        </div>

        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-24">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-foreground mb-6 tracking-tight">
              ¿Por qué nace <span className="text-primary italic">Luca</span>?
            </h2>
            <p className="text-lg sm:text-xl text-muted-foreground font-medium leading-relaxed">
              En Chile, el acceso a una educación financiera de calidad es limitado. Luca nace como una respuesta tecnológica para reducir las brechas de conocimiento y fomentar una cultura de bienestar económico desde temprana edad.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 pb-12 md:pb-24">
            <div className="group relative overflow-hidden rounded-[2.5rem] bg-card/50 backdrop-blur-sm border border-border p-8 lg:p-12 hover:border-primary/30 transition-colors duration-500">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-8 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-500">
                  <Target className="w-8 h-8" />
                </div>
                <h3 className="text-2xl sm:text-3xl font-black mb-4 tracking-tight">Aprendizaje Adaptativo</h3>
                <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                  Nuestra plataforma identifica tus fortalezas y debilidades en tiempo real, personalizando cada sesión para optimizar tu tiempo y asegurar que domines cada concepto.
                </p>
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-[2.5rem] bg-card/50 backdrop-blur-sm border border-border p-8 lg:p-12 hover:border-primary/30 transition-colors duration-500">
              <div className="absolute inset-0 bg-gradient-to-bl from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-8 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
                  <BrainCircuit className="w-8 h-8" />
                </div>
                <h3 className="text-2xl sm:text-3xl font-black mb-4 tracking-tight">Respaldo Factual</h3>
                <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                  Utilizamos un riguroso sistema de validación de contenidos para garantizar que toda la información entregada sea precisa y actualizada.
                </p>
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-[2.5rem] bg-card/50 backdrop-blur-sm border border-border p-8 lg:p-12 hover:border-primary/30 transition-colors duration-500">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-8 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-500">
                  <Sparkles className="w-8 h-8" />
                </div>
                <h3 className="text-2xl sm:text-3xl font-black mb-4 tracking-tight">Metodología Ágil</h3>
                <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                  Transformamos conceptos complejos en actividades interactivas y rápidas, permitiéndote avanzar de forma constante y medir tu progreso mediante logros y experiencias.
                </p>
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-[2.5rem] bg-card/50 backdrop-blur-sm border border-border p-8 lg:p-12 hover:border-primary/30 transition-colors duration-500">
              <div className="absolute inset-0 bg-gradient-to-tl from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-8 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
                  <BookOpen className="w-8 h-8" />
                </div>
                <h3 className="text-2xl sm:text-3xl font-black mb-4 tracking-tight">Preparación Real</h3>
                <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                  Te entregamos herramientas prácticas para enfrentar decisiones financieras reales: desde la gestión de tu primer sueldo hasta la planificación de inversiones futuras.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>



      <footer className="border-t border-border py-12 mt-auto bg-card/30">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
              <span className="text-primary-foreground font-black italic text-lg">L</span>
            </div>
            <span className="font-black text-2xl tracking-tighter">Luca</span>
          </div>
          <p className="text-muted-foreground text-sm font-medium max-w-[280px] md:max-w-none">
            © 2026 Memoria de Título: <br className="md:hidden" /> Educación Financiera Adaptativa.
          </p>
          <div className="flex gap-8">
            <Link href="#" className="text-sm font-bold text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest">LinkedIn</Link>
            <Link href="#" className="text-sm font-bold text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest">Privacidad</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
