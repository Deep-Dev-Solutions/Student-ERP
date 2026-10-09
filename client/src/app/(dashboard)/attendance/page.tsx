"use client";

import { useState } from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  UserCheck,
  Lock,
  Bell,
  Download,
  Sparkles,
} from "lucide-react";
import {
  MarkAttendanceUI,
  ReviewAndLock,
  AbsenceAlerts,
} from "@/features/attendance/components";

export default function AttendancePage() {
  const [activeTab, setActiveTab] = useState("mark");

  return (
    <div className="space-y-6">
      {/* 1. Top Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Attendance Management
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 border border-blue-200/60">
              <Sparkles className="h-3 w-3" /> Live Sync
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Record classroom attendance, enforce administrative locks, and trigger instant guardian alerts.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50 shadow-xs h-9 text-xs font-medium"
          >
            <Download className="mr-2 h-3.5 w-3.5 text-slate-500" />
            Export Monthly Sheet
          </Button>
          <Button
            onClick={() => setActiveTab("review")}
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-xs h-9 text-xs font-medium"
          >
            <Lock className="mr-1.5 h-3.5 w-3.5" />
            Lock Today's Attendance
          </Button>
        </div>
      </div>

      {/* 2. Modern Pill-Shaped Tabs & Content */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full space-y-6"
      >
        <div className="border-b border-slate-200/80 pb-4">
          <TabsList className="inline-flex h-11 items-center gap-1.5 rounded-xl border border-slate-200/80 bg-slate-100/80 p-1 text-slate-600 shadow-xs">
            <TabsTrigger
              value="mark"
              className="flex items-center gap-2 rounded-lg px-4 py-1.5 text-xs font-medium transition-all data-active:bg-white data-active:text-blue-700 data-active:font-semibold data-active:shadow-xs"
            >
              <UserCheck className="h-3.5 w-3.5" />
              <span>Mark Attendance</span>
            </TabsTrigger>

            <TabsTrigger
              value="review"
              className="flex items-center gap-2 rounded-lg px-4 py-1.5 text-xs font-medium transition-all data-active:bg-white data-active:text-blue-700 data-active:font-semibold data-active:shadow-xs"
            >
              <Lock className="h-3.5 w-3.5" />
              <span>Review & Lock</span>
              <span className="rounded-full bg-amber-50 px-1.5 py-0.2 text-[10px] font-semibold text-amber-700 border border-amber-200/60">
                1 Pending
              </span>
            </TabsTrigger>

            <TabsTrigger
              value="alerts"
              className="flex items-center gap-2 rounded-lg px-4 py-1.5 text-xs font-medium transition-all data-active:bg-white data-active:text-blue-700 data-active:font-semibold data-active:shadow-xs"
            >
              <Bell className="h-3.5 w-3.5" />
              <span>Absence Alerts</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab 1: Mark Attendance */}
        <TabsContent value="mark" className="focus-visible:outline-none">
          <MarkAttendanceUI />
        </TabsContent>

        {/* Tab 2: Review & Lock */}
        <TabsContent value="review" className="focus-visible:outline-none">
          <ReviewAndLock />
        </TabsContent>

        {/* Tab 3: Absence Alerts */}
        <TabsContent value="alerts" className="focus-visible:outline-none">
          <AbsenceAlerts />
        </TabsContent>
      </Tabs>
    </div>
  );
}
