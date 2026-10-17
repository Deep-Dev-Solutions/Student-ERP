"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { useAdminNotices } from "../useNotifications";

const tones = {
  danger: "border-danger/30 bg-danger-tint text-danger",
  warning: "border-warning/30 bg-warning-tint text-warning",
  info: "border-info/30 bg-info-tint text-info",
} as const;

/** A strip of what needs attention today, each linking to the task. Hidden when there's nothing. */
export function DashboardAlerts() {
  const notices = useAdminNotices();
  if (notices.length === 0) return null;
  return (
    <section aria-label="Needs attention">
      <ul className="flex flex-wrap gap-2">
        {notices.map((n) => (
          <li key={n.id}>
            <Link
              href={n.href}
              className={cn("inline-flex rounded-lg border px-3 py-1.5 text-sm font-medium outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring/40", tones[n.tone])}
            >
              {n.title}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
