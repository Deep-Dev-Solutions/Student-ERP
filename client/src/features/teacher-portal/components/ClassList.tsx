"use client";

import { useState } from "react";
import { Phone, Search, UsersRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
import { primaryGuardian } from "@/features/students/status";
import { sectionRoster } from "@/lib/results";
import { useGetStudentsQuery } from "@/store/api";
import { useTeachingSections } from "../hooks";

/** Student list for one of the teacher's sections. */
export function ClassList({ sectionId }: { sectionId: string }) {
  const teaching = useTeachingSections().find((t) => t.section.id === sectionId);
  const { data: students = [] } = useGetStudentsQuery();
  const [query, setQuery] = useState("");

  if (!teaching) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
        <Card className="py-0">
          <EmptyState
            icon={UsersRound}
            title="This isn't one of your classes"
            description="You can see the student lists of sections you teach or are incharge of."
            action={<ButtonLink href="/teacher-portal/classes">Back to my classes</ButtonLink>}
          />
        </Card>
      </div>
    );
  }

  const roster = sectionRoster(students, sectionId);
  const q = query.trim().toLowerCase();
  const shown = roster.filter(({ student, rollNo }) => !q || student.name.toLowerCase().includes(q) || rollNo.includes(q));

  return (
    <div className="mx-auto max-w-2xl space-y-4 px-4 py-6 sm:px-6">
      <PageHeader
        title={teaching.label}
        description={`${roster.length} ${roster.length === 1 ? "student" : "students"}. ${teaching.incharge ? "You're the class incharge. " : ""}${teaching.subjects.map((s) => s.name).join(", ")}`}
      />
      <div className="relative">
        <Search aria-hidden className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input type="search" aria-label="Find a student" placeholder="Name or roll number" value={query} onChange={(e) => setQuery(e.target.value)} className="h-10 bg-card pl-9" />
      </div>
      {shown.length === 0 ? (
        <Card className="py-0">
          <EmptyState icon={Search} title={roster.length ? "No students match" : "No students in this section"} description={roster.length ? "Search by name or roll number." : "Students appear here once they're admitted."} />
        </Card>
      ) : (
        <ul className="space-y-2">
          {shown.map(({ student, rollNo }) => {
            const guardian = primaryGuardian(student);
            return (
              <li key={student.id}>
                <Card className="gap-2 px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span aria-hidden className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-secondary-foreground">
                        {student.avatar}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-medium">{student.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Roll {rollNo}
                          {guardian ? `, ${guardian.relation === "father" ? "father" : guardian.relation === "mother" ? "mother" : "guardian"} ${guardian.name}` : ""}
                        </p>
                      </div>
                    </div>
                    <Badge variant={student.attendance >= 90 ? "success" : student.attendance >= 80 ? "warning" : "danger"} className="shrink-0">
                      <span className="sr-only">Attendance </span>
                      {student.attendance}%
                    </Badge>
                  </div>
                  {guardian?.phone ? (
                    <a href={`tel:${guardian.phone.replace(/\D/g, "")}`} className="flex w-fit items-center gap-1.5 rounded text-sm text-primary outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring/40">
                      <Phone aria-hidden className="size-3.5" />
                      {guardian.phone}
                    </a>
                  ) : null}
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
