"use client";

import type { DomainKnowledge } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { scoreColorClasses, scoreTone } from "@/lib/learning.utils";

interface DomainProgressListProps {
  domains: DomainKnowledge[];
}

export function DomainProgressList({ domains }: DomainProgressListProps) {
  return (
    <Card className="border-border/70 bg-card/85 shadow-sm backdrop-blur">
      <CardHeader className="border-b border-border/60 pb-4">
        <CardTitle className="text-lg">Progreso por tema</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 p-4 sm:p-5">
        {domains.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aún no hay intentos. Haz tu primer test para ver progreso por dominio.
          </p>
        ) : (
          domains.map((domain) => (
            <div key={domain.topic} className="rounded-xl border border-border/60 bg-background/75 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-foreground">{domain.topic}</p>
                <p className={`text-sm font-bold ${scoreTone(domain.score)}`}>
                  {Math.round(domain.score)}%
                </p>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full transition-all duration-500 ${scoreColorClasses(domain.score)}`}
                  style={{ width: `${Math.max(0, Math.min(100, domain.score))}%` }}
                />
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                <span>{domain.correct_attempts}/{domain.attempts} correctas</span>
                <span>{domain.attempts} intentos</span>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
