"use client";

import { useState } from "react";
import { ClipboardList, Lock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/EmptyState";
import { LabeledSelect } from "@/components/shared/LabeledSelect";
import { useBranchExams } from "@/features/exams/components/ExamSetup";
import { MobileMarksEntry } from "@/features/teacher-portal/components/MobileMarksEntry";
import { useTeachingSections } from "@/features/teacher-portal/hooks";
import { useReadOnly } from "@/hooks/use-academics";
import { useCan } from "@/hooks/use-session";
import { sectionRoster, sitsPaper } from "@/lib/results";
import { useGetClassSubjectsQuery, useGetExamPapersQuery, useGetStudentsQuery } from "@/store/api";

export default function TeacherMarksPage() {
  const readOnly = useReadOnly();
  const canEnterRole = useCan("acad_enter_marks") && !readOnly;
  const exams = useBranchExams();
  const teaching = useTeachingSections();
  const { data: papers = [] } = useGetExamPapersQuery();
  const { data: students = [] } = useGetStudentsQuery();
  const { data: classSubjects = [] } = useGetClassSubjectsQuery();

  // Each subject the teacher teaches in a section, where the exam has a paper for it.
  const slotsFor = (examId: string) =>
    teaching.flatMap((t) =>
      t.subjects
        .map((s) => ({ key: `${t.section.id}|${s.id}`, label: `${t.cls.name} ${t.section.name}, ${s.name}`, teaching: t, subjectName: s.name, paper: papers.find((p) => p.examId === examId && p.classId === t.cls.id && p.subjectId === s.id) }))
        .filter((x) => x.paper)
    );
  const withPapers = exams.filter((e) => slotsFor(e.id).length > 0);
  const [examId, setExamId] = useState("");
  const exam = withPapers.find((e) => e.id === examId) ?? withPapers.find((e) => !e.publishedAt) ?? withPapers[0];
  const slots = exam ? slotsFor(exam.id) : [];
  const [slotKey, setSlotKey] = useState("");
  const slot = slots.find((s) => s.key === slotKey) ?? slots[0];
  const paper = slot?.paper;
  const roster = slot && paper ? sectionRoster(students, slot.teaching.section.id).filter(({ student }) => sitsPaper(student, paper, classSubjects)) : [];

  return (
    <div className="mx-auto max-w-2xl space-y-4 px-4 py-6 sm:px-6">
      <Card className="gap-4 px-4 sm:px-5">
        <div>
          <h1 className="text-xl font-semibold">Enter marks</h1>
          <p className="text-sm text-muted-foreground">
            {slot && paper ? `${slot.teaching.label} · ${slot.subjectName} out of ${paper.totalMarks}, pass at ${paper.passMarks}` : "Your subjects only"}
          </p>
        </div>
        {exam ? (
          <div className="grid grid-cols-2 gap-3">
            <LabeledSelect
              label="Exam"
              options={withPapers.map((e) => ({ value: e.id, label: e.title }))}
              value={exam.id}
              onValueChange={(v) => {
                setExamId(v);
                setSlotKey("");
              }}
            />
            <LabeledSelect label="Class and subject" options={slots.map((s) => ({ value: s.key, label: s.label }))} value={slot?.key ?? ""} onValueChange={setSlotKey} />
          </div>
        ) : null}
        {exam?.publishedAt ? (
          <p className="flex items-center gap-2 rounded-lg border border-border bg-muted/60 p-3 text-sm text-muted-foreground">
            <Lock aria-hidden className="size-4 shrink-0" />
            Results for this exam are published, so marks are locked. Ask the branch admin if a mark needs correcting.
          </p>
        ) : null}
      </Card>

      {exam && slot && paper ? (
        roster.length ? (
          <MobileMarksEntry key={`${exam.id}-${slot.key}`} exam={exam} paper={paper} roster={roster} canEnter={canEnterRole && !exam.publishedAt} />
        ) : (
          <Card className="py-0">
            <EmptyState icon={ClipboardList} title="No students sit this paper" description="This section has no active students taking this subject." />
          </Card>
        )
      ) : (
        <Card className="py-0">
          <EmptyState icon={ClipboardList} title="Nothing to mark yet" description="Marks open here once an exam's date sheet includes a subject you teach." />
        </Card>
      )}
    </div>
  );
}
