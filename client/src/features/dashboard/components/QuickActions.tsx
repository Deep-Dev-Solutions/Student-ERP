"use client";

import Link from "next/link";
import { CalendarCheck, ChevronRight, FileText, Upload, Wallet } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useCanAccess, useModules } from "@/hooks/use-session";
import { moduleForPath } from "@/lib/modules";

const actions = [
  { href: "/fees", label: "Collect a fee", hint: "Issue a receipt at the counter", icon: Wallet },
  { href: "/attendance?tab=review", label: "Lock today's attendance", hint: "Review and lock open registers", icon: CalendarCheck },
  { href: "/fees?tab=defaulters", label: "Defaulter report", hint: "Overdue vouchers by class", icon: FileText },
  { href: "/students/import", label: "Import students", hint: "Add admissions from a spreadsheet", icon: Upload },
];

/** A link shown only when the school has its module and the user may open it. */
function useAvailable() {
  const { has } = useModules();
  const canFees = useCanAccess("/fees");
  const canAttendance = useCanAccess("/attendance");
  const canStudents = useCanAccess("/students");
  const allowed: Record<string, boolean> = { "/fees": canFees, "/attendance": canAttendance, "/students": canStudents };
  return (href: string) => has(moduleForPath(href)) && (allowed[`/${href.split("/")[1].split("?")[0]}`] ?? true);
}

export function QuickActions() {
  const available = useAvailable();
  const shown = actions.filter((a) => available(a.href));
  if (shown.length === 0) return null;
  return (
    <Card className="gap-3 px-3">
      <h2 className="px-2 text-base font-semibold">Quick actions</h2>
      <ul className="space-y-0.5">
        {shown.map(({ href, label, hint, icon: Icon }) => (
          <li key={label}>
            <Link
              href={href}
              className="group flex items-center gap-3 rounded-lg px-2 py-2.5 outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/40"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                <Icon aria-hidden className="size-4" />
              </span>
              <span className="flex min-w-0 flex-1 flex-col leading-tight">
                <span className="text-sm font-medium">{label}</span>
                <span className="truncate text-xs text-muted-foreground">{hint}</span>
              </span>
              <ChevronRight aria-hidden className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}
