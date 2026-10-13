import type { VariantProps } from "class-variance-authority";
import type { badgeVariants } from "@/components/ui/badge";

export type StatusVariant = NonNullable<VariantProps<typeof badgeVariants>["variant"]>;

/**
 * One place to decide how each domain status looks, so "pending" reads the
 * same in attendance, fees and payroll. Keys are the lower-cased status
 * values used across the feature types.
 */
const statusVariants: Record<string, StatusVariant> = {
  // Good / done
  paid: "success",
  present: "success",
  p: "success",
  active: "success",
  completed: "success",
  locked: "success",
  // Needs attention
  pending: "warning",
  partial: "warning",
  processing: "warning",
  warning: "warning",
  late: "warning",
  leave: "warning",
  on_leave: "warning",
  l: "warning",
  unpaid: "warning",
  // Problem
  overdue: "danger",
  absent: "danger",
  a: "danger",
  defaulter: "danger",
  critical: "danger",
  terminated: "danger",
  // In progress / informational
  current: "info",
  ongoing: "info",
  upcoming: "neutral",
  inactive: "neutral",
};

export function statusVariant(status: string): StatusVariant {
  return statusVariants[status.toLowerCase()] ?? "neutral";
}
