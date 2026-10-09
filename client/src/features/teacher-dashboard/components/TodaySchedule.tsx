"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Clock,
  MapPin,
  CheckCircle2,
  PlayCircle,
  Calendar,
  BookOpen,
  ArrowRight,
  UserCheck,
} from "lucide-react";
import { ScheduledClass } from "../types";

const mockClasses: ScheduledClass[] = [
  {
    id: "cls-1",
    time: "8:30 AM - 9:15 AM",
    period: "Period 1",
    className: "Class 9",
    section: "Section A",
    subject: "Physics",
    room: "Lab 02",
    attendanceMarked: true,
    status: "completed",
  },
  {
    id: "cls-2",
    time: "9:20 AM - 10:05 AM",
    period: "Period 2",
    className: "Class 10",
    section: "Section B",
    subject: "Physics",
    room: "Room 104",
    attendanceMarked: false,
    status: "current",
  },
  {
    id: "cls-3",
    time: "10:30 AM - 11:15 AM",
    period: "Period 3",
    className: "Class 8",
    section: "Section C",
    subject: "General Science",
    room: "Room 108",
    attendanceMarked: false,
    status: "upcoming",
  },
  {
    id: "cls-4",
    time: "11:20 AM - 12:05 PM",
    period: "Period 4",
    className: "Class 10",
    section: "Section A",
    subject: "Physics Practicals",
    room: "Physics Lab",
    attendanceMarked: false,
    status: "upcoming",
  },
];

export function TodaySchedule() {
  const [scheduleList, setScheduleList] = useState<ScheduledClass[]>(mockClasses);

  const handleMarkAttendanceQuick = (id: string) => {
    setScheduleList((prev) =>
      prev.map((c) => (c.id === id ? { ...c, attendanceMarked: true } : c))
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-blue-600" />
          <h2 className="text-base font-bold tracking-tight text-slate-900">
            Today's Teaching Schedule
          </h2>
        </div>
        <span className="text-xs font-medium text-slate-500">
          {scheduleList.length} periods assigned
        </span>
      </div>

      {/* Vertical Timeline / Card List */}
      <div className="space-y-3">
        {scheduleList.map((item) => {
          const isCurrent = item.status === "current";
          const isCompleted = item.status === "completed";

          return (
            <Card
              key={item.id}
              className={`rounded-xl border transition-all ${
                isCurrent
                  ? "border-blue-500 bg-white shadow-md ring-1 ring-blue-500/30"
                  : isCompleted
                  ? "border-slate-200/80 bg-slate-50/70 shadow-xs opacity-90"
                  : "border-slate-200/80 bg-white shadow-xs hover:border-slate-300"
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold font-mono ${
                          isCurrent
                            ? "bg-blue-600 text-white"
                            : isCompleted
                            ? "bg-slate-200 text-slate-700"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {item.period}
                      </span>

                      <div className="flex items-center gap-1 text-xs font-mono text-slate-500">
                        <Clock className="h-3 w-3 text-slate-400" />
                        <span>{item.time}</span>
                      </div>

                      {isCurrent && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 ring-1 ring-emerald-600/20">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Live Now
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-slate-900 leading-tight pt-0.5">
                      {item.className} ({item.section}) • {item.subject}
                    </h3>

                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <MapPin className="h-3.5 w-3.5 text-slate-400" />
                      <span>{item.room}</span>
                    </div>
                  </div>

                  <div className="shrink-0 pt-0.5">
                    {item.attendanceMarked ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        Attendance Marked
                      </span>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleMarkAttendanceQuick(item.id)}
                        className={`h-8 gap-1.5 text-xs font-semibold rounded-lg shadow-xs ${
                          isCurrent
                            ? "bg-blue-600 hover:bg-blue-700 text-white"
                            : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <UserCheck className="h-3.5 w-3.5" />
                        Mark Attendance
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

