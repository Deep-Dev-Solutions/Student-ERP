import Link from "next/link";
import {
  Users,
  AlertCircle,
  Wallet,
  UserCheck,
  Plus,
  ArrowUpRight,
  TrendingUp,
  Download,
  FileText,
  Calendar,
  CheckCircle2,
  Clock,
  ChevronRight,
  BarChart3,
  Sparkles,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* ========================================================= */}
      {/* 1. HEADER SECTION                                         */}
      {/* ========================================================= */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Dashboard Overview
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 border border-blue-200/60">
              <Sparkles className="h-3 w-3" /> Live
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Real-time branch attendance, fee collections, and student admissions.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50 shadow-xs h-9 text-xs font-medium"
          >
            <Download className="mr-2 h-3.5 w-3.5 text-slate-500" />
            Export Branch Summary
          </Button>
          <Link href="/students">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-xs h-9 text-xs font-medium">
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Admit Student
            </Button>
          </Link>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. KPI CARDS GRID (4 METRICS)                             */}
      {/* ========================================================= */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Active Students */}
        <Card className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all duration-200 hover:border-slate-300 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium tracking-wide text-slate-500 uppercase">
              Total Students
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 ring-1 ring-blue-500/10">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold tracking-tight text-slate-900">
              1,245
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
              <span className="inline-flex items-center font-semibold text-emerald-600">
                <TrendingUp className="mr-1 h-3.5 w-3.5" />
                +12
              </span>
              <span>admitted this month</span>
            </div>
          </div>
        </Card>

        {/* Card 2: Attendance */}
        <Card className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all duration-200 hover:border-slate-300 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium tracking-wide text-slate-500 uppercase">
              Today's Attendance
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-500/10">
              <UserCheck className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold tracking-tight text-slate-900">
              92.4%
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
              <span className="text-emerald-600 font-medium">1,150 Present</span>
              <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[11px] font-medium text-amber-700 border border-amber-200/50">
                3 classes pending lock
              </span>
            </div>
          </div>
        </Card>

        {/* Card 3: Fee Collection */}
        <Card className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all duration-200 hover:border-slate-300 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium tracking-wide text-slate-500 uppercase">
              Fee Collected (Oct)
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-500/10">
              <Wallet className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold tracking-tight text-slate-900">
              Rs 1.25M
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
              <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full w-3/4 rounded-full bg-indigo-600" />
              </div>
              <span className="font-medium text-slate-700">75% of target</span>
            </div>
          </div>
        </Card>

        {/* Card 4: Defaulters */}
        <Card className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all duration-200 hover:border-slate-300 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium tracking-wide text-rose-600 uppercase">
              Total Defaulters
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600 ring-1 ring-rose-500/10">
              <AlertCircle className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold tracking-tight text-rose-600">
              Rs 145,000
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
              <span className="font-semibold text-rose-600">120 vouchers</span>
              <span>Pending follow-up</span>
            </div>
          </div>
        </Card>
      </div>

      {/* ========================================================= */}
      {/* 3. REVENUE & ATTENDANCE TRENDS (RECHARTS PLACEHOLDER)    */}
      {/* ========================================================= */}
      <Card className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-xs">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg font-bold text-slate-900">
                Revenue & Attendance Trends
              </CardTitle>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                Academic Year 2026
              </span>
            </div>
            <CardDescription className="text-xs text-slate-500 mt-1">
              Monthly reconciliation between student attendance rates and fee collection velocity.
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs">
              <button className="rounded-md bg-white px-2.5 py-1 font-semibold text-slate-900 shadow-xs">
                Attendance
              </button>
              <button className="rounded-md px-2.5 py-1 font-medium text-slate-500 hover:text-slate-900">
                Fee Velocity
              </button>
              <button className="rounded-md px-2.5 py-1 font-medium text-slate-500 hover:text-slate-900">
                Combined
              </button>
            </div>
          </div>
        </div>

        {/* Visual Charts Canvas Placeholder */}
        <div className="mt-6 flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600 ring-4 ring-blue-50/50">
            <BarChart3 className="h-6 w-6" />
          </div>
          <h3 className="mt-3 text-sm font-semibold text-slate-900">
            Recharts Visualization Slot
          </h3>
          <p className="mt-1 max-w-md text-xs text-slate-500 leading-relaxed">
            Ready for Recharts &lt;ResponsiveContainer&gt; component. Displays interactive Area and Bar charts for fee collections, defaulter trends, and daily attendance percentages.
          </p>
          <div className="mt-4 flex items-center gap-4 text-xs text-slate-600">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-blue-600" />
              <span>Fee Collection (Target vs Actual)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span>Daily Attendance (Avg 92.4%)</span>
            </div>
          </div>
        </div>
      </Card>

      {/* ========================================================= */}
      {/* 4. QUICK ACTIONS & ACTIVITY LOG GRID                      */}
      {/* ========================================================= */}
      <div className="grid gap-6 lg:grid-cols-7">
        {/* Quick Actions Panel (3 Columns) */}
        <Card className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-xs lg:col-span-3">
          <div className="border-b border-slate-100 pb-4">
            <CardTitle className="text-base font-bold text-slate-900">
              Quick Actions
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 mt-0.5">
              Rapid workflows for daily administrative routines.
            </CardDescription>
          </div>

          <div className="mt-5 space-y-3">
            {/* Primary Action Button (Brand solid) */}
            <Link href="/students" className="block">
              <Button className="w-full justify-between bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-xs h-11 px-4 rounded-lg group">
                <div className="flex items-center gap-2.5">
                  <Plus className="h-4 w-4 transition-transform group-hover:scale-110" />
                  <span>Admit New Student</span>
                </div>
                <ArrowUpRight className="h-4 w-4 opacity-70 group-hover:opacity-100" />
              </Button>
            </Link>

            {/* Secondary Clean Outline Action Buttons */}
            <Button
              variant="outline"
              className="w-full justify-between border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 font-medium h-11 px-4 rounded-lg shadow-xs group"
            >
              <div className="flex items-center gap-2.5">
                <Wallet className="h-4 w-4 text-slate-500 group-hover:text-blue-600 transition-colors" />
                <span>Collect Fee (Issue Voucher)</span>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-slate-600" />
            </Button>

            <Button
              variant="outline"
              className="w-full justify-between border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 font-medium h-11 px-4 rounded-lg shadow-xs group"
            >
              <div className="flex items-center gap-2.5">
                <UserCheck className="h-4 w-4 text-slate-500 group-hover:text-emerald-600 transition-colors" />
                <span>Lock Today's Attendance</span>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-slate-600" />
            </Button>

            <Button
              variant="outline"
              className="w-full justify-between border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 font-medium h-11 px-4 rounded-lg shadow-xs group"
            >
              <div className="flex items-center gap-2.5">
                <FileText className="h-4 w-4 text-slate-500 group-hover:text-indigo-600 transition-colors" />
                <span>Generate Defaulter Report</span>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-slate-600" />
            </Button>
          </div>
        </Card>

        {/* Activity Feed / Timeline Log (4 Columns) */}
        <Card className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-xs lg:col-span-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <CardTitle className="text-base font-bold text-slate-900">
                Recent Activity Log
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 mt-0.5">
                Audit trail of administrative actions across this branch.
              </CardDescription>
            </div>
            <span className="text-xs font-medium text-blue-600 hover:text-blue-700 cursor-pointer">
              View all
            </span>
          </div>

          {/* Timeline UI with Continuous Stem */}
          <div className="mt-5 relative pl-6 space-y-6 before:absolute before:top-2 before:bottom-2 before:left-2 before:w-0.5 before:bg-slate-200">
            {/* Log Item 1: Fee Collected */}
            <div className="relative group">
              <div className="absolute -left-6 top-1 h-2.5 w-2.5 rounded-full bg-blue-600 ring-4 ring-white" />
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Fee Collected
                  </p>
                  <p className="mt-0.5 text-xs text-slate-600 leading-relaxed">
                    <span className="font-medium text-slate-800">Ali (Accountant)</span>{" "}
                    collected Rs 3,000 via Cash for Student #1042 (Ahmed Khan).
                  </p>
                </div>
                <span className="text-[11px] font-medium text-slate-400 shrink-0">
                  10m ago
                </span>
              </div>
            </div>

            {/* Log Item 2: Attendance Locked */}
            <div className="relative group">
              <div className="absolute -left-6 top-1 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-4 ring-white" />
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Attendance Locked
                  </p>
                  <p className="mt-0.5 text-xs text-slate-600 leading-relaxed">
                    <span className="font-medium text-slate-800">Usman (Principal)</span>{" "}
                    verified and locked Class 9-A attendance record (34 present, 2 absent).
                  </p>
                </div>
                <span className="text-[11px] font-medium text-slate-400 shrink-0">
                  1h ago
                </span>
              </div>
            </div>

            {/* Log Item 3: Admission Registered */}
            <div className="relative group">
              <div className="absolute -left-6 top-1 h-2.5 w-2.5 rounded-full bg-indigo-500 ring-4 ring-white" />
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    New Student Registered
                  </p>
                  <p className="mt-0.5 text-xs text-slate-600 leading-relaxed">
                    <span className="font-medium text-slate-800">Admin</span> registered{" "}
                    Zainab Bilal into Class 10-B. Voucher generated automatically.
                  </p>
                </div>
                <span className="text-[11px] font-medium text-slate-400 shrink-0">
                  3h ago
                </span>
              </div>
            </div>

            {/* Log Item 4: System Batch Notification */}
            <div className="relative group">
              <div className="absolute -left-6 top-1 h-2.5 w-2.5 rounded-full bg-slate-400 ring-4 ring-white" />
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Monthly Fee Vouchers Generated
                  </p>
                  <p className="mt-0.5 text-xs text-slate-600 leading-relaxed">
                    System generated 1,245 fee challans for the November billing cycle.
                  </p>
                </div>
                <span className="text-[11px] font-medium text-slate-400 shrink-0">
                  Yesterday
                </span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}