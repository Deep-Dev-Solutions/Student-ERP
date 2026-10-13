import Link from "next/link";
import { Card } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  registerSummary,
  todayRegister,
  type RegisterStatus,
} from "@/features/dashboard/data";

const statusMeta: Record<RegisterStatus, { label: string; cell: string; swatch: string }> = {
  locked: {
    label: "Locked",
    cell: "border-success/25 bg-success-tint text-success hover:border-success/60",
    swatch: "border-success/25 bg-success-tint",
  },
  pending: {
    label: "Marked, not locked",
    cell: "border-transparent bg-highlight text-highlight-foreground hover:border-foreground/40",
    swatch: "border-transparent bg-highlight",
  },
  not_marked: {
    label: "Not marked",
    cell: "border-dashed border-input bg-card text-muted-foreground hover:border-foreground/50",
    swatch: "border-dashed border-input bg-card",
  },
};

const legendOrder: RegisterStatus[] = ["locked", "pending", "not_marked"];

export function TodayRegister() {
  const { sections, locked, pending, notMarked, present, enrolledInMarked, rate } = registerSummary;
  const counts: Record<RegisterStatus, number> = { locked, pending, not_marked: notMarked };
  const needsAction = pending + notMarked;

  return (
    <Card className="gap-6 px-5 sm:px-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-base font-semibold">Today&apos;s register</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Attendance across {sections} sections at this campus
          </p>
          <p className="mt-4 text-5xl font-semibold tracking-tight">{rate}%</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {present.toLocaleString()} of {enrolledInMarked.toLocaleString()} students present in
            marked sections
          </p>
        </div>

        <div className="sm:text-right">
          <p className="text-sm">
            <span className="font-semibold">{locked}</span>
            <span className="text-muted-foreground"> of {sections} sections locked</span>
          </p>
          {needsAction > 0 ? (
            <ButtonLink href="/attendance" size="sm" className="mt-2">
              Review {needsAction} open {needsAction === 1 ? "register" : "registers"}
            </ButtonLink>
          ) : null}
        </div>
      </div>

      <ul
        aria-label="Section registers"
        className="grid grid-cols-[repeat(auto-fill,minmax(3.5rem,1fr))] gap-1.5"
      >
        {todayRegister.map((s) => {
          const meta = statusMeta[s.status];
          const detail =
            s.status === "not_marked" ? "not marked yet" : `${s.present} of ${s.enrolled} present`;
          return (
            <li key={s.section}>
              <Link
                href="/attendance"
                title={`Class ${s.section}: ${meta.label.toLowerCase()}, ${detail}`}
                aria-label={`Class ${s.section}: ${meta.label}, ${detail}`}
                className={cn(
                  "flex h-10 items-center justify-center rounded-md border text-sm font-medium tabular-nums outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-1",
                  meta.cell
                )}
              >
                {s.section}
              </Link>
            </li>
          );
        })}
      </ul>

      <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
        {legendOrder.map((status) => (
          <li key={status} className="flex items-center gap-2">
            <span aria-hidden className={cn("size-3.5 rounded-sm border", statusMeta[status].swatch)} />
            {statusMeta[status].label}
            <span className="font-medium text-foreground tabular-nums">{counts[status]}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
