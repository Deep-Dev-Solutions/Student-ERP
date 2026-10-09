"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Award,
  Sparkles,
  BookOpen,
} from "lucide-react";
import { MobileMarksEntry } from "@/features/teacher-portal/components/MobileMarksEntry";

export default function TeacherMarksPage() {
  const [selectedExam, setSelectedExam] = useState("midterm-2026");
  const [selectedSubject, setSelectedSubject] = useState("physics");

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 max-w-2xl mx-auto space-y-4">
      {/* 1. Header & Exam/Subject Selectors Card */}
      <Card className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <Award className="h-4 w-4" />
              </span>
              <div>
                <h1 className="text-base font-bold text-slate-900 leading-tight">
                  Enter Subject Marks
                </h1>
                <p className="text-[11px] text-slate-500 font-medium">
                  Class 10 (Section B) • Quick Entry
                </p>
              </div>
            </div>

            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
              <Sparkles className="h-3 w-3" /> Term 2026
            </span>
          </div>

          {/* Select Dropdowns for Exam and Subject */}
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <div>
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Examination Term
              </label>
              <Select
                value={selectedExam}
                onValueChange={(val) => {
                  if (val) setSelectedExam(val);
                }}
              >
                <SelectTrigger className="w-full bg-slate-50/80 border-slate-200 text-xs h-10 rounded-xl font-medium">
                  <SelectValue placeholder="Select exam" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200 shadow-md">
                  <SelectItem value="midterm-2026">Mid-Term Exam 2026</SelectItem>
                  <SelectItem value="monthly-test">Monthly Assessment</SelectItem>
                  <SelectItem value="final-2026">Annual Exam 2026</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Assigned Subject
              </label>
              <Select
                value={selectedSubject}
                onValueChange={(val) => {
                  if (val) setSelectedSubject(val);
                }}
              >
                <SelectTrigger className="w-full bg-slate-50/80 border-slate-200 text-xs h-10 rounded-xl font-medium">
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200 shadow-md">
                  <SelectItem value="physics">Physics (100 M)</SelectItem>
                  <SelectItem value="mathematics">Maths (100 M)</SelectItem>
                  <SelectItem value="general-science">Gen Science (100 M)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </Card>

      {/* 2. Mobile Marks Entry List */}
      <MobileMarksEntry />
    </div>
  );
}

