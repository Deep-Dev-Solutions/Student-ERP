"use client";

import { useState } from "react";
import Link from "next/link";
import { Award, Download, Printer, Send, Undo2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/EmptyState";
import { FormStatus } from "@/components/shared/FormFields";
import { StatCard } from "@/components/shared/StatCard";
import { useGrader, useReadOnly } from "@/hooks/use-academics";
import { useCan } from "@/hooks/use-session";
import { downloadFile, toCsv } from "@/lib/csv";
import { computeResults, ordinal, sectionRoster, type StudentResult } from "@/lib/results";
import { errorMessage, useGetClassSubjectsQuery, useGetExamMarksQuery, useGetStudentsQuery, useGetSubjectsQuery, useSetResultsPublishedMutation } from "@/store/api";
import { useExamPicker } from "./MarksEntryGrid";

const ALL = "all";
const resultLabels = { pass: "Pass", fail: "Fail", incomplete: "Incomplete" } as const;
const resultVariants = { pass: "success", fail: "danger", incomplete: "neutral" } as const;

/** Results for a class or section, ranked by percentage. */
export function useResults(examId: string | undefined, classId: string | undefined, sectionId: string, papers: ReturnType<typeof useExamPicker>["papers"], sections: { id: string; name: string }[]) {
  const { data: students = [] } = useGetStudentsQuery();
  const { data: marks = [] } = useGetExamMarksQuery();
  const { data: classSubjects = [] } = useGetClassSubjectsQuery();
  if (!examId || !classId) return [];
  const ids = sectionId === ALL ? sections.map((s) => s.id) : [sectionId];
  const roster = ids.flatMap((id) => sectionRoster(students, id));
  return computeResults(roster, papers, marks, classSubjects);
}

export function ResultsPanel() {
  const picker = useExamPicker();
  const readOnly = useReadOnly();
  const canPublish = useCan("acad_create_exam") && !readOnly;
  const grade = useGrader();
  const { data: subjects = [] } = useGetSubjectsQuery();
  const [setPublished, { isLoading }] = useSetResultsPublishedMutation();
  const [notice, setNotice] = useState<{ success?: string; error?: string }>({});
  const [sectionId, setSectionId] = useState<string>(ALL);
  const section = picker.sections.find((s) => s.id === sectionId);
  const effectiveSection = section ? section.id : ALL;
  const results = useResults(picker.exam?.id, picker.cls?.id, effectiveSection, picker.papers, picker.sections);
  const exam = picker.exam;

  if (!exam || !picker.cls) {
    return (
      <Card className="py-0">
        <EmptyState icon={Award} title="No results yet" description="Results appear once an exam has a date sheet and marks." />
      </Card>
    );
  }

  const sorted = [...results].sort((a, b) => (a.position ?? 1e9) - (b.position ?? 1e9) || a.student.name.localeCompare(b.student.name));
  const complete = results.filter((r) => r.result !== "incomplete");
  const passed = results.filter((r) => r.result === "pass");
  const average = complete.length ? complete.reduce((n, r) => n + r.percent!, 0) / complete.length : null;
  const top = sorted.find((r) => r.position === 1);
  const sectionName = (r: StudentResult) => picker.sections.find((s) => s.id === r.student.sectionId)?.name ?? "";
  const scope = section ? `${picker.cls.name}, section ${section.name}` : picker.cls.name;
  const subjectCode = (id: string) => subjects.find((s) => s.id === id)?.code ?? "";
  const subjectName = (id: string) => subjects.find((s) => s.id === id)?.name ?? "";
  const printHref = `/print/report-cards?exam=${exam.id}&class=${picker.cls.id}${section ? `&section=${section.id}` : ""}`;

  const exportCsv = () =>
    downloadFile(
      `result-sheet-${scope.toLowerCase().replace(/\W+/g, "-")}.csv`,
      toCsv([
        ["Position", "Roll no.", "Student ID", "Name", "Section", ...picker.papers.map((p) => `${subjectName(p.subjectId)} (${p.totalMarks})`), "Obtained", "Total", "Percent", "Grade", "Result"],
        ...sorted.map((r) => [
          r.position ?? "",
          r.rollNo,
          r.student.id,
          r.student.name,
          sectionName(r),
          ...picker.papers.map((p) => {
            const s = r.subjects.find((x) => x.paper.subjectId === p.subjectId);
            return !s ? "" : s.mark?.absent ? "Absent" : (s.obtained ?? "");
          }),
          r.obtained,
          r.total,
          r.percent ?? "",
          r.percent !== null ? grade(r.percent).label : "",
          resultLabels[r.result],
        ]),
      ])
    );

  const publish = async (published: boolean) => {
    const result = await setPublished({ examId: exam.id, published });
    setNotice(
      "error" in result
        ? { error: errorMessage(result.error) }
        : { success: published ? `Results for ${exam.title} are published. Marks are now locked.` : `Results for ${exam.title} are unpublished. Marks can be corrected again.` }
    );
  };

  const filters = [
    { id: "results-exam", label: "Exam", items: picker.exams.map((e) => ({ value: e.id, label: e.title })), value: exam.id, set: (v: string) => { picker.setExamId(v); setSectionId(ALL); } },
    { id: "results-class", label: "Class", items: picker.classes.map((c) => ({ value: c.id, label: c.name })), value: picker.cls.id, set: (v: string) => { picker.setClassId(v); setSectionId(ALL); } },
    { id: "results-section", label: "Section", items: [{ value: ALL, label: "All sections" }, ...picker.sections.map((s) => ({ value: s.id, label: `Section ${s.name}` }))], value: effectiveSection, set: setSectionId },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Students" value={results.length} footer={complete.length === results.length ? "All papers marked" : `${results.length - complete.length} still have unmarked papers`} />
        <StatCard label="Passed" value={`${passed.length} of ${complete.length}`} footer={complete.length ? `${Math.round((passed.length / complete.length) * 100)}% pass rate` : "No complete results yet"} />
        <StatCard label="Average" value={average !== null ? `${average.toFixed(1)}%` : "—"} footer={average !== null ? `Grade ${grade(average).label}` : "Waiting for marks"} />
        <StatCard label="Top of the list" value={top ? `${top.percent}%` : "—"} footer={top ? top.student.name : "Waiting for marks"} />
      </div>

      <Card className="gap-0 py-0">
        <div className="space-y-4 border-b border-border p-5 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="text-base font-semibold">Result sheet, {scope}</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {exam.publishedAt ? "Published; marks are locked." : "Not published yet."} A student passes by reaching the pass marks in every paper; absence counts as a fail.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" onClick={exportCsv} disabled={!results.length}>
                <Download data-icon="inline-start" />
                Export result sheet
              </Button>
              <ButtonLink href={printHref} variant="outline" target="_blank">
                <Printer data-icon="inline-start" />
                Print report cards
              </ButtonLink>
              {canPublish ? (
                exam.publishedAt ? (
                  <Button variant="outline" disabled={isLoading} onClick={() => publish(false)}>
                    <Undo2 data-icon="inline-start" />
                    Unpublish
                  </Button>
                ) : (
                  <Button disabled={isLoading || complete.length < results.length || !results.length} onClick={() => publish(true)}>
                    <Send data-icon="inline-start" />
                    Publish results
                  </Button>
                )
              ) : null}
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
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
          <FormStatus
            success={notice.success}
            error={notice.error}
            idle={!exam.publishedAt && canPublish && complete.length < results.length ? "Publishing opens once every paper is marked (or the student is marked absent)." : null}
          />
        </div>

        {results.length === 0 ? (
          <EmptyState icon={Award} title="No students here" description="This class or section has no active students." />
        ) : (
          <div data-allow-scroll>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-5">Position</TableHead>
                  <TableHead>Student</TableHead>
                  {picker.papers.map((p) => (
                    <TableHead key={p.id} className="text-right">
                      <abbr title={`${subjectName(p.subjectId)}, out of ${p.totalMarks}`} className="no-underline">
                        {subjectCode(p.subjectId)}
                      </abbr>
                    </TableHead>
                  ))}
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Percent</TableHead>
                  <TableHead className="text-center">Grade</TableHead>
                  <TableHead>Result</TableHead>
                  <TableHead className="pr-5 text-right">
                    <span className="sr-only">Report card</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((r) => {
                  const g = r.percent !== null ? grade(r.percent) : null;
                  return (
                    <TableRow key={r.student.id}>
                      <TableCell className="pl-5 font-medium tabular-nums">{r.position ? ordinal(r.position) : "—"}</TableCell>
                      <TableCell className="min-w-40">
                        <Link href={`/students/${r.student.id}?tab=results`} className="rounded font-medium outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring/40">
                          {r.student.name}
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          Roll {r.rollNo}
                          {section ? "" : `, section ${sectionName(r)}`}
                        </p>
                      </TableCell>
                      {picker.papers.map((p) => {
                        const s = r.subjects.find((x) => x.paper.subjectId === p.subjectId);
                        return (
                          <TableCell key={p.id} className={`text-right tabular-nums ${s?.mark && !s.passed ? "font-medium text-danger" : ""}`}>
                            {!s ? <span className="text-muted-foreground">n/a</span> : !s.mark ? "—" : s.mark.absent ? "Abs" : s.obtained}
                          </TableCell>
                        );
                      })}
                      <TableCell className="text-right tabular-nums">
                        {r.obtained} / {r.total}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{r.percent !== null ? `${r.percent}%` : "—"}</TableCell>
                      <TableCell className="text-center">{g ? <Badge variant={r.result === "fail" ? "danger" : g.variant}>{g.label}</Badge> : "—"}</TableCell>
                      <TableCell>
                        <Badge variant={resultVariants[r.result]}>{resultLabels[r.result]}</Badge>
                      </TableCell>
                      <TableCell className="pr-5 text-right">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Print report card for ${r.student.name}`}
                          onClick={() => window.open(`/print/report-cards?exam=${exam.id}&student=${r.student.id}`, "_blank", "noopener")}
                        >
                          <Printer />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
}
