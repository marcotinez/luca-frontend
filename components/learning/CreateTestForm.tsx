"use client";

import { useMemo, useState } from "react";
import type { FinancialTopic, PracticeDifficulty, PracticeTestCreateRequest } from "@/types";
import { FinancialTopic as FinancialTopicEnum } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CreateTestFormProps {
  onSubmit: (payload: PracticeTestCreateRequest) => Promise<void>;
  loading?: boolean;
}

const difficultyOptions: PracticeDifficulty[] = ["Fácil", "Medio", "Difícil"];

const topicOptions: FinancialTopic[] = Object.values(FinancialTopicEnum);

export function CreateTestForm({ onSubmit, loading = false }: CreateTestFormProps) {
  const [questionCount, setQuestionCount] = useState(5);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [subtopic, setSubtopic] = useState("");
  const [difficulty, setDifficulty] = useState<string>("all");

  const canSubmit = useMemo(
    () => questionCount >= 1 && questionCount <= 20 && !loading,
    [questionCount, loading],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Configura tu práctica</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="title">Título (opcional)</Label>
          <Input
            id="title"
            value={title}
            maxLength={100}
            placeholder="Práctica del día"
            onChange={(event) => setTitle(event.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="question-count">Cantidad de preguntas (1-20)</Label>
          <Input
            id="question-count"
            type="number"
            min={1}
            max={20}
            value={questionCount}
            onChange={(event) => setQuestionCount(Number(event.target.value))}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Categoría (opcional)</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Todas las categorías" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {topicOptions.map((topic) => (
                  <SelectItem key={topic} value={topic}>
                    {topic}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Dificultad (opcional)</Label>
            <Select value={difficulty} onValueChange={setDifficulty}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Todas las dificultades" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {difficultyOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="subtopic">Subtema (opcional)</Label>
          <Input
            id="subtopic"
            value={subtopic}
            maxLength={120}
            placeholder="Ej: Fondo de emergencia"
            onChange={(event) => setSubtopic(event.target.value)}
          />
        </div>

        <Button
          className="w-full"
          disabled={!canSubmit}
          onClick={() =>
            onSubmit({
              question_count: questionCount,
              category: category !== "all" ? (category as FinancialTopic) : undefined,
              subtopic: subtopic.trim() || undefined,
              difficulty:
                difficulty !== "all" ? (difficulty as PracticeDifficulty) : undefined,
              title: title.trim() || undefined,
            })
          }
        >
          {loading ? "Creando test..." : "Comenzar práctica"}
        </Button>
      </CardContent>
    </Card>
  );
}
