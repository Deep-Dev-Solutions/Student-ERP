"use client";

import { Receipt } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/EmptyState";
import { PrintToolbar } from "@/features/students/components/print/PrintToolbar";
import { SchoolLetterhead } from "@/features/students/components/print/SchoolLetterhead";
import { usePlacement } from "@/features/students/hooks";
import { primaryGuardian } from "@/features/students/status";
import { monthLabel, voucherBalance } from "@/lib/fees";
import { formatRupees } from "@/lib/format";
import { useGetPaymentsQuery, useGetStudentsQuery, useGetVouchersQuery } from "@/store/api";

const methodLabels = { cash: "Cash", bank: "Bank transfer", easypaisa: "Mobile wallet", cheque: "Cheque" } as const;

/** A fee receipt for one payment. */
export function ReceiptPrint({ paymentId }: { paymentId: string }) {
  const { data: payments = [] } = useGetPaymentsQuery();
  const { data: vouchers = [] } = useGetVouchersQuery();
  const { data: students = [] } = useGetStudentsQuery();
  const placement = usePlacement();
  const payment = payments.find((p) => p.id === paymentId);
  if (!payment) {
    return <EmptyState icon={Receipt} title="We couldn't find this receipt" description="It may belong to another campus." action={<ButtonLink href="/fees">Back to fees</ButtonLink>} />;
  }
  const voucher = vouchers.find((v) => v.id === payment.voucherId);
  const student = students.find((s) => s.id === payment.studentId);
  const where = student ? placement(student) : undefined;
  const rows: [string, string][] = [
    ["Student", `${student?.name ?? ""} (${payment.studentId})`],
    ["Class", where ? `${where.className}, section ${where.sectionName}` : ""],
    ["Father or guardian", student ? (primaryGuardian(student)?.name ?? "") : ""],
    ["For", voucher ? `${monthLabel(voucher.month)}, voucher ${voucher.voucherNumber}` : ""],
    ["Paid by", methodLabels[payment.method]],
    ["Received by", payment.by],
  ];

  return (
    <>
      <PrintToolbar backHref="/fees" backLabel="Back to fees" />
      <article className="relative mx-auto max-w-[148mm] space-y-5 p-6 text-sm sm:p-10 print:max-w-[148mm] print:p-0">
        {payment.reversed ? (
          <p aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center text-5xl font-bold text-danger/20">REVERSED</p>
        ) : null}
        <SchoolLetterhead
          title="Fee receipt"
          meta={
            <>
              {payment.receiptNo}
              <br />
              {new Date(payment.at).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" })}
            </>
          }
        />
        <dl className="space-y-1.5">
          {rows.map(([label, value]) => (
            <div key={label} className="flex justify-between gap-4 border-b border-border pb-1">
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="text-right font-medium">{value}</dd>
            </div>
          ))}
        </dl>
        <dl className="space-y-1.5 rounded-lg border border-foreground/30 p-3">
          <div className="flex justify-between">
            <dt>Fee paid</dt>
            <dd className="tabular-nums">{formatRupees(payment.amount)}</dd>
          </div>
          {payment.lateFine ? (
            <div className="flex justify-between">
              <dt>Late fine</dt>
              <dd className="tabular-nums">{formatRupees(payment.lateFine)}</dd>
            </div>
          ) : null}
          <div className="flex justify-between border-t border-border pt-1.5 text-base font-semibold">
            <dt>Total received</dt>
            <dd className="tabular-nums">{formatRupees(payment.amount + payment.lateFine)}</dd>
          </div>
          {voucher ? (
            <div className="flex justify-between text-muted-foreground">
              <dt>Still owed on this voucher</dt>
              <dd className="tabular-nums">{formatRupees(voucherBalance(voucher))}</dd>
            </div>
          ) : null}
        </dl>
        {payment.reversed ? <p className="text-danger">Reversed by {payment.reversed.by}: {payment.reversed.reason}</p> : null}
        <p className="pt-8 text-xs text-muted-foreground">This is a computer-generated receipt. Keep it until the end of the session.</p>
      </article>
    </>
  );
}
