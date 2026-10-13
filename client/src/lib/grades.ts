import type { StatusVariant } from "@/lib/status";

/** Grade bands used on report cards, from a percentage (or null if not marked). */
export function gradeFor(percentage: number | null): { label: string; variant: StatusVariant } {
  if (percentage === null) return { label: "—", variant: "neutral" };
  if (percentage >= 80) return { label: "A+", variant: "success" };
  if (percentage >= 70) return { label: "A", variant: "info" };
  if (percentage >= 60) return { label: "B", variant: "info" };
  if (percentage >= 50) return { label: "C", variant: "warning" };
  return { label: "F", variant: "danger" };
}
