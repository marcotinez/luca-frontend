'use client';

import type { ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { getGraphStats } from '@/lib/graph.api';
import { findCategory } from '@/lib/graph-stats.utils';
import type { GraphCategoryStats, GraphStats } from '@/types/graph.types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BarChart3, CircleHelp, PieChart, RefreshCw, Shapes, TrendingUp } from 'lucide-react';

type VistaRelaciones = 'estructural' | 'valor';

const CONFIG_VISTA: Record<
  VistaRelaciones,
  {
    titulo: string;
    descripcion: string;
    kpiTitulo: string;
    kpiDescripcion: string;
    columna: string;
    icon: ReactNode;
  }
> = {
  estructural: {
    titulo: 'Vista estructural',
    descripcion:
      'Aquí solo se muestran relaciones de clasificación del grafo: conexiones hacia categorías y subtópicos.',
    kpiTitulo: 'Relaciones estructurales',
    kpiDescripcion: 'Cobertura taxonómica del contenido clasificado',
    columna: 'Relaciones estructurales',
    icon: <Shapes className="h-5 w-5" />,
  },
  valor: {
    titulo: 'Vista de valor',
    descripcion:
      'Aquí solo se muestran relaciones semánticas y funcionales del grafo, excluyendo la taxonomía.',
    kpiTitulo: 'Relaciones de valor',
    kpiDescripcion: 'Conexiones útiles entre entidades del conocimiento',
    columna: 'Relaciones de valor',
    icon: <TrendingUp className="h-5 w-5" />,
  },
};

function getConteoVista(category: GraphCategoryStats['relationships'], vista: VistaRelaciones): number {
  return vista === 'estructural' ? category.structural_relationships : category.non_structural_relationships;
}

function getPesoVista(category: GraphCategoryStats['relationships'], vista: VistaRelaciones): number {
  if (category.total_relationships === 0) return 0;
  const base = vista === 'estructural' ? category.structural_relationships : category.non_structural_relationships;
  return (base / category.total_relationships) * 100;
}

function formatPercent(value: number): string {
  if (!Number.isFinite(value)) return '0%';
  return `${Math.round(value)}%`;
}

const CHART_COLORS = ['var(--color-chart-1)', 'var(--color-chart-2)', 'var(--color-chart-3)', 'var(--color-chart-4)', 'var(--color-chart-5)'];
const STRUCTURAL_RELATION_TYPES = new Set(['IN_CATEGORY', 'IN_SUBCATEGORY', 'PART_OF']);

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
  return ['M', cx, cy, 'L', start.x, start.y, 'A', r, r, 0, largeArcFlag, 0, end.x, end.y, 'Z'].join(' ');
}

