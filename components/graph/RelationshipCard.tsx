'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, ArrowRight, FileText } from 'lucide-react';
import type { RelationshipResult } from '@/types/graph.types';

interface RelationshipCardProps {
  relationship: RelationshipResult;
}

export function RelationshipCard({ relationship }: RelationshipCardProps) {
  const [expanded, setExpanded] = useState(false);

  const source = relationship.source;
  const target = relationship.target;
  const properties = relationship.properties || {};

  // Filtrar propiedades para mostrar
  const propertyEntries = Object.entries(properties).filter(
    ([key, value]) => key !== 'description' && value
  );

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        {/* Tipo de relación */}
        <div className="flex items-center justify-between mb-3">
          <Badge className="bg-primary/10 text-primary hover:bg-primary/20 font-mono">
            {relationship.type}
          </Badge>

          {(propertyEntries.length > 0 || source || target) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </Button>
          )}
        </div>

        {/* Nodos origen y destino */}
        <div className="flex items-center gap-2 text-sm flex-wrap">
          <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-2.5 py-1 rounded-md font-medium">
            {source?.name || 'Nodo origen'}
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
          <div className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 px-2.5 py-1 rounded-md font-medium">
            {target?.name || 'Nodo destino'}
          </div>
        </div>

        {/* Descripción si existe */}
        {properties.description && (
          <p className="text-sm text-muted-foreground mt-3">
            {properties.description}
          </p>
        )}

        {/* Contenido expandido */}
        {expanded && (
          <div className="mt-4 pt-4 border-t space-y-4">
            {/* Detalles del nodo origen */}
            <div className="space-y-1.5">
              <div className="text-xs font-medium text-blue-600 dark:text-blue-400">
                Nodo Origen
              </div>
              <div className="bg-muted/50 rounded-md p-2.5 text-sm">
                <div className="font-medium">{source?.name || 'Sin nombre'}</div>
                {source?.description && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {source.description}
                  </p>
                )}
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {source?.labels?.filter(l => !l.startsWith('__')).map((label) => (
                    <Badge key={label} variant="outline" className="text-xs">
                      {label}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* Detalles del nodo destino */}
            <div className="space-y-1.5">
              <div className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                Nodo Destino
              </div>
              <div className="bg-muted/50 rounded-md p-2.5 text-sm">
                <div className="font-medium">{target?.name || 'Sin nombre'}</div>
                {target?.description && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {target.description}
                  </p>
                )}
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {target?.labels?.filter(l => !l.startsWith('__')).map((label) => (
                    <Badge key={label} variant="outline" className="text-xs">
                      {label}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* Propiedades de la relación */}
            {propertyEntries.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-xs font-medium text-muted-foreground">
                  Propiedades de la relación
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {propertyEntries.map(([key, value]) => (
                    <div key={key} className="bg-muted/50 rounded-md px-2 py-1.5">
                      <span className="text-xs font-medium text-muted-foreground">
                        {key}:
                      </span>
                      <span className="text-xs ml-1.5 break-words">
                        {String(value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Origen del archivo */}
            {properties.file_origin && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-2 border-t">
                <FileText className="w-3 h-3" />
                <span>Origen: {properties.file_origin}</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
