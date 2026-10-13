"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { LabeledSelect } from "@/components/shared/LabeledSelect";
import { useClassSectionPicker, useClassSubjects } from "@/hooks/use-academics";
import { MobileMarksEntry } from "@/features/teacher-portal/components/MobileMarksEntry";

const examOptions = [
  { value: "midterm-2026", label: "Mid-term 2026" },
  { value: "monthly-test", label: "Monthly test" },
  { value: "final-2026", label: "Annual exam 2026" },
];

export default function TeacherMarksPage() {
  const [selectedExam, setSelectedExam] = useState("midterm-2026");
  // The class and section shown in the subtitle; they become pickers in Phase I.
  const { classId } = useClassSectionPicker({ className: "Class 10", section: "B" });
  const subjectOptions = useClassSubjects(classId).map((s) => ({ value: s.id, label: s.name }));
  const [pickedSubject, setSelectedSubject] = useState("sub-phy");
  const selectedSubject = subjectOptions.some((o) => o.value === pickedSubject) ? pickedSubject : (subjectOptions[0]?.value ?? "");

  return (
    <div className="mx-auto max-w-2xl space-y-4 px-4 py-6 sm:px-6">
      <Card className="gap-4 px-4 sm:px-5">
        <div>
          <h1 className="text-xl font-semibold">Enter marks</h1>
          <p className="text-sm text-muted-foreground">Class 10, section B · out of 100</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <LabeledSelect label="Exam" options={examOptions} value={selectedExam} onValueChange={setSelectedExam} />
          <LabeledSelect label="Subject" options={subjectOptions} value={selectedSubject} onValueChange={setSelectedSubject} />
        </div>
      </Card>

      <MobileMarksEntry />
    </div>
  );
}
