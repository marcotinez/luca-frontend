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
              "group relative w-full overflow-hidden rounded-2xl border p-4 text-left transition-all",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/45",
              "disabled:cursor-not-allowed disabled:opacity-70",
              isSelected
                ? "border-primary/45 bg-primary/10"
                : "border-border/70 bg-card/75 hover:-translate-y-0.5 hover:border-primary/35 hover:bg-card",
            )}
            disabled={disabled}
            onClick={() => onSelect(alternative.option_id)}
          >
            <div className="flex items-start gap-3">
              <span
                className={cn(
                  "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black",
                  isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                )}
              >
                {label}
              </span>
              <span className="text-[15px] leading-relaxed text-foreground">{alternative.text}</span>
            </div>
            <span className={cn("pointer-events-none absolute inset-y-0 right-0 w-1 rounded-r-2xl transition", isSelected ? "bg-primary" : "bg-transparent group-hover:bg-primary/35")} />
          </button>
        );
      })}
    </div>
  );
}
