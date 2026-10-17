"use client";

import { useState } from "react";
import { CalendarCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/EmptyState";
import { LabeledSelect } from "@/components/shared/LabeledSelect";
import { useCurrentBranch } from "@/hooks/use-session";
import { useToday } from "@/features/attendance/hooks";
import { useTeachingSections } from "@/features/teacher-portal/hooks";
import { useGetSchoolRulesQuery } from "@/store/api";
import { MobileAttendanceList } from "@/features/teacher-portal/components/MobileAttendanceList";

const modeNote = {
  single_marker: "A designated person marks attendance at this school, so there's nothing for you to mark here.",
  admin_oversight: "The office records attendance at this school, so there's nothing for you to mark here.",
} as const;

export default function TeacherAttendancePage() {
  const branch = useCurrentBranch();
  const isoToday = useToday();
  const mode = useGetSchoolRulesQuery().data?.attendance.mode ?? "class_incharge";
  const teaching = useTeachingSections();
  // Class incharges mark their own section; in subject-wise mode, each teacher marks the subjects they teach.
  const own = mode === "class_incharge" ? teaching.filter((t) => t.incharge) : mode === "subject_wise" ? teaching.filter((t) => t.subjects.length) : [];
  const [pickedSection, setPickedSection] = useState("");
  const current = own.find((t) => t.section.id === pickedSection) ?? own[0];
  const [pickedSubject, setPickedSubject] = useState("");
  const subject = mode === "subject_wise" ? (current?.subjects.find((s) => s.id === pickedSubject) ?? current?.subjects[0]) : undefined;

  // Rendered on the client at request time (see teacher-portal/loading.tsx).
  const today = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="mx-auto max-w-2xl space-y-4 px-4 py-6 sm:px-6">
      <Card className="gap-4 px-4 sm:px-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold">Mark attendance</h1>
            <p className="text-sm text-muted-foreground">{today}</p>
          </div>
          {current ? <Badge variant="info">{subject ? subject.name : "Class incharge"}</Badge> : null}
        </div>
        {own.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            <LabeledSelect
              label="Section"
              className={subject ? "" : "col-span-2"}
              options={own.map((t) => ({ value: t.section.id, label: t.label }))}
              value={current?.section.id ?? ""}
              onValueChange={(v) => {
                setPickedSection(v);
                setPickedSubject("");
              }}
            />
            {subject && current ? (
              <LabeledSelect label="Subject" options={current.subjects.map((s) => ({ value: s.id, label: s.name }))} value={subject.id} onValueChange={setPickedSubject} />
            ) : null}
          </div>
        ) : null}
      </Card>

      {current ? (
        <MobileAttendanceList
          key={`${current.section.id}-${subject?.id ?? ""}`}
          branchId={branch?.id ?? ""}
          classId={current.cls.id}
          sectionId={current.section.id}
          subjectId={subject?.id}
          date={isoToday ?? ""}
        />
      ) : (
        <Card className="py-0">
          <EmptyState
            icon={CalendarCheck}
            title="No register for you to mark"
            description={
              mode === "class_incharge"
                ? "At this school the class incharge marks attendance, and you aren't incharge of a section."
                : mode === "subject_wise"
                  ? "You don't have any subjects assigned yet. Ask the branch admin."
                  : modeNote[mode]
            }
          />
        </Card>
      )}
    </div>
  );
}
