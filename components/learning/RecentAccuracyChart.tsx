"use client";

import type { PracticeHistorySummary } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDateTime, toPercent } from "@/lib/learning.utils";

interface RecentAccuracyChartProps {
  summary: PracticeHistorySummary[];
}

function accuracyVariant(accuracy: number): "destructive" | "secondary" | "default" {
  const pct = toPercent(accuracy);
  if (pct < 40) return "destructive";
  if (pct < 70) return "secondary";
  return "default";
}

export function RecentAccuracyChart({ summary }: RecentAccuracyChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Accuracy reciente</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {summary.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Sin historial reciente para calcular precisión por tema.
          </p>
        ) : (
          summary.map((item) => (
            <div
              key={item.topic}
              className="flex items-center justify-between rounded-xl border border-border/60 bg-background/60 p-3"
            >
              <div className="space-y-1">
                <p className="text-sm font-semibold">{item.topic}</p>
                <p className="text-xs text-muted-foreground">
                  Última práctica: {formatDateTime(item.last_practiced_at)}
                </p>
              </div>
              <div className="text-right">
                <Badge variant={accuracyVariant(item.recent_accuracy)}>
                  {toPercent(item.recent_accuracy)}%
                </Badge>
                <p className="mt-1 text-xs text-muted-foreground">{item.total_seen} vistas</p>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
