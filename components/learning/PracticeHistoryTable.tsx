"use client";

import { useMemo } from "react";
import type { PracticeHistoryEntry, PracticeTestSummaryResponse } from "@/types";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
  tests: PracticeTestSummaryResponse[];
}

type PracticeWithQuestions = {
  test: PracticeTestSummaryResponse;
  questions: PracticeHistoryEntry[];
};

export function PracticeHistoryTable({ history, tests }: PracticeHistoryTableProps) {
  const practiceHistory = useMemo<PracticeWithQuestions[]>(() => {
    const sortedTests = [...tests].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
    const sortedHistory = [...history].sort(
      (a, b) => new Date(b.practiced_at).getTime() - new Date(a.practiced_at).getTime(),
    );

    return sortedTests
      .reduce<{ list: PracticeWithQuestions[]; cursor: number }>(
        (acc, test) => {
          const questionCount = Math.max(0, test.answered_questions);
          const questions = sortedHistory.slice(acc.cursor, acc.cursor + questionCount);
          return {
            list: [...acc.list, { test, questions }],
            cursor: acc.cursor + questionCount,
          };
        },
        { list: [], cursor: 0 },
      )
      .list;
  }, [history, tests]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Historial de práctica</CardTitle>
      </CardHeader>
      <CardContent>
        {practiceHistory.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Todavía no hay prácticas registradas.
          </p>
        ) : (
          <Accordion type="single" collapsible className="w-full">
            {practiceHistory.map(({ test, questions }, practiceIdx) => (
              <AccordionItem key={test.id} value={test.id}>
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex w-full flex-wrap items-center justify-between gap-3 text-left">
                    <div>
                      <p className="font-semibold">
                        {test.title || `Práctica ${practiceIdx + 1}`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateTime(test.created_at)}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={test.status === "completed" ? "default" : "secondary"}>
                        {test.status === "completed" ? "Completada" : "En progreso"}
                      </Badge>
                      <Badge variant="outline">
                        {test.correct_answers}/{test.total_questions} correctas
                      </Badge>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  {questions.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Esta práctica aún no tiene preguntas registradas.
                    </p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>#</TableHead>
                          <TableHead>Tema</TableHead>
                          <TableHead>Subtema</TableHead>
                          <TableHead>Dificultad</TableHead>
                          <TableHead>Resultado</TableHead>
                          <TableHead>Tiempo</TableHead>
                          <TableHead>Fecha</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {questions.map((entry, idx) => (
                          <TableRow key={`${test.id}-${entry.practiced_at}-${idx}`}>
                            <TableCell>{idx + 1}</TableCell>
                            <TableCell>{entry.topic}</TableCell>
                            <TableCell>{entry.subtopic || "-"}</TableCell>
                            <TableCell>{entry.difficulty || "-"}</TableCell>
                            <TableCell>
                              <Badge variant={entry.is_correct ? "default" : "destructive"}>
                                {entry.is_correct ? "Correcta" : "Incorrecta"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {entry.response_time_seconds
                                ? `${entry.response_time_seconds.toFixed(1)}s`
                                : "-"}
                            </TableCell>
                            <TableCell>{formatDateTime(entry.practiced_at)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
}
