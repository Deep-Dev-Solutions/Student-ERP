"use client";

import { useState } from "react";
import {
  Card,
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
  Download,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/EmptyState";
import { gradeFor } from "@/lib/grades";
import { StudentMarksRecord } from "../types";

const examOptions = [
  { value: "midterm-2026", label: "Mid-term exam 2026" },
  { value: "monthly-sep", label: "Monthly test, September" },
  { value: "final-2026", label: "Annual board exam" },
];
const classOptions = [
  { value: "class-8", label: "Class 8" },
  { value: "class-9", label: "Class 9" },
  { value: "class-10", label: "Class 10" },
];
const sectionOptions = [
  { value: "sec-a", label: "Section A" },
  { value: "sec-b", label: "Section B" },
  { value: "sec-c", label: "Section C" },
];
const subjectOptions = [
  { value: "physics", label: "Physics (out of 100)" },
  { value: "mathematics", label: "Mathematics (out of 100)" },
  { value: "chemistry", label: "Chemistry (out of 100)" },
  { value: "english", label: "English (out of 100)" },
  { value: "biology", label: "Biology (out of 100)" },
];


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

  const filters = [
    { id: "marks-exam", label: "Exam", items: examOptions, value: selectedExam, set: setSelectedExam },
    { id: "marks-class", label: "Class", items: classOptions, value: selectedClass, set: setSelectedClass },
    { id: "marks-section", label: "Section", items: sectionOptions, value: selectedSection, set: setSelectedSection },
    { id: "marks-subject", label: "Subject", items: subjectOptions, value: selectedSubject, set: setSelectedSubject },
  ];

  const saveButton = (
    <Button onClick={handleSaveMarks} disabled={isSaving}>
      {isSaving ? (
        <>
          <Clock data-icon="inline-start" className="motion-safe:animate-spin" />
          Saving…
        </>
      ) : (
        <>
          <Save data-icon="inline-start" />
          Save marks
        </>
      )}
    </Button>
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
            <Button variant="outline">
              <Download data-icon="inline-start" />
              Download result sheet
            </Button>
            {saveButton}
          </div>
        </div>

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

        <div className="flex flex-col gap-3 rounded-lg bg-muted/60 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="text-muted-foreground" aria-live="polite">
            <span className="font-medium text-foreground">
              {totalEvaluated} of {marksData.length}
            </span>{" "}
            marked · average <span className="font-medium text-foreground">{classAverage.toFixed(1)}</span> out of 100
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

        {saveSuccess ? (
          <p role="status" className="flex items-center gap-2 rounded-lg border border-success/30 bg-success-tint p-3 text-sm text-success">
            <CheckCircle2 aria-hidden className="size-4 shrink-0" />
            Marks saved.
          </p>
        ) : null}
      </Card>

      <Card className="gap-0 py-0">
        {filteredStudents.length === 0 ? (
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
                <TableHead className="hidden pl-5 md:table-cell">Roll no.</TableHead>
                <TableHead className="pl-5 md:pl-3">Student</TableHead>
                <TableHead>Marks</TableHead>
                <TableHead className="hidden text-right lg:table-cell">Percent</TableHead>
                <TableHead className="text-center">Grade</TableHead>
                <TableHead className="hidden pr-5 xl:table-cell">Teacher&apos;s remark</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filteredStudents.map((student) => {
                const marks = student.obtainedMarks === "" ? null : Number(student.obtainedMarks);
                const percentage = marks !== null ? Math.round((marks / student.maxMarks) * 100) : null;
                const grade = gradeFor(percentage);
                return (
                  <TableRow key={student.id}>
                    <TableCell className="hidden pl-5 text-muted-foreground md:table-cell">{student.rollNo}</TableCell>
                    <TableCell className="min-w-36 pl-5 whitespace-normal md:pl-3">
                      <p className="font-medium">{student.studentName}</p>
                      <p className="text-xs text-muted-foreground">
                        {student.studentId}
                        <span className="md:hidden"> · {student.rollNo}</span>
                      </p>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          inputMode="numeric"
                          min={0}
                          max={student.maxMarks}
                          value={student.obtainedMarks}
                          onChange={(e) => handleMarksChange(student.studentId, e.target.value)}
                          aria-label={`Marks for ${student.studentName}, out of ${student.maxMarks}`}
                          className="h-9 w-20 bg-card text-center text-base font-semibold tabular-nums"
                        />
                        <span className="hidden text-sm text-muted-foreground sm:inline">/ {student.maxMarks}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden text-right lg:table-cell">
                      {percentage !== null ? `${percentage}%` : "—"}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={grade.variant} className="min-w-9">
                        {grade.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden max-w-64 truncate pr-5 text-muted-foreground xl:table-cell">
                      {student.remarks || "—"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}

        <div className="flex flex-col gap-3 border-t border-border bg-muted/50 px-5 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="text-sm text-muted-foreground">
            Showing {filteredStudents.length} of {marksData.length} students
          </p>
          {saveButton}
        </div>
      </Card>
    </div>
  );
}
