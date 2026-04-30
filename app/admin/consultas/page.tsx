'use client';

import { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  Database,
  GitBranch,
  Layers,
  Loader2,
  AlertCircle,
  RotateCcw,
  Brain,
  Sparkles,
  Network,
} from 'lucide-react';
import { toast } from 'sonner';

import { EntityCard } from '@/components/graph/EntityCard';
import { RelationshipCard } from '@/components/graph/RelationshipCard';
import { SemanticResultCard } from '@/components/graph/SemanticResultCard';
import { searchGraph, semanticSearch, getGraphStats } from '@/lib/graph.api';
import type { EntityResult, RelationshipResult, SemanticResult } from '@/types/graph.types';

type SearchMode = 'keyword' | 'semantic';

export default function ConsultasPage() {
  const [query, setQuery] = useState('');
  const [limit, setLimit] = useState('10');
  const [searchMode, setSearchMode] = useState<SearchMode>('semantic');
  const [expandGraph, setExpandGraph] = useState(true);
  const [depth, setDepth] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Resultados
  const [entities, setEntities] = useState<EntityResult[]>([]);
  const [relationships, setRelationships] = useState<RelationshipResult[]>([]);
  const [semanticResults, setSemanticResults] = useState<SemanticResult[]>([]);
  const [totalEntities, setTotalEntities] = useState(0);
  const [totalRelationships, setTotalRelationships] = useState(0);

  // Estadísticas del grafo (solo nodos y relaciones)
  const [stats, setStats] = useState<{ total_nodes: number; total_relationships: number } | null>(null);
  useEffect(() => {
    getGraphStats().then((s) => setStats(s)).catch(() => {});
  }, []);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) {
      toast.error('Ingresa un término de búsqueda');
      return;
    }

    setLoading(true);
    setHasSearched(true);

    try {
      const limitNum = parseInt(limit, 10);

      if (searchMode === 'keyword') {
        const result = await searchGraph(query, limitNum);
        setEntities(result.entities || []);
        setRelationships(result.relationships || []);
        setSemanticResults([]);
        setTotalEntities(result.total_entities || 0);
        setTotalRelationships(result.total_relationships || 0);
      } else {
        // Búsqueda semántica híbrida
        const semLimit = Math.min(limitNum, 20); // máx 20 para semántica
        const response = await semanticSearch(query, semLimit, expandGraph, depth);
        setSemanticResults(response.results || []);
        setEntities([]);
        setRelationships([]);
        setTotalEntities(0);
        setTotalRelationships(0);
      }

      toast.success('Búsqueda completada');
    } catch (error) {
      console.error('Error searching:', error);
      toast.error('Error al realizar la búsqueda. Revisa la consola para más detalles.');
      setEntities([]);
      setRelationships([]);
      setSemanticResults([]);
    } finally {
      setLoading(false);
    }
  }, [query, limit, searchMode, expandGraph, depth]);

  const handleClear = useCallback(() => {
    setQuery('');
    setHasSearched(false);
    setEntities([]);
    setRelationships([]);
    setSemanticResults([]);
    setTotalEntities(0);
    setTotalRelationships(0);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const totalResults = totalEntities + totalRelationships + semanticResults.length;

  return (
    <div className="space-y-8 p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl flex items-center gap-3">
            <Layers className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
            Explorador del Grafo
          </h1>
          <p className="text-muted-foreground mt-1">
            Consulta el cerebro de Luca mediante palabras clave o inteligencia semántica.
          </p>
        </div>
        {/* Pills de estadísticas */}
        {stats && (
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="gap-1.5 text-sm py-1 px-3">
              <Database className="w-3.5 h-3.5" />
              {stats.total_nodes.toLocaleString()} nodos
            </Badge>
            <Badge variant="outline" className="gap-1.5 text-sm py-1 px-3">
              <GitBranch className="w-3.5 h-3.5" />
              {stats.total_relationships.toLocaleString()} relaciones
            </Badge>
          </div>
        )}
      </div>

      {/* Panel de Búsqueda */}
      <Card className="border-2 border-primary/10 shadow-lg overflow-hidden">
        <div className="bg-muted/30 px-4 sm:px-6 py-4 border-b flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="text-xl flex items-center gap-2">
              <Search className="w-5 h-5 text-primary" />
              Barra de Búsqueda
            </CardTitle>
            <CardDescription>
              {searchMode === 'semantic'
                ? 'Modo IA: Busca por conceptos y significado usando embeddings vectoriales + texto completo.'
                : 'Modo Exacto: Busca fragmentos de texto en nombres y descripciones (case-insensitive).'}
            </CardDescription>
          </div>

          {/* Switch entre modos */}
          <Tabs
            value={searchMode}
            onValueChange={(v) => setSearchMode(v as SearchMode)}
            className="w-full md:w-auto"
          >
            <TabsList className="grid grid-cols-2 h-11 p-1 bg-muted/80 rounded-full border">
              <TabsTrigger
                value="semantic"
                className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-3 sm:px-6"
              >
                <Brain className="w-4 h-4 mr-2" />
                Semántica
              </TabsTrigger>
              <TabsTrigger
                value="keyword"
                className="rounded-full data-[state=active]:bg-white data-[state=active]:shadow-sm px-3 sm:px-6"
              >
                <Database className="w-4 h-4 mr-2" />
                Exacta
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <CardContent className="p-6 space-y-5">
          {/* Input + controles */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 group">
              <Input
                placeholder={
                  searchMode === 'semantic'
                    ? 'Ej: ¿Cómo funciona el sistema de pensiones?'
                    : 'Ej: AFP, cotización, crédito...'
                }
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="h-12 pl-4 pr-10 text-lg border-2 focus-visible:ring-primary/20 transition-all"
              />
              {searchMode === 'semantic' && (
                <Sparkles className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary/40 group-focus-within:text-primary animate-pulse" />
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <Select value={limit} onValueChange={setLimit}>
                <SelectTrigger className="w-[90px] sm:w-[100px] h-12 border-2">
                  <SelectValue placeholder="Límite" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>

              <Button
                onClick={handleSearch}
                disabled={loading}
                className="h-12 flex-1 sm:flex-none px-6 sm:px-8 text-base sm:text-lg font-medium shadow-md"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Search className="w-5 h-5 mr-2" />
                    Buscar
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Opciones modo semántico */}
          {searchMode === 'semantic' && (
            <div className="flex flex-col sm:flex-row gap-3">

              {/* Caja 1: Toggle subgrafo */}
              <div className="flex items-center gap-3 flex-1 bg-muted/20 rounded-lg px-4 py-3 border border-dashed">
                <Network className="w-4 h-4 text-muted-foreground shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Expandir subgrafo</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Recupera las relaciones del grafo de cada entidad encontrada
                  </p>
                </div>
                <Checkbox
                  id="expand-graph"
                  checked={expandGraph}
                  onCheckedChange={(v) => setExpandGraph(v === true)}
                />
              </div>

              {/* Caja 2: Profundidad (solo si subgrafo activo) */}
              {expandGraph && (
                <div className="flex items-center gap-3 w-full sm:w-72 shrink-0 bg-muted/20 rounded-lg px-4 py-3 border border-dashed">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">Profundidad</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {depth === 1 ? 'Relaciones directas' : 'Relaciones de vecinos'}
                    </p>
                  </div>
                  <div className="flex rounded-md border border-border overflow-hidden shrink-0">
                    {[1, 2].map((d) => (
                      <button
                        key={d}
                        onClick={() => setDepth(d)}
                        className={`w-9 h-9 text-sm font-semibold transition-all ${
                          depth === d
                            ? 'bg-foreground text-background'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}

          {/* Info de resultados */}
          {hasSearched && (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-2 border-t text-sm">
              <div className="flex items-center gap-4 text-muted-foreground">
                <span>
                  Resultados para{' '}
                  <strong className="text-foreground">&quot;{query}&quot;</strong>{' '}
                  en modo{' '}
                  <Badge variant="outline">
                    {searchMode === 'semantic' ? 'Semántico' : 'Exacto'}
                  </Badge>
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="h-8 text-muted-foreground hover:text-destructive"
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1" />
                Limpiar todo
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resultados */}
      {hasSearched && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">

          {/* MODO SEMÁNTICO */}
          {searchMode === 'semantic' && semanticResults.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Brain className="w-6 h-6 text-violet-600" />
                  Hallazgos Semánticos
                </h3>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-sm font-medium">
                    {semanticResults.length} entidad{semanticResults.length !== 1 ? 'es' : ''}
                  </Badge>
                  <Badge variant="outline" className="text-sm font-medium">
                    {semanticResults.reduce((acc, r) => acc + r.subgraph.length, 0)} relaciones
                  </Badge>
                </div>
              </div>
              <div className="flex flex-col gap-4">
                {semanticResults.map((result, idx) => (
                  <SemanticResultCard key={idx} result={result} rank={idx + 1} />
                ))}
              </div>
            </div>
          )}

          {/* MODO EXACTO - ENTIDADES */}
          {searchMode === 'keyword' && entities.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Database className="w-6 h-6 text-blue-500" />
                  Entidades Encontradas
                </h3>
                <Badge variant="outline">{entities.length} entidades</Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {entities.map((entity, idx) => (
                  <EntityCard key={entity.id || idx} entity={entity} />
                ))}
              </div>
            </div>
          )}

          {/* MODO EXACTO - RELACIONES */}
          {searchMode === 'keyword' && relationships.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <GitBranch className="w-6 h-6 text-emerald-500" />
                  Relaciones Encontradas
                </h3>
                <Badge variant="outline">{relationships.length} relaciones</Badge>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {relationships.map((rel, idx) => (
                  <RelationshipCard key={rel.id || idx} relationship={rel} />
                ))}
              </div>
            </div>
          )}

          {/* Sin resultados */}
          {totalResults === 0 && !loading && (
            <Card className="border-dashed bg-muted/10">
              <CardContent className="py-20 text-center">
                <AlertCircle className="w-16 h-16 mx-auto text-muted-foreground/20 mb-4" />
                <h3 className="text-xl font-semibold text-muted-foreground">
                  No encontramos coincidencias
                </h3>
                <p className="text-muted-foreground mt-2 max-w-xs mx-auto">
                  {searchMode === 'keyword'
                    ? 'Prueba cambiando al modo Semántico para una búsqueda por significado.'
                    : 'Prueba con términos más generales o verifica que los datos estén ingresados.'}
                </p>
                <Button variant="outline" onClick={handleClear} className="mt-6">
                  Intentar otra búsqueda
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
