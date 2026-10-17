"use client";

import { useState } from "react";
import { errorMessage, useGetExamMarksQuery, useSaveMarksMutation } from "@/store/api";
import type { Exam, ExamPaper } from "@/types";

export type MarksEntry = { value: string; absent: boolean; remark: string };
export type MarksSaveState = { saving: number; at?: string; error?: string };

/** Why a typed mark can't be saved, or null if it can (blank is fine). */
export function markProblem(value: string, total: number): string | null {
  if (value === "") return null;
  if (!/^\d+(\.\d+)?$/.test(value)) return "Enter a number";
  const n = Number(value);
  if (n > total) return `Can't be more than ${total}`;
  if (Math.round(n * 2) !== n * 2) return "Use whole or half marks";
  return null;
}

/**
 * Typed marks for one paper, saved one student at a time as they're entered.
 * Invalid marks stay on screen with an error and aren't sent.
 */
export function useMarksEditor(exam: Exam, paper: ExamPaper | undefined, studentIds: string[], canEnter: boolean) {
  const { data: marks = [] } = useGetExamMarksQuery();
  const [saveMarks] = useSaveMarksMutation();
  const [state, setState] = useState<MarksSaveState>({ saving: 0 });
  const total = paper?.totalMarks ?? 100;

  const saved = (studentId: string): MarksEntry => {
    const m = marks.find((x) => x.examId === exam.id && x.subjectId === paper?.subjectId && x.studentId === studentId);
    return { value: m?.obtained != null ? String(m.obtained) : "", absent: m?.absent ?? false, remark: m?.remark ?? "" };
  };
  const [entries, setEntries] = useState<Record<string, MarksEntry>>(() => Object.fromEntries(studentIds.map((id) => [id, saved(id)])));
  const entryOf = (id: string) => entries[id] ?? saved(id);
  const errorOf = (id: string) => (entryOf(id).absent ? null : markProblem(entryOf(id).value, total));
  const errorCount = studentIds.filter((id) => errorOf(id)).length;

  const persist = async (studentId: string, entry: MarksEntry = entryOf(studentId)) => {
    if (!paper || !canEnter) return;
    if (!entry.absent && markProblem(entry.value, total)) return;
    const before = saved(studentId);
    if (before.value === entry.value && before.absent === entry.absent && before.remark === entry.remark.trim()) return;
    setState((s) => ({ ...s, saving: s.saving + 1, error: undefined }));
    const result = await saveMarks({
      examId: exam.id,
      subjectId: paper.subjectId,
      entries: [{ studentId, obtained: entry.absent || entry.value === "" ? null : Number(entry.value), absent: entry.absent, remark: entry.remark }],
    });
    setState((s) => ({
      saving: s.saving - 1,
      at: "error" in result ? s.at : new Date().toLocaleTimeString("en-GB", { hour: "numeric", minute: "2-digit" }),
      error: "error" in result ? errorMessage(result.error) : undefined,
    }));
  };

  /** Updates a student's entry; pass saveNow for changes that should save at once (the absent toggle). */
  const change = (studentId: string, changes: Partial<MarksEntry>, saveNow = false) => {
    const next = { ...entryOf(studentId), ...changes };
    setEntries((e) => ({ ...e, [studentId]: next }));
    if (saveNow) persist(studentId, next);
  };

  const valid = studentIds.map(entryOf).filter((e) => !e.absent && e.value !== "" && !markProblem(e.value, total));
  return {
    total,
    entryOf,
    errorOf,
    errorCount,
    change,
    persist,
    state,
    marked: studentIds.filter((id) => entryOf(id).absent || entryOf(id).value !== "").length,
    average: valid.length ? valid.reduce((n, e) => n + Number(e.value), 0) / valid.length : 0,
  };
}
