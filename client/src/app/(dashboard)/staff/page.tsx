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
  Users,
  GraduationCap,
  DollarSign,
  UserPlus,
  FileSpreadsheet,
  Sparkles,
} from "lucide-react";
import {
  StaffDirectory,
  TeacherAllocations,
  PayrollList,
} from "@/features/staff/components";

export default function StaffPage() {
  const [activeTab, setActiveTab] = useState("directory");

  return (
    <div className="space-y-6">
      {/* 1. Top Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Staff & Human Resources
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 border border-blue-200/60">
              <Sparkles className="h-3 w-3" /> Faculty Portal
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Manage academic personnel, subject-to-class allocations, and monthly salary disbursals.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50 shadow-xs h-9 text-xs font-medium"
          >
            <FileSpreadsheet className="mr-2 h-3.5 w-3.5 text-slate-500" />
            Monthly Attendance Report
          </Button>
          <Button
            onClick={() => setActiveTab("directory")}
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-xs h-9 text-xs font-medium"
          >
            <UserPlus className="mr-1.5 h-3.5 w-3.5" />
            Onboard Faculty
          </Button>
        </div>
      </div>

      {/* 2. Modern Pill-Shaped Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <div className="border-b border-slate-200/80 pb-3">
          <TabsList className="inline-flex h-11 items-center gap-1.5 rounded-xl border border-slate-200/80 bg-slate-100/80 p-1 text-slate-600 shadow-xs">
            <TabsTrigger
              value="directory"
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-medium transition-all hover:text-slate-900 data-active:bg-white data-active:text-blue-700 data-active:font-semibold data-active:shadow-xs"
            >
              <Users className="h-4 w-4" />
              <span>Staff Directory</span>
            </TabsTrigger>

            <TabsTrigger
              value="allocations"
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-medium transition-all hover:text-slate-900 data-active:bg-white data-active:text-blue-700 data-active:font-semibold data-active:shadow-xs"
            >
              <GraduationCap className="h-4 w-4" />
              <span>Teacher Allocations</span>
            </TabsTrigger>

            <TabsTrigger
              value="payroll"
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-medium transition-all hover:text-slate-900 data-active:bg-white data-active:text-blue-700 data-active:font-semibold data-active:shadow-xs"
            >
              <DollarSign className="h-4 w-4" />
              <span>Payroll & Compensation</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab 1: Staff Directory */}
        <TabsContent
          value="directory"
          className="mt-0 focus-visible:outline-none"
        >
          <StaffDirectory />
        </TabsContent>

        {/* Tab 2: Teacher Allocations */}
        <TabsContent
          value="allocations"
          className="mt-0 focus-visible:outline-none"
        >
          <TeacherAllocations />
        </TabsContent>

        {/* Tab 3: Payroll List */}
        <TabsContent
          value="payroll"
          className="mt-0 focus-visible:outline-none"
        >
          <PayrollList />
        </TabsContent>
      </Tabs>
    </div>
  );
}

