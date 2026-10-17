"use client";

import { Wallet } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/EmptyState";
import { PrintToolbar } from "@/features/students/components/print/PrintToolbar";
import { SchoolLetterhead } from "@/features/students/components/print/SchoolLetterhead";
import { monthLabel } from "@/lib/fees";
import { formatRupees } from "@/lib/format";
import { useGetPayrollRunsQuery, useGetPayslipsQuery, useGetStaffQuery } from "@/store/api";

const methodLabels = { bank: "Bank transfer", cash: "Cash", cheque: "Cheque" } as const;

function Lines({ title, lines, total, totalLabel }: { title: string; lines: [string, number][]; total: number; totalLabel: string }) {
  return (
    <section className="rounded-lg border border-foreground/30 p-3">
      <h2 className="mb-2 font-semibold">{title}</h2>
      <dl className="space-y-1.5">
        {lines.map(([label, amount]) => (
          <div key={label} className="flex justify-between gap-4">
            <dt>{label}</dt>
            <dd className="tabular-nums">{formatRupees(amount)}</dd>
          </div>
        ))}
        <div className="flex justify-between border-t border-border pt-1.5 font-semibold">
          <dt>{totalLabel}</dt>
          <dd className="tabular-nums">{formatRupees(total)}</dd>
        </div>
      </dl>
    </section>
  );
}

/** A salary slip for one staff member and month. */
export function PayslipPrint({ payslipId }: { payslipId: string }) {
  const { data: payslips = [] } = useGetPayslipsQuery();
  const { data: runs = [] } = useGetPayrollRunsQuery();
  const { data: staff = [] } = useGetStaffQuery();
  const slip = payslips.find((p) => p.id === payslipId);
  if (!slip) {
    return <EmptyState icon={Wallet} title="We couldn't find this payslip" description="It may belong to another campus." action={<ButtonLink href="/staff?tab=payroll">Back to payroll</ButtonLink>} />;
  }
  const member = staff.find((m) => m.staffId === slip.staffId);
  const run = runs.find((r) => r.id === slip.runId);
  const earnings: [string, number][] = [["Basic salary", slip.basic], ...slip.allowances.map((a): [string, number] => [a.label, a.amount]), ...slip.adjustments.filter((a) => a.amount > 0).map((a): [string, number] => [a.label, a.amount])];
  const deductions: [string, number][] = [
    ...(slip.absentDeduction ? [[`Absent ${slip.absentDays} ${slip.absentDays === 1 ? "day" : "days"}`, slip.absentDeduction] as [string, number]] : []),
    ["Income tax", slip.tax],
    ...(slip.eobi ? [["EOBI", slip.eobi] as [string, number]] : []),
    ...(slip.advanceRecovery ? [["Advance instalment", slip.advanceRecovery] as [string, number]] : []),
    ...slip.adjustments.filter((a) => a.amount < 0).map((a): [string, number] => [a.label, -a.amount]),
  ];
  const rows: [string, string][] = [
    ["Name", `${member?.name ?? ""} (${slip.staffId})`],
    ["Designation", member ? `${member.role}, ${member.department}` : ""],
    ["CNIC", member?.cnic ?? "—"],
    ["Paid", slip.status === "paid" && slip.method ? `${methodLabels[slip.method]}${slip.method === "bank" && member?.bankAccount ? `, ${member.bankAccount}` : ""}` : "Not paid yet"],
  ];

  return (
    <>
      <PrintToolbar backHref="/staff?tab=payroll" backLabel="Back to payroll" />
      <article className="relative mx-auto max-w-[180mm] space-y-5 p-6 text-sm sm:p-10 print:max-w-none print:p-0">
        {run?.status === "draft" ? (
          <p aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center text-5xl font-bold text-warning/20">DRAFT</p>
        ) : null}
        <SchoolLetterhead title="Salary slip" meta={<>{monthLabel(slip.month)}</>} />
        <dl className="space-y-1.5">
          {rows.map(([label, value]) => (
            <div key={label} className="flex justify-between gap-4 border-b border-border pb-1">
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="text-right font-medium">{value}</dd>
            </div>
          ))}
        </dl>
        <div className="grid gap-4 sm:grid-cols-2 print:grid-cols-2">
          <Lines title="Earnings" lines={earnings} total={slip.gross} totalLabel="Gross pay" />
          <Lines title="Deductions" lines={deductions} total={slip.totalDeductions} totalLabel="Total deductions" />
        </div>
        <p className="flex justify-between rounded-lg border-2 border-foreground/60 p-3 text-base font-semibold">
          <span>Net pay</span>
          <span className="tabular-nums">{formatRupees(slip.net)}</span>
        </p>
        <div className="grid grid-cols-2 gap-8 pt-12 text-xs text-muted-foreground">
          <p className="border-t border-foreground/40 pt-1">Accountant</p>
          <p className="border-t border-foreground/40 pt-1 text-right">Received by employee</p>
        </div>
      </article>
    </>
  );
}
