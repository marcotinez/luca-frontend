'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { clearOpenAILogs, getOpenAILogs, OpenAILogEntry } from '@/lib/openai-logs.storage';
import { RefreshCcw, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

function prettyJson(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function prettyRawOutput(rawOutput: string): string {
  const trimmed = rawOutput.trim();
  const withoutFence = trimmed
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/, '');

  try {
    const parsed = JSON.parse(withoutFence);
    return JSON.stringify(parsed, null, 2);
  } catch {
    return rawOutput;
  }
}

export default function OpenAILogsPage() {
  const [logs, setLogs] = useState<OpenAILogEntry[]>(() => getOpenAILogs());

  const loadLogs = () => {
    setLogs(getOpenAILogs());
  };

  const totalRequests = logs.length;
  const totalGeneratedQuestions = useMemo(
    () => logs.reduce((acc, log) => acc + (log.response.questions?.length || 0), 0),
    [logs]
  );

  const handleClear = () => {
    clearOpenAILogs();
    setLogs([]);
    toast.success('Historial local de trazas OpenAI limpiado');
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Trazas OpenAI</h1>
          <p className="text-muted-foreground mt-1">
            Historial local de requests y raw outputs del generador de preguntas.
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <Button variant="outline" onClick={loadLogs} className="w-full sm:w-auto">
            <RefreshCcw className="w-4 h-4 mr-2" />
            Refrescar
          </Button>
          <Button variant="destructive" onClick={handleClear} disabled={logs.length === 0} className="w-full sm:w-auto">
            <Trash2 className="w-4 h-4 mr-2" />
            Limpiar historial
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge variant="outline">Requests: {totalRequests}</Badge>
        <Badge variant="outline">Preguntas generadas: {totalGeneratedQuestions}</Badge>
      </div>

      {logs.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Sin trazas registradas</CardTitle>
            <CardDescription>
              Genera preguntas en la vista de generación para empezar a ver requests y outputs aquí.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <Accordion type="multiple" className="w-full border border-border rounded-md px-4">
          {logs.map((log, index) => (
            <AccordionItem key={log.id} value={log.id}>
              <AccordionTrigger className="hover:no-underline">
                <div className="flex flex-wrap items-center gap-2 pr-3">
                  <Badge variant="outline">#{index + 1}</Badge>
                  <Badge variant="outline">{new Date(log.created_at).toLocaleString('es-CL')}</Badge>
                  <Badge variant="outline">Modelo: {log.response.used_model}</Badge>
                  <Badge variant="outline">Preguntas: {log.response.questions.length}</Badge>
                  <span className="text-sm text-muted-foreground line-clamp-1">
                    {log.request.user_input}
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Request</CardTitle>
                    <CardDescription>Payload enviado al endpoint de generación</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-xs bg-muted/50 border border-border rounded-md p-3 overflow-x-auto">
                      {prettyJson(log.request)}
                    </pre>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Raw Output</CardTitle>
                    <CardDescription>Respuesta cruda devuelta por el modelo</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-xs bg-muted/50 border border-border rounded-md p-3 overflow-x-auto whitespace-pre-wrap">
                      {prettyRawOutput(log.response.raw_output)}
                    </pre>
                  </CardContent>
                </Card>

                {log.response.final_prompt && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Prompt Final</CardTitle>
                      <CardDescription>Prompt consolidado enviado al modelo</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <pre className="text-xs bg-muted/50 border border-border rounded-md p-3 overflow-x-auto whitespace-pre-wrap">
                        {log.response.final_prompt}
                      </pre>
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Respuesta resumida</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-xs bg-muted/50 border border-border rounded-md p-3 overflow-x-auto">
                      {prettyJson({
                        generated_count: log.response.generated_count,
                        semantic_total: log.response.semantic_total,
                        used_model: log.response.used_model,
                      })}
                    </pre>
                  </CardContent>
                </Card>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  );
}
