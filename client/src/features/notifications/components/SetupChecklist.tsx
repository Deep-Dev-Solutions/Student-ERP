"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { CheckCircle2, Circle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { useBranchClasses, useCurrentSession } from "@/hooks/use-academics";
import { useCurrentBranch, useModules } from "@/hooks/use-session";
import type { ModuleKey } from "@/types";
import {
  useGetAllocationsQuery,
  useGetCampusProfileQuery,
  useGetClassSubjectsQuery,
  useGetFeePlansQuery,
  useGetSectionsQuery,
  useGetStaffQuery,
  useGetStudentsQuery,
  useGetUsersQuery,
} from "@/store/api";

const KEY = "dd_setup_dismissed:";
const listeners = new Set<() => void>();
const subscribe = (fn: () => void) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};
const readDismissed = (branchId: string) => {
  try {
    return localStorage.getItem(KEY + branchId) === "1";
  } catch {
    return false;
  }
};

/** Steps to get a new campus running; shown on the dashboard until they're done or dismissed. */
export function SetupChecklist() {
  const branch = useCurrentBranch();
  const session = useCurrentSession();
  const classes = useBranchClasses();
  const profile = useGetCampusProfileQuery().data;
  const { data: sections = [] } = useGetSectionsQuery();
  const { data: classSubjects = [] } = useGetClassSubjectsQuery();
  const { data: staff = [] } = useGetStaffQuery();
  const { data: users = [] } = useGetUsersQuery();
  const { data: plans = [] } = useGetFeePlansQuery();
  const { data: students = [] } = useGetStudentsQuery();
  const { data: allocations = [] } = useGetAllocationsQuery();
  const { has } = useModules();
  const dismissed = useSyncExternalStore(subscribe, () => readDismissed(branch?.id ?? ""), () => true);
  if (!branch || dismissed) return null;

  const branchSections = sections.filter((s) => classes.some((c) => c.id === s.classId));
  const branchStaff = staff.filter((m) => m.branchId === branch.id && m.status !== "terminated");
  const branchStudents = students.filter((s) => s.branchId === branch.id && s.enrollment === "active");
  const occupied = branchSections.filter((s) => branchStudents.some((st) => st.sectionId === s.id));
  const teachers = branchStaff.filter((m) => m.teaches);
  const allSteps: { module?: ModuleKey; label: string; done: boolean; href: string }[] = [
    { label: "School profile and contact details", done: Boolean(profile?.schoolName && profile.contactPhone), href: "/settings?tab=profile" },
    { label: "Current academic session", done: Boolean(session), href: "/academics?tab=sessions" },
    { module: "students", label: "Classes and sections", done: classes.length > 0 && classes.every((c) => branchSections.some((s) => s.classId === c.id)), href: "/academics" },
    { module: "students", label: "Subjects for every class", done: classes.length > 0 && classes.every((c) => classSubjects.some((cs) => cs.classId === c.id)), href: "/academics?tab=subjects" },
    { module: "staff", label: "Staff records", done: branchStaff.length > 0, href: "/staff/new" },
    { module: "students", label: "A class incharge for every section with students", done: occupied.length > 0 && occupied.every((s) => s.inchargeId), href: "/academics" },
    { module: "staff", label: "Teachers for every subject", done: allocations.length > 0 && classes.filter((c) => allocations.some((a) => a.classId === c.id)).every((c) => classSubjects.filter((cs) => cs.classId === c.id).every((cs) => branchSections.filter((s) => s.classId === c.id).every((s) => allocations.some((a) => a.sectionId === s.id && a.subjectId === cs.subjectId)))), href: "/staff?tab=allocations" },
    { module: "fees", label: "Fee plan for every class", done: classes.length > 0 && classes.every((c) => plans.some((p) => p.branchId === branch.id && p.classId === c.id)), href: "/fees?tab=structure" },
    { module: "students", label: "Students admitted", done: branchStudents.length > 0, href: "/students/new" },
    { label: "Logins for teachers", done: teachers.length > 0 && teachers.every((t) => users.some((u) => u.staffId === t.staffId)), href: "/settings?tab=users" },
  ];
  // Steps for modules the school has; "Teachers for every subject" also needs classes.
  const steps = allSteps.filter((s) => has(s.module) && (s.label !== "Teachers for every subject" || has("students")));
  const done = steps.filter((s) => s.done).length;
  if (done === steps.length) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(KEY + branch.id, "1");
    } catch {
      // Storage blocked: the checklist simply stays.
    }
    listeners.forEach((fn) => fn());
  };

  return (
    <Card className="gap-4 px-5 sm:px-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <CardTitle>
            <h2>Finish setting up {branch.name}</h2>
          </CardTitle>
          <CardDescription className="mt-0.5">
            {done} of {steps.length} done. Each step links to where it&apos;s set.
          </CardDescription>
        </div>
        <Button variant="ghost" size="icon-sm" aria-label="Hide setup checklist" onClick={dismiss}>
          <X />
        </Button>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted" role="progressbar" aria-label="Setup progress" aria-valuemin={0} aria-valuemax={steps.length} aria-valuenow={done}>
        <div className="h-full rounded-full bg-primary" style={{ width: `${(done / steps.length) * 100}%` }} />
      </div>
      <ul className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
        {steps.map((s) => (
          <li key={s.label} className="flex items-center gap-2 text-sm">
            {s.done ? <CheckCircle2 aria-hidden className="size-4 shrink-0 text-success" /> : <Circle aria-hidden className="size-4 shrink-0 text-muted-foreground" />}
            {s.done ? (
              <span className="text-muted-foreground">
                <span className="sr-only">Done: </span>
                {s.label}
              </span>
            ) : (
              <Link href={s.href} className="rounded font-medium text-primary outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring/40">
                {s.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </Card>
  );
}
