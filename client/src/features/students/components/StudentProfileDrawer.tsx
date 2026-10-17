import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { formatPercent, formatRupees } from "@/lib/format";
import { statusVariant } from "@/lib/status";
import { useGetVouchersQuery } from "@/store/api";
import { useToday } from "@/features/attendance/hooks";
import { monthLabel, voucherState, voucherStateLabels } from "@/lib/fees";
import { formatDate } from "@/lib/format";
import type { Student } from "@/types";
import { usePlacement } from "../hooks";
import { attendanceBreakdown, primaryGuardian, studentStatus, studentStatusLabels } from "../status";

interface StudentProfileDrawerProps {
  student: Student | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}


/** Quick view from the directory; the full record is on the profile page. */
export function StudentProfileDrawer({ student, open, onOpenChange }: StudentProfileDrawerProps) {
  const placement = usePlacement();
  const { data: vouchers = [] } = useGetVouchersQuery();
  const today = useToday();
  if (!student) return null;

  const where = placement(student);
  const guardian = primaryGuardian(student);
  const status = studentStatus(student);
  const feeHistory = vouchers.filter((v) => v.studentId === student.id && v.status !== "cancelled").sort((a, b) => b.month.localeCompare(a.month));
  const days = attendanceBreakdown(student);
  const attendanceSummary = [
    { label: "Days present", value: days.present },
    { label: "Days absent", value: days.absent },
    { label: "Approved leave", value: days.leave },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 overflow-y-auto p-0 sm:max-w-lg">
        <SheetHeader className="border-b border-border p-6">
          <div className="flex items-center gap-4">
            <span
              aria-hidden
              className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-primary text-lg font-semibold text-primary-foreground"
            >
              {student.avatar}
            </span>
            <div className="min-w-0 flex-1 text-left">
              <div className="flex flex-wrap items-center gap-2">
                <SheetTitle className="text-lg font-semibold">{student.name}</SheetTitle>
                <Badge variant={statusVariant(status)}>{studentStatusLabels[status]}</Badge>
              </div>
              <SheetDescription className="mt-0.5">
                {student.id}, {where.className}, {where.sectionLabel}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-6 p-6">
          <dl className="grid grid-cols-2 gap-4 rounded-lg border border-border p-4">
            <div>
              <dt className="text-xs text-muted-foreground">Father or guardian</dt>
              <dd className="mt-0.5 font-medium">{guardian?.name ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Phone (WhatsApp)</dt>
              <dd className="mt-0.5 font-medium">{guardian?.phone ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Attendance this term</dt>
              <dd className="mt-0.5 font-medium">{formatPercent(student.attendance)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Outstanding balance</dt>
              <dd className="mt-0.5 font-medium">{formatRupees(student.balance)}</dd>
            </div>
          </dl>

          <section>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold">Fee vouchers</h3>
              <ButtonLink href={`/fees?find=${student.id}`} variant="link" size="sm" className="h-auto px-0">
                Collect a fee
              </ButtonLink>
            </div>
            {feeHistory.length === 0 ? (
              <p className="rounded-lg border border-border p-3 text-sm text-muted-foreground">No vouchers this session yet.</p>
            ) : (
              <ul className="divide-y divide-border rounded-lg border border-border">
                {feeHistory.map((row) => (
                  <li key={row.id} className="flex items-center justify-between gap-3 p-3">
                    <div>
                      <p className="font-medium">{monthLabel(row.month)}</p>
                      <p className="text-xs text-muted-foreground">
                        {row.voucherNumber}, due {formatDate(row.dueDate)}
                      </p>
                    </div>
                    <Badge variant={statusVariant(voucherState(row, today))}>
                      {voucherStateLabels[voucherState(row, today)]} {formatRupees(row.totalAmount)}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h3 className="mb-3 text-sm font-semibold">Attendance this term</h3>
            <dl className="grid grid-cols-3 gap-3">
              {attendanceSummary.map((item) => (
                <div key={item.label} className="rounded-lg border border-border p-3">
                  <dt className="text-xs text-muted-foreground">{item.label}</dt>
                  <dd className="mt-1 text-2xl font-semibold">{item.value}</dd>
                </div>
              ))}
            </dl>
          </section>

          <ButtonLink href={`/students/${student.id}`} className="w-full">
            Open full profile
          </ButtonLink>
        </div>
      </SheetContent>
    </Sheet>
  );
}
