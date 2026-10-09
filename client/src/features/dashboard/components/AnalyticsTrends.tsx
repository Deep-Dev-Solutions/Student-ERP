import { BarChart3 } from "lucide-react";
import {
  Card,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";

export function AnalyticsTrends() {
  return (
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
  );
}

