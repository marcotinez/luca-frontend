"use client";

import type { PracticeTestQuestionPublic } from "@/types";
import { cn } from "@/lib/utils";

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
    <div className="animate-enter-up-delay grid grid-cols-1 gap-3">
      {alternatives.map((alternative, index) => {
        const isSelected = selectedOptionId === alternative.option_id;
        const label = String.fromCharCode(65 + index);

        return (
          <button
            key={alternative.option_id}
            type="button"
            className={cn(
              "group flex min-h-14 w-full items-start gap-3 rounded-xl border px-4 py-3 text-left transition-all",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
              isSelected
                ? "border-primary/45 bg-primary/10"
                : "border-border/70 bg-card/70 hover:-translate-y-0.5 hover:border-primary/30 hover:bg-card",
            )}
            disabled={disabled}
            onClick={() => onSelect(alternative.option_id)}
          >
            <span
              className={cn(
                "mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
              )}
            >
              {label}
            </span>
            <span className="text-sm leading-relaxed text-foreground">{alternative.text}</span>
          </button>
        );
      })}
    </div>
  );
}
