import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GenerationRunResponse } from '@/lib/generation.api';

function prettyJson(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

/** Traza de una ejecución de generación, tal como la guarda el backend. Reutilizable
 * en el detalle de una unidad y en la vista de ejecuciones (`/admin/openai-logs`). */
export function TraceViewer({ run }: { run: GenerationRunResponse }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline">Estado: {run.status}</Badge>
        <Badge variant="outline">Modelo generación: {run.generation_model}</Badge>
        <Badge variant="outline">Modelo judge: {run.judge_model}</Badge>
        <Badge variant="outline">{new Date(run.created_at).toLocaleString('es-CL')}</Badge>
      </div>

      {run.error ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-destructive/5 border border-destructive/30 rounded-md p-3 overflow-x-auto whitespace-pre-wrap">
              {run.error}
            </pre>
          </CardContent>
        </Card>
      ) : null}

      {run.trace ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Traza</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-muted/50 border border-border rounded-md p-3 overflow-x-auto whitespace-pre-wrap">
              {prettyJson(run.trace)}
            </pre>
          </CardContent>
        </Card>
      ) : (
        <p className="text-sm text-muted-foreground">Esta ejecución no tiene traza registrada.</p>
      )}
    </div>
  );
}
