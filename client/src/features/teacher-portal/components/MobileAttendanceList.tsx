"use client";

import { useState } from "react";
import {
  Card,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  Clock,
  UserX,
  Save,
} from "lucide-react";

export type AttendanceStatus = "present" | "absent" | "leave";

export interface StudentAttendanceItem {
  id: string;
  rollNo: string;
  name: string;
  avatar: string;
  status: AttendanceStatus;
}

const mockStudents: StudentAttendanceItem[] = [
  {
    id: "std-1",
    rollNo: "10-B-01",
    name: "Ahmed Khan",
    avatar: "AK",
    status: "present",
  },
  {
    id: "std-2",
    rollNo: "10-B-02",
    name: "Fatima Ali",
    avatar: "FA",
    status: "present",
  },
  {
    id: "std-3",
    rollNo: "10-B-03",
    name: "Bilal Sheikh",
    avatar: "BS",
    status: "absent",
  },
  {
    id: "std-4",
    rollNo: "10-B-04",
    name: "Zubair Shah",
    avatar: "ZS",
    status: "present",
  },
  {
    id: "std-5",
    rollNo: "10-B-05",
    name: "Sara Mansoor",
    avatar: "SM",
    status: "leave",
  },
  {
    id: "std-6",
    rollNo: "10-B-06",
    name: "Hamza Abbasi",
    avatar: "HA",
    status: "present",
  },
  {
    id: "std-7",
    rollNo: "10-B-07",
    name: "Mariam Farooq",
    avatar: "MF",
    status: "present",
  },
];

const statusOptions: {
  value: AttendanceStatus;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  checked: string;
}[] = [
  { value: "present", label: "Present", icon: CheckCircle2, checked: "bg-success text-success-foreground" },
  { value: "absent", label: "Absent", icon: UserX, checked: "bg-danger text-danger-foreground" },
  { value: "leave", label: "Leave", icon: Clock, checked: "bg-warning text-warning-foreground" },
];

export function MobileAttendanceList() {
  const [students, setStudents] = useState<StudentAttendanceItem[]>(mockStudents);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleStatusChange = (id: string, status: AttendanceStatus) => {
    setStudents((prev) =>
      prev.map((student) =>
        student.id === id ? { ...student, status } : student
      )
    );
  };

  const markAllPresent = () => {
    setStudents((prev) =>
      prev.map((student) => ({ ...student, status: "present" }))
    );
  };

  const handleSubmit = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitSuccess(true);
      setTimeout(() => setSubmitSuccess(false), 3500);
    }, 700);
  };

  const presentCount = students.filter((s) => s.status === "present").length;
  const absentCount = students.filter((s) => s.status === "absent").length;
  const leaveCount = students.filter((s) => s.status === "leave").length;

  const tally = [
    { label: "Present", count: presentCount, dot: "bg-success" },
    { label: "Absent", count: absentCount, dot: "bg-danger" },
    { label: "Leave", count: leaveCount, dot: "bg-warning" },
  ];

  return (
    <div className="space-y-4 pb-24">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-xl border border-border bg-card py-2 pr-2 pl-4">
        <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm" aria-label="Summary">
          {tally.map((t) => (
            <li key={t.label} className="flex items-center gap-1.5">
              <span aria-hidden className={`size-2 rounded-full ${t.dot}`} />
              <span className="text-muted-foreground">{t.label}</span>
              <span className="font-semibold">{t.count}</span>
            </li>
          ))}
        </ul>
        <Button variant="ghost" size="sm" onClick={markAllPresent}>
          All present
        </Button>
      </div>

      <ul className="space-y-2">
        {students.map((student) => (
          <li key={student.id}>
            <Card className="gap-3 px-4 py-4">
              <div className="flex items-center gap-3">
                <span
                  aria-hidden
                  className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-secondary-foreground"
                >
                  {student.avatar}
                </span>
                <div>
                  <p className="font-medium">{student.name}</p>
                  <p className="text-xs text-muted-foreground">Roll {student.rollNo}</p>
                </div>
              </div>

              <div
                role="radiogroup"
                aria-label={`Attendance for ${student.name}`}
                className="grid grid-cols-3 gap-1 rounded-xl border border-border bg-muted p-1"
              >
                {statusOptions.map(({ value, label, icon: Icon, checked: checkedClass }) => {
                  const checked = student.status === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      role="radio"
                      aria-checked={checked}
                      onClick={() => handleStatusChange(student.id, value)}
                      className={`flex h-11 items-center justify-center gap-1.5 rounded-lg text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/40 ${
                        checked ? checkedClass : "text-muted-foreground hover:bg-card"
                      }`}
                    >
                      <Icon aria-hidden className="size-4" />
                      {label}
                    </button>
                  );
                })}
              </div>
            </Card>
          </li>
        ))}
      </ul>

      {/* Sits just above the mobile bottom nav; next to the sidebar on desktop. */}
      <div className="pointer-events-none fixed inset-x-0 bottom-16 z-40 bg-gradient-to-t from-background via-background/95 to-transparent p-4 md:bottom-0 md:pl-66">
        <div className="pointer-events-auto mx-auto max-w-md space-y-2 md:max-w-2xl">
          {submitSuccess ? (
            <p role="status" className="flex items-center justify-center gap-2 rounded-lg border border-success/30 bg-success-tint p-2 text-sm text-success">
              <CheckCircle2 aria-hidden className="size-4" />
              Attendance submitted.
            </p>
          ) : null}
          <Button size="lg" onClick={handleSubmit} disabled={isSubmitting} className="h-12 w-full text-base">
            {isSubmitting ? (
              <>
                <Clock data-icon="inline-start" className="motion-safe:animate-spin" />
                Submitting…
              </>
            ) : (
              <>
                <Save data-icon="inline-start" />
                Submit attendance ({presentCount} of {students.length} present)
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
