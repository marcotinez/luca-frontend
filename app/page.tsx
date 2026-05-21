import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { MoveRight, BrainCircuit, Zap, ChevronDown } from "lucide-react";

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
          <div className="pb-12 md:pb-24">
            <section className="relative overflow-hidden rounded-[2.5rem] border border-border/80 bg-card/60 p-8 sm:p-10 lg:p-14 backdrop-blur-sm">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,hsl(var(--primary)/0.14),transparent_45%)]" />
              <div className="absolute -bottom-24 -left-24 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />

              <div className="relative z-10 grid gap-8 lg:grid-cols-12 lg:gap-10">
                <div className="lg:col-span-4">
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-primary/80">Nuestra base</p>
                  <h2 className="mt-3 text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[0.95] text-foreground">
                    ¿Por qué nace <span className="text-primary italic">Luca</span>?
                  </h2>
                </div>

                <div className="lg:col-span-8 space-y-6 border-t border-border/70 pt-6 lg:border-t-0 lg:border-l lg:pl-10 lg:pt-0">
                  <p className="text-lg sm:text-xl lg:text-2xl text-foreground/90 font-medium leading-relaxed">
                    Luca nace para simplificar la educación financiera de los estudiantes en Chile. Transformamos decisiones complejas en herramientas prácticas y cercanas, utilizando IA respaldada por fuentes reales para ofrecerte un aprendizaje con contexto, diseñado para acompañarte en cada paso.
                  </p>
                  <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                    Como toda tecnología en evolución, nuestra IA puede omitir matices o presentar errores. Por eso, te invitamos a usar Luca como una guía para potenciar tu pensamiento crítico y autonomía, más que como una fuente de información única.
                  </p>
                </div>
              </div>
            </section>
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
            <Link
              href="https://www.linkedin.com/in/marcotinez/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-bold text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest"
            >
              LinkedIn
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
