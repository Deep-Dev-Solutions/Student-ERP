"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
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
  Calendar,
  GraduationCap,
  Plus,
  CheckCircle2,
  Clock,
  BookOpen,
  Layers,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { ExamTerm } from "../types";

const initialExams: ExamTerm[] = [
  {
    id: "ex-1",
    title: "Mid-Term Examination 2026",
    termType: "midterm",
    academicYear: "2026-2027",
    startDate: "2026-10-20",
    endDate: "2026-10-31",
    totalSubjects: 8,
    classesIncluded: ["Class 8", "Class 9", "Class 10"],
    status: "ongoing",
  },
  {
    id: "ex-2",
    title: "Monthly Assessment - September",
    termType: "monthly",
    academicYear: "2026-2027",
    startDate: "2026-09-25",
    endDate: "2026-09-30",
    totalSubjects: 6,
    classesIncluded: ["Class 9", "Class 10"],
    status: "completed",
  },
  {
    id: "ex-3",
    title: "Annual Board Preparation Exam",
    termType: "final",
    academicYear: "2026-2027",
    startDate: "2026-12-10",
    endDate: "2026-12-24",
    totalSubjects: 8,
    classesIncluded: ["Class 10"],
    status: "upcoming",
  },
];

export function ExamSetup() {
  const [exams, setExams] = useState<ExamTerm[]>(initialExams);
  const [title, setTitle] = useState("");
  const [termType, setTermType] = useState<"midterm" | "final" | "monthly" | "quiz">("midterm");
  const [academicYear, setAcademicYear] = useState("2026-2027");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedClass, setSelectedClass] = useState("all");
  const [successNotice, setSuccessNotice] = useState(false);

  const handleCreateExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !startDate || !endDate) return;

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
          ? ["Class 8", "Class 9", "Class 10"]
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

  return (
    <div className="space-y-6">
      {/* 1. Exam Configuration Card */}
      <Card className="rounded-xl border border-slate-200/80 bg-white shadow-xs">
        <CardHeader className="p-6 border-b border-slate-100 bg-white">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-bold tracking-tight text-slate-900">
                Schedule & Create New Examination
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 mt-1">
                Configure examination sessions, scheduling windows, and cohort inclusions.
              </CardDescription>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 ring-1 ring-blue-200/70">
              <Calendar className="h-4 w-4" />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <form onSubmit={handleCreateExam} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {/* Exam Title */}
              <div className="lg:col-span-2">
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  Examination Title
                </label>
                <Input
                  placeholder="e.g. Mid-Term Examination 2026"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="bg-slate-50/70 border-slate-200 focus-visible:ring-blue-600 text-xs h-10 rounded-lg"
                />
              </div>

              {/* Term Category */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  Assessment Category
                </label>
                <Select
                  value={termType}
                  onValueChange={(val: any) => {
                    if (val) setTermType(val);
                  }}
                >
                  <SelectTrigger className="w-full bg-slate-50/70 border-slate-200 text-xs h-10 rounded-lg">
                    <SelectValue placeholder="Select type..." />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 shadow-md">
                    <SelectItem value="midterm">Mid-Term Examination</SelectItem>
                    <SelectItem value="final">Final Term / Annual</SelectItem>
                    <SelectItem value="monthly">Monthly Test Series</SelectItem>
                    <SelectItem value="quiz">Spot Quiz / Assessment</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Start Date */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  Start Date
                </label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-slate-50/70 border-slate-200 focus-visible:ring-blue-600 text-xs h-10 rounded-lg"
                />
              </div>

              {/* End Date */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  End Date
                </label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-slate-50/70 border-slate-200 focus-visible:ring-blue-600 text-xs h-10 rounded-lg"
                />
              </div>

              {/* Target Classes */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  Target Cohort
                </label>
                <Select
                  value={selectedClass}
                  onValueChange={(val) => {
                    if (val) setSelectedClass(val);
                  }}
                >
                  <SelectTrigger className="w-full bg-slate-50/70 border-slate-200 text-xs h-10 rounded-lg">
                    <SelectValue placeholder="Select classes..." />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 shadow-md">
                    <SelectItem value="all">All Classes (Grade 8-10)</SelectItem>
                    <SelectItem value="Class 8">Class 8 Only</SelectItem>
                    <SelectItem value="Class 9">Class 9 Only</SelectItem>
                    <SelectItem value="Class 10">Class 10 Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
              {successNotice ? (
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-200/80">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>Exam session configured & datesheet locked into timetable!</span>
                </div>
              ) : (
                <div className="text-xs text-slate-500">
                  Academic Session:{" "}
                  <span className="font-semibold text-slate-700">
                    {academicYear}
                  </span>
                </div>
              )}

              <Button
                type="submit"
                disabled={!title || !startDate || !endDate}
                className="h-10 gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition-colors rounded-lg ml-auto"
              >
                <Plus className="h-4 w-4" />
                Schedule Examination
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* 2. Registered Exams Table */}
      <Card className="rounded-xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
        <CardHeader className="p-6 border-b border-slate-100 bg-white">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold tracking-tight text-slate-900">
                Active & Scheduled Exam Terms
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 mt-1">
                Current evaluation calendars and examination schedules.
              </CardDescription>
            </div>
            <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 border border-slate-200">
              {exams.length} Terms Registered
            </span>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-slate-200/80 bg-slate-50/90 hover:bg-slate-50/90">
                  <TableHead className="py-3.5 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Exam Term Title
                  </TableHead>
                  <TableHead className="py-3.5 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Category
                  </TableHead>
                  <TableHead className="py-3.5 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Date Window
                  </TableHead>
                  <TableHead className="py-3.5 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Enrolled Classes
                  </TableHead>
                  <TableHead className="py-3.5 px-4 text-center text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Status
                  </TableHead>
                  <TableHead className="py-3.5 px-4 text-right text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Academic Year
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {exams.map((ex) => (
                  <TableRow
                    key={ex.id}
                    className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors"
                  >
                    {/* Title */}
                    <TableCell className="py-4 px-4 font-semibold text-slate-900 text-sm">
                      {ex.title}
                    </TableCell>

                    {/* Category */}
                    <TableCell className="py-4 px-4">
                      <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 border border-slate-200/80 capitalize">
                        {ex.termType}
                      </span>
                    </TableCell>

                    {/* Date Window */}
                    <TableCell className="py-4 px-4 text-xs font-medium text-slate-600">
                      <div className="flex items-center gap-1.5 font-mono">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        <span>{ex.startDate}</span>
                        <span className="text-slate-400">→</span>
                        <span>{ex.endDate}</span>
                      </div>
                    </TableCell>

                    {/* Classes */}
                    <TableCell className="py-4 px-4">
                      <div className="flex flex-wrap gap-1">
                        {ex.classesIncluded.map((c) => (
                          <span
                            key={c}
                            className="inline-flex items-center rounded bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700 border border-blue-200/60"
                          >
                            {c}
                          </span>
                        ))}
                      </div>
                    </TableCell>

                    {/* Status */}
                    <TableCell className="py-4 px-4 text-center">
                      {ex.status === "ongoing" && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Ongoing
                        </span>
                      )}
                      {ex.status === "upcoming" && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 ring-1 ring-inset ring-blue-600/20">
                          <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                          Upcoming
                        </span>
                      )}
                      {ex.status === "completed" && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-400/20">
                          <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                          Archived
                        </span>
                      )}
                    </TableCell>

                    {/* Year */}
                    <TableCell className="py-4 px-4 text-right text-xs font-mono text-slate-500">
                      {ex.academicYear}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

