"use client";

import Link from "next/link";
import {
  AlertTriangle,
  Clock,
  ArrowRight,
  UserX,
  FileCheck,
  Award,
} from "lucide-react";
import { PendingTaskItem } from "../types";

const mockPendingTasks: PendingTaskItem[] = [
  {
    id: "task-1",
    type: "attendance",
    title: "Attendance pending for Class 10B",
    description: "Period 2 ended at 10:05 AM. Please submit today's attendance before administrative roster lock.",
    urgency: "high",
    actionLabel: "Mark Now",
    actionHref: "/teacher-dashboard/attendance",
  },
  {
    id: "task-2",
    type: "marks",
    title: "Mid-Term Physics marks pending",
    description: "14 answer sheets remaining to enter for Class 9A before the examination lock deadline.",
    urgency: "medium",
    actionLabel: "Enter Marks",
    actionHref: "/teacher-dashboard/marks",
  },
];

export function PendingTasks() {
  if (mockPendingTasks.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold tracking-tight text-slate-900">
          Pending Tasks & Reminders
        </h2>
        <span className="text-xs font-semibold text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200/60">
          {mockPendingTasks.length} Action Needed
        </span>
      </div>

      <div className="space-y-2.5">
        {mockPendingTasks.map((task) => {
          const isHigh = task.urgency === "high";

          return (
            <div
              key={task.id}
              className={`rounded-xl border p-4 transition-all shadow-xs ${
                isHigh
                  ? "bg-rose-50/90 border-rose-200 text-rose-950"
                  : "bg-amber-50/90 border-amber-200 text-amber-950"
              }`}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg mt-0.5 ${
                      isHigh
                        ? "bg-rose-100 text-rose-700 ring-1 ring-rose-300"
                        : "bg-amber-100 text-amber-700 ring-1 ring-amber-300"
                    }`}
                  >
                    <AlertTriangle className="h-4 w-4" />
                  </div>

                  <div>
                    <h3 className="text-sm font-bold leading-tight">
                      {task.title}
                    </h3>
                    <p
                      className={`text-xs mt-1 leading-relaxed ${
                        isHigh ? "text-rose-700" : "text-amber-800"
                      }`}
                    >
                      {task.description}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 self-end sm:self-center">
                  <Link
                    href={task.actionHref}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold transition-all shadow-xs ${
                      isHigh
                        ? "bg-rose-600 hover:bg-rose-700 text-white"
                        : "bg-amber-600 hover:bg-amber-700 text-white"
                    }`}
                  >
                    <span>{task.actionLabel}</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

