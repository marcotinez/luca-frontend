'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain, Zap, FileText, Tag, ChevronDown, ChevronUp, MoveRight } from 'lucide-react';
import { useState } from 'react';
import type { SemanticResult, SubgraphEdge } from '@/types/graph.types';

interface SemanticResultCardProps {
  result: SemanticResult;
  rank?: number;
}

const DEPTH_CONFIG: Record<number, { label: string; headerClass: string; dotClass: string }> = {
  1: {
    label: 'Nivel 1 — Relaciones directas',
    headerClass: 'bg-muted/60 text-foreground/80 border border-border',
    dotClass: 'bg-blue-500',
  },
  2: {
    label: 'Nivel 2 — Segundo salto',
    headerClass: 'bg-muted/40 text-foreground/70 border border-border',
    dotClass: 'bg-emerald-500',
  },
};

function EdgeRow({ edge }: { edge: SubgraphEdge }) {
  const [open, setOpen] = useState(false);
  const hasDetail = !!(edge.rel_description || edge.target_description);

  return (
    <div className="rounded-lg border border-border/60 overflow-hidden">
      {/* Fila principal */}
      <button
        onClick={() => hasDetail && setOpen(!open)}
        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
          hasDetail ? 'hover:bg-muted/30 cursor-pointer' : 'cursor-default'
        }`}
      >
        {/* Origen */}
        <span className="font-semibold text-base text-foreground shrink-0 min-w-0 max-w-[28%] truncate">
          {edge.source}
        </span>

        {/* Flecha + tipo de relación */}
        <div className="flex items-center gap-2 shrink-0">
          <MoveRight className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs font-mono font-bold uppercase tracking-wide text-muted-foreground bg-muted px-2 py-0.5 rounded border border-border">
            {edge.relation.replace(/_/g, ' ')}
          </span>
          <MoveRight className="w-4 h-4 text-muted-foreground" />
        </div>

        {/* Destino */}
        <span className="font-semibold text-base text-foreground min-w-0 truncate flex-1">
          {edge.target}
        </span>

        {/* Toggle */}
        {hasDetail && (
          <span className="ml-auto shrink-0 text-muted-foreground">
            {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </span>
        )}
      </button>

      {/* Detalle expandido */}
      {open && hasDetail && (
        <div className="px-4 pb-4 pt-0 space-y-2 bg-muted/20 border-t border-border/60">
          {edge.rel_description && (
            <p className="text-sm text-muted-foreground leading-relaxed">
              <span className="font-medium text-foreground/80">Descripción: </span>
              {edge.rel_description}
            </p>
          )}
          {edge.target_description && (
            <p className="text-sm text-muted-foreground leading-relaxed">
              <span className="font-medium text-foreground/80">{edge.target}: </span>
              {edge.target_description}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export function SemanticResultCard({ result, rank }: SemanticResultCardProps) {
  // Cerrado por defecto
  const [subgraphOpen, setSubgraphOpen] = useState(false);

  const scorePercent = Math.round(result.score * 100);
  const isVector = result.search_type === 'vector';

  const scoreColor =
    scorePercent >= 75 ? 'text-emerald-500' :
    scorePercent >= 55 ? 'text-amber-500' :
    'text-muted-foreground';

  // Agrupar aristas por nivel
  const byDepth = result.subgraph.reduce<Record<number, SubgraphEdge[]>>((acc, edge) => {
    if (!acc[edge.depth]) acc[edge.depth] = [];
    acc[edge.depth].push(edge);
    return acc;
  }, {});
  const depthLevels = Object.keys(byDepth).map(Number).sort((a, b) => a - b);
  const totalEdges = result.subgraph.length;

  return (
    <Card className="border border-border shadow-sm rounded-xl overflow-hidden">
      <CardContent className="p-5 space-y-4">

        {/* Header de la entidad */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            {rank !== undefined && (
              <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">
                #{rank}
              </span>
            )}
            <h4 className="font-bold text-lg text-foreground">{result.concepto}</h4>
          </div>

          {/* Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            {result.tipo && (
              <Badge variant="outline" className="text-xs gap-1">
                <Tag className="w-3 h-3" />
                {result.tipo}
              </Badge>
            )}
            <Badge variant="outline" className="text-xs gap-1 text-muted-foreground">
              {isVector
                ? <><Brain className="w-3 h-3" />Vectorial</>
                : <><Zap className="w-3 h-3" />Fulltext</>
              }
            </Badge>
            <span className={`text-sm font-semibold ${scoreColor}`}>
              {scorePercent}% similitud
            </span>
          </div>
        </div>

        {/* Definición */}
        {result.definicion && (
          <p className="text-sm text-muted-foreground leading-relaxed">
            {result.definicion}
          </p>
        )}

        {/* Origen */}
        {(result.file_origin || result.source_context) && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 rounded-md px-3 py-2">
            <FileText className="w-3.5 h-3.5 shrink-0" />
            {result.file_origin && (
              <span className="font-medium text-foreground/70">{result.file_origin}</span>
            )}
            {result.file_origin && result.source_context && <span>·</span>}
            {result.source_context && <span className="italic">{result.source_context}</span>}
          </div>
        )}

        {/* Subgrafo — cerrado por defecto */}
        {totalEdges > 0 && (
          <div className="border-t border-border pt-3 space-y-3">
            {/* Botón toggle del subgrafo */}
            <button
              onClick={() => setSubgraphOpen(!subgraphOpen)}
              className="w-full flex items-center justify-between gap-2 text-sm font-medium text-foreground/80 hover:text-foreground transition-colors"
            >
              <span>
                {totalEdges} relación{totalEdges !== 1 ? 'es' : ''} en el subgrafo
                {depthLevels.length > 1 && ` · ${depthLevels.length} niveles`}
              </span>
              {subgraphOpen
                ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
                : <ChevronDown className="w-4 h-4 text-muted-foreground" />
              }
            </button>

            {/* Contenido desplegable */}
            {subgraphOpen && (
              <div className="space-y-4">
                {depthLevels.map((level) => {
                  const cfg = DEPTH_CONFIG[level] ?? DEPTH_CONFIG[1];
                  const edges = byDepth[level];
                  return (
                    <div key={level} className="space-y-2">
                      {/* Header del nivel */}
                      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold ${cfg.headerClass}`}>
                        <span className={`w-2 h-2 rounded-full shrink-0 ${cfg.dotClass}`} />
                        <span>{cfg.label}</span>
                        <span className="ml-auto font-normal text-muted-foreground">
                          {edges.length} arista{edges.length !== 1 ? 's' : ''}
                        </span>
                      </div>

                      {/* Aristas */}
                      <div className="space-y-2">
                        {edges.map((edge, i) => (
                          <EdgeRow key={i} edge={edge} />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
