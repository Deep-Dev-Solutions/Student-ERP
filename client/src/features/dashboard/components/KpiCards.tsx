import {
  Users,
  UserCheck,
  Wallet,
  AlertCircle,
  TrendingUp,
} from "lucide-react";
import { Card } from "@/components/ui/card";

export function KpiCards() {
  return (
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
  );
}

