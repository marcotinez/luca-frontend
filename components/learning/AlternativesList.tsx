"use client";

import type { PracticeTestQuestionPublic } from "@/types";
import { Button } from "@/components/ui/button";

interface AlternativesListProps {
  alternatives: PracticeTestQuestionPublic["alternatives"];
  disabled?: boolean;
  selectedOptionId?: number | null;
  onSelect: (optionId: number) => void;
}

export function AlternativesList({
  alternatives,
  disabled = false,
  selectedOptionId = null,
  onSelect,
}: AlternativesListProps) {
  return (
    <div className="grid grid-cols-1 gap-3">
      {alternatives.map((alternative) => {
        const isSelected = selectedOptionId === alternative.option_id;
        return (
          <Button
            key={alternative.option_id}
            variant={isSelected ? "default" : "outline"}
            className="h-auto min-h-14 justify-start whitespace-normal py-3 text-left"
            disabled={disabled}
            onClick={() => onSelect(alternative.option_id)}
          >
            <span className="mr-2 font-bold">{String.fromCharCode(65 + alternative.option_id)}.</span>
            <span>{alternative.text}</span>
          </Button>
        );
      })}
    </div>
  );
}
