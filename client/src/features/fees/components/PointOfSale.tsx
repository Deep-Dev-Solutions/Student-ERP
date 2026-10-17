"use client";

import { useState } from "react";
import {
  Card,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button, ButtonLink } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Search,
  Receipt,
  CheckCircle2,
  Printer,
  Wallet,
  Building2,
  Clock,
  Phone,
  Check,
  CreditCard,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/EmptyState";
import { useToday } from "@/features/attendance/hooks";
import { primaryGuardian } from "@/features/students/status";
import { usePlacement } from "@/features/students/hooks";
import { useReadOnly } from "@/hooks/use-academics";
import { useCan, useCurrentBranch } from "@/hooks/use-session";
import { useUrlParam } from "@/hooks/use-url-state";
import { lateFineFor, monthLabel, voucherBalance, voucherState, voucherStateLabels } from "@/lib/fees";
import { formatDate, formatRupees } from "@/lib/format";
import { errorMessage, useGetSchoolRulesQuery, useGetStudentsQuery, useGetVouchersQuery, useRecordPaymentMutation } from "@/store/api";
import { FeeVoucher, PaymentMethod } from "../types";

const paymentMethods: { value: PaymentMethod; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { value: "cash", label: "Cash", icon: Wallet },
  { value: "bank", label: "Bank", icon: Building2 },
  { value: "easypaisa", label: "Mobile", icon: CreditCard },
  { value: "cheque", label: "Cheque", icon: Receipt },
];

const stateVariant = { paid: "success", partial: "warning", unpaid: "warning", overdue: "danger", cancelled: "neutral" } as const;

