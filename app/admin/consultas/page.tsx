'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Database, GitBranch, Layers, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

import { GraphStats } from '@/components/graph/GraphStats';
import { EntityCard } from '@/components/graph/EntityCard';
import { RelationshipCard } from '@/components/graph/RelationshipCard';
import { searchGraph, searchEntities, searchRelationships } from '@/lib/graph.api';
import type { EntityResult, RelationshipResult, SearchResponse } from '@/types/graph.types';

type SearchMode = 'combined' | 'entities' | 'relationships';

export default function ConsultasPage() {
  const [query, setQuery] = useState('');
  const [limit, setLimit] = useState('50');
  const [searchMode, setSearchMode] = useState<SearchMode>('combined');
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Resultados
  const [entities, setEntities] = useState<EntityResult[]>([]);
  const [relationships, setRelationships] = useState<RelationshipResult[]>([]);
  const [totalEntities, setTotalEntities] = useState(0);
  const [totalRelationships, setTotalRelationships] = useState(0);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) {
      toast.error('Ingresa un término de búsqueda');
      return;
    }

    setLoading(true);
    setHasSearched(true);

    try {
      const limitNum = parseInt(limit, 10);

      if (searchMode === 'combined') {
        const result = await searchGraph(query, limitNum);
        setEntities(result.entities || []);
        setRelationships(result.relationships || []);
        setTotalEntities(result.total_entities || 0);
        setTotalRelationships(result.total_relationships || 0);
      } else if (searchMode === 'entities') {
        const result = await searchEntities(query, limitNum);
        setEntities(result || []);
        setRelationships([]);
        setTotalEntities(result?.length || 0);
        setTotalRelationships(0);
      } else {
        const result = await searchRelationships(query, limitNum);
        setRelationships(result || []);
        setEntities([]);
        setTotalEntities(0);
        setTotalRelationships(result?.length || 0);
      }

      toast.success('Búsqueda completada');
    } catch (error) {
      console.error('Error searching:', error);
      toast.error('Error al realizar la búsqueda');
      setEntities([]);
      setRelationships([]);
    } finally {
      setLoading(false);
    }
  }, [query, limit, searchMode]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const totalResults = totalEntities + totalRelationships;

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <Search className="w-8 h-8 text-primary" />
          Consultas al Grafo
        </h1>
        <p className="text-muted-foreground mt-1">
          Explora entidades y relaciones del grafo de conocimiento Neo4j.
        </p>
      </div>

      {/* Estadísticas */}
      <GraphStats />

      {/* Búsqueda */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Buscar en el Grafo
          </CardTitle>
          <CardDescription>
            Busca entidades y relaciones por nombre, descripción o tipo (búsqueda parcial, case-insensitive).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Controles de búsqueda */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Input
                placeholder="Ej: costo, crédito, regula..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="h-10"
              />
            </div>
            <Select value={limit} onValueChange={setLimit}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Límite" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
                <SelectItem value="200">200</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleSearch} disabled={loading} className="min-w-[100px]">
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Buscar
                </>
              )}
            </Button>
          </div>

          {/* Tabs de modo */}
          <Tabs value={searchMode} onValueChange={(v) => setSearchMode(v as SearchMode)} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="combined" className="flex items-center gap-2">
                <Layers className="w-4 h-4" />
                Combinado
              </TabsTrigger>
              <TabsTrigger value="entities" className="flex items-center gap-2">
                <Database className="w-4 h-4" />
                Entidades
              </TabsTrigger>
              <TabsTrigger value="relationships" className="flex items-center gap-2">
                <GitBranch className="w-4 h-4" />
                Relaciones
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>

      {/* Resultados */}
      {hasSearched && (
        <div className="space-y-6">
          {/* Resumen de resultados */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>
              Resultados para <strong className="text-foreground">"{query}"</strong>:
            </span>
            {totalResults > 0 ? (
              <div className="flex items-center gap-2">
                {totalEntities > 0 && (
                  <Badge variant="secondary">
                    {totalEntities} entidad{totalEntities !== 1 ? 'es' : ''}
                  </Badge>
                )}
                {totalRelationships > 0 && (
                  <Badge variant="secondary">
                    {totalRelationships} relacion{totalRelationships !== 1 ? 'es' : ''}
                  </Badge>
                )}
              </div>
            ) : (
              <Badge variant="outline">Sin resultados</Badge>
            )}
          </div>

          {/* Lista de entidades */}
          {(searchMode === 'combined' || searchMode === 'entities') && entities.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Database className="w-5 h-5 text-blue-500" />
                Entidades
                <Badge variant="outline" className="ml-2">{entities.length}</Badge>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {entities.map((entity, idx) => (
                  <EntityCard key={entity.id || idx} entity={entity} />
                ))}
              </div>
            </div>
          )}

          {/* Lista de relaciones */}
          {(searchMode === 'combined' || searchMode === 'relationships') && relationships.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <GitBranch className="w-5 h-5 text-emerald-500" />
                Relaciones
                <Badge variant="outline" className="ml-2">{relationships.length}</Badge>
              </h3>
              <div className="grid grid-cols-1 gap-4">
                {relationships.map((rel, idx) => (
                  <RelationshipCard key={rel.id || idx} relationship={rel} />
                ))}
              </div>
            </div>
          )}

          {/* Sin resultados */}
          {totalResults === 0 && !loading && (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground">
                  No se encontraron resultados para "{query}".
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Intenta con otros términos de búsqueda.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
