"use client";

import Link from "next/link";
import { ChevronRight, UsersRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
import { useGetStudentsQuery } from "@/store/api";
import { usePortalTeacher, useTeachingSections } from "../hooks";

/** The sections a teacher teaches or is incharge of, with links to their student lists. */
export function MyClasses() {
  const { member } = usePortalTeacher();
  const sections = useTeachingSections();
  const { data: students = [] } = useGetStudentsQuery();
  const countIn = (sectionId: string) => students.filter((s) => s.sectionId === sectionId && s.enrollment === "active").length;
  const periods = sections.reduce((n, t) => n + t.subjects.reduce((m, s) => m + s.weeklyPeriods, 0), 0);
  const studentTotal = sections.reduce((n, t) => n + countIn(t.section.id), 0);

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader title="My classes" description={member ? `Sections you teach this term, ${member.name}.` : "Sections you teach this term."} />

      <dl className="grid grid-cols-3 gap-3">
        {[
          { label: "Sections", value: sections.length },
          { label: "Periods a week", value: periods },
          { label: "Students", value: studentTotal },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card px-4 py-3">
            <dt className="text-sm text-muted-foreground">{s.label}</dt>
            <dd className="mt-1 text-2xl font-semibold">{s.value}</dd>
          </div>
        ))}
      </dl>

      {sections.length === 0 ? (
        <Card className="py-0">
          <EmptyState icon={UsersRound} title="No classes assigned yet" description="Ask the branch admin to assign your subjects in Teaching allocations." />
        </Card>
      ) : (
        <ul className="space-y-2">
          {sections.map((t) => (
            <li key={t.section.id}>
              <Link
                href={`/teacher-portal/classes/${t.section.id}`}
                className="group block rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
              >
                <Card className="gap-2 px-4 py-4 transition-colors group-hover:bg-muted/50 sm:px-5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="flex flex-wrap items-center gap-2 font-medium">
                        {t.label}
                        {t.incharge ? <Badge variant="info">Class incharge</Badge> : null}
                      </p>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {t.subjects.length
                          ? t.subjects.map((s) => `${s.name}, ${s.weeklyPeriods} periods a week`).join("; ")
                          : "You don't teach a subject here"}
                      </p>
                    </div>
                    <span className="flex shrink-0 items-center gap-1 text-sm text-muted-foreground">
                      {countIn(t.section.id)} {countIn(t.section.id) === 1 ? "student" : "students"}
                      <ChevronRight aria-hidden className="size-4" />
                    </span>
                  </div>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