export function PointOfSale() {
  const readOnly = useReadOnly();
  const today = useToday();
  const branch = useCurrentBranch();
  const canWaive = useCan("fin_waive_fee");
  const placement = usePlacement();
  const { data: allVouchers = [] } = useGetVouchersQuery();
  const { data: students = [] } = useGetStudentsQuery();
  const { data: rules } = useGetSchoolRulesQuery();
  const [recordPayment, { isLoading: recording }] = useRecordPaymentMutation();
  const [selectedId, setSelectedId] = useState<string>();
  const [searchQuery, setSearchQuery] = useUrlParam("find", "");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [amountReceived, setAmountReceived] = useState<string | null>(null);
  const [waiveFine, setWaiveFine] = useState(false);
  const [receipt, setReceipt] = useState<{ id: string; receiptNo: string; total: number; change: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const studentOf = (v: FeeVoucher) => students.find((s) => s.id === v.studentId);
  const atCampus = allVouchers.filter((v) => v.branchId === branch?.id && v.status !== "cancelled");
  const query = searchQuery.trim().toLowerCase();
  const digits = query.replace(/\D/g, "");

  // Outstanding vouchers, oldest due first. A search also finds paid ones.
  const vouchers = atCampus
    .filter((v) => {
      const s = studentOf(v);
      if (!query) return voucherBalance(v) > 0;
      return (
        s?.name.toLowerCase().includes(query) ||
        v.studentId.toLowerCase().includes(query) ||
        v.voucherNumber.toLowerCase().includes(query) ||
        (digits.length >= 4 && s?.guardians.some((g) => g.phone.replace(/\D/g, "").includes(digits)))
      );
    })
    .sort((a, b) => Number(voucherBalance(b) > 0) - Number(voucherBalance(a) > 0) || a.dueDate.localeCompare(b.dueDate));

  const selectedVoucher = vouchers.find((v) => v.id === selectedId) ?? atCampus.find((v) => v.id === selectedId) ?? vouchers[0];

  const handleSelectVoucher = (voucher: FeeVoucher) => {
    setSelectedId(voucher.id);
    setAmountReceived(null);
    setWaiveFine(false);
    setReceipt(null);
    setError(null);
  };

  if (!selectedVoucher) {
    return (
      <Card className="py-0">
        <EmptyState
          icon={Search}
          title={query ? "No vouchers match" : "Nothing awaiting payment"}
          description={query ? "Search by the student's name, roll ID, voucher number or guardian's phone." : "Every voucher at this campus is paid. Generate next month's vouchers from the Vouchers tab."}
          action={
            query ? (
              <Button variant="outline" onClick={() => setSearchQuery("")}>
                Clear search
              </Button>
            ) : undefined
          }
        />
      </Card>
    );
  }

  const student = studentOf(selectedVoucher);
  const due = voucherBalance(selectedVoucher);
  const fineOwed = today ? lateFineFor(selectedVoucher, today, rules) : 0;
  const fine = waiveFine ? 0 : fineOwed;
  const payable = due + fine;
  const received = amountReceived === null ? payable : Number(amountReceived) || 0;
  const applied = Math.min(Math.max(0, received - fine), due);
  const change = Math.max(0, received - payable);
  const isPaid = due === 0;
  const otherDues = atCampus.filter((v) => v.studentId === selectedVoucher.studentId && v.id !== selectedVoucher.id && voucherBalance(v) > 0);
  const where = student ? placement(student) : undefined;
  const breakdown = [
    ...selectedVoucher.lines.map((l) => ({ label: l.label, amount: l.amount })),
    ...(selectedVoucher.discount ? [{ label: "Discount", amount: -selectedVoucher.discount }] : []),
    ...(selectedVoucher.paidAmount ? [{ label: "Paid already", amount: -selectedVoucher.paidAmount }] : []),
    ...(fineOwed ? [{ label: waiveFine ? "Late fine (waived)" : "Late fine", amount: fine }] : []),
  ];

  const handleRecordPayment = async () => {
    setError(null);
    if (received < fine + 1) return setError(fine ? `Collect at least the late fine plus something towards the voucher (more than ${formatRupees(fine)}).` : "Enter the amount received.");
    const result = await recordPayment({ voucherId: selectedVoucher.id, method: paymentMethod, amount: applied, lateFine: fine });
    if ("error" in result) return setError(errorMessage(result.error));
    setReceipt({ id: result.data.id, receiptNo: result.data.receiptNo, total: applied + fine, change });
    setAmountReceived(null);
    setWaiveFine(false);
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      <div className="min-w-0 space-y-4 lg:col-span-7">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1">
            <Search aria-hidden className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Name, roll ID, voucher number or phone"
              aria-label="Search vouchers"
              className="h-9 bg-card pl-9"
            />
          </div>
          <p className="text-sm text-muted-foreground" aria-live="polite">
            <span className="font-medium text-foreground">{vouchers.filter((v) => voucherBalance(v) > 0).length}</span> awaiting payment
          </p>
        </div>

        {vouchers.length === 0 ? (
          <Card className="py-0">
            <EmptyState
              icon={Search}
              title="No vouchers match"
              description="Search by the student's name, roll ID, voucher number or guardian's phone."
              action={
                <Button variant="outline" onClick={() => setSearchQuery("")}>
                  Clear search
                </Button>
              }
            />
          </Card>
        ) : (
          <ul className="space-y-2" aria-label="Fee vouchers">
            {vouchers.map((voucher) => {
              const isSelected = selectedVoucher.id === voucher.id;
              const s = studentOf(voucher);
              const g = s ? primaryGuardian(s) : undefined;
              const p = s ? placement(s) : undefined;
              const state = voucherState(voucher, today);
              return (
                <li key={voucher.id}>
                  <button
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => handleSelectVoucher(voucher)}
                    className={`w-full rounded-xl border p-4 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/40 ${
                      isSelected
                        ? "border-primary bg-secondary/50 ring-1 ring-primary"
                        : "border-border bg-card hover:bg-muted/60"
                    }`}
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3">
                        <span
                          aria-hidden
                          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground"
                        >
                          {s?.avatar}
                        </span>
                        <div>
                          <p className="font-medium">
                            {s?.name ?? voucher.studentId}{" "}
                            <span className="font-normal text-muted-foreground">{voucher.studentId}</span>
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {p?.className}, {p?.sectionLabel} · {voucher.voucherNumber}, {monthLabel(voucher.month)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end sm:gap-1">
                        <p className="text-right">
                          <span className="text-base font-semibold">{formatRupees(voucherBalance(voucher) || voucher.totalAmount)}</span>
                          {voucher.paidAmount > 0 && voucherBalance(voucher) > 0 ? (
                            <span className="block text-xs text-muted-foreground">of {formatRupees(voucher.totalAmount)}</span>
                          ) : null}
                        </p>
                        <Badge variant={stateVariant[state]}>{voucherStateLabels[state]}</Badge>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-2.5 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <span className="text-foreground">{g?.name}</span>
                        <Phone aria-hidden className="size-3" />
                        {g?.phone}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock aria-hidden className="size-3.5" />
                        Due {formatDate(voucher.dueDate)}
                      </span>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="min-w-0 lg:col-span-5">
        <Card className="gap-5 px-6 lg:sticky lg:top-0">
          <div>
            <CardTitle>
              <h2>Take payment</h2>
            </CardTitle>
            <CardDescription className="mt-0.5">{branch?.name}</CardDescription>
          </div>

          {receipt ? (
            <div role="status" className="rounded-lg border border-success/30 bg-success-tint p-5 text-center">
              <span className="mx-auto flex size-11 items-center justify-center rounded-full bg-success text-success-foreground">
                <Check aria-hidden className="size-5" />
              </span>
              <p className="mt-3 text-base font-semibold text-success">Payment of {formatRupees(receipt.total)} recorded</p>
              <p className="mt-1 text-sm text-success">
                Receipt {receipt.receiptNo}
                {receipt.change ? `. Give back ${formatRupees(receipt.change)} in change.` : ""}
              </p>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                <ButtonLink href={`/print/receipts/${receipt.id}`} target="_blank" variant="outline" size="sm">
                  <Printer data-icon="inline-start" />
                  Print receipt
                </ButtonLink>
                <Button size="sm" onClick={() => setReceipt(null)}>
                  Next payment
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="rounded-lg border border-border bg-muted/50 p-3.5">
                <p className="font-medium">
                  {student?.name}{" "}
                  <span className="font-normal text-muted-foreground">{selectedVoucher.studentId}</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  {where?.className}, {where?.sectionLabel} · {selectedVoucher.voucherNumber}, {monthLabel(selectedVoucher.month)}
                </p>
              </div>

              <dl className="text-sm">
                {breakdown.map((row) => (
                  <div key={row.label} className="flex items-center justify-between border-b border-border py-2">
                    <dt className="text-muted-foreground">{row.label}</dt>
                    <dd className="tabular-nums">{row.amount < 0 ? `−${formatRupees(-row.amount)}` : formatRupees(row.amount)}</dd>
                  </div>
                ))}
                <div className="flex items-center justify-between pt-3">
                  <dt className="font-semibold">Total payable</dt>
                  <dd className="text-lg font-semibold tabular-nums">{formatRupees(payable)}</dd>
                </div>
              </dl>

              {otherDues.length ? (
                <p className="rounded-lg border border-warning/30 bg-warning-tint p-3 text-sm text-warning">
                  Also owed:{" "}
                  {otherDues.map((v, i) => (
                    <span key={v.id}>
                      {i ? ", " : ""}
                      <button type="button" onClick={() => handleSelectVoucher(v)} className="rounded font-medium underline outline-none focus-visible:ring-2 focus-visible:ring-ring/40">
                        {monthLabel(v.month)} {formatRupees(voucherBalance(v))}
                      </button>
                    </span>
                  ))}
                </p>
              ) : null}

              {isPaid ? (
                <p className="flex items-center gap-2 rounded-lg border border-success/30 bg-success-tint p-3 text-sm text-success">
                  <CheckCircle2 aria-hidden className="size-4 shrink-0" />
                  This voucher is already paid. Choose another one to take a payment.
                </p>
              ) : (
                <>
                  <fieldset>
                    <legend className="mb-2 text-sm font-medium">Payment method</legend>
                    <div className="grid grid-cols-4 gap-2" role="radiogroup" aria-label="Payment method">
                      {paymentMethods.map(({ value, label, icon: Icon }) => {
                        const checked = paymentMethod === value;
                        return (
                          <button
                            key={value}
                            type="button"
                            role="radio"
                            aria-checked={checked}
                            onClick={() => setPaymentMethod(value)}
                            className={`flex flex-col items-center justify-center gap-1 rounded-lg border p-2 text-xs font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/40 ${
                              checked
                                ? "border-primary bg-secondary text-secondary-foreground"
                                : "border-border bg-card text-muted-foreground hover:bg-muted"
                            }`}
                          >
                            <Icon aria-hidden className="size-4" />
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </fieldset>

                  {fineOwed && canWaive ? (
                    <label className="flex cursor-pointer items-center gap-2 text-sm">
                      <Checkbox checked={waiveFine} onCheckedChange={(c) => setWaiveFine(c)} />
                      Waive the {formatRupees(fineOwed)} late fine
                    </label>
                  ) : null}

                  <div>
                    <label htmlFor="amount-received" className="mb-1.5 block text-sm font-medium">
                      Amount received (Rs)
                    </label>
                    <Input
                      id="amount-received"
                      type="number"
                      inputMode="numeric"
                      value={amountReceived ?? String(payable)}
                      onChange={(e) => setAmountReceived(e.target.value)}
                      className="h-11 bg-card text-base font-semibold tabular-nums"
                    />
                    <p className="mt-2 flex items-center justify-between rounded-lg bg-muted px-3 py-2 text-sm">
                      <span className="text-muted-foreground">{received < payable ? "Still owed after this" : "Change to return"}</span>
                      <span className="font-semibold tabular-nums">{formatRupees(received < payable ? payable - Math.max(received, 0) : change)}</span>
                    </p>
                  </div>

                  {error ? (
                    <p role="alert" className="flex items-center gap-2 text-sm text-danger">
                      <AlertCircle aria-hidden className="size-4 shrink-0" />
                      {error}
                    </p>
                  ) : null}

                  <Button
                    size="lg"
                    className="h-12 w-full text-base"
                    onClick={handleRecordPayment}
                    disabled={readOnly || recording || received <= fine}
                  >
                    <ShieldCheck data-icon="inline-start" className="size-5" />
                    {applied < due ? `Record part payment of ${formatRupees(applied + fine)}` : `Record payment of ${formatRupees(payable)}`}
                  </Button>
                </>
              )}
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
