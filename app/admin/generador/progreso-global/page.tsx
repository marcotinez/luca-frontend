'use client';

import { useCallback, useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getGenerationConfig } from '@/lib/config.api';
import { getGlobalGenerationProgress, GlobalProgressResponse } from '@/lib/generation.api';
import { Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { apiErrorMessage } from '@/lib/api';

function ratioToPercent(value: number) {
  return `${Math.round((value || 0) * 100)}%`;
}

function MetricStat({
  label,
  value,
  tone = 'default',
}: {
  label: string;
  value: number;
  tone?: 'default' | 'ok' | 'failed';
}) {
  const toneClass =
    tone === 'ok' ? 'text-emerald-600' : tone === 'failed' ? 'text-rose-600' : 'text-foreground';
  return (
    <div className="rounded-lg border bg-muted/20 px-3 py-2">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={`text-sm font-semibold ${toneClass}`}>{value}</p>
    </div>
  );
}

export default function ProgresoGlobalGeneracionPage() {
  const [data, setData] = useState<GlobalProgressResponse | null>(null);
  const [allCategories, setAllCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [response, config] = await Promise.all([getGlobalGenerationProgress(), getGenerationConfig()]);
      setData(response);
      setAllCategories(config.categories || []);
    } catch (error) {
      toast.error(apiErrorMessage(error, 'No se pudo cargar el progreso global'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const mergedByCategory = allCategories.map((category) => {
    const existing = (data?.by_category || []).find((item) => item.key === category);
    return (
      existing || {
        key: category,
        total_units: 0,
        pending_units: 0,
        in_progress_units: 0,
        ok_units: 0,
        failed_units: 0,
        completion_ratio: 0,
      }
    );
  });

  const categoryTotalUnits = mergedByCategory.reduce((acc, item) => acc + item.total_units, 0);
  const categoryCompletedUnits = mergedByCategory.reduce((acc, item) => acc + item.ok_units + item.failed_units, 0);
  const categoryWeightedCompletion = categoryTotalUnits > 0 ? categoryCompletedUnits / categoryTotalUnits : 0;
  const categoryCompletionSum = mergedByCategory.reduce((acc, item) => acc + (item.completion_ratio || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Progreso Global de Generación</h1>
          <p className="text-muted-foreground">Métricas históricas agregadas por snapshot, categoría y dificultad.</p>
        </div>
        <Button onClick={() => void loadData()} disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
          Refrescar
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Resumen Global</CardTitle>
          <CardDescription>Estado agregado de generación</CardDescription>
        </CardHeader>
        <CardContent>
          {loading && !data ? (
            <p className="text-sm text-muted-foreground">Cargando...</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Snapshots</p>
                <p className="text-lg font-semibold">{data?.snapshot_count || 0}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-lg font-semibold">{data?.total_units || 0}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Pend</p>
                <p className="text-lg font-semibold">{data?.pending_units || 0}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">En progreso</p>
                <p className="text-lg font-semibold">{data?.in_progress_units || 0}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">OK</p>
                <p className="text-lg font-semibold">{data?.ok_units || 0}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Fallidas</p>
                <p className="text-lg font-semibold">{data?.failed_units || 0}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Completitud</p>
                <p className="text-lg font-semibold">{ratioToPercent(data?.completion_ratio || 0)}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Por Categoría</CardTitle>
          <CardDescription>
            Total generado (ponderado): {ratioToPercent(categoryWeightedCompletion)} | Suma % categorías:{' '}
            {Math.round(categoryCompletionSum * 100)}%
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead>Categoría</TableHead>
                <TableHead>Métricas</TableHead>
                <TableHead className="min-w-[220px]">Completitud</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mergedByCategory.map((item) => (
                <TableRow key={`category-${item.key}`}>
                  <TableCell className="font-semibold whitespace-normal">{item.key || '-'}</TableCell>
                  <TableCell className="whitespace-normal">
                    <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                      <MetricStat label="Total" value={item.total_units} />
                      <MetricStat label="Pend" value={item.pending_units} />
                      <MetricStat label="Correctas" value={item.ok_units} tone="ok" />
                      <MetricStat label="Fallidas" value={item.failed_units} tone="failed" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Progreso</span>
                        <Badge variant="outline">{ratioToPercent(item.completion_ratio)}</Badge>
                      </div>
                      <Progress value={Math.round((item.completion_ratio || 0) * 100)} />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Por Dificultad</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead>Dificultad</TableHead>
                <TableHead>Métricas</TableHead>
                <TableHead className="min-w-[220px]">Completitud</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data?.by_difficulty || []).map((item) => (
                <TableRow key={`difficulty-${item.key}`}>
                  <TableCell className="font-semibold">{item.key || '-'}</TableCell>
                  <TableCell className="whitespace-normal">
                    <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                      <MetricStat label="Total" value={item.total_units} />
                      <MetricStat label="Pend" value={item.pending_units} />
                      <MetricStat label="Correctas" value={item.ok_units} tone="ok" />
                      <MetricStat label="Fallidas" value={item.failed_units} tone="failed" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Progreso</span>
                        <Badge variant="outline">{ratioToPercent(item.completion_ratio)}</Badge>
                      </div>
                      <Progress value={Math.round((item.completion_ratio || 0) * 100)} />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Por Categoría + Dificultad</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead>Categoría</TableHead>
                <TableHead>Dificultad</TableHead>
                <TableHead>Métricas</TableHead>
                <TableHead className="min-w-[220px]">Completitud</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data?.by_category_difficulty || []).map((item) => (
                <TableRow key={`category-difficulty-${item.category}-${item.difficulty}`}>
                  <TableCell className="font-semibold whitespace-normal">{item.category || '-'}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{item.difficulty || '-'}</Badge>
                  </TableCell>
                  <TableCell className="whitespace-normal">
                    <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                      <MetricStat label="Total" value={item.total_units} />
                      <MetricStat label="Pend" value={item.pending_units} />
                      <MetricStat label="Correctas" value={item.ok_units} tone="ok" />
                      <MetricStat label="Fallidas" value={item.failed_units} tone="failed" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Progreso</span>
                        <Badge variant="outline">{ratioToPercent(item.completion_ratio)}</Badge>
                      </div>
                      <Progress value={Math.round((item.completion_ratio || 0) * 100)} />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
