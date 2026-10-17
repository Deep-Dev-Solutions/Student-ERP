"use client";

import { useGetCampusProfileQuery, useGetSchoolRulesQuery, useGetStudentsQuery, useGetVouchersQuery } from "@/store/api";
import { usePlacement } from "@/features/students/hooks";
import { primaryGuardian } from "@/features/students/status";
import { graceEnds, monthLabel, voucherBalance } from "@/lib/fees";
import { formatDate, formatRupees } from "@/lib/format";
import { useCurrentBranch } from "@/hooks/use-session";
import type { FeeVoucher } from "@/types";

const COPIES = ["Bank copy", "School copy", "Student copy"];

/** One voucher as a three-part challan (bank, school, student) with cut lines, for A4. */
export function VoucherChallan({ voucher }: { voucher: FeeVoucher }) {
  const { data: profile } = useGetCampusProfileQuery();
  const { data: rules } = useGetSchoolRulesQuery();
  const { data: students = [] } = useGetStudentsQuery();
  const { data: vouchers = [] } = useGetVouchersQuery();
  const branch = useCurrentBranch();
  const placement = usePlacement();
  const student = students.find((s) => s.id === voucher.studentId);
  const guardian = student ? primaryGuardian(student) : undefined;
  const where = student ? placement(student) : undefined;
  const previousDues = vouchers
    .filter((v) => v.studentId === voucher.studentId && v.id !== voucher.id && v.month < voucher.month)
    .reduce((n, v) => n + voucherBalance(v), 0);
  const payable = voucher.status === "cancelled" ? 0 : voucher.totalAmount - voucher.paidAmount;

  return (
    <div className="break-after-page space-y-0 text-[0.72rem] leading-snug last:break-after-auto">
      {COPIES.map((copy, i) => (
        <section key={copy} className={`relative break-inside-avoid py-3 ${i < COPIES.length - 1 ? "border-b-2 border-dashed border-foreground/40" : ""}`} aria-label={copy}>
          {voucher.status === "cancelled" ? (
            <p aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center text-5xl font-bold text-danger/20">CANCELLED</p>
          ) : voucherBalance(voucher) === 0 ? (
            <p aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center text-5xl font-bold text-success/20">PAID</p>
          ) : null}
          <div className="flex items-start justify-between gap-4 border-b border-foreground pb-1.5">
            <div>
              <p className="text-sm font-semibold">{profile?.schoolName}</p>
              <p className="text-muted-foreground">
                {branch?.name}, {profile?.city}. {profile?.contactPhone}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold">Fee voucher</p>
              <p className="text-muted-foreground">{copy}</p>
            </div>
          </div>
          <div className="mt-1.5 grid grid-cols-2 gap-x-6 gap-y-0.5 sm:grid-cols-4">
            {[
              ["Voucher no.", voucher.voucherNumber],
              ["Month", monthLabel(voucher.month)],
              ["Issued", formatDate(voucher.issueDate)],
              ["Due", formatDate(voucher.dueDate)],
              ["Student", student?.name ?? voucher.studentId],
              ["Roll ID", voucher.studentId],
              ["Class", where ? `${where.className}, section ${where.sectionName}` : ""],
              ["Father or guardian", guardian?.name ?? ""],
            ].map(([label, value]) => (
              <div key={label}>
                <span className="text-muted-foreground">{label}: </span>
                <span className="font-medium">{value}</span>
              </div>
            ))}
          </div>
          <div className="mt-1.5 flex gap-6">
            <table className="w-full border-collapse">
              <tbody>
                {voucher.lines.map((l) => (
                  <tr key={l.headId} className="border-b border-border">
                    <td className="py-0.5">{l.label}</td>
                    <td className="py-0.5 text-right tabular-nums">{formatRupees(l.amount)}</td>
                  </tr>
                ))}
                {voucher.discount ? (
                  <tr className="border-b border-border">
                    <td className="py-0.5">Discount</td>
                    <td className="py-0.5 text-right tabular-nums">−{formatRupees(voucher.discount)}</td>
                  </tr>
                ) : null}
                {voucher.paidAmount ? (
                  <tr className="border-b border-border">
                    <td className="py-0.5">Paid already</td>
                    <td className="py-0.5 text-right tabular-nums">−{formatRupees(voucher.paidAmount)}</td>
                  </tr>
                ) : null}
                <tr>
                  <td className="py-1 font-semibold">Payable by {formatDate(graceEnds(voucher, rules))}</td>
                  <td className="py-1 text-right text-sm font-semibold tabular-nums">{formatRupees(payable)}</td>
                </tr>
              </tbody>
            </table>
            <div className="w-56 shrink-0 space-y-1 text-muted-foreground">
              {previousDues ? <p className="font-medium text-foreground">Previous dues not on this voucher: {formatRupees(previousDues)}</p> : null}
              <p>
                After {formatDate(graceEnds(voucher, rules))}, a late fine of {formatRupees(rules?.fees.lateFinePerDay ?? 0)} a day is added.
              </p>
              <p className="pt-4">Received by: ____________</p>
              <p>Stamp and date</p>
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}
