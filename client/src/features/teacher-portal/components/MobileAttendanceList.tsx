"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  Clock,
  Sparkles,
  UserCheck,
  UserX,
  AlertCircle,
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

  return (
    <div className="space-y-4 pb-20">
      {/* Quick Summary Pill Bar */}
      <div className="flex items-center justify-between gap-2 rounded-xl bg-white p-3 border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span>P: {presentCount}</span>
          </div>
          <div className="flex items-center gap-1 rounded-lg bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700">
            <span className="h-2 w-2 rounded-full bg-rose-500" />
            <span>A: {absentCount}</span>
          </div>
          <div className="flex items-center gap-1 rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            <span>L: {leaveCount}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={markAllPresent}
          className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline active:scale-95 transition-all"
        >
          Mark All Present
        </button>
      </div>

      {/* Student Attendance Cards with Large Touch Targets */}
      <div className="space-y-3">
        {students.map((student) => {
          return (
            <Card
              key={student.id}
              className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs transition-all hover:border-slate-300"
            >
              <CardContent className="p-0 space-y-3.5">
                {/* Header: Student Info */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 font-bold text-sm text-slate-700 border border-slate-200/70">
                      {student.avatar}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 leading-tight">
                        {student.name}
                      </h4>
                      <p className="text-xs font-mono font-medium text-slate-500 mt-0.5">
                        Roll #{student.rollNo}
                      </p>
                    </div>
                  </div>

                  {/* Active Status Dot Indicator */}
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ${
                      student.status === "present"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : student.status === "absent"
                        ? "bg-rose-50 text-rose-700 border border-rose-200"
                        : "bg-amber-50 text-amber-700 border border-amber-200"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        student.status === "present"
                          ? "bg-emerald-500"
                          : student.status === "absent"
                          ? "bg-rose-500"
                          : "bg-amber-500"
                      }`}
                    />
                    {student.status}
                  </span>
                </div>

                {/* Large Segmented Toggle Buttons (Touch-friendly minimum 44px height) */}
                <div className="grid grid-cols-3 gap-2 p-1 rounded-xl bg-slate-100/90 border border-slate-200/80">
                  {/* Present Button */}
                  <button
                    type="button"
                    onClick={() => handleStatusChange(student.id, "present")}
                    className={`flex h-11 items-center justify-center gap-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 ${
                      student.status === "present"
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "text-slate-600 hover:bg-slate-200/60"
                    }`}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Present</span>
                  </button>

                  {/* Absent Button */}
                  <button
                    type="button"
                    onClick={() => handleStatusChange(student.id, "absent")}
                    className={`flex h-11 items-center justify-center gap-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 ${
                      student.status === "absent"
                        ? "bg-rose-600 text-white shadow-xs"
                        : "text-slate-600 hover:bg-slate-200/60"
                    }`}
                  >
                    <UserX className="h-4 w-4" />
                    <span>Absent</span>
                  </button>

                  {/* Leave Button */}
                  <button
                    type="button"
                    onClick={() => handleStatusChange(student.id, "leave")}
                    className={`flex h-11 items-center justify-center gap-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 ${
                      student.status === "leave"
                        ? "bg-amber-500 text-white shadow-xs"
                        : "text-slate-600 hover:bg-slate-200/60"
                    }`}
                  >
                    <Clock className="h-4 w-4" />
                    <span>Leave</span>
                  </button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Sticky Bottom Submit Bar (Positioned right above MobileBottomNav) */}
      <div className="fixed bottom-16 md:bottom-4 left-0 right-0 z-40 p-4 md:pl-66 bg-gradient-to-t from-slate-50 via-slate-50/95 to-transparent pointer-events-none">
        <div className="max-w-md md:max-w-2xl mx-auto pointer-events-auto">
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full h-12 text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/25 rounded-xl gap-2 transition-transform active:scale-[0.99]"
          >
            {isSubmitting ? (
              <>
                <Clock className="h-4 w-4 animate-spin" />
                Submitting Register...
              </>
            ) : submitSuccess ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                Attendance Registered!
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Submit Today's Attendance ({presentCount}/{students.length} Present)
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

