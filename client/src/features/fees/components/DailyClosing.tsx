"use client";

import { useState } from "react";
import { Download, Lock, Printer, Undo2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/EmptyState";
import { FormStatus, TextField } from "@/components/shared/FormFields";
import { StatCard } from "@/components/shared/StatCard";
import { useToday } from "@/features/attendance/hooks";
import { useReadOnly } from "@/hooks/use-academics";
import { useCan, useCurrentBranch } from "@/hooks/use-session";
import { useUrlParam } from "@/hooks/use-url-state";
import { downloadFile, toCsv } from "@/lib/csv";
import { monthLabel } from "@/lib/fees";
import { formatDate, formatRupees } from "@/lib/format";
import {
  errorMessage,
  useCloseDayMutation,
  useGetDayClosingsQuery,
  useGetPaymentsQuery,
  useGetStudentsQuery,
  useGetVouchersQuery,
  useReversePaymentMutation,
} from "@/store/api";
import type { Payment, PaymentMethod } from "@/types";

const methodLabels: Record<PaymentMethod, string> = { cash: "Cash", bank: "Bank", easypaisa: "Mobile wallet", cheque: "Cheque" };
const METHODS: PaymentMethod[] = ["cash", "bank", "easypaisa", "cheque"];

function ReverseDialog({ payment, onClose, onDone }: { payment: Payment; onClose: () => void; onDone: (msg: string) => void }) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [reverse, { isLoading }] = useReversePaymentMutation();
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await reverse({ id: payment.id, reason });
    if ("error" in result) return setError(errorMessage(result.error));
    onClose();
    onDone(`Receipt ${payment.receiptNo} reversed. The voucher shows the amount as owed again.`);
  };
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <form onSubmit={submit} noValidate className="flex flex-col gap-5">
          <DialogHeader>
            <DialogTitle>Reverse receipt {payment.receiptNo}</DialogTitle>
            <DialogDescription>
              {formatRupees(payment.amount + payment.lateFine)} goes back on the voucher. The receipt stays on record, marked reversed, with your reason.
            </DialogDescription>
          </DialogHeader>
          <TextField id="reverse-reason" label="Reason" placeholder="e.g. Cheque returned by the bank" value={reason} onChange={(e) => setReason(e.target.value)} />
          {error ? <FormStatus error={error} /> : null}
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>Keep payment</DialogClose>
            <Button type="submit" variant="destructive" disabled={isLoading}>
              Reverse payment
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** A day's collections at the campus, the cash count, and closing the day. */
export function DailyClosing() {
  const readOnly = useReadOnly();
  const today = useToday();
  const branch = useCurrentBranch();
  const canCollect = useCan("fin_collect_fee");
  const canReverse = useCan("fin_waive_fee") && !readOnly;
  const { data: payments = [] } = useGetPaymentsQuery();
  const { data: vouchers = [] } = useGetVouchersQuery();
  const { data: students = [] } = useGetStudentsQuery();
  const { data: closings = [] } = useGetDayClosingsQuery();
  const [closeDay, { isLoading: closing }] = useCloseDayMutation();
  const [dateParam, setDate] = useUrlParam("day", "");
  const [cash, setCash] = useState("");
  const [note, setNote] = useState("");
  const [reversing, setReversing] = useState<Payment | null>(null);
  const [notice, setNotice] = useState<{ ok?: string; error?: string }>({});
  const date = dateParam || today || "";

  const dayPayments = payments
    .filter((p) => p.branchId === branch?.id && p.at.slice(0, 10) === date)
    .sort((a, b) => a.at.localeCompare(b.at));
  const valid = dayPayments.filter((p) => !p.reversed);
  const totals = Object.fromEntries(METHODS.map((m) => [m, valid.filter((p) => p.method === m).reduce((n, p) => n + p.amount + p.lateFine, 0)])) as Record<PaymentMethod, number>;
  const grand = METHODS.reduce((n, m) => n + totals[m], 0);
  const fines = valid.reduce((n, p) => n + p.lateFine, 0);
  const closed = closings.find((c) => c.branchId === branch?.id && c.date === date);
  const cashCounted = cash === "" ? null : Number(cash);
  const difference = cashCounted === null ? null : cashCounted - totals.cash;

  const close = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!branch || cashCounted === null) return setNotice({ error: "Count the cash in the drawer and enter the total." });
    const result = await closeDay({ branchId: branch.id, date, totals, cashCounted, ...(note.trim() ? { note: note.trim() } : {}) });
    if ("error" in result) return setNotice({ error: errorMessage(result.error) });
    setNotice({ ok: `${formatDate(date)} is closed. Payments on this day can no longer be reversed.` });
  };

  const exportCsv = () =>
    downloadFile(
      `collections-${branch?.code ?? "campus"}-${date}.csv`,
      toCsv([
        ["Time", "Receipt", "Roll ID", "Student", "Voucher month", "Method", "Amount (Rs)", "Late fine (Rs)", "Collected by", "Reversed"],
        ...dayPayments.map((p) => {
          const v = vouchers.find((x) => x.id === p.voucherId);
          return [
            new Date(p.at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
            p.receiptNo,
            p.studentId,
            students.find((s) => s.id === p.studentId)?.name,
            v ? monthLabel(v.month) : "",
            methodLabels[p.method],
            p.amount,
            p.lateFine,
            p.by,
            p.reversed ? `Yes: ${p.reversed.reason}` : "",
          ];
        }),
        [],
        ["Total collected", "", "", "", "", "", grand],
      ])
    );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="w-44">
          <label htmlFor="closing-date" className="mb-1.5 block text-sm font-medium">
            Date
          </label>
          <Input id="closing-date" type="date" value={date} max={today ?? undefined} onChange={(e) => setDate(e.target.value === today ? "" : e.target.value)} className="h-9 bg-card" />
        </div>
        {notice.ok || notice.error ? <FormStatus success={notice.ok} error={notice.error} /> : null}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Collected" value={formatRupees(grand)} footer={`${valid.length} receipts${fines ? `, ${formatRupees(fines)} in late fines` : ""}`} />
        <StatCard label="Cash" value={formatRupees(totals.cash)} footer="Should be in the drawer" />
        <StatCard label="Bank and mobile" value={formatRupees(totals.bank + totals.easypaisa)} footer="Check against the bank statement" />
        <StatCard label="Cheques" value={formatRupees(totals.cheque)} footer={closed ? <Badge variant="success">Day closed</Badge> : "To deposit"} />
      </div>

      <Card className="gap-0 py-0">
        <div className="flex flex-col gap-3 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <h2 className="text-base font-semibold">Receipts{date ? `, ${formatDate(date)}` : ""}</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">Every payment taken at this campus on the day.</p>
          </div>
          <Button variant="outline" size="sm" onClick={exportCsv} disabled={dayPayments.length === 0}>
            <Download data-icon="inline-start" />
            Download report
          </Button>
        </div>
        {dayPayments.length === 0 ? (
          <EmptyState icon={Printer} title="No payments on this day" description="Payments taken at the counter appear here." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="hidden pl-5 md:table-cell">Time</TableHead>
                <TableHead className="pl-5 md:pl-3">Receipt</TableHead>
                <TableHead className="hidden lg:table-cell">Method</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="pr-5 text-right">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dayPayments.map((p) => {
                const s = students.find((x) => x.id === p.studentId);
                return (
                  <TableRow key={p.id} className={p.reversed ? "text-muted-foreground" : undefined}>
                    <TableCell className="hidden pl-5 tabular-nums md:table-cell">
                      {new Date(p.at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                    </TableCell>
                    <TableCell className="pl-5 whitespace-normal md:pl-3">
                      <p className="font-medium">
                        {p.receiptNo} <span className="font-normal">{s?.name ?? p.studentId}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {methodLabels[p.method]}, by {p.by}
                        {p.reversed ? `. Reversed: ${p.reversed.reason}` : ""}
                      </p>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">{methodLabels[p.method]}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      <span className={p.reversed ? "line-through" : "font-medium"}>{formatRupees(p.amount + p.lateFine)}</span>
                      {p.reversed ? <Badge variant="neutral" className="ml-2">Reversed</Badge> : null}
                    </TableCell>
                    <TableCell className="pr-5 text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon-sm" aria-label={`Print receipt ${p.receiptNo}`} onClick={() => window.open(`/print/receipts/${p.id}`, "_blank", "noopener")}>
                          <Printer />
                        </Button>
                        {canReverse && !p.reversed && !closed ? (
                          <Button variant="ghost" size="icon-sm" aria-label={`Reverse receipt ${p.receiptNo}`} onClick={() => setReversing(p)} className="text-muted-foreground hover:bg-danger-tint hover:text-danger">
                            <Undo2 />
                          </Button>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>

      <Card className="gap-5 px-6">
        <div>
          <CardTitle>
            <h2>Close the day</h2>
          </CardTitle>
          <CardDescription className="mt-0.5">Count the cash in the drawer. Once closed, the day&apos;s payments can&apos;t be reversed.</CardDescription>
        </div>
        {closed ? (
          <p className="flex items-center gap-2 rounded-lg border border-success/30 bg-success-tint p-3 text-sm text-success">
            <Lock aria-hidden className="size-4 shrink-0" />
            Closed by {closed.closedBy}. Cash counted {formatRupees(closed.cashCounted)} against {formatRupees(closed.totals.cash)} expected
            {closed.cashCounted !== closed.totals.cash ? ` (${closed.cashCounted > closed.totals.cash ? "over" : "short"} by ${formatRupees(Math.abs(closed.cashCounted - closed.totals.cash))})` : ""}.
          </p>
        ) : (
          <form onSubmit={close} noValidate className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <TextField id="cash-counted" label="Cash counted (Rs)" inputMode="numeric" value={cash} onChange={(e) => setCash(e.target.value.replace(/\D/g, ""))} />
              <div className="flex flex-col justify-end rounded-lg bg-muted px-3 py-2 text-sm">
                <span className="text-muted-foreground">Difference from {formatRupees(totals.cash)} expected</span>
                <span className={`text-base font-semibold tabular-nums ${difference ? "text-danger" : ""}`}>
                  {difference === null ? "—" : difference === 0 ? "Matches" : `${difference > 0 ? "Over" : "Short"} by ${formatRupees(Math.abs(difference))}`}
                </span>
              </div>
              <TextField id="closing-note" label="Note (optional)" placeholder="e.g. Rs 500 short, recounted twice" value={note} onChange={(e) => setNote(e.target.value)} />
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={readOnly || !canCollect || closing || cash === "" || !date || (today !== null && date > today)}>
                <Lock data-icon="inline-start" />
                Close {date ? formatDate(date) : "the day"}
              </Button>
            </div>
          </form>
        )}
      </Card>

      {reversing ? <ReverseDialog payment={reversing} onClose={() => setReversing(null)} onDone={(msg) => setNotice({ ok: msg })} /> : null}
    </div>
  );
}
