import type { StatusVariant } from "@/lib/status";
import type { GradeBand } from "@/types";

/** The bands used until Settings → School rules says otherwise. */
export const DEFAULT_GRADE_BANDS: GradeBand[] = [
  { label: "A+", min: 80 },
  { label: "A", min: 70 },
  { label: "B", min: 60 },
  { label: "C", min: 50 },
  { label: "F", min: 0 },
];

/**
 * The grade for a percentage (or null if not marked). The top band reads as
 * success, the lowest passing band as a warning, and anything below the pass
 * mark as danger.
 */
export function gradeFor(
  percentage: number | null,
  bands: GradeBand[] = DEFAULT_GRADE_BANDS,
  passPercent = 50
): { label: string; variant: StatusVariant } {
  if (percentage === null) return { label: "—", variant: "neutral" };
  const sorted = [...bands].sort((a, b) => b.min - a.min);
  const index = sorted.findIndex((b) => percentage >= b.min);
  const band = sorted[index] ?? sorted.at(-1);
  if (!band) return { label: "—", variant: "neutral" };
  if (percentage < passPercent) return { label: band.label, variant: "danger" };
  if (index === 0) return { label: band.label, variant: "success" };
  const passing = sorted.filter((b) => b.min >= passPercent);
  return { label: band.label, variant: band === passing.at(-1) ? "warning" : "info" };
}
