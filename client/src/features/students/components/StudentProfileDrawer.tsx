import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Check } from "lucide-react";
import { Student } from "../types";

interface StudentProfileDrawerProps {
  student: Student | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StudentProfileDrawer({
  student,
  open,
  onOpenChange,
}: StudentProfileDrawerProps) {
  if (!student) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[420px] sm:w-[540px] overflow-y-auto bg-white p-6">
        <SheetHeader className="border-b border-slate-100 pb-5">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-lg font-bold text-white shadow-sm">
              {student.avatar}
            </div>
            <div className="flex-1 text-left">
              <div className="flex items-center gap-2">
                <SheetTitle className="text-lg font-bold text-slate-900">
                  {student.name}
                </SheetTitle>
                <DrawerStatusBadge status={student.status} />
              </div>
              <SheetDescription className="text-xs text-slate-500 mt-0.5">
                {student.id} • {student.class} ({student.section})
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Quick Contact & Details Bar */}
          <div className="grid grid-cols-2 gap-3 rounded-xl border border-slate-200/80 bg-slate-50/70 p-3 text-xs">
            <div>
              <span className="text-[11px] text-slate-400 block font-medium">
                Father / Guardian
              </span>
              <span className="font-semibold text-slate-800">
                {student.guardian}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block font-medium">
                Phone (WhatsApp)
              </span>
              <span className="font-semibold text-slate-800">
                {student.phone}
              </span>
            </div>
          </div>

          {/* Fee History / Ledger */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Fee Ledger & Invoices
              </h4>
              <span className="text-[11px] font-semibold text-blue-600 hover:underline cursor-pointer">
                View Ledger
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-white p-3 shadow-xs">
                <div>
                  <p className="text-xs font-semibold text-slate-900">
                    October 2026 Tuition
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Paid via Cash on Oct 03, 2026
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                  <Check className="h-3 w-3" /> Paid Rs 3,000
                </span>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-white p-3 shadow-xs">
                <div>
                  <p className="text-xs font-semibold text-slate-900">
                    September 2026 Tuition
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Paid via Bank Transfer on Sep 05, 2026
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                  <Check className="h-3 w-3" /> Paid Rs 3,000
                </span>
              </div>
            </div>
          </div>

          {/* Attendance Summary */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">
              Attendance Summary (Fall Session)
            </h4>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-3.5">
                <span className="block text-xl font-bold text-emerald-700">
                  18
                </span>
                <span className="text-[11px] font-medium text-emerald-600">
                  Days Present
                </span>
              </div>
              <div className="rounded-xl border border-rose-100 bg-rose-50/60 p-3.5">
                <span className="block text-xl font-bold text-rose-700">
                  2
                </span>
                <span className="text-[11px] font-medium text-rose-600">
                  Days Absent
                </span>
              </div>
              <div className="rounded-xl border border-amber-100 bg-amber-50/60 p-3.5">
                <span className="block text-xl font-bold text-amber-700">
                  0
                </span>
                <span className="text-[11px] font-medium text-amber-600">
                  Approved Leaves
                </span>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function DrawerStatusBadge({
  status,
}: {
  status: Student["status"];
}) {
  if (status === "active") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        Active
      </span>
    );
  }

  if (status === "defaulter") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-medium text-rose-700">
        <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
        Defaulter
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
      Pending Fee
    </span>
  );
}

