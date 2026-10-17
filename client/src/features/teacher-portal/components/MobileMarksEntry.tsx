"use client";

import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MarksSaveStatus } from "@/features/exams/components/MarksSaveStatus";
import { useMarksEditor } from "@/features/exams/useMarksEditor";
import { useGrader } from "@/hooks/use-academics";
import type { Exam, ExamPaper, Student } from "@/types";

interface MobileMarksEntryProps {
  exam: Exam;
  paper: ExamPaper;
  roster: { student: Student; rollNo: string }[];
  canEnter: boolean;
}

export function MobileMarksEntry({ exam, paper, roster, canEnter }: MobileMarksEntryProps) {
  const gradeFor = useGrader();
  const editor = useMarksEditor(exam, paper, roster.map((r) => r.student.id), canEnter);
  const { total, entryOf, change, persist } = editor;

  return (
    <div className="space-y-4 pb-24">
      <p className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground" aria-live="polite">
        <span className="font-semibold text-foreground">
          {editor.marked} of {roster.length}
        </span>{" "}
        entered · average <span className="font-semibold text-foreground">{editor.average.toFixed(1)}</span>
      </p>

      <ul className="space-y-2">
        {roster.map(({ student, rollNo }) => {
          const e = entryOf(student.id);
          const error = editor.errorOf(student.id);
          const score = !e.absent && e.value !== "" && !error ? Number(e.value) : null;
          const grade = gradeFor(score === null ? null : Math.round((score / total) * 100));
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
                        <span className="text-xs text-muted-foreground">Roll {rollNo}</span>
                        {e.absent ? (
                          <Badge variant="neutral" className="h-5 px-1.5">
                            Absent
                          </Badge>
                        ) : (
                          <Badge variant={score !== null && score < paper.passMarks ? "danger" : grade.variant} className="h-5 px-1.5">
                            <span className="sr-only">Grade </span>
                            {grade.label}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <Input
                      id={inputId}
                      inputMode="decimal"
                      value={e.absent ? "" : e.value}
                      placeholder="—"
                      disabled={!canEnter || e.absent}
                      onChange={(ev) => change(student.id, { value: ev.target.value.replace(/[^\d.]/g, "") })}
                      onBlur={() => persist(student.id)}
                      onKeyDown={(ev) => ev.key === "Enter" && ev.currentTarget.blur()}
                      aria-invalid={error ? true : undefined}
                      aria-describedby={`${inputId}-max${error ? ` ${inputId}-error` : ""}`}
                      className="h-12 w-20 bg-card text-center text-lg font-semibold tabular-nums"
                    />
                    <span id={`${inputId}-max`} className="text-sm text-muted-foreground">
                      / {total}
                    </span>
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between gap-3 pl-13">
                  {error ? (
                    <p id={`${inputId}-error`} className="text-xs text-danger">
                      {error}
                    </p>
                  ) : (
                    <span />
                  )}
                  <label className="flex cursor-pointer items-center gap-1.5 text-sm text-muted-foreground">
                    <Checkbox checked={e.absent} disabled={!canEnter} onCheckedChange={(c) => change(student.id, { absent: Boolean(c) }, true)} />
                    Absent
                  </label>
                </div>
              </Card>
            </li>
          );
        })}
      </ul>

      {/* Sits just above the mobile bottom nav; next to the sidebar on desktop. */}
      <div className="pointer-events-none fixed inset-x-0 bottom-16 z-40 bg-gradient-to-t from-background via-background/95 to-transparent p-4 md:bottom-0 md:pl-66">
        <div className="pointer-events-auto mx-auto max-w-md md:max-w-2xl">
          <p role="status" className="flex min-h-12 items-center justify-center rounded-lg border border-border bg-card px-3 py-2 text-sm text-muted-foreground">
            <MarksSaveStatus
              state={editor.state}
              errorCount={editor.errorCount}
              idle={canEnter ? `Marks save as you go (${editor.marked} of ${roster.length} entered).` : "Marks are locked."}
            />
          </p>
        </div>
      </div>
    </div>
  );
}
