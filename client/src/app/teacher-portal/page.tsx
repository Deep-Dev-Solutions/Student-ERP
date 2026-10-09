"use client";

import {
  Calendar,
  Sparkles,
  UserCheck,
  Award,
  FileSpreadsheet,
  Clock,
  BookOpen,
} from "lucide-react";
import { TodaySchedule, PendingTasks } from "@/features/teacher-dashboard/components";

export default function TeacherPortalPage() {
  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8 space-y-6 max-w-4xl mx-auto">
      {/* 1. Mobile-First Welcome Banner */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                <Sparkles className="h-3 w-3" /> Teacher Portal
              </span>
              <span className="text-xs text-slate-400 font-medium">
                {currentDate}
              </span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl mt-1.5">
              Good morning, Dr. Tariq! 👋
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              You have 4 teaching periods scheduled today across Physics and General Science.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t border-slate-100 sm:border-0">
            <div className="flex-1 sm:flex-initial rounded-xl bg-slate-50 border border-slate-200/70 px-3.5 py-2 text-center">
              <div className="text-xs text-slate-400">Classes Done</div>
              <div className="text-base font-bold text-slate-900 font-mono">
                1 / 4
              </div>
            </div>
            <div className="flex-1 sm:flex-initial rounded-xl bg-slate-50 border border-slate-200/70 px-3.5 py-2 text-center">
              <div className="text-xs text-slate-400">Total Students</div>
              <div className="text-base font-bold text-blue-600 font-mono">
                142
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Pending Tasks Reminders */}
      <PendingTasks />

      {/* 3. Today's Teaching Schedule */}
      <TodaySchedule />
    </div>
  );
}

