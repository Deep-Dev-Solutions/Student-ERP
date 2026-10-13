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
import { studentStatusLabels } from "../status";
import { Student } from "../types";

interface StudentProfileDrawerProps {
  student: Student | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const feeHistory = [
  { period: "October 2026 tuition", detail: "Paid in cash on 3 Oct 2026", amount: "Rs 3,000" },
  { period: "September 2026 tuition", detail: "Paid by bank transfer on 5 Sep 2026", amount: "Rs 3,000" },
];

const attendanceSummary = [
  { label: "Days present", value: 18 },
  { label: "Days absent", value: 2 },
  { label: "Approved leave", value: 0 },
];

export function StudentProfileDrawer({ student, open, onOpenChange }: StudentProfileDrawerProps) {
  if (!student) return null;

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
                <Badge variant={statusVariant(student.status)}>{studentStatusLabels[student.status]}</Badge>
              </div>
              <SheetDescription className="mt-0.5">
                {student.id}, {student.class}, {student.section}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-6 p-6">
          <dl className="grid grid-cols-2 gap-4 rounded-lg border border-border p-4">
            <div>
              <dt className="text-xs text-muted-foreground">Father or guardian</dt>
              <dd className="mt-0.5 font-medium">{student.guardian}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Phone (WhatsApp)</dt>
              <dd className="mt-0.5 font-medium">{student.phone}</dd>
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
              <h3 className="text-sm font-semibold">Fee history</h3>
              <ButtonLink href="/fees" variant="link" size="sm" className="h-auto px-0">
                Open fee ledger
              </ButtonLink>
            </div>
            <ul className="divide-y divide-border rounded-lg border border-border">
              {feeHistory.map((row) => (
                <li key={row.period} className="flex items-center justify-between gap-3 p-3">
                  <div>
                    <p className="font-medium">{row.period}</p>
                    <p className="text-xs text-muted-foreground">{row.detail}</p>
                  </div>
                  <Badge variant="success">Paid {row.amount}</Badge>
                </li>
              ))}
            </ul>
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
        </div>
      </SheetContent>
    </Sheet>
  );
}
