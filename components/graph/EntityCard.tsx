'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, FileText, Tag } from 'lucide-react';
import type { EntityResult } from '@/types/graph.types';

interface EntityCardProps {
  entity: EntityResult;
}

export function EntityCard({ entity }: EntityCardProps) {
  const [expanded, setExpanded] = useState(false);

  // Filtrar labels internos de Neo4j
  const displayLabels = entity.labels.filter(l => !l.startsWith('__'));

  // Propiedades relevantes para mostrar
  const properties = entity.properties || {};
  const propertyEntries = Object.entries(properties).filter(
    ([key]) => !['id', 'name', 'description'].includes(key) && properties[key]
  );

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Header con nombre y labels */}
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <h4 className="font-semibold text-base">
                {entity.name || 'Sin nombre'}
              </h4>
              {displayLabels.map((label) => (
                <Badge key={label} variant="secondary" className="text-xs">
                  <Tag className="w-3 h-3 mr-1" />
                  {label}
                </Badge>
              ))}
            </div>

            {/* Descripción */}
            {entity.description && (
              <p className="text-sm text-muted-foreground mb-2">
                {entity.description}
              </p>
            )}

            {/* Origen del archivo si existe */}
            {properties.file_origin && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <FileText className="w-3 h-3" />
                <span>{properties.file_origin}</span>
              </div>
            )}
          </div>

          {/* Botón expandir propiedades */}
          {propertyEntries.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="shrink-0"
            >
              {expanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </Button>
          )}
        </div>

        {/* Propiedades expandidas */}
        {expanded && propertyEntries.length > 0 && (
          <div className="mt-3 pt-3 border-t">
            <div className="text-xs font-medium text-muted-foreground mb-2">
              Propiedades adicionales
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
      </CardContent>
    </Card>
  );
}
