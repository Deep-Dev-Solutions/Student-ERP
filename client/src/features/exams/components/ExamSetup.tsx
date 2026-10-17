"use client";

import { useState } from "react";
import { AlertTriangle, CalendarDays, CheckCircle2, Pencil, Plus, Save, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/EmptyState";
import { FormStatus, SelectField } from "@/components/shared/FormFields";
import { useToday } from "@/features/attendance/hooks";
import { useBranchClasses, useClassSubjects, useReadOnly, useSelectedSession } from "@/hooks/use-academics";
import { useCan, useCurrentBranch } from "@/hooks/use-session";
import { useUrlParam } from "@/hooks/use-url-state";
import { examStatus } from "@/lib/results";
import { statusVariant } from "@/lib/status";
import {
  errorMessage,
  useDeleteExamMutation,
  useGetExamMarksQuery,
  useGetExamPapersQuery,
  useGetExamsQuery,
  useGetSchoolRulesQuery,
  useSaveDateSheetMutation,
  useSaveExamMutation,
} from "@/store/api";
import type { Exam, ExamType } from "../types";

const termTypeOptions: { value: ExamType; label: string }[] = [
  { value: "midterm", label: "Mid-term" },
  { value: "final", label: "Final or annual" },
  { value: "monthly", label: "Monthly test" },
  { value: "quiz", label: "Quiz" },
];
const termTypeLabels = Object.fromEntries(termTypeOptions.map((o) => [o.value, o.label])) as Record<ExamType, string>;

const examStatusLabels: Record<ReturnType<typeof examStatus>, string> = {
  upcoming: "Upcoming",
  ongoing: "In progress",
  completed: "Completed",
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "2026-10-20", "2026-10-31" -> "20–31 Oct 2026" (parsed as plain dates, no time zone). */
export function formatDateRange(start: string, end: string) {
  const [sy, sm, sd] = start.split("-").map(Number);
  const [ey, em, ed] = end.split("-").map(Number);
  if (sy === ey && sm === em) return `${sd}–${ed} ${MONTHS[em - 1]} ${ey}`;
  if (sy === ey) return `${sd} ${MONTHS[sm - 1]} – ${ed} ${MONTHS[em - 1]} ${ey}`;
  return `${sd} ${MONTHS[sm - 1]} ${sy} – ${ed} ${MONTHS[em - 1]} ${ey}`;
}

const shortDate = (iso: string) => {
  const [, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTHS[m - 1]}`;
};

/** Exams at this campus in the session picked in the header, newest first. */
export function useBranchExams() {
  const branch = useCurrentBranch();
  const { session } = useSelectedSession();
  const { data: exams = [] } = useGetExamsQuery();
  return exams.filter((e) => e.branchId === branch?.id && e.sessionId === session?.id).sort((a, b) => b.startDate.localeCompare(a.startDate));
}

type Draft = { title: string; termType: ExamType; startDate: string; endDate: string; classIds: string[] };
const emptyDraft: Draft = { title: "", termType: "midterm", startDate: "", endDate: "", classIds: [] };

export function ExamSetup() {
  const readOnly = useReadOnly();
  const canManage = useCan("acad_create_exam") && !readOnly;
  const today = useToday();
  const branch = useCurrentBranch();
  const { session } = useSelectedSession();
  const exams = useBranchExams();
  const branchClasses = useBranchClasses();
  const { data: papers = [] } = useGetExamPapersQuery();
  const { data: marks = [] } = useGetExamMarksQuery();
  const [saveExam, { isLoading: saving }] = useSaveExamMutation();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [notice, setNotice] = useState<{ success?: string; error?: string }>({});
  const [deleting, setDeleting] = useState<Exam | null>(null);
  const [sheetParam, setSheetParam] = useUrlParam("exam", "");
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => ({ ...d, [key]: value }));

  const className = (id: string) => branchClasses.find((c) => c.id === id)?.name ?? "";
  const dateError = draft.startDate && draft.endDate && draft.endDate < draft.startDate ? "The end date must be on or after the start date." : "";
  const allClasses = branchClasses.length > 0 && draft.classIds.length === branchClasses.length;
  const sheetExam = exams.find((e) => e.id === sheetParam) ?? exams.find((e) => examStatus(e, today) !== "completed") ?? exams[0];

  const startEdit = (exam: Exam) => {
    setEditingId(exam.id);
    setDraft({ title: exam.title, termType: exam.termType, startDate: exam.startDate, endDate: exam.endDate, classIds: exam.classIds });
    setNotice({});
    document.getElementById("exam-title")?.focus();
  };
  const cancelEdit = () => {
    setEditingId(null);
    setDraft(emptyDraft);
    setNotice({});
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!branch || !session) return;
    const result = await saveExam({ ...draft, ...(editingId ? { id: editingId } : {}), branchId: branch.id, sessionId: session.id });
    if ("error" in result) return setNotice({ error: errorMessage(result.error) });
    setNotice({ success: editingId ? `${result.data.title} updated.` : `${result.data.title} scheduled. Now set its date sheet below.` });
    if (!editingId) setSheetParam(result.data.id);
    setEditingId(null);
    setDraft(emptyDraft);
  };

  return (
    <div className="space-y-6">
      {canManage ? (
        <Card className="gap-5 px-6">
          <div>
            <CardTitle>
              <h2>{editingId ? "Edit exam" : "Schedule an exam"}</h2>
            </CardTitle>
            <CardDescription className="mt-0.5">Set the dates and the classes taking part. Academic year {session?.label}.</CardDescription>
          </div>

          <form onSubmit={submit} className="space-y-4" noValidate>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="sm:col-span-2">
                <label htmlFor="exam-title" className="mb-1.5 block text-sm font-medium">
                  Exam name
                </label>
                <Input id="exam-title" placeholder="e.g. Mid-term exam 2026" value={draft.title} onChange={(e) => set("title", e.target.value)} className="h-9 bg-card" />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="exam-type" className="mb-1.5 block text-sm font-medium">
                  Type
                </label>
                <Select items={termTypeOptions} value={draft.termType} onValueChange={(val) => val && set("termType", val as ExamType)}>
                  <SelectTrigger id="exam-type" className="h-9 w-full bg-card">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {termTypeOptions.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-1 lg:col-span-2">
                <label htmlFor="exam-start" className="mb-1.5 block text-sm font-medium">
                  Start date
                </label>
                <Input id="exam-start" type="date" value={draft.startDate} onChange={(e) => set("startDate", e.target.value)} className="h-9 bg-card" />
              </div>
              <div className="sm:col-span-1 lg:col-span-2">
                <label htmlFor="exam-end" className="mb-1.5 block text-sm font-medium">
                  End date
                </label>
                <Input
                  id="exam-end"
                  type="date"
                  value={draft.endDate}
                  min={draft.startDate || undefined}
                  onChange={(e) => set("endDate", e.target.value)}
                  aria-invalid={dateError ? true : undefined}
                  aria-describedby={dateError ? "exam-end-error" : undefined}
                  className="h-9 bg-card"
                />
                {dateError ? (
                  <p id="exam-end-error" role="alert" className="mt-1 text-xs text-danger">
                    {dateError}
                  </p>
                ) : null}
              </div>
            </div>

            <fieldset>
              <legend className="mb-2 text-sm font-medium">Classes</legend>
              <div className="flex flex-wrap gap-x-5 gap-y-2.5">
                <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
                  <Checkbox checked={allClasses} onCheckedChange={(c) => set("classIds", c ? branchClasses.map((x) => x.id) : [])} />
                  All classes
                </label>
                {branchClasses.map((c) => (
                  <label key={c.id} className="flex cursor-pointer items-center gap-2 text-sm">
                    <Checkbox
                      checked={draft.classIds.includes(c.id)}
                      onCheckedChange={(checked) => set("classIds", checked ? [...draft.classIds, c.id] : draft.classIds.filter((x) => x !== c.id))}
                    />
                    {c.name}
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <FormStatus success={notice.success} error={notice.error} />
              <div className="flex flex-col-reverse gap-2 sm:flex-row">
                {editingId ? (
                  <Button type="button" variant="outline" onClick={cancelEdit}>
                    Cancel
                  </Button>
                ) : null}
                <Button type="submit" disabled={saving || !draft.title || !draft.startDate || !draft.endDate || Boolean(dateError) || draft.classIds.length === 0}>
                  {editingId ? <Save data-icon="inline-start" /> : <Plus data-icon="inline-start" />}
                  {editingId ? "Save changes" : "Schedule exam"}
                </Button>
              </div>
            </div>
          </form>
        </Card>
      ) : null}

      <Card className="gap-0 py-0">
        <div className="border-b border-border p-5 sm:p-6">
          <h2 className="text-base font-semibold">Exams this year</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {exams.length} exams scheduled for {session?.label}.
          </p>
        </div>

        {exams.length === 0 ? (
          <EmptyState icon={CalendarDays} title="No exams this year" description={canManage ? "Schedule one above." : "Exams appear here once they're scheduled."} />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-5">Exam</TableHead>
                <TableHead className="hidden lg:table-cell">Dates</TableHead>
                <TableHead className="hidden xl:table-cell">Classes</TableHead>
                <TableHead className="hidden sm:table-cell">Status</TableHead>
                <TableHead className="pr-5 text-right">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {exams.map((ex) => {
                const status = examStatus(ex, today);
                const withSheet = ex.classIds.filter((c) => papers.some((p) => p.examId === ex.id && p.classId === c)).length;
                const statusBadge = ex.publishedAt ? <Badge variant="success">Results out</Badge> : <Badge variant={statusVariant(status)}>{examStatusLabels[status]}</Badge>;
                return (
                  <TableRow key={ex.id} aria-current={ex.id === sheetExam?.id ? true : undefined}>
                    <TableCell className="min-w-40 pl-5 whitespace-normal">
                      <p className="font-medium">{ex.title}</p>
                      <div className="mt-1 sm:hidden">{statusBadge}</div>
                      <p className="text-xs text-muted-foreground">
                        {termTypeLabels[ex.termType]}, date sheet for {withSheet} of {ex.classIds.length} classes
                        <span className="lg:hidden">. {formatDateRange(ex.startDate, ex.endDate)}</span>
                      </p>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">{formatDateRange(ex.startDate, ex.endDate)}</TableCell>
                    <TableCell className="hidden whitespace-normal xl:table-cell">{ex.classIds.map(className).join(", ")}</TableCell>
                    <TableCell className="hidden sm:table-cell">{statusBadge}</TableCell>
                    <TableCell className="pr-5 text-right whitespace-nowrap">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Date sheet for ${ex.title}`}
                        onClick={() => {
                          setSheetParam(ex.id);
                          requestAnimationFrame(() => document.getElementById("date-sheet")?.scrollIntoView({ behavior: "smooth", block: "start" }));
                        }}
                      >
                        <CalendarDays />
                      </Button>
                      {canManage ? (
                        <>
                          <Button variant="ghost" size="icon-sm" aria-label={`Edit ${ex.title}`} disabled={Boolean(ex.publishedAt)} onClick={() => startEdit(ex)}>
                            <Pencil />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Delete ${ex.title}`}
                            disabled={Boolean(ex.publishedAt)}
                            onClick={() => setDeleting(ex)}
                            className="text-muted-foreground hover:bg-danger-tint hover:text-danger"
                          >
                            <Trash2 />
                          </Button>
                        </>
                      ) : null}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>

      {sheetExam ? <DateSheet key={sheetExam.id} exam={sheetExam} exams={exams} onExamChange={setSheetParam} canManage={canManage} /> : null}

      {deleting ? (
        <DeleteExamDialog
          exam={deleting}
          markCount={marks.filter((m) => m.examId === deleting.id).length}
          onClose={() => setDeleting(null)}
          onDone={(msg) => {
            if (editingId === deleting.id) cancelEdit();
            setNotice({ success: msg });
          }}
        />
      ) : null}
    </div>
  );
}

function DeleteExamDialog({ exam, markCount, onClose, onDone }: { exam: Exam; markCount: number; onClose: () => void; onDone: (msg: string) => void }) {
  const [remove, { isLoading }] = useDeleteExamMutation();
  const [error, setError] = useState<string | null>(null);
  const confirm = async () => {
    const result = await remove(exam.id);
    if ("error" in result) return setError(errorMessage(result.error));
    onClose();
    onDone(`${exam.title} deleted.`);
  };
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete {exam.title}?</DialogTitle>
          <DialogDescription>
            {markCount
              ? `Its date sheet and ${markCount} marks already entered will be deleted too. This can't be undone.`
              : "Its date sheet will be deleted too. This can't be undone."}
          </DialogDescription>
        </DialogHeader>
        {error ? <FormStatus error={error} /> : null}
        <DialogFooter>
          <DialogClose render={<Button type="button" variant="outline" />}>Keep exam</DialogClose>
          <Button variant="destructive" disabled={isLoading} onClick={confirm}>
            Delete exam
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type Row = { on: boolean; date: string; totalMarks: string; passMarks: string };

function DateSheet({ exam, exams, onExamChange, canManage }: { exam: Exam; exams: Exam[]; onExamChange: (id: string) => void; canManage: boolean }) {
  const branchClasses = useBranchClasses();
  const classes = branchClasses.filter((c) => exam.classIds.includes(c.id));
  const [classId, setClassId] = useState(classes[0]?.id ?? "");
  const editable = canManage && !exam.publishedAt;

  return (
    <Card id="date-sheet" className="scroll-mt-6 gap-5 px-5 sm:px-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <CardTitle>
            <h2>Date sheet</h2>
          </CardTitle>
          <CardDescription className="mt-0.5">
            The day, total marks and pass marks of each paper. {formatDateRange(exam.startDate, exam.endDate)}. Pass marks start at the school&apos;s pass percentage.
          </CardDescription>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:w-[28rem]">
          <SelectField id="sheet-exam" label="Exam" options={exams.map((e) => ({ value: e.id, label: e.title }))} value={exam.id} onValueChange={onExamChange} />
          <SelectField id="sheet-class" label="Class" options={classes.map((c) => ({ value: c.id, label: c.name }))} value={classId} onValueChange={setClassId} />
        </div>
      </div>
      {exam.publishedAt ? <p className="text-sm text-muted-foreground">Results for this exam are published, so the date sheet is locked.</p> : null}
      {classId ? <ClassSheet key={classId} exam={exam} classId={classId} editable={editable} /> : null}
    </Card>
  );
}

function ClassSheet({ exam, classId, editable }: { exam: Exam; classId: string; editable: boolean }) {
  const subjects = useClassSubjects(classId);
  const { data: papers = [] } = useGetExamPapersQuery();
  const [save, { isLoading }] = useSaveDateSheetMutation();
  const [notice, setNotice] = useState<{ success?: string; error?: string }>({});
  const passPercent = useGetSchoolRulesQuery().data?.grading.passPercent ?? 50;
  const passFor = (total: string) => String(Math.ceil(((Number(total) || 0) * passPercent) / 100));
  const blankRow = (on: boolean): Row => ({ on, date: "", totalMarks: "100", passMarks: passFor("100") });
  const existing = papers.filter((p) => p.examId === exam.id && p.classId === classId);
  const [rows, setRows] = useState<Record<string, Row>>(() =>
    Object.fromEntries(
      subjects.map((s) => {
        const p = existing.find((x) => x.subjectId === s.id);
        return [s.id, p ? { on: true, date: p.date, totalMarks: String(p.totalMarks), passMarks: String(p.passMarks) } : blankRow(existing.length === 0)];
      })
    )
  );
  const setRow = (id: string, changes: Partial<Row>) => setRows((r) => ({ ...r, [id]: { ...r[id], ...changes } }));
  const rowOf = (id: string): Row => rows[id] ?? blankRow(false);

  const chosen = subjects.filter((s) => rowOf(s.id).on);
  const byDate = new Map<string, string[]>();
  for (const s of chosen) if (rowOf(s.id).date) byDate.set(rowOf(s.id).date, [...(byDate.get(rowOf(s.id).date) ?? []), s.name]);
  const clashes = [...byDate.entries()].filter(([, names]) => names.length > 1);
  const total = chosen.reduce((n, s) => n + (Number(rowOf(s.id).totalMarks) || 0), 0);

  const submit = async () => {
    const missing = chosen.find((s) => !rowOf(s.id).date);
    if (missing) return setNotice({ error: `Choose a date for ${missing.name}.` });
    const result = await save({
      examId: exam.id,
      classId,
      papers: chosen.map((s) => ({ subjectId: s.id, date: rowOf(s.id).date, totalMarks: Number(rowOf(s.id).totalMarks), passMarks: Number(rowOf(s.id).passMarks) })),
    });
    setNotice("error" in result ? { error: errorMessage(result.error) } : { success: `Date sheet saved: ${result.data.length} papers, ${total} marks in all.` });
  };

  return (
    <div className="space-y-4">
      {clashes.length ? (
        <ul className="space-y-1.5 rounded-lg border border-warning/30 bg-warning-tint p-3 text-sm text-warning">
          {clashes.map(([date, names]) => (
            <li key={date} className="flex items-start gap-2">
              <AlertTriangle aria-hidden className="mt-0.5 size-4 shrink-0" />
              {names.join(" and ")} are both on {shortDate(date)}. Check that&apos;s intended.
            </li>
          ))}
        </ul>
      ) : null}
      <div data-allow-scroll className="-mx-5 sm:-mx-6">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-5 sm:pl-6">Subject</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="pr-5 text-right sm:pr-6">Pass</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subjects.map((s) => {
              const r = rowOf(s.id);
              return (
                <TableRow key={s.id}>
                  <TableCell className="pl-5 sm:pl-6">
                    <label className="flex cursor-pointer items-center gap-2.5">
                      <Checkbox checked={r.on} disabled={!editable} onCheckedChange={(c) => setRow(s.id, { on: Boolean(c) })} aria-label={`${s.name} is on the date sheet`} />
                      <span className={r.on ? "font-medium" : "text-muted-foreground"}>
                        {s.name}
                        {s.elective ? <span className="block text-xs font-normal text-muted-foreground">Elective</span> : null}
                      </span>
                    </label>
                  </TableCell>
                  <TableCell>
                    <Input
                      type="date"
                      aria-label={`${s.name} paper date`}
                      min={exam.startDate}
                      max={exam.endDate}
                      value={r.date}
                      disabled={!editable || !r.on}
                      onChange={(e) => setRow(s.id, { date: e.target.value })}
                      className="h-9 w-36 bg-card sm:w-40"
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <Input
                      inputMode="numeric"
                      aria-label={`${s.name} total marks`}
                      value={r.totalMarks}
                      disabled={!editable || !r.on}
                      onChange={(e) => {
                        const totalMarks = e.target.value.replace(/\D/g, "");
                        // Keep the pass mark at the school's pass percentage unless it was changed by hand.
                        setRow(s.id, r.passMarks === passFor(r.totalMarks) ? { totalMarks, passMarks: passFor(totalMarks) } : { totalMarks });
                      }}
                      className="ml-auto h-9 w-16 bg-card text-right tabular-nums"
                    />
                  </TableCell>
                  <TableCell className="pr-5 text-right sm:pr-6">
                    <Input
                      inputMode="numeric"
                      aria-label={`${s.name} pass marks`}
                      value={r.passMarks}
                      disabled={!editable || !r.on}
                      onChange={(e) => setRow(s.id, { passMarks: e.target.value.replace(/\D/g, "") })}
                      className="ml-auto h-9 w-16 bg-card text-right tabular-nums"
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <FormStatus
          success={notice.success}
          error={notice.error}
          idle={
            <span className="flex items-center gap-2">
              <CheckCircle2 aria-hidden className="size-4 text-muted-foreground" />
              {chosen.length} papers, {total} marks in all.
            </span>
          }
        />
        {editable ? (
          <Button onClick={submit} disabled={isLoading}>
            <Save data-icon="inline-start" />
            Save date sheet
          </Button>
        ) : null}
      </div>
    </div>
  );
}
