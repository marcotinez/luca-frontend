"use client";

import type { PracticeHistoryEntry } from "@/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/lib/learning.utils";

interface PracticeHistoryTableProps {
  history: PracticeHistoryEntry[];
}

export function PracticeHistoryTable({ history }: PracticeHistoryTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Historial de práctica</CardTitle>
      </CardHeader>
      <CardContent>
        {history.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Todavía no hay intentos registrados.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tema</TableHead>
                <TableHead>Subtema</TableHead>
                <TableHead>Dificultad</TableHead>
                <TableHead>Resultado</TableHead>
                <TableHead>Tiempo</TableHead>
                <TableHead>Fecha</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.slice(0, 12).map((entry, idx) => (
                <TableRow key={`${entry.practiced_at}-${idx}`}>
                  <TableCell>{entry.topic}</TableCell>
                  <TableCell>{entry.subtopic || "-"}</TableCell>
                  <TableCell>{entry.difficulty || "-"}</TableCell>
                  <TableCell>
                    <Badge variant={entry.is_correct ? "default" : "destructive"}>
                      {entry.is_correct ? "Correcta" : "Incorrecta"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {entry.response_time_seconds ? `${entry.response_time_seconds.toFixed(1)}s` : "-"}
                  </TableCell>
                  <TableCell>{formatDateTime(entry.practiced_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
