import Link from "next/link";
import { Plus, Download, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  KpiCards,
  QuickActions,
  ActivityFeed,
  AnalyticsTrends,
} from "@/features/dashboard/components";

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Header Section */}
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

      {/* Metric KPI Cards */}
      <KpiCards />

      {/* Revenue & Attendance Trends Visualizer */}
      <AnalyticsTrends />

      {/* Quick Actions & Recent Activity Log Grid */}
      <div className="grid gap-6 lg:grid-cols-7">
        <div className="lg:col-span-3">
          <QuickActions />
        </div>
        <div className="lg:col-span-4">
          <ActivityFeed />
        </div>
      </div>
    </div>
  );
}

