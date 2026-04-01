'use client';

import Link from 'next/link';
import { ArrowLeft, BookOpenCheck, Database, Sparkles } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const SECTION_LINKS = [
  {
    title: 'Configuración de la ingesta',
    description:
      'Define prompts de extracción, refinamiento y clasificación taxonómica para el pipeline de ingesta.',
    href: '/admin/generador/configuracion/ingesta',
    icon: Database,
  },
  {
    title: 'Configuración de la generación',
    description:
      'Ajusta prompts base, template de generación, enfoques por dificultad y reglas de salida.',
    href: '/admin/generador/configuracion/generacion',
    icon: Sparkles,
  },
  {
    title: 'Configuración de la taxonomía',
    description:
      'Gestiona versión de taxonomía, fallback y estructura completa de categorías y subcategorías.',
    href: '/admin/generador/configuracion/taxonomia',
    icon: BookOpenCheck,
  },
] as const;

export default function GeneradorConfiguracionIndexPage() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Configuración de generación</h1>
          <p className="text-muted-foreground">
            Selecciona una sección para editar su configuración en una página independiente.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/admin/generador">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al generador
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {SECTION_LINKS.map((section) => {
          const Icon = section.icon;
          return (
            <Card key={section.href} className="border-border/70">
              <CardHeader className="space-y-3">
                <div className="inline-flex w-fit items-center rounded-lg border border-border/60 bg-muted/25 p-2">
                  <Icon className="h-4 w-4" />
                </div>
                <CardTitle className="text-base">{section.title}</CardTitle>
                <CardDescription>{section.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link href={section.href}>Abrir sección</Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
