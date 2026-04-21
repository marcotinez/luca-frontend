"use client";

import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { DashboardNavbar } from "@/components/DashboardNavbar";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";

export default function TemarioPage() {
  const router = useRouter();

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-grid-soft pb-20">
        <DashboardNavbar />
        <main className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
          
          <section className="animate-enter-up rounded-2xl border border-border/70 bg-card/80 px-5 py-4 shadow-sm backdrop-blur sm:px-6 sm:py-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary/80">Temario de Aprendizaje</p>
                <h1 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">
                  ¿Qué vas a practicar en Luca?
                </h1>
                <p className="mt-2 text-sm text-muted-foreground max-w-2xl leading-relaxed">
                  En Luca no buscamos que memorices teoría. Vas a enfrentarte a preguntas de situaciones cotidianas para reconocer conceptos financieros, interpretar información básica y tomar mejores decisiones en contextos reales.
                </p>
                <p className="mt-2 text-sm font-semibold text-foreground">
                  Las evaluaciones se organizan en 3 categorías:
                </p>
              </div>
              <Button onClick={() => router.push("/dashboard")} className="rounded-full shadow-md">
                Ir al Dashboard
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </section>

          <div className="space-y-6 animate-enter-up">
            
            {/* Category 1 */}
            <section className="rounded-3xl border border-border/70 bg-card/80 p-5 shadow-sm backdrop-blur sm:p-8">
              <div className="border-b border-border/60 pb-4">
                <h2 className="text-2xl font-black">Mi Primer Sueldo y Seguridad</h2>
              </div>
              <div className="mt-5">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  <strong className="text-foreground font-semibold">Esta categoría te pone en escenarios típicos de inicio laboral en Chile.</strong> El foco está en que puedas interpretar documentos y conceptos que aparecen cuando comienzas a trabajar formalmente.
                </p>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-6">
                  <article className="bg-background/50 p-4 rounded-2xl border border-border/60 hover:bg-card hover:border-primary/30 transition-colors">
                    <h3 className="font-bold text-sm">Contrato laboral</h3>
                    <p className="text-xs text-muted-foreground mt-2 leading-relaxed">Preguntas sobre tipos de contrato, condiciones básicas de trabajo y diferencias entre modalidades laborales comunes.</p>
                  </article>
                  <article className="bg-background/50 p-4 rounded-2xl border border-border/60 hover:bg-card hover:border-primary/30 transition-colors">
                    <h3 className="font-bold text-sm">Liquidación</h3>
                    <p className="text-xs text-muted-foreground mt-2 leading-relaxed">Preguntas para interpretar sueldo bruto, sueldo líquido, haberes y descuentos, y entender cómo se compone el pago mensual.</p>
                  </article>
                  <article className="bg-background/50 p-4 rounded-2xl border border-border/60 sm:col-span-2 lg:col-span-1 hover:bg-card hover:border-primary/30 transition-colors">
                    <h3 className="font-bold text-sm">Cotizaciones (AFP/Fonasa)</h3>
                    <p className="text-xs text-muted-foreground mt-2 leading-relaxed">Preguntas sobre descuentos legales obligatorios y su propósito (salud, pensión y cesantía), en lenguaje aplicado a casos cotidianos.</p>
                  </article>
                </div>
              </div>
            </section>

            {/* Category 2 */}
            <section className="rounded-3xl border border-border/70 bg-card/80 p-5 shadow-sm backdrop-blur sm:p-8">
              <div className="border-b border-border/60 pb-4">
                <h2 className="text-2xl font-black">Planificación y Presupuesto</h2>
              </div>
              <div className="mt-5">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  <strong className="text-foreground font-semibold">Esta categoría se centra en decisiones del día a día para ordenar tus finanzas personales.</strong> La idea es practicar criterio financiero más que cálculos complejos.
                </p>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-6">
                  <article className="bg-background/50 p-4 rounded-2xl border border-border/60 hover:bg-card hover:border-primary/30 transition-colors">
                    <h3 className="font-bold text-sm">Gastos hormiga</h3>
                    <p className="text-xs text-muted-foreground mt-2 leading-relaxed">Preguntas sobre pequeños consumos frecuentes que impactan tu presupuesto mensual sin que siempre lo notes.</p>
                  </article>
                  <article className="bg-background/50 p-4 rounded-2xl border border-border/60 hover:bg-card hover:border-primary/30 transition-colors">
                    <h3 className="font-bold text-sm">Ahorro para metas</h3>
                    <p className="text-xs text-muted-foreground mt-2 leading-relaxed">Preguntas para priorizar objetivos, estimar esfuerzos de ahorro y planificar compras o metas de corto/mediano plazo.</p>
                  </article>
                  <article className="bg-background/50 p-4 rounded-2xl border border-border/60 sm:col-span-2 lg:col-span-1 hover:bg-card hover:border-primary/30 transition-colors">
                    <h3 className="font-bold text-sm">Fondo de emergencia</h3>
                    <p className="text-xs text-muted-foreground mt-2 leading-relaxed">Preguntas sobre cómo responder a imprevistos sin desordenar tus finanzas ni depender de deuda de alto costo.</p>
                  </article>
                </div>
              </div>
            </section>

            {/* Category 3 */}
            <section className="rounded-3xl border border-border/70 bg-card/80 p-5 shadow-sm backdrop-blur sm:p-8">
              <div className="border-b border-border/60 pb-4">
                <h2 className="text-2xl font-black">El Mundo del Crédito</h2>
              </div>
              <div className="mt-5">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  <strong className="text-foreground font-semibold">Esta categoría te entrena para evaluar decisiones de endeudamiento en situaciones comunes.</strong> El foco está en distinguir costo real, riesgo y consecuencias de pago.
                </p>
                <div className="grid gap-4 sm:grid-cols-2 mt-6">
                  <article className="bg-background/50 p-4 rounded-2xl border border-border/60 hover:bg-card hover:border-primary/30 transition-colors">
                    <h3 className="font-bold text-sm">CAE</h3>
                    <p className="text-xs text-muted-foreground mt-2 leading-relaxed">Preguntas para comparar créditos con criterio, usando costo total y no solo el valor de la cuota.</p>
                  </article>
                  <article className="bg-background/50 p-4 rounded-2xl border border-border/60 hover:bg-card hover:border-primary/30 transition-colors">
                    <h3 className="font-bold text-sm">Avances en efectivo</h3>
                    <p className="text-xs text-muted-foreground mt-2 leading-relaxed">Preguntas sobre uso de avances con tarjeta, comisiones e impacto financiero frente a otras alternativas.</p>
                  </article>
                  <article className="bg-background/50 p-4 rounded-2xl border border-border/60 hover:bg-card hover:border-primary/30 transition-colors">
                    <h3 className="font-bold text-sm">Historial crediticio</h3>
                    <p className="text-xs text-muted-foreground mt-2 leading-relaxed">Preguntas sobre comportamiento de pago, morosidad y efectos prácticos en futuras oportunidades financieras.</p>
                  </article>
                  <article className="bg-background/50 p-4 rounded-2xl border border-border/60 hover:bg-card hover:border-primary/30 transition-colors">
                    <h3 className="font-bold text-sm">Cuotas</h3>
                    <p className="text-xs text-muted-foreground mt-2 leading-relaxed">Preguntas para diferenciar cuotas con y sin interés, pago mínimo y costo final de compras financiadas.</p>
                  </article>
                </div>
              </div>
            </section>

            {/* Qué esperar */}
            <section className="rounded-3xl border border-border/70 bg-primary/5 p-5 shadow-sm backdrop-blur sm:p-8">
              <h2 className="text-2xl font-black text-primary">Qué esperar de las evaluaciones</h2>
              <ul className="mt-5 space-y-3 text-sm text-foreground">
                <li className="flex items-start gap-3">
                  <div className="h-2 w-2 mt-1.5 rounded-full bg-primary shrink-0" />
                  <p className="leading-relaxed">Verás preguntas contextualizadas y de aplicación práctica.</p>
                </li>
                <li className="flex items-start gap-3">
                  <div className="h-2 w-2 mt-1.5 rounded-full bg-primary shrink-0" />
                  <p className="leading-relaxed">Algunas evaluaciones te reforzarán temas donde has tenido más errores recientes.</p>
                </li>
                <li className="flex items-start gap-3">
                  <div className="h-2 w-2 mt-1.5 rounded-full bg-primary shrink-0" />
                  <p className="leading-relaxed">El objetivo es mejorar tu criterio de decisión en finanzas cotidianas, paso a paso.</p>
                </li>
              </ul>
            </section>

          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
