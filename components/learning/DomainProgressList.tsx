"use client";

import type { DomainKnowledge } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { scoreColorClasses, scoreTone } from "@/lib/learning.utils";

interface DomainProgressListProps {
  domains: DomainKnowledge[];
}

export function DomainProgressList({ domains }: DomainProgressListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Progreso por tema</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {domains.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aún no hay intentos. Haz tu primer test para ver progreso por dominio.
          </p>
        ) : (
          domains.map((domain) => (
            <div key={domain.topic} className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-foreground">{domain.topic}</p>
                <p className={`text-sm font-bold ${scoreTone(domain.score)}`}>
                  {Math.round(domain.score)}%
                </p>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full transition-all duration-500 ${scoreColorClasses(domain.score)}`}
                  style={{ width: `${Math.max(0, Math.min(100, domain.score))}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {domain.correct_attempts}/{domain.attempts} correctas
              </p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