function polarToCartesian(cx: number, cy: number, r: number, angle: number) {
  const angleInRadians = ((angle - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(angleInRadians),
    y: cy + r * Math.sin(angleInRadians),
  };
}

function GraficoTorta({
  title,
  description,
  items,
}: {
  title: string;
  description: string;
  items: Array<{ label: string; value: number }>;
}) {
  const total = items.reduce((acc, item) => acc + item.value, 0);
  const slices = items.map((item) => item.value).reduce<Array<{ path: string; label: string; color: string }>>((acc, value, index) => {
    const startAngle = acc.length === 0 ? 0 : acc.reduce((sum, current, idx) => {
      const itemValue = items[idx]?.value ?? 0;
      return sum + (total === 0 ? 0 : (itemValue / total) * 360);
    }, 0);
    const sweep = total === 0 ? 0 : (value / total) * 360;
    acc.push({
      path: describeArc(110, 110, 90, startAngle, startAngle + sweep),
      label: items[index].label,
      color: CHART_COLORS[index % CHART_COLORS.length],
    });
    return acc;
  }, []);

  return (
    <Card className="gap-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PieChart className="h-5 w-5 text-primary" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:items-center">
        <div className="mx-auto">
          <svg viewBox="0 0 220 220" className="h-[220px] w-[220px]">
            {slices.map((slice) => (
              <path
                key={slice.label}
                d={slice.path}
                fill={slice.color}
                stroke="var(--background)"
                strokeWidth="2"
              />
            ))}
            <circle cx="110" cy="110" r="44" fill="var(--background)" />
            <text x="110" y="104" textAnchor="middle" className="fill-foreground text-[12px] font-medium">
              Entidades
            </text>
            <text x="110" y="124" textAnchor="middle" className="fill-foreground text-[18px] font-semibold">
              {total}
            </text>
          </svg>
        </div>

        <div className="space-y-3">
          {items.map((item, index) => {
            const percent = total === 0 ? 0 : (item.value / total) * 100;
            return (
              <div key={item.label} className="rounded-lg border bg-muted/20 px-4 py-3">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                    />
                    <span className="font-medium">{item.label}</span>
                  </div>
                  <div className="text-right text-sm">
                    <div className="font-medium">{item.value.toLocaleString()}</div>
                    <div className="text-muted-foreground">{formatPercent(percent)}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function getRelationTypesForView(
  relationshipTypes: GraphCategoryStats['relationships']['relationship_types'],
  vista: VistaRelaciones
) {
  if (vista === 'estructural') {
    return relationshipTypes.filter((item) => STRUCTURAL_RELATION_TYPES.has(item.relationship_type));
  }

  return relationshipTypes.filter((item) => !STRUCTURAL_RELATION_TYPES.has(item.relationship_type));
}

function GraficoBarrasRelaciones({
  title,
  description,
  items,
  compact = false,
  plain = false,
}: {
  title: string;
  description: string;
  items: Array<{ label: string; value: number }>;
  compact?: boolean;
  plain?: boolean;
}) {
  const maxValue = items.reduce((max, item) => Math.max(max, item.value), 0);
  const content = (
    <>
      <div className={plain ? 'mb-3' : ''}>
        <p className="font-medium">{title}</p>
        <p className={compact ? 'text-xs text-muted-foreground' : 'text-sm text-muted-foreground'}>{description}</p>
      </div>
      <div className={compact ? 'space-y-2' : 'space-y-3'}>
        {items.map((item) => {
          const width = maxValue === 0 ? 0 : (item.value / maxValue) * 100;
          return (
            <div key={item.label} className={compact ? 'rounded-lg border bg-muted/20 px-3 py-2.5' : 'rounded-lg border bg-muted/20 px-4 py-3'}>
              <div className={compact ? 'mb-1.5 flex items-center justify-between gap-3' : 'mb-2 flex items-center justify-between gap-4'}>
                <span className="font-medium">{item.label}</span>
                <Badge variant="outline">{item.value.toLocaleString()}</Badge>
              </div>
              <div className={compact ? 'h-1.5 overflow-hidden rounded-full bg-background' : 'h-2 overflow-hidden rounded-full bg-background'}>
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${width}%`,
                    backgroundColor: 'var(--color-chart-1)',
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </>
  );

  if (plain) {
    return content;
  }

  return (
    <Card className={compact ? 'gap-3' : 'gap-4'}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{content}</CardContent>
    </Card>
  );
}

export function GraphTaxonomyStats() {
  const [stats, setStats] = useState<GraphStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [vista, setVista] = useState<VistaRelaciones>('estructural');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getGraphStats();
      setStats(data);
      const firstCategory = data.categories?.[0];
      if (firstCategory) {
        setSelectedCategory((current) => current ?? firstCategory.name);
      }
    } catch (err) {
      console.error('Error fetching graph taxonomy stats:', err);
      setError('No se pudieron cargar las estadísticas del grafo.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const config = CONFIG_VISTA[vista];
  const hasData = Boolean(stats?.overall_relationships && stats.categories?.length);
  const categories = stats?.categories ?? [];

  const activeCategory = useMemo(() => {
    if (!stats || !selectedCategory) return null;
    return findCategory(stats, selectedCategory);
  }, [stats, selectedCategory]);

  useEffect(() => {
    if (!activeCategory) {
      setSelectedSubcategory(null);
      return;
    }
    const exists = activeCategory.subcategories.some((item) => item.name === selectedSubcategory);
    if (!exists) {
      setSelectedSubcategory(activeCategory.subcategories[0]?.name ?? null);
    }
  }, [activeCategory, selectedSubcategory]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="space-y-3 px-6 py-6">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-full" />
          </CardContent>
        </Card>
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 2 }).map((_, index) => (
            <Card key={index}>
              <CardContent className="space-y-3 px-5 py-5">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-9 w-28" />
                <Skeleton className="h-3 w-40" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="space-y-3 px-6 py-6">
            <Skeleton className="h-56 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/50 bg-destructive/5">
        <CardContent className="flex items-center justify-between gap-4 px-6 py-5">
          <div>
            <p className="font-medium text-destructive">Error al cargar estadísticas</p>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
          <Button variant="outline" onClick={fetchStats}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Reintentar
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!stats || !hasData || !stats.overall_relationships) {
    return (
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle>Estadísticas no disponibles</CardTitle>
          <CardDescription>
            El endpoint no devolvió el desglose por categoría y subtópico esperado.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const totalVista =
    vista === 'estructural'
      ? stats.overall_relationships.structural_relationships
      : stats.overall_relationships.non_structural_relationships;
  const categoryPieData = categories.map((category) => ({ label: category.name, value: category.entity_count }));
  const subcategoryPieData = (activeCategory?.subcategories ?? []).map((subcategory) => ({
    label: subcategory.name,
    value: subcategory.entity_count,
  }));
  const globalValueRelations = getRelationTypesForView(stats.overall_relationships.relationship_types, 'valor').map(
    (relation) => ({
      label: relation.relationship_type,
      value: relation.count,
    })
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
            <BarChart3 className="h-6 w-6 text-primary" />
            Estadísticas del grafo
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Revisión por categoría y subtópico, separando taxonomía y valor relacional.
          </p>
        </div>
        <Button variant="outline" onClick={fetchStats}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Actualizar
        </Button>
      </div>

      <Card className="gap-4 border-primary/15 bg-primary/5">
        <CardHeader className="gap-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>Modo de análisis</CardTitle>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
              <Badge variant="secondary" className="min-w-[220px] justify-center px-3 py-1.5 text-sm">
                {totalVista.toLocaleString()} {config.columna.toLowerCase()}
              </Badge>
              <Tabs value={vista} onValueChange={(value) => setVista(value as VistaRelaciones)}>
                <TabsList className="grid h-11 w-full max-w-[420px] grid-cols-2">
                  <TabsTrigger value="estructural">Estructural</TabsTrigger>
                  <TabsTrigger value="valor">De valor</TabsTrigger>
                </TabsList>
              </Tabs>
              <span
                title={config.descripcion}
                className="inline-flex cursor-help items-center text-muted-foreground"
                aria-label={config.descripcion}
              >
                <CircleHelp className="h-4 w-4" />
              </span>
            </div>
          </div>
        </CardHeader>
      </Card>

      {vista === 'estructural' ? (
        <GraficoTorta
          title="Entidades por categoría"
          description="Distribución de entidades entre todas las categorías del grafo."
          items={categoryPieData}
        />
      ) : null}

      <Card className="gap-4">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Detalle por categoría</CardTitle>
            <CardDescription>
              Selecciona una categoría para revisar sus subtópicos y su distribución interna.
            </CardDescription>
          </div>
          <Select value={selectedCategory ?? undefined} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-[280px]">
              <SelectValue placeholder="Selecciona una categoría" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.name} value={category.name}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.95fr)]">
            <div className="space-y-6">
              <div className="rounded-xl border bg-muted/20 px-5 py-4">
                <p className="text-sm text-muted-foreground">Categoría activa</p>
                <p className="mt-1 text-xl font-semibold">{activeCategory?.name ?? 'Sin selección'}</p>
                {activeCategory ? (
                  <div className="mt-3 space-y-2">
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">{activeCategory.entity_count.toLocaleString()} entidades</Badge>
                      <Badge variant="secondary">
                        {getConteoVista(activeCategory.relationships, vista).toLocaleString()} {config.columna.toLowerCase()}
                      </Badge>
                      <Badge variant="secondary">{formatPercent(getPesoVista(activeCategory.relationships, vista))}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Ese porcentaje indica qué parte del total de relaciones de esta categoría corresponde a{' '}
                      {vista === 'estructural' ? 'relaciones estructurales' : 'relaciones de valor'}.
                    </p>
                  </div>
                ) : null}
              </div>

              <div className="overflow-hidden rounded-xl border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="pl-4">Subtópico</TableHead>
                      <TableHead>Entidades</TableHead>
                      <TableHead className="pr-4">{config.columna}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeCategory?.subcategories.map((subcategory) => {
                      const isSelected = subcategory.name === selectedSubcategory;
                      const count = getConteoVista(subcategory.relationships, vista);

                      return (
                        <TableRow
                          key={subcategory.name}
                          data-state={isSelected ? 'selected' : undefined}
                          className="cursor-pointer"
                          onClick={() => setSelectedSubcategory(subcategory.name)}
                        >
                          <TableCell className="pl-4 font-medium">{subcategory.name}</TableCell>
                          <TableCell>{subcategory.entity_count.toLocaleString()}</TableCell>
                          <TableCell className="pr-4">{count.toLocaleString()}</TableCell>
                        </TableRow>
                      );
                  })}
                </TableBody>
              </Table>
            </div>
            </div>

            <GraficoTorta
              title="Entidades por subtópico"
              description={`Distribución de entidades dentro de ${activeCategory?.name ?? 'la categoría seleccionada'}.`}
              items={subcategoryPieData}
            />
          </div>
        </CardContent>
      </Card>

      {vista === 'valor' ? (
        <div className="space-y-6">
          <Accordion type="single" collapsible defaultValue="global" className="rounded-xl border bg-card px-6">
            <AccordionItem value="global" className="border-b-0">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex w-full items-center justify-between gap-4 pr-4">
                  <div className="text-left">
                    <p className="font-medium">Relaciones de valor globales</p>
                    <p className="text-xs text-muted-foreground">
                      Comparación directa de los tipos de relación de valor en todo el grafo. Cada barra muestra cuántas
                      veces aparece ese tipo considerando todas las categorías.
                    </p>
                  </div>
                  <Badge variant="secondary">{globalValueRelations.length} tipos</Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="pb-2">
                  <GraficoBarrasRelaciones
                    title="Distribución global por tipo"
                    description=""
                    items={globalValueRelations}
                    compact
                    plain
                  />
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <Card className="gap-4">
            <CardHeader>
              <CardTitle>Relaciones por categoría</CardTitle>
              <CardDescription>
                Comparación por barras de los tipos de relaciones de valor presentes en cada categoría.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="rounded-xl border px-4">
                {categories.map((category) => {
                  const relationTypes = getRelationTypesForView(category.relationships.relationship_types, 'valor');
                  const barItems = relationTypes.map((relation) => ({
                    label: relation.relationship_type,
                    value: relation.count,
                  }));

                  return (
                    <AccordionItem key={category.name} value={category.name}>
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex w-full items-center justify-between gap-4 pr-4">
                          <div className="text-left">
                            <p className="font-medium">{category.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {category.relationships.non_structural_relationships.toLocaleString()} relaciones de valor
                            </p>
                          </div>
                          <Badge variant="secondary">{relationTypes.length} tipos</Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        {barItems.length > 0 ? (
                          <div className="pb-2">
                            <GraficoBarrasRelaciones
                              title={`Tipos de relación en ${category.name}`}
                              description="Cada barra muestra cuántas veces aparece ese tipo dentro de la categoría."
                              items={barItems}
                              compact
                              plain
                            />
                          </div>
                        ) : (
                          <p className="px-2 pb-2 text-sm text-muted-foreground">
                            Esta categoría no tiene tipos de relación de valor desglosados.
                          </p>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
