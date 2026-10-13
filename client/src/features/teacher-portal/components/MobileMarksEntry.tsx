"use client";

import { useState } from "react";
import {
  Card,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useGrader } from "@/hooks/use-academics";
import {
  CheckCircle2,
  Clock,
  Save,
} from "lucide-react";

import { useGetTeacherMarksQuery } from "@/store/api";
import type { StudentMarksItem } from "@/types";

export function MobileMarksEntry() {
  const { data: marks = [] } = useGetTeacherMarksQuery();
  const gradeFor = useGrader();
  const [students, setStudents] = useState<StudentMarksItem[]>(marks);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleScoreChange = (id: string, val: string) => {
    setStudents((prev) =>
      prev.map((student) => {
        if (student.id === id) {
          if (val === "") return { ...student, obtainedMarks: "" };
          const num = Number(val);
          const clamped = Math.min(Math.max(0, num), student.maxMarks);
          return { ...student, obtainedMarks: clamped };
        }
        return student;
      })
    );
  };

  const handleSaveMarks = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    }, 700);
  };

  const totalFilled = students.filter((s) => s.obtainedMarks !== "").length;
  const averageMarks =
    students.reduce((acc, curr) => acc + (Number(curr.obtainedMarks) || 0), 0) /
    (totalFilled || 1);

  return (
    <div className="space-y-4 pb-24">
      <p className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground" aria-live="polite">
        <span className="font-semibold text-foreground">
          {totalFilled} of {students.length}
        </span>{" "}
        entered · average <span className="font-semibold text-foreground">{averageMarks.toFixed(1)}</span>
      </p>

      <ul className="space-y-2">
        {students.map((student) => {
          const score = student.obtainedMarks === "" ? null : Number(student.obtainedMarks);
          const grade = gradeFor(score === null ? null : Math.round((score / student.maxMarks) * 100));
          const inputId = `marks-${student.id}`;
          return (
            <li key={student.id}>
              <Card className="gap-0 px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      aria-hidden
                      className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-secondary-foreground"
                    >
                      {student.avatar}
                    </span>
                    <div className="min-w-0">
                      <label htmlFor={inputId} className="block truncate font-medium">
                        {student.name}
                      </label>
                      <div className="mt-0.5 flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Roll {student.rollNo}</span>
                        <Badge variant={grade.variant} className="h-5 px-1.5">
                          <span className="sr-only">Grade </span>
                          {grade.label}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <Input
                      id={inputId}
                      type="number"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      min={0}
                      max={student.maxMarks}
                      value={student.obtainedMarks}
                      placeholder="—"
                      onChange={(e) => handleScoreChange(student.id, e.target.value)}
                      aria-describedby={`${inputId}-max`}
                      className="h-12 w-20 bg-card text-center text-lg font-semibold tabular-nums"
                    />
                    <span id={`${inputId}-max`} className="text-sm text-muted-foreground">
                      / {student.maxMarks}
                    </span>
                  </div>
                </div>
              </Card>
            </li>
          );
        })}
      </ul>

      {/* Sits just above the mobile bottom nav; next to the sidebar on desktop. */}
      <div className="pointer-events-none fixed inset-x-0 bottom-16 z-40 bg-gradient-to-t from-background via-background/95 to-transparent p-4 md:bottom-0 md:pl-66">
        <div className="pointer-events-auto mx-auto max-w-md space-y-2 md:max-w-2xl">
          {saveSuccess ? (
            <p role="status" className="flex items-center justify-center gap-2 rounded-lg border border-success/30 bg-success-tint p-2 text-sm text-success">
              <CheckCircle2 aria-hidden className="size-4" />
              Marks saved.
            </p>
          ) : null}
          <Button size="lg" onClick={handleSaveMarks} disabled={isSaving} className="h-12 w-full text-base">
            {isSaving ? (
              <>
                <Clock data-icon="inline-start" className="motion-safe:animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <Save data-icon="inline-start" />
                Save marks ({totalFilled} of {students.length} entered)
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
