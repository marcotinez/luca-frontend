'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { getGenerationConfig } from '@/lib/prompt-generation.api';
import { normalizeRuntimeTaxonomy, type RuntimeTaxonomy } from '@/lib/taxonomy.utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ListFilter } from 'lucide-react';
import { toast } from 'sonner';

export default function PreguntasPage() {
  const [taxonomy, setTaxonomy] = useState<RuntimeTaxonomy>({ categories: [], subtopicsByCategory: {} });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTaxonomy = async () => {
      try {
        setLoading(true);
        const response = await getGenerationConfig();
        const normalized = normalizeRuntimeTaxonomy({
          categories: response.categories,
          subtopics: response.subtopics,
        });
        setTaxonomy(normalized);
      } catch {
        toast.error('No se pudo cargar el catálogo de categorías');
      } finally {
        setLoading(false);
      }
    };

    void loadTaxonomy();
  }, []);

  const categoryCards = useMemo(() => {
    return taxonomy.categories.map((category) => ({
      name: category,
      subtopicsCount: taxonomy.subtopicsByCategory[category]?.length || 0,
    }));
  }, [taxonomy.categories, taxonomy.subtopicsByCategory]);

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Gestión de Preguntas</h1>
        <p className="text-muted-foreground">
          Selecciona una categoría para abrir su tabla de preguntas y filtrar por subtópico, estado y dificultad.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ListFilter className="h-5 w-5 text-primary" />
            Categorías disponibles
          </CardTitle>
          <CardDescription>Listado por categoría, sin cargar todo el banco de preguntas.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Cargando categorías...</p>
          ) : categoryCards.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay categorías disponibles.</p>
          ) : (
            <div className="space-y-2">
              {categoryCards.map((category) => (
                <div
                  key={category.name}
                  className="flex flex-col gap-2 rounded-lg border border-border/70 p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div className="space-y-1">
                    <p className="font-medium">Preguntas de categoría {category.name}</p>
                    <Badge variant="outline">Subtópicos: {category.subtopicsCount}</Badge>
                  </div>
                  <Button asChild>
                    <Link href={`/admin/preguntas/${encodeURIComponent(category.name)}`}>
                      Ver preguntas de esta categoría
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
