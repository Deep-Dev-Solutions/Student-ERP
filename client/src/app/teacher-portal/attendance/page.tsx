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
  UserCheck,
  Calendar,
  Sparkles,
  Users,
} from "lucide-react";
import { MobileAttendanceList } from "@/features/teacher-portal/components/MobileAttendanceList";

export default function TeacherAttendancePage() {
  const [selectedClass, setSelectedClass] = useState("class-10");
  const [selectedSection, setSelectedSection] = useState("section-b");

  const todayStr = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 max-w-2xl mx-auto space-y-4">
      {/* 1. Header & Class Selector Bar */}
      <Card className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <UserCheck className="h-4 w-4" />
              </span>
              <div>
                <h1 className="text-base font-bold text-slate-900 leading-tight">
                  Mark Attendance
                </h1>
                <p className="text-[11px] text-slate-500 font-medium">
                  {todayStr} • Daily Register
                </p>
              </div>
            </div>

            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
              <Sparkles className="h-3 w-3" /> Period 2
            </span>
          </div>

          {/* Select Dropdowns for Class and Section */}
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <div>
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Class / Grade
              </label>
              <Select
                value={selectedClass}
                onValueChange={(val) => {
                  if (val) setSelectedClass(val);
                }}
              >
                <SelectTrigger className="w-full bg-slate-50/80 border-slate-200 text-xs h-10 rounded-xl font-medium">
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200 shadow-md">
                  <SelectItem value="class-8">Class 8</SelectItem>
                  <SelectItem value="class-9">Class 9</SelectItem>
                  <SelectItem value="class-10">Class 10</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Section
              </label>
              <Select
                value={selectedSection}
                onValueChange={(val) => {
                  if (val) setSelectedSection(val);
                }}
              >
                <SelectTrigger className="w-full bg-slate-50/80 border-slate-200 text-xs h-10 rounded-xl font-medium">
                  <SelectValue placeholder="Select section" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200 shadow-md">
                  <SelectItem value="section-a">Section A</SelectItem>
                  <SelectItem value="section-b">Section B</SelectItem>
                  <SelectItem value="section-c">Section C</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </Card>

      {/* 2. Mobile Attendance List */}
      <MobileAttendanceList />
    </div>
  );
}

