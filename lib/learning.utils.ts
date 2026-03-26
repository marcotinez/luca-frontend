export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "Sin registros";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Sin registros";
  return new Intl.DateTimeFormat("es-CL", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
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
