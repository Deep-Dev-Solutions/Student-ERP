"use client";

import { useState } from "react";
import {
  Card,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  CheckCircle2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { statusVariant } from "@/lib/status";
import { useBranchClasses, useCurrentSession, useReadOnly } from "@/hooks/use-academics";
import { useGetExamsQuery } from "@/store/api";
import { ExamTerm } from "../types";

const termTypeOptions = [
  { value: "midterm", label: "Mid-term" },
  { value: "final", label: "Final or annual" },
  { value: "monthly", label: "Monthly test" },
  { value: "quiz", label: "Quiz" },
];
const termTypeLabels = Object.fromEntries(termTypeOptions.map((o) => [o.value, o.label])) as Record<
  ExamTerm["termType"],
  string
>;

const examStatusLabels: Record<ExamTerm["status"], string> = {
  upcoming: "Upcoming",
  ongoing: "In progress",
  completed: "Completed",
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "2026-10-20", "2026-10-31" -> "20–31 Oct 2026" (parsed as plain dates, no time zone). */
function formatDateRange(start: string, end: string) {
  const [sy, sm, sd] = start.split("-").map(Number);
  const [ey, em, ed] = end.split("-").map(Number);
  if (sy === ey && sm === em) return `${sd}–${ed} ${MONTHS[em - 1]} ${ey}`;
  if (sy === ey) return `${sd} ${MONTHS[sm - 1]} – ${ed} ${MONTHS[em - 1]} ${ey}`;
  return `${sd} ${MONTHS[sm - 1]} ${sy} – ${ed} ${MONTHS[em - 1]} ${ey}`;
}

export function ExamSetup() {
  const readOnly = useReadOnly();
  const { data: initialExams = [] } = useGetExamsQuery();
  const [exams, setExams] = useState<ExamTerm[]>(initialExams);
  const [title, setTitle] = useState("");
  const [termType, setTermType] = useState<ExamTerm["termType"]>("midterm");
  const academicYear = useCurrentSession()?.label ?? "";
  const branchClasses = useBranchClasses();
  const classOptions = [
    { value: "all", label: "All classes" },
    ...branchClasses.map((c) => ({ value: c.name, label: c.name })),
  ];
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedClass, setSelectedClass] = useState("all");
  const [successNotice, setSuccessNotice] = useState(false);

  const handleCreateExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !startDate || !endDate || endDate < startDate) return;

    const newExam: ExamTerm = {
      id: `ex-${Date.now()}`,
      title,
      termType,
      academicYear,
      startDate,
      endDate,
      totalSubjects: 8,
      classesIncluded:
        selectedClass === "all"
          ? branchClasses.map((c) => c.name)
          : [selectedClass],
      status: "upcoming",
    };

    setExams([newExam, ...exams]);
    setTitle("");
    setStartDate("");
    setEndDate("");
    setSuccessNotice(true);
    setTimeout(() => setSuccessNotice(false), 3500);
  };

  const dateError = startDate && endDate && endDate < startDate ? "The end date must be on or after the start date." : "";

  return (
    <div className="space-y-6">
      <Card className="gap-5 px-6">
        <div>
          <CardTitle>
            <h2>Schedule an exam</h2>
          </CardTitle>
          <CardDescription className="mt-0.5">
            Set the dates and the classes taking part. Academic year {academicYear}.
          </CardDescription>
        </div>

        <form onSubmit={handleCreateExam} className="space-y-4" noValidate>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <label htmlFor="exam-title" className="mb-1.5 block text-sm font-medium">
                Exam name
              </label>
              <Input
                id="exam-title"
                placeholder="e.g. Mid-term exam 2026"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-9 bg-card"
              />
            </div>

            <div>
              <label htmlFor="exam-type" className="mb-1.5 block text-sm font-medium">
                Type
              </label>
              <Select items={termTypeOptions} value={termType} onValueChange={(val) => val && setTermType(val as ExamTerm["termType"])}>
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

            <div>
              <label htmlFor="exam-start" className="mb-1.5 block text-sm font-medium">
                Start date
              </label>
              <Input id="exam-start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="h-9 bg-card" />
            </div>

            <div>
              <label htmlFor="exam-end" className="mb-1.5 block text-sm font-medium">
                End date
              </label>
              <Input
                id="exam-end"
                type="date"
                value={endDate}
                min={startDate || undefined}
                onChange={(e) => setEndDate(e.target.value)}
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

            <div>
              <label htmlFor="exam-classes" className="mb-1.5 block text-sm font-medium">
                Classes
              </label>
              <Select items={classOptions} value={selectedClass} onValueChange={(val) => val && setSelectedClass(val)}>
                <SelectTrigger id="exam-classes" className="h-9 w-full bg-card">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {classOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground" role="status">
              {successNotice ? (
                <span className="flex items-center gap-2 text-success">
                  <CheckCircle2 aria-hidden className="size-4" />
                  Exam scheduled.
                </span>
              ) : null}
            </p>
            <Button type="submit" disabled={readOnly || !title || !startDate || !endDate || Boolean(dateError)}>
              <Plus data-icon="inline-start" />
              Schedule exam
            </Button>
          </div>
        </form>
      </Card>

      <Card className="gap-0 py-0">
        <div className="border-b border-border p-5 sm:p-6">
          <h2 className="text-base font-semibold">Exams this year</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {exams.length} exams scheduled for {academicYear}.
          </p>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-5">Exam</TableHead>
              <TableHead className="hidden md:table-cell">Dates</TableHead>
              <TableHead className="hidden lg:table-cell">Classes</TableHead>
              <TableHead className="pr-5">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {exams.map((ex) => (
              <TableRow key={ex.id}>
                <TableCell className="min-w-40 pl-5 whitespace-normal">
                  <p className="font-medium">{ex.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {termTypeLabels[ex.termType]}
                    <span className="md:hidden"> · {formatDateRange(ex.startDate, ex.endDate)}</span>
                  </p>
                </TableCell>
                <TableCell className="hidden md:table-cell">{formatDateRange(ex.startDate, ex.endDate)}</TableCell>
                <TableCell className="hidden lg:table-cell">{ex.classesIncluded.join(", ")}</TableCell>
                <TableCell className="pr-5">
                  <Badge variant={statusVariant(ex.status)}>{examStatusLabels[ex.status]}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
