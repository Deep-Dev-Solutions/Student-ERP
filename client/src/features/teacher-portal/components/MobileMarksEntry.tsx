"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  Clock,
  Save,
  Award,
  Sparkles,
  Calculator,
} from "lucide-react";

export interface StudentMarksItem {
  id: string;
  rollNo: string;
  name: string;
  avatar: string;
  obtainedMarks: number | "";
  maxMarks: number;
}

const mockMarksData: StudentMarksItem[] = [
  {
    id: "std-1",
    rollNo: "10-B-01",
    name: "Ahmed Khan",
    avatar: "AK",
    obtainedMarks: 85,
    maxMarks: 100,
  },
  {
    id: "std-2",
    rollNo: "10-B-02",
    name: "Fatima Ali",
    avatar: "FA",
    obtainedMarks: 94,
    maxMarks: 100,
  },
  {
    id: "std-3",
    rollNo: "10-B-03",
    name: "Bilal Sheikh",
    avatar: "BS",
    obtainedMarks: 58,
    maxMarks: 100,
  },
  {
    id: "std-4",
    rollNo: "10-B-04",
    name: "Zubair Shah",
    avatar: "ZS",
    obtainedMarks: 76,
    maxMarks: 100,
  },
  {
    id: "std-5",
    rollNo: "10-B-05",
    name: "Sara Mansoor",
    avatar: "SM",
    obtainedMarks: 89,
    maxMarks: 100,
  },
  {
    id: "std-6",
    rollNo: "10-B-06",
    name: "Hamza Abbasi",
    avatar: "HA",
    obtainedMarks: 48,
    maxMarks: 100,
  },
  {
    id: "std-7",
    rollNo: "10-B-07",
    name: "Mariam Farooq",
    avatar: "MF",
    obtainedMarks: "",
    maxMarks: 100,
  },
];

export function MobileMarksEntry() {
  const [students, setStudents] = useState<StudentMarksItem[]>(mockMarksData);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleScoreChange = (id: string, val: string) => {
    setStudents((prev) =>
      prev.map((student) => {
        if (student.id === id) {
          if (val === "") return { ...student, obtainedMarks: "" };
          const num = Number(val);
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

  const totalFilled = students.filter((s) => s.obtainedMarks !== "").length;
  const averageMarks =
    students.reduce((acc, curr) => acc + (Number(curr.obtainedMarks) || 0), 0) /
    (totalFilled || 1);

  return (
    <div className="space-y-4 pb-20">
      {/* Quick Stats Pill Strip */}
      <div className="flex items-center justify-between rounded-xl bg-white p-3 border border-slate-200/80 shadow-xs text-xs">
        <div className="flex items-center gap-3">
          <span className="text-slate-600">
            Recorded:{" "}
            <strong className="text-slate-900 font-bold">
              {totalFilled}/{students.length}
            </strong>
          </span>
          <span className="text-slate-300">•</span>
          <span className="text-slate-600">
            Avg:{" "}
            <strong className="text-blue-600 font-bold font-mono">
              {averageMarks.toFixed(1)} / 100
            </strong>
          </span>
        </div>

        <span className="text-[11px] font-semibold text-slate-400">
          Max: 100 Marks
        </span>
      </div>

      {/* Student List Cards with Large Touch Number Input */}
      <div className="space-y-3">
        {students.map((student) => {
          const score =
            student.obtainedMarks === "" ? null : Number(student.obtainedMarks);
          let grade = "—";
          let gradeColor = "text-slate-400 bg-slate-100";

          if (score !== null) {
            if (score >= 80) {
              grade = "A+";
              gradeColor = "text-emerald-700 bg-emerald-50 border-emerald-200";
            } else if (score >= 70) {
              grade = "A";
              gradeColor = "text-blue-700 bg-blue-50 border-blue-200";
            } else if (score >= 60) {
              grade = "B";
              gradeColor = "text-indigo-700 bg-indigo-50 border-indigo-200";
            } else if (score >= 50) {
              grade = "C";
              gradeColor = "text-amber-700 bg-amber-50 border-amber-200";
            } else {
              grade = "F";
              gradeColor = "text-rose-700 bg-rose-50 border-rose-200";
            }
          }

          return (
            <Card
              key={student.id}
              className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs transition-all hover:border-slate-300"
            >
              <CardContent className="p-0 flex items-center justify-between gap-3">
                {/* Left: Student Identity */}
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 font-bold text-sm text-slate-700 border border-slate-200/70">
                    {student.avatar}
                  </div>
                  <div className="truncate">
                    <h4 className="text-sm font-bold text-slate-900 leading-tight truncate">
                      {student.name}
                    </h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs font-mono font-medium text-slate-500">
                        Roll #{student.rollNo}
                      </span>
                      <span
                        className={`inline-flex items-center justify-center h-5 px-1.5 rounded text-[10px] font-bold border ${gradeColor}`}
                      >
                        {grade}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Large Input for Thumb Typing */}
                <div className="flex items-center gap-2 shrink-0">
                  <div className="relative">
                    <Input
                      type="number"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      min={0}
                      max={student.maxMarks}
                      value={student.obtainedMarks}
                      placeholder="—"
                      onChange={(e) =>
                        handleScoreChange(student.id, e.target.value)
                      }
                      className="h-12 w-20 text-center font-mono font-bold text-lg bg-slate-50 border-slate-300 focus:bg-white focus-visible:ring-blue-600 rounded-xl"
                    />
                  </div>
                  <span className="text-xs font-mono text-slate-400">
                    / {student.maxMarks}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Sticky Bottom Save Bar */}
      <div className="fixed bottom-16 md:bottom-4 left-0 right-0 z-40 p-4 md:pl-68 bg-gradient-to-t from-slate-50 via-slate-50/95 to-transparent pointer-events-none">
        <div className="max-w-md md:max-w-2xl mx-auto pointer-events-auto">
          <Button
            onClick={handleSaveMarks}
            disabled={isSaving}
            className="w-full h-12 text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/25 rounded-xl gap-2 transition-transform active:scale-[0.99]"
          >
            {isSaving ? (
              <>
                <Clock className="h-4 w-4 animate-spin" />
                Saving Scores...
              </>
            ) : saveSuccess ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                Marks Saved to Gradebook!
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Marks ({totalFilled}/{students.length} Entered)
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

