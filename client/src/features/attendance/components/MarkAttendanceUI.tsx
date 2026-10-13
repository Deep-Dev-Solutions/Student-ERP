"use client";

import { useState } from "react";
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
import { Search, CheckCircle2 } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { useClassSectionPicker, useReadOnly } from "@/hooks/use-academics";
import { useGetAttendanceRosterQuery } from "@/store/api";
import { AttendanceStatus, StudentAttendanceRecord } from "../types";


const statusOptions: {
  value: AttendanceStatus;
  /** Shown on the button: P, A or L. */
  letter: string;
  label: string;
  checked: string;
  hover: string;
}[] = [
  { value: "present", letter: "P", label: "Present", checked: "bg-success text-success-foreground", hover: "hover:bg-success-tint hover:text-success" },
  { value: "absent", letter: "A", label: "Absent", checked: "bg-danger text-danger-foreground", hover: "hover:bg-danger-tint hover:text-danger" },
  { value: "leave", letter: "L", label: "Leave", checked: "bg-warning text-warning-foreground", hover: "hover:bg-warning-tint hover:text-warning" },
];

interface MarkAttendanceUIProps {
  initialRecords?: StudentAttendanceRecord[];
  onRosterUpdate?: (records: StudentAttendanceRecord[]) => void;
}

export function MarkAttendanceUI({
  initialRecords,
  onRosterUpdate,
}: MarkAttendanceUIProps) {
  const readOnly = useReadOnly();
  const { data: roster = [] } = useGetAttendanceRosterQuery();
  const records = initialRecords ?? roster;
  const [students, setStudents] = useState<StudentAttendanceRecord[]>(records);
  const picker = useClassSectionPicker({ className: "Class 9", section: "A" });
  const [selectedDate, setSelectedDate] = useState("2026-10-09");
  const [searchQuery, setSearchQuery] = useState("");

  const presentCount = students.filter((s) => s.status === "present").length;
  const absentCount = students.filter((s) => s.status === "absent").length;
  const leaveCount = students.filter((s) => s.status === "leave").length;

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    const updated = students.map((s) =>
      s.id === studentId ? { ...s, status } : s
    );
    setStudents(updated);
    onRosterUpdate?.(updated);
  };

  const [submitted, setSubmitted] = useState(false);

  const handleReset = () => {
    setStudents(records);
    setSubmitted(false);
    onRosterUpdate?.(records);
  };

  const tally = [
    { label: "Present", count: presentCount, dot: "bg-success" },
    { label: "Absent", count: absentCount, dot: "bg-danger" },
    { label: "On leave", count: leaveCount, dot: "bg-warning" },
  ];

  const handleMarkAll = (status: AttendanceStatus) => {
    const updated = students.map((s) => ({ ...s, status }));
    setStudents(updated);
    onRosterUpdate?.(updated);
  };

  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-1 flex-wrap items-end gap-3">
          <div className="w-36">
            <label htmlFor="mark-class" className="mb-1.5 block text-sm font-medium">
              Class
            </label>
            <Select items={picker.classOptions} value={picker.classId} onValueChange={(val) => val && picker.setClassId(val)}>
              <SelectTrigger id="mark-class" className="h-9 w-full bg-card">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {picker.classOptions.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-36">
            <label htmlFor="mark-section" className="mb-1.5 block text-sm font-medium">
              Section
            </label>
            <Select items={picker.sectionOptions} value={picker.sectionId} onValueChange={(val) => val && picker.setSectionId(val)}>
              <SelectTrigger id="mark-section" className="h-9 w-full bg-card">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {picker.sectionOptions.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-44">
            <label htmlFor="mark-date" className="mb-1.5 block text-sm font-medium">
              Date
            </label>
            <Input
              id="mark-date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="h-9 bg-card"
            />
          </div>

          <div className="min-w-52 flex-1">
            <label htmlFor="mark-search" className="mb-1.5 block text-sm font-medium">
              Find a student
            </label>
            <div className="relative">
              <Search aria-hidden className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="mark-search"
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Name or roll ID"
                className="h-9 bg-card pl-9"
              />
            </div>
          </div>
        </div>

        <Button variant="outline" onClick={() => handleMarkAll("present")} disabled={readOnly}>
          Mark all present
        </Button>
      </div>

      <dl className="grid grid-cols-3 gap-3">
        {tally.map((t) => (
          <div key={t.label} className="rounded-xl border border-border bg-card px-4 py-3">
            <dt className="flex items-center gap-2 text-sm text-muted-foreground">
              <span aria-hidden className={`size-2.5 rounded-full ${t.dot}`} />
              {t.label}
            </dt>
            <dd className="mt-1 text-2xl font-semibold">{t.count}</dd>
          </div>
        ))}
      </dl>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {filteredStudents.length === 0 ? (
          <EmptyState
            icon={Search}
            title="No students match"
            description="Check the spelling or search by roll ID."
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
                <TableHead className="hidden pl-5 md:table-cell">Roll ID</TableHead>
                <TableHead className="pl-5 md:pl-3">Student</TableHead>
                <TableHead className="hidden lg:table-cell">Remark</TableHead>
                <TableHead className="pr-5 text-right">Status</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filteredStudents.map((student) => (
                <TableRow key={student.id}>
                  <TableCell className="hidden pl-5 text-muted-foreground md:table-cell">{student.id}</TableCell>

                  <TableCell className="pl-5 md:pl-3">
                    <div className="flex items-center gap-3">
                      <span
                        aria-hidden
                        className="hidden size-9 shrink-0 sm:flex items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground"
                      >
                        {student.avatar}
                      </span>
                      <div className="flex flex-col">
                        <span className="font-medium">{student.name}</span>
                        <span className="hidden text-xs text-muted-foreground sm:inline">{student.email}</span>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="hidden text-muted-foreground lg:table-cell">{student.remark || "—"}</TableCell>

                  <TableCell className="pr-5 text-right">
                    <div
                      role="radiogroup"
                      aria-label={`Attendance for ${student.name}`}
                      className="inline-flex items-center gap-0.5 rounded-lg border border-border bg-muted p-0.5"
                    >
                      {statusOptions.map((opt) => {
                        const checked = student.status === opt.value;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            role="radio"
                            aria-checked={checked}
                            aria-label={opt.label}
                            title={opt.label}
                            onClick={() => handleStatusChange(student.id, opt.value)}
                            disabled={readOnly}
                            className={`flex h-8 w-9 items-center justify-center rounded-md text-sm font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/40 ${
                              checked ? opt.checked : `text-muted-foreground ${opt.hover}`
                            }`}
                          >
                            {opt.letter}
                          </button>
                        );
                      })}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <div className="flex flex-col gap-3 border-t border-border bg-muted/50 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-center gap-2 text-sm text-muted-foreground" role="status">
            {submitted ? (
              <>
                <CheckCircle2 aria-hidden className="size-4 text-success" />
                Register submitted. It can be locked from Review and lock.
              </>
            ) : (
              "Changes aren't submitted until you select Submit register."
            )}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleReset}>
              Reset changes
            </Button>
            <Button size="sm" onClick={() => setSubmitted(true)} disabled={readOnly}>
              Submit register
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
