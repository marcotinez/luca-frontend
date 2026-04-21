export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "Sin registros";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Sin registros";
  return new Intl.DateTimeFormat("es-CL", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function formatRelativeDate(value: string | null | undefined): string {
  if (!value) return "Sin sesiones previas";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Sin sesiones previas";
  
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return `Hoy, ${date.toLocaleDateString("es-CL", { day: 'numeric', month: 'short' })}`;
  if (diffDays === 1) return `Ayer, ${date.toLocaleDateString("es-CL", { day: 'numeric', month: 'short' })}`;
  
  return date.toLocaleDateString("es-CL", { day: 'numeric', month: 'short', year: 'numeric' });
}


export function formatPracticeMinutes(totalMinutes: number): string {
  if (totalMinutes <= 0) return "0 min";
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours <= 0) return `${minutes} min`;
  if (minutes <= 0) return `${hours} h`;
  return `${hours} h ${minutes} min`;
}

export function scoreColorClasses(score: number): string {
  if (score <= 39) return "bg-red-500";
  if (score <= 69) return "bg-amber-500";
  return "bg-emerald-500";
}

export function scoreTone(score: number): string {
  if (score <= 39) return "text-red-600";
  if (score <= 69) return "text-amber-600";
  return "text-emerald-600";
}

export function toPercent(decimal: number): number {
  return Math.round(decimal * 100);
}

export function apiErrorMessage(error: unknown, fallback: string): string {
  if (typeof error !== "object" || error === null) return fallback;
  const maybeAxios = error as {
    response?: {
      data?: { detail?: unknown };
    };
  };
  const detail = maybeAxios.response?.data?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        if (typeof item === "string") return item;
        if (typeof item === "object" && item !== null && "msg" in item) {
          return String(item.msg);
        }
        return "";
      })
      .filter(Boolean)
      .join(", ");
  }
  return fallback;
}

export interface LearningApiErrorSuggestion {
  category: string;
  subtopic?: string | null;
  available?: number;
}

export interface LearningApiErrorDetail {
  code?: string;
  message: string;
  suggestions: LearningApiErrorSuggestion[];
}

export function getLearningApiErrorDetail(error: unknown): LearningApiErrorDetail | null {
  if (typeof error !== "object" || error === null) return null;
  const maybeAxios = error as {
    response?: {
      data?: { detail?: unknown };
    };
  };
  const detail = maybeAxios.response?.data?.detail;
  if (typeof detail !== "object" || detail === null) return null;

  const detailObj = detail as {
    code?: unknown;
    message?: unknown;
    suggestions?: unknown;
  };

  if (typeof detailObj.message !== "string") return null;

  const suggestions = Array.isArray(detailObj.suggestions)
    ? detailObj.suggestions
      .filter((item): item is LearningApiErrorSuggestion => typeof item === "object" && item !== null)
      .map((item) => {
        const source = item as { category?: unknown; subtopic?: unknown; available?: unknown };
        return {
          category: typeof source.category === "string" ? source.category : "Sin categoría",
          subtopic: typeof source.subtopic === "string" ? source.subtopic : null,
          available: typeof source.available === "number" ? source.available : undefined,
        };
      })
    : [];

  return {
    code: typeof detailObj.code === "string" ? detailObj.code : undefined,
    message: detailObj.message,
    suggestions,
  };
}

export function formatLearningSuggestions(suggestions: LearningApiErrorSuggestion[], max = 3): string {
  if (suggestions.length === 0) return "";
  return suggestions
    .slice(0, max)
    .map((item) => `${item.category}${item.subtopic ? ` / ${item.subtopic}` : ""}${typeof item.available === "number" ? ` (${item.available})` : ""}`)
    .join(" • ");
}

export function resolveLearningApiErrorMessage(error: unknown, fallback: string): string {
  const detail = getLearningApiErrorDetail(error);
  if (!detail) {
    return apiErrorMessage(error, fallback);
  }

  const formattedSuggestions = formatLearningSuggestions(detail.suggestions);
  return formattedSuggestions ? `${detail.message} ${formattedSuggestions}` : detail.message;
}
