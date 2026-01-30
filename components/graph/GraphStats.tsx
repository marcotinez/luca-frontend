'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Database, GitBranch, Tag, ArrowLeftRight, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getGraphStats } from '@/lib/graph.api';
import type { GraphStats as GraphStatsType } from '@/types/graph.types';

interface GraphStatsProps {
  onRefresh?: () => void;
}

export function GraphStats({ onRefresh }: GraphStatsProps) {
  const [stats, setStats] = useState<GraphStatsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showLabels, setShowLabels] = useState(false);
  const [showRelTypes, setShowRelTypes] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getGraphStats();
      setStats(data);
      onRefresh?.();
    } catch (err) {
      console.error('Error fetching graph stats:', err);
      setError('Error al cargar estadísticas');
    } finally {
      setLoading(false);
    }
  }, [onRefresh]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/50 bg-destructive/5">
        <CardContent className="p-4 flex items-center justify-between">
          <span className="text-destructive text-sm">{error}</span>
          <Button variant="ghost" size="sm" onClick={fetchStats}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Reintentar
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!stats) return null;

  const statCards = [
    {
      label: 'Nodos',
      value: stats.total_nodes,
      icon: <Database className="w-5 h-5 text-blue-500" />,
      color: 'text-blue-600'
    },
    {
      label: 'Relaciones',
      value: stats.total_relationships,
      icon: <GitBranch className="w-5 h-5 text-emerald-500" />,
      color: 'text-emerald-600'
    },
    {
      label: 'Labels',
      value: stats.labels.length,
      icon: <Tag className="w-5 h-5 text-purple-500" />,
      color: 'text-purple-600',
      onClick: () => setShowLabels(!showLabels),
      expanded: showLabels,
      items: stats.labels
    },
    {
      label: 'Tipos de Relación',
      value: stats.relationship_types.length,
      icon: <ArrowLeftRight className="w-5 h-5 text-orange-500" />,
      color: 'text-orange-600',
      onClick: () => setShowRelTypes(!showRelTypes),
      expanded: showRelTypes,
      items: stats.relationship_types
    }
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium text-muted-foreground">Estadísticas del Grafo</h3>
        <Button variant="ghost" size="sm" onClick={fetchStats} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <Card
            key={i}
            className={`transition-all ${stat.onClick ? 'cursor-pointer hover:shadow-md hover:border-primary/30' : ''}`}
            onClick={stat.onClick}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">{stat.label}</span>
                {stat.icon}
              </div>
              <div className={`text-2xl font-bold ${stat.color}`}>
                {stat.value.toLocaleString()}
              </div>
              {stat.expanded && stat.items && (
                <div className="mt-3 pt-3 border-t flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                  {stat.items.map((item) => (
                    <Badge key={item} variant="secondary" className="text-xs">
                      {item}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
