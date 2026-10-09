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
  Search,
  Save,
  CheckCircle2,
  Clock,
  Sparkles,
  Download,
  AlertCircle,
  FileSpreadsheet,
} from "lucide-react";
import { StudentMarksRecord } from "../types";

const mockStudents: StudentMarksRecord[] = [
  {
    id: "std-1",
    studentId: "STD-1042",
    rollNo: "10-A-01",
    studentName: "Ahmed Khan",
    avatar: "AK",
    className: "Class 10",
    section: "Section A",
    obtainedMarks: 85,
    maxMarks: 100,
    remarks: "Excellent problem solving",
  },
  {
    id: "std-2",
    studentId: "STD-1043",
    rollNo: "10-A-02",
    studentName: "Fatima Ali",
    avatar: "FA",
    className: "Class 10",
    section: "Section A",
    obtainedMarks: 92,
    maxMarks: 100,
    remarks: "Outstanding presentation",
  },
  {
    id: "std-3",
    studentId: "STD-1044",
    rollNo: "10-A-03",
    studentName: "Bilal Sheikh",
    avatar: "BS",
    className: "Class 10",
    section: "Section A",
    obtainedMarks: 58,
    maxMarks: 100,
    remarks: "Needs improvement in derivations",
  },
  {
    id: "std-4",
    studentId: "STD-1045",
    rollNo: "10-A-04",
    studentName: "Zubair Shah",
    avatar: "ZS",
    className: "Class 10",
    section: "Section A",
    obtainedMarks: 74,
    maxMarks: 100,
    remarks: "Good conceptual grasp",
  },
  {
    id: "std-5",
    studentId: "STD-1046",
    rollNo: "10-A-05",
    studentName: "Sara Mansoor",
    avatar: "SM",
    className: "Class 10",
    section: "Section A",
    obtainedMarks: 88,
    maxMarks: 100,
    remarks: "Very thorough answer sheet",
  },
  {
    id: "std-6",
    studentId: "STD-1047",
    rollNo: "10-A-06",
    studentName: "Hamza Abbasi",
    avatar: "HA",
    className: "Class 10",
    section: "Section A",
    obtainedMarks: 46,
    maxMarks: 100,
    remarks: "Remedial coaching recommended",
  },
];

