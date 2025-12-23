import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { MoveRight, BookOpen, Trophy, Sparkles } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />
      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 pt-32 pb-12 text-center max-w-5xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/5 border border-primary/20 text-primary text-sm font-medium mb-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <Sparkles className="w-4 h-4" />
          <span>Nueva forma de aprender finanzas</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-foreground mb-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
          Domina tus finanzas con <span className="text-primary italic">Luca</span>
        </h1>

        <p className="text-xl text-muted-foreground mb-10 max-w-2xl animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-200">
          Aprende, compite y crece. La plataforma interactiva diseñada para transformar tu relación con el dinero a través de la gamificación.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mb-20 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-300">
          <Button asChild size="lg" className="h-14 px-8 text-lg font-bold rounded-xl shadow-xl hover:shadow-primary/20 transition-all">
            <Link href="/register">
              Comenzar gratis
              <MoveRight className="ml-2 w-5 h-5" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="h-14 px-8 text-lg font-semibold rounded-xl border-border hover:bg-accent transition-all">
            <Link href="/login">Iniciar sesión</Link>
          </Button>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full mt-10">
          <div className="p-6 rounded-2xl border border-border bg-card shadow-sm hover:shadow-md transition-all text-left">
            <div className="w-12 h-12 bg-amber-100/10 rounded-xl flex items-center justify-center mb-4 text-amber-500">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-2">Aprendizaje Práctico</h3>
            <p className="text-muted-foreground font-medium">Contenido diseñado para la vida real, desde presupuestos hasta inversiones complejas.</p>
          </div>

          <div className="p-6 rounded-2xl border border-border bg-card shadow-sm hover:shadow-md transition-all text-left">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4 text-primary">
              <Trophy className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-2">Gamificación</h3>
            <p className="text-muted-foreground font-medium">Gana XP, mantén tu racha y sube de nivel mientras mejoras tu salud financiera.</p>
          </div>

          <div className="p-6 rounded-2xl border border-border bg-card shadow-sm hover:shadow-md transition-all text-left">
            <div className="w-12 h-12 bg-emerald-100/10 rounded-xl flex items-center justify-center mb-4 text-emerald-500">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-2">Personalizado</h3>
            <p className="text-muted-foreground font-medium">Rutas de aprendizaje adaptadas a tus intereses y nivel educativo actual.</p>
          </div>
        </div>
      </main>

      {/* Basic Footer */}
      <footer className="border-t border-border py-10 mt-auto bg-card/30">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
              <span className="text-primary-foreground text-xs font-bold">L</span>
            </div>
            <span className="font-bold text-foreground">Luca</span>
          </div>
          <p className="text-muted-foreground text-sm">© 2025 Luca Educación Financiera. Todos los derechos reservados.</p>
          <div className="flex gap-6">
            <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Twitter</Link>
            <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Privacidad</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
