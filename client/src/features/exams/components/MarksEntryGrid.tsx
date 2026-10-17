"use client";

import { useState } from "react";
import { Clock, Download, Lock, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/EmptyState";
import { useBranchClasses, useClassSections, useGrader, useReadOnly } from "@/hooks/use-academics";
import { useCan } from "@/hooks/use-session";
import { downloadFile, toCsv } from "@/lib/csv";
import { sectionRoster, sitsPaper } from "@/lib/results";
import { useGetClassSubjectsQuery, useGetExamPapersQuery, useGetStudentsQuery, useGetSubjectsQuery } from "@/store/api";
import type { Exam, ExamPaper } from "../types";
import { useMarksEditor } from "../useMarksEditor";
import { useBranchExams } from "./ExamSetup";
import { MarksSaveStatus } from "./MarksSaveStatus";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const shortDate = (iso: string) => `${Number(iso.slice(8, 10))} ${MONTHS[Number(iso.slice(5, 7)) - 1]}`;

/** Exam, class, section and subject pickers that only offer what's on a date sheet. */
export function useExamPicker(initial: { examId?: string } = {}) {
  const exams = useBranchExams();
  const { data: papers = [] } = useGetExamPapersQuery();
  const classes = useBranchClasses();
  const withSheet = exams.filter((e) => papers.some((p) => p.examId === e.id));
  const [examId, setExamId] = useState(initial.examId ?? "");
  const exam = withSheet.find((e) => e.id === examId) ?? withSheet.find((e) => !e.publishedAt) ?? withSheet[0];
  const examClasses = classes.filter((c) => exam?.classIds.includes(c.id) && papers.some((p) => p.examId === exam.id && p.classId === c.id));
  const [pickedClass, setPickedClass] = useState("");
  const cls = examClasses.find((c) => c.id === pickedClass) ?? examClasses.at(-1);
  const sections = useClassSections(cls?.id);
  const [pickedSection, setPickedSection] = useState("");
  const section = sections.find((s) => s.id === pickedSection) ?? sections[0];
  return {
    exams: withSheet,
    exam,
    classes: examClasses,
    cls,
    sections,
    section,
    papers: papers.filter((p) => p.examId === exam?.id && p.classId === cls?.id).sort((a, b) => a.date.localeCompare(b.date)),
    setExamId: (id: string) => {
      setExamId(id);
      setPickedClass("");
      setPickedSection("");
    },
    setClassId: (id: string) => {
      setPickedClass(id);
      setPickedSection("");
    },
    setSectionId: setPickedSection,
  };
}

export function MarksEntryGrid() {
  const picker = useExamPicker();
  const { data: subjects = [] } = useGetSubjectsQuery();
  const [pickedSubject, setPickedSubject] = useState("");
  const paper = picker.papers.find((p) => p.subjectId === pickedSubject) ?? picker.papers[0];
  const subjectName = (id: string) => subjects.find((s) => s.id === id)?.name ?? "";

  const filters = [
    { id: "marks-exam", label: "Exam", items: picker.exams.map((e) => ({ value: e.id, label: e.title })), value: picker.exam?.id ?? "", set: picker.setExamId },
    { id: "marks-class", label: "Class", items: picker.classes.map((c) => ({ value: c.id, label: c.name })), value: picker.cls?.id ?? "", set: picker.setClassId },
    { id: "marks-section", label: "Section", items: picker.sections.map((s) => ({ value: s.id, label: `Section ${s.name}` })), value: picker.section?.id ?? "", set: picker.setSectionId },
    {
      id: "marks-subject",
      label: "Subject",
      items: picker.papers.map((p) => ({ value: p.subjectId, label: `${subjectName(p.subjectId)} (out of ${p.totalMarks})` })),
      value: paper?.subjectId ?? "",
      set: setPickedSubject,
    },
  ];

  if (!picker.exam) {
    return (
      <Card className="py-0">
        <EmptyState icon={Clock} title="No exam has a date sheet yet" description="Set the date sheet in Exam setup, then enter marks here." />
      </Card>
    );
  }

  return (
    <MarksSheet
      key={`${picker.exam.id}-${picker.section?.id}-${paper?.id}`}
      exam={picker.exam}
      paper={paper}
      sectionId={picker.section?.id ?? ""}
      subjectName={paper ? subjectName(paper.subjectId) : ""}
      filters={
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {filters.map((f) => (
            <div key={f.id}>
              <label htmlFor={f.id} className="mb-1.5 block text-sm font-medium">
                {f.label}
              </label>
              <Select items={f.items} value={f.value} onValueChange={(val) => val && f.set(val)}>
                <SelectTrigger id={f.id} className="h-9 w-full bg-card">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {f.items.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
      }
    />
  );
}

function MarksSheet({ exam, paper, sectionId, subjectName, filters }: { exam: Exam; paper?: ExamPaper; sectionId: string; subjectName: string; filters: React.ReactNode }) {
  const readOnly = useReadOnly();
  const canEnter = useCan("acad_enter_marks") && !readOnly && !exam.publishedAt;
  const { data: students = [] } = useGetStudentsQuery();
  const { data: classSubjects = [] } = useGetClassSubjectsQuery();
  const gradeFor = useGrader();
  const [searchQuery, setSearchQuery] = useState("");
  const roster = paper ? sectionRoster(students, sectionId).filter(({ student }) => sitsPaper(student, paper, classSubjects)) : [];
  const editor = useMarksEditor(exam, paper, roster.map((r) => r.student.id), canEnter);
  const { total, entryOf, change, persist, marked, average } = editor;

  const q = searchQuery.trim().toLowerCase();
  const filtered = roster.filter(({ student, rollNo }) => !q || student.name.toLowerCase().includes(q) || student.id.toLowerCase().includes(q) || rollNo.includes(q));
  const saveStatus = <MarksSaveStatus state={editor.state} errorCount={editor.errorCount} idle={canEnter ? "Marks save as you go." : null} />;

  const exportCsv = () =>
    downloadFile(
      `marks-${subjectName.toLowerCase().replace(/\W+/g, "-")}-${exam.title.toLowerCase().replace(/\W+/g, "-")}.csv`,
      toCsv([
        ["Roll no.", "Student ID", "Name", `Marks (out of ${total})`, "Absent", "Remark"],
        ...roster.map(({ student, rollNo }) => {
          const e = entryOf(student.id);
          return [rollNo, student.id, student.name, e.absent ? "" : e.value, e.absent ? "Yes" : "", e.remark];
        }),
      ])
    );

  return (
    <div className="space-y-6">
      <Card className="gap-4 px-5 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-base font-semibold">Enter marks</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">Choose the exam, class and subject, then type each student&apos;s marks.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={exportCsv} disabled={!roster.length}>
              <Download data-icon="inline-start" />
              Download marks
            </Button>
          </div>
        </div>

        {filters}

        {paper ? (
          <p className="text-sm text-muted-foreground">
            {subjectName} paper on {shortDate(paper.date)}: out of {paper.totalMarks}, pass at {paper.passMarks}.
          </p>
        ) : null}
        {exam.publishedAt ? (
          <p className="flex items-center gap-2 rounded-lg border border-border bg-muted/60 p-3 text-sm text-muted-foreground">
            <Lock aria-hidden className="size-4 shrink-0" />
            Results for this exam are published, so marks are locked. Unpublish them in Results to correct a mark.
          </p>
        ) : null}

        <div className="flex flex-col gap-3 rounded-lg bg-muted/60 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="text-muted-foreground" aria-live="polite">
            <span className="font-medium text-foreground">
              {marked} of {roster.length}
            </span>{" "}
            marked · average <span className="font-medium text-foreground">{average.toFixed(1)}</span> out of {total}
          </p>
          <div className="relative w-full sm:w-64">
            <Search aria-hidden className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              aria-label="Find a student"
              placeholder="Name or roll number"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 bg-card pl-9"
            />
          </div>
        </div>
      </Card>

      <Card className="gap-0 py-0">
        {roster.length === 0 ? (
          <EmptyState icon={Search} title="No students sit this paper" description="This section has no active students taking this subject." />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Search}
            title="No students match"
            description="Search by name or roll number."
            action={
              <Button variant="outline" onClick={() => setSearchQuery("")}>
                Clear search
              </Button>
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="hidden pl-5 lg:table-cell">Roll no.</TableHead>
                <TableHead className="pl-5 lg:pl-3">Student</TableHead>
                <TableHead>Marks</TableHead>
                <TableHead className="hidden sm:table-cell">Absent</TableHead>
                <TableHead className="hidden text-right lg:table-cell">Percent</TableHead>
                <TableHead className="text-center">Grade</TableHead>
                <TableHead className="hidden pr-5 xl:table-cell">Teacher&apos;s remark</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(({ student, rollNo }) => {
                const e = entryOf(student.id);
                const error = editor.errorOf(student.id);
                const value = !e.absent && e.value !== "" && !error ? Number(e.value) : null;
                const percentage = value !== null ? Math.round((value / total) * 100) : null;
                const grade = gradeFor(percentage);
                const errorId = `marks-error-${student.id}`;
                return (
                  <TableRow key={student.id}>
                    <TableCell className="hidden pl-5 text-muted-foreground lg:table-cell">{rollNo}</TableCell>
                    <TableCell className="min-w-36 pl-5 whitespace-normal lg:pl-3">
                      <p className="font-medium">{student.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {student.id}
                        <span className="lg:hidden"> · roll {rollNo}</span>
                      </p>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Input
                          inputMode="decimal"
                          value={e.absent ? "" : e.value}
                          placeholder={e.absent ? "Absent" : undefined}
                          disabled={!canEnter || e.absent}
                          onChange={(ev) => change(student.id, { value: ev.target.value.replace(/[^\d.]/g, "") })}
                          onBlur={() => persist(student.id)}
                          onKeyDown={(ev) => ev.key === "Enter" && ev.currentTarget.blur()}
                          aria-label={`Marks for ${student.name}, out of ${total}`}
                          aria-invalid={error ? true : undefined}
                          aria-describedby={error ? errorId : undefined}
                          className="h-9 w-20 bg-card text-center text-base font-semibold tabular-nums"
                        />
                        <span className="hidden text-sm text-muted-foreground sm:inline">/ {total}</span>
                      </div>
                      {error ? (
                        <p id={errorId} className="mt-1 text-xs text-danger">
                          {error}
                        </p>
                      ) : null}
                      <label className="mt-1.5 flex cursor-pointer items-center gap-1.5 text-xs text-muted-foreground sm:hidden">
                        <Checkbox checked={e.absent} disabled={!canEnter} onCheckedChange={(c) => change(student.id, { absent: Boolean(c) }, true)} />
                        Absent
                      </label>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Checkbox
                        checked={e.absent}
                        disabled={!canEnter}
                        aria-label={`${student.name} was absent`}
                        onCheckedChange={(c) => change(student.id, { absent: Boolean(c) }, true)}
                      />
                    </TableCell>
                    <TableCell className="hidden text-right lg:table-cell">{percentage !== null ? `${percentage}%` : "—"}</TableCell>
                    <TableCell className="text-center">
                      {e.absent ? (
                        <Badge variant="neutral">Absent</Badge>
                      ) : (
                        <Badge variant={value !== null && paper && value < paper.passMarks ? "danger" : grade.variant} className="min-w-9">
                          {grade.label}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="hidden pr-5 xl:table-cell">
                      <Input
                        aria-label={`Remark for ${student.name}`}
                        placeholder="Optional"
                        value={e.remark}
                        disabled={!canEnter}
                        onChange={(ev) => change(student.id, { remark: ev.target.value })}
                        onBlur={() => persist(student.id)}
                        className="h-9 w-56 bg-card"
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}

        <div className="flex flex-col gap-3 border-t border-border bg-muted/50 px-5 py-3 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="text-muted-foreground">
            Showing {filtered.length} of {roster.length} students
          </p>
          <p role="status" className="text-muted-foreground">
            {saveStatus}
          </p>
        </div>
      </Card>
    </div>
  );
}