export function MarksEntryGrid() {
  const [selectedExam, setSelectedExam] = useState("midterm-2026");
  const [selectedClass, setSelectedClass] = useState("class-10");
  const [selectedSection, setSelectedSection] = useState("sec-a");
  const [selectedSubject, setSelectedSubject] = useState("physics");
  const [searchQuery, setSearchQuery] = useState("");
  const [marksData, setMarksData] = useState<StudentMarksRecord[]>(mockStudents);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleMarksChange = (studentId: string, value: string) => {
    setMarksData((prev) =>
      prev.map((student) => {
        if (student.studentId === studentId) {
          if (value === "") {
            return { ...student, obtainedMarks: "" };
          }
          const num = Number(value);
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

  const filteredStudents = marksData.filter(
    (student) =>
      student.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.studentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.rollNo.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalEvaluated = marksData.filter((s) => s.obtainedMarks !== "").length;
  const classAverage =
    marksData.reduce((acc, curr) => acc + (Number(curr.obtainedMarks) || 0), 0) /
    (totalEvaluated || 1);

  return (
    <div className="space-y-6">
      {/* 1. Filter Bar & Controller Card */}
      <Card className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
          <div>
            <CardTitle className="text-base font-bold tracking-tight text-slate-900">
              Gradebook Evaluation & Marks Entry
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 mt-0.5">
              Rapid tabular grade entry for examination results and report card consolidation.
            </CardDescription>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-2 border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 shadow-xs"
            >
              <Download className="h-3.5 w-3.5 text-slate-500" />
              Download Gazette
            </Button>

            <Button
              size="sm"
              onClick={handleSaveMarks}
              disabled={isSaving}
              className="h-9 gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition-colors"
            >
              {isSaving ? (
                <>
                  <Clock className="h-3.5 w-3.5 animate-spin" />
                  Saving Marks...
                </>
              ) : saveSuccess ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />
                  Marks Saved!
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5" />
                  Save Marks
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {/* Exam Filter */}
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block mb-1.5">
              Select Exam
            </label>
            <Select
              value={selectedExam}
              onValueChange={(val) => {
                if (val) setSelectedExam(val);
              }}
            >
              <SelectTrigger className="w-full bg-slate-50/70 border-slate-200 text-xs h-10 rounded-lg">
                <SelectValue placeholder="Choose exam..." />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200 shadow-md">
                <SelectItem value="midterm-2026">Mid-Term Exam 2026</SelectItem>
                <SelectItem value="monthly-sep">Monthly Assessment - Sept</SelectItem>
                <SelectItem value="final-2026">Annual Board Exam</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Class Filter */}
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block mb-1.5">
              Class & Grade
            </label>
            <Select
              value={selectedClass}
              onValueChange={(val) => {
                if (val) setSelectedClass(val);
              }}
            >
              <SelectTrigger className="w-full bg-slate-50/70 border-slate-200 text-xs h-10 rounded-lg">
                <SelectValue placeholder="Choose class..." />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200 shadow-md">
                <SelectItem value="class-8">Class 8</SelectItem>
                <SelectItem value="class-9">Class 9</SelectItem>
                <SelectItem value="class-10">Class 10</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Section Filter */}
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block mb-1.5">
              Section
            </label>
            <Select
              value={selectedSection}
              onValueChange={(val) => {
                if (val) setSelectedSection(val);
              }}
            >
              <SelectTrigger className="w-full bg-slate-50/70 border-slate-200 text-xs h-10 rounded-lg">
                <SelectValue placeholder="Choose section..." />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200 shadow-md">
                <SelectItem value="sec-a">Section A</SelectItem>
                <SelectItem value="sec-b">Section B</SelectItem>
                <SelectItem value="sec-c">Section C</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Subject Filter */}
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block mb-1.5">
              Subject
            </label>
            <Select
              value={selectedSubject}
              onValueChange={(val) => {
                if (val) setSelectedSubject(val);
              }}
            >
              <SelectTrigger className="w-full bg-slate-50/70 border-slate-200 text-xs h-10 rounded-lg">
                <SelectValue placeholder="Choose subject..." />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200 shadow-md">
                <SelectItem value="physics">Physics (Max: 100)</SelectItem>
                <SelectItem value="mathematics">Mathematics (Max: 100)</SelectItem>
                <SelectItem value="chemistry">Chemistry (Max: 100)</SelectItem>
                <SelectItem value="english">English (Max: 100)</SelectItem>
                <SelectItem value="biology">Biology (Max: 100)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Live Metrics Strip */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200/60 bg-slate-50/60 px-4 py-2.5 text-xs text-slate-600">
          <div className="flex items-center gap-4">
            <span>
              Evaluated:{" "}
              <strong className="text-slate-900 font-semibold">
                {totalEvaluated}/{marksData.length} students
              </strong>
            </span>
            <span className="text-slate-300">•</span>
            <span>
              Subject Average:{" "}
              <strong className="text-blue-700 font-semibold font-mono">
                {classAverage.toFixed(1)} / 100
              </strong>
            </span>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input
              placeholder="Search student or roll no..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8.5 bg-white border-slate-200 focus-visible:ring-blue-600 text-xs h-8 rounded-md"
            />
          </div>
        </div>
      </Card>

      {/* 2. Rapid Entry Data Table */}
      <Card className="rounded-xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-slate-200/80 bg-slate-50/90 hover:bg-slate-50/90">
                  <TableHead className="py-3.5 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Roll No
                  </TableHead>
                  <TableHead className="py-3.5 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Student Details
                  </TableHead>
                  <TableHead className="py-3.5 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Class & Section
                  </TableHead>
                  <TableHead className="py-3.5 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 w-36">
                    Obtained Marks
                  </TableHead>
                  <TableHead className="py-3.5 px-4 text-center text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Percentage
                  </TableHead>
                  <TableHead className="py-3.5 px-4 text-center text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Grade
                  </TableHead>
                  <TableHead className="py-3.5 px-4 text-right text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Teacher Feedback
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredStudents.map((student) => {
                  const marks =
                    student.obtainedMarks === ""
                      ? null
                      : Number(student.obtainedMarks);
                  const percentage =
                    marks !== null
                      ? ((marks / student.maxMarks) * 100).toFixed(0)
                      : null;

                  let grade = "—";
                  let gradeColor = "text-slate-400 bg-slate-100";
                  if (marks !== null) {
                    const num = Number(percentage);
                    if (num >= 80) {
                      grade = "A+";
                      gradeColor = "text-emerald-700 bg-emerald-50 border-emerald-200";
                    } else if (num >= 70) {
                      grade = "A";
                      gradeColor = "text-blue-700 bg-blue-50 border-blue-200";
                    } else if (num >= 60) {
                      grade = "B";
                      gradeColor = "text-indigo-700 bg-indigo-50 border-indigo-200";
                    } else if (num >= 50) {
                      grade = "C";
                      gradeColor = "text-amber-700 bg-amber-50 border-amber-200";
                    } else {
                      grade = "F";
                      gradeColor = "text-rose-700 bg-rose-50 border-rose-200";
                    }
                  }

                  return (
                    <TableRow
                      key={student.id}
                      className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors"
                    >
                      {/* Roll No */}
                      <TableCell className="py-3.5 px-4 font-mono text-xs font-semibold text-slate-600">
                        {student.rollNo}
                      </TableCell>

                      {/* Student Details */}
                      <TableCell className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 font-semibold text-xs text-slate-700 border border-slate-200">
                            {student.avatar}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-slate-900 leading-tight">
                              {student.studentName}
                            </div>
                            <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                              {student.studentId}
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      {/* Class & Section */}
                      <TableCell className="py-3.5 px-4 text-xs text-slate-600">
                        {student.className} • {student.section}
                      </TableCell>

                      {/* Narrow Shadcn Input for Rapid Entry */}
                      <TableCell className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min={0}
                            max={student.maxMarks}
                            value={student.obtainedMarks}
                            onChange={(e) =>
                              handleMarksChange(student.studentId, e.target.value)
                            }
                            className="h-9 w-20 text-center font-mono font-bold text-sm bg-slate-50/80 border-slate-200 focus:bg-white focus-visible:ring-blue-600 rounded-lg"
                          />
                          <span className="text-xs font-mono text-slate-400">
                            / {student.maxMarks}
                          </span>
                        </div>
                      </TableCell>

                      {/* Percentage */}
                      <TableCell className="py-3.5 px-4 text-center font-mono text-xs font-semibold text-slate-700">
                        {percentage !== null ? `${percentage}%` : "—"}
                      </TableCell>

                      {/* Grade Badge */}
                      <TableCell className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center justify-center h-6 w-9 rounded-md text-xs font-bold border ${gradeColor}`}
                        >
                          {grade}
                        </span>
                      </TableCell>

                      {/* Remarks */}
                      <TableCell className="py-3.5 px-4 text-right text-xs text-slate-500">
                        {student.remarks || "—"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Table Footer */}
          <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-6 py-3.5 text-xs text-slate-500">
            <div>
              Displaying{" "}
              <span className="font-semibold text-slate-700">
                {filteredStudents.length}
              </span>{" "}
              students in grade registry
            </div>
            <div className="flex items-center gap-3">
              <Button
                size="sm"
                onClick={handleSaveMarks}
                disabled={isSaving}
                className="h-8 gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs"
              >
                <Save className="h-3 w-3" />
                Commit Gradebook
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

