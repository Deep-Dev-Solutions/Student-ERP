import Link from "next/link";
import {
  Plus,
  ArrowUpRight,
  Wallet,
  UserCheck,
  FileText,
  ChevronRight,
} from "lucide-react";
import {
  Card,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function QuickActions() {
  return (
    <Card className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-xs">
      <div className="border-b border-slate-100 pb-4">
        <CardTitle className="text-base font-bold text-slate-900">
          Quick Actions
        </CardTitle>
        <CardDescription className="text-xs text-slate-500 mt-0.5">
          Rapid workflows for daily administrative routines.
        </CardDescription>
      </div>

      <div className="mt-5 space-y-3">
        {/* Primary Action Button (Brand solid blue) */}
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

        <Link href="/attendance" className="block">
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
        </Link>

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
  );
}

