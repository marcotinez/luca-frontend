'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { BookOpenCheck, Database, Settings2, Sparkles } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getConfigSections } from '@/lib/config.api';

// Cada tarjeta mapea a una sección real que declara `/admin/config` (`backendSection`).
// El servidor no publica ruta/título/ícono por sección, así que ese mapeo sigue
// siendo del cliente; lo que sí se resuelve dinámicamente es cuáles secciones
// existen — si el backend deja de declarar una, su tarjeta deja de mostrarse.
const SECTION_LINKS = [
  {
    title: 'Configuración de la ingesta',
    description: 'Define prompts de extracción, refinamiento y clasificación taxonómica para el pipeline de ingesta.',
    href: '/admin/generador/configuracion/ingesta',
    icon: Database,
    backendSection: 'ingestion',
  },
  {
    title: 'Configuración de la generación',
    description: 'Ajusta prompts del flujo por etapas: base, stem, distractores y judge.',
    href: '/admin/generador/configuracion/generacion',
    icon: Sparkles,
    backendSection: 'generation',
  },
  {
    title: 'Modelos y pipeline',
    description: 'Gestiona modelos por componente y parámetros técnicos del pipeline de generación.',
    href: '/admin/generador/configuracion/modelos-pipeline',
    icon: Settings2,
    backendSection: 'llm',
  },
  {
    title: 'Configuración de la taxonomía',
    description: 'Gestiona versión de taxonomía, fallback y estructura completa de categorías y subcategorías.',
    href: '/admin/generador/configuracion/taxonomia',
    icon: BookOpenCheck,
    backendSection: 'taxonomy',
  },
] as const;

export default function GeneradorConfiguracionIndexPage() {
  const [sections, setSections] = useState<string[] | null>(null);

  useEffect(() => {
    void getConfigSections().then(setSections);
  }, []);

  // Mientras carga (o si la llamada falla), se muestran las 4 tarjetas de
  // siempre en vez de esconder la navegación completa.
  const visibleLinks = sections ? SECTION_LINKS.filter((section) => sections.includes(section.backendSection)) : SECTION_LINKS;
  const extraSections = sections ? sections.filter((name) => !SECTION_LINKS.some((s) => s.backendSection === name)) : [];

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 p-4 sm:p-6 lg:p-8">
      <div className="space-y-1">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Configuración general de la app</h1>
          <p className="text-muted-foreground">
            Administra la configuración global de IA, ingesta y taxonomía desde secciones independientes.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {visibleLinks.map((section) => {
          const Icon = section.icon;
          return (
            <Card key={section.href} className="flex h-full flex-col border-border/70">
              <CardHeader className="space-y-3">
                <div className="inline-flex w-fit items-center rounded-lg border border-border/60 bg-muted/25 p-2">
                  <Icon className="h-4 w-4" />
                </div>
                <CardTitle className="text-base">{section.title}</CardTitle>
                <CardDescription>{section.description}</CardDescription>
              </CardHeader>
              <CardContent className="mt-auto">
                <Button asChild className="w-full">
                  <Link href={section.href}>Abrir sección</Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {extraSections.length > 0 ? (
        <p className="text-xs text-muted-foreground">
          El servidor también declara: {extraSections.map((name) => (
            <Badge key={name} variant="outline" className="ml-1">
              {name}
            </Badge>
          ))}{' '}
          — sin editor todavía en esta interfaz.
        </p>
      ) : null}
    </div>
  );
}
