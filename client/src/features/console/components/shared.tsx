"use client";

import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { dependentsOf, MODULES, moduleName, withRequirements } from "@/lib/modules";
import type { ModuleKey, TenantStatus } from "@/types";

const statusVariants = { active: "success", trial: "info", suspended: "danger" } as const;
const statusLabels: Record<TenantStatus, string> = { active: "Active", trial: "Trial", suspended: "Suspended" };

export function TenantStatusBadge({ status }: { status: TenantStatus }) {
  return <Badge variant={statusVariants[status]}>{statusLabels[status]}</Badge>;
}

const shortNames: Record<ModuleKey, string> = {
  students: "Students",
  fees: "Fees",
  attendance: "Attendance",
  staff: "Staff",
  payroll: "Payroll",
  exams: "Exams",
  paper_maker: "Paper maker",
  messages: "Messages",
  reports: "Reports",
};
export const moduleShortName = (k: ModuleKey) => shortNames[k];

export function ModuleBadges({ modules }: { modules: ModuleKey[] }) {
  return (
    <span className="flex flex-wrap gap-1">
      {modules.map((m) => (
        <Badge key={m} variant="secondary">
          {shortNames[m]}
        </Badge>
      ))}
    </span>
  );
}

/** Every module that goes off with this one (dependents of dependents too). */
function allDependents(key: ModuleKey): ModuleKey[] {
  const out = new Set<ModuleKey>();
  const walk = (k: ModuleKey) => {
    for (const d of dependentsOf(k)) {
      if (out.has(d)) continue;
      out.add(d);
      walk(d);
    }
  };
  walk(key);
  return [...out];
}

/**
 * Module switches. Turning one on also turns on what it needs; turning one off
 * also turns off what depends on it. onNote explains any automatic change.
 */
export function ModulePicker({ value, onChange, onNote, idPrefix }: { value: ModuleKey[]; onChange: (next: ModuleKey[]) => void; onNote?: (note: string | null) => void; idPrefix: string }) {
  const toggle = (key: ModuleKey, on: boolean) => {
    if (on) {
      const next = withRequirements([...value, key]);
      const added = next.filter((k) => k !== key && !value.includes(k));
      onChange(next);
      onNote?.(added.length ? `${added.map(moduleName).join(" and ")} turned on too: ${moduleName(key)} needs ${added.length === 1 ? "it" : "them"}.` : null);
    } else {
      const off = allDependents(key).filter((k) => value.includes(k));
      onChange(value.filter((k) => k !== key && !off.includes(k)));
      onNote?.(off.length ? `${off.map(moduleName).join(" and ")} turned off too: ${off.length === 1 ? "it needs" : "they need"} ${moduleName(key)}.` : null);
    }
  };
  return (
    <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {MODULES.map((m) => {
        const checked = value.includes(m.key);
        const id = `${idPrefix}-${m.key}`;
        return (
          <li key={m.key}>
            <label htmlFor={id} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring/40 ${checked ? "border-primary bg-secondary/50" : "border-border bg-card hover:bg-muted/60"}`}>
              <Checkbox id={id} checked={checked} onCheckedChange={(c) => toggle(m.key, Boolean(c))} className="mt-0.5" />
              <span>
                <span className="block text-sm font-medium">{m.name}</span>
                <span className="block text-xs text-muted-foreground">
                  {m.description}
                  {m.requires.length ? ` Needs ${m.requires.map(moduleName).join(", ")}.` : ""}
                </span>
              </span>
            </label>
          </li>
        );
      })}
    </ul>
  );
}
