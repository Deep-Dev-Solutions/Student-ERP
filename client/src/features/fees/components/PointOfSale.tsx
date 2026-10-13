"use client";

import { useState } from "react";
import {
  Card,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/EmptyState";
import { statusVariant } from "@/lib/status";
import { FeeVoucher, PaymentMethod } from "../types";

const voucherStatusLabels: Record<FeeVoucher["status"], string> = {
  unpaid: "Unpaid",
  partial: "Partly paid",
  overdue: "Overdue",
  paid: "Paid",
};

const paymentMethods: { value: PaymentMethod; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { value: "cash", label: "Cash", icon: Wallet },
  { value: "bank", label: "Bank", icon: Building2 },
  { value: "easypaisa", label: "Mobile", icon: CreditCard },
  { value: "cheque", label: "Cheque", icon: Receipt },
];

const mockVouchers: FeeVoucher[] = [
  {
    id: "vch-1",
    voucherNumber: "VCH-2026-1042",
    studentId: "STD-1042",
    studentName: "Ahmed Khan",
    avatar: "AK",
    className: "Class 9",
    section: "Section A",
    guardianName: "Muhammad Khan",
    guardianPhone: "0300-1234567",
    month: "October 2026",
    dueDate: "Oct 15, 2026",
    tuitionFee: 3000,
    examFee: 500,
    labFee: 300,
    arrears: 0,
    totalAmount: 3800,
    status: "unpaid",
  },
  {
    id: "vch-2",
    voucherNumber: "VCH-2026-1043",
    studentId: "STD-1043",
    studentName: "Fatima Ali",
    avatar: "FA",
    className: "Class 10",
    section: "Section B",
    guardianName: "Ali Asghar",
    guardianPhone: "0333-7654321",
    month: "October 2026",
    dueDate: "Oct 10, 2026",
    tuitionFee: 3000,
    examFee: 500,
    labFee: 500,
    arrears: 6000,
    totalAmount: 10000,
    status: "overdue",
  },
  {
    id: "vch-3",
    voucherNumber: "VCH-2026-1044",
    studentId: "STD-1044",
    studentName: "Muhammad Bilal",
    avatar: "MB",
    className: "Class 9",
    section: "Section A",
    guardianName: "Bilal Tariq",
    guardianPhone: "0321-9876543",
    month: "October 2026",
    dueDate: "Oct 15, 2026",
    tuitionFee: 3000,
    examFee: 500,
    labFee: 0,
    arrears: 0,
    totalAmount: 3500,
    status: "unpaid",
  },
  {
    id: "vch-4",
    voucherNumber: "VCH-2026-1045",
    studentId: "STD-1045",
    studentName: "Ayesha Noor",
    avatar: "AN",
    className: "Class 10",
    section: "Section A",
    guardianName: "Noor Hassan",
    guardianPhone: "0345-5544332",
    month: "October 2026",
    dueDate: "Oct 12, 2026",
    tuitionFee: 3000,
    examFee: 500,
    labFee: 500,
    arrears: 1500,
    totalAmount: 5500,
    status: "partial",
  },
  {
    id: "vch-5",
    voucherNumber: "VCH-2026-1046",
    studentId: "STD-1046",
    studentName: "Zainab Tariq",
    avatar: "ZT",
    className: "Class 9",
    section: "Section C",
    guardianName: "Tariq Mehmood",
    guardianPhone: "0312-3322110",
    month: "October 2026",
    dueDate: "Oct 15, 2026",
    tuitionFee: 3000,
    examFee: 0,
    labFee: 0,
    arrears: 3000,
    totalAmount: 6000,
    status: "overdue",
  },
];

export function PointOfSale() {
  const [vouchers, setVouchers] = useState<FeeVoucher[]>(mockVouchers);
  const [selectedVoucher, setSelectedVoucher] = useState<FeeVoucher>(mockVouchers[0]);
  const [searchQuery, setSearchQuery] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [amountReceived, setAmountReceived] = useState<string>(
    mockVouchers[0].totalAmount.toString()
  );
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [lastReceiptNumber, setLastReceiptNumber] = useState<string>("");

  const handleSelectVoucher = (voucher: FeeVoucher) => {
    setSelectedVoucher(voucher);
    setAmountReceived(voucher.totalAmount.toString());
    setPaymentSuccess(false);
  };

  const numericReceived = parseFloat(amountReceived) || 0;
  const balanceReturn = Math.max(0, numericReceived - selectedVoucher.totalAmount);

  const handleRecordPayment = () => {
    const receiptNo = `REC-${Math.floor(100000 + Math.random() * 900000)}`;
    setLastReceiptNumber(receiptNo);
    setPaymentSuccess(true);

    // Update local voucher list to marked as paid
    setVouchers((prev) =>
      prev.map((v) =>
        v.id === selectedVoucher.id
          ? { ...v, status: "paid" }
          : v
      )
    );
  };

  const filteredVouchers = vouchers.filter(
    (v) =>
      v.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.studentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.voucherNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.guardianPhone.includes(searchQuery)
  );

  const isPaid = selectedVoucher.status === "paid";
  const breakdown = [
    { label: "Tuition", amount: selectedVoucher.tuitionFee },
    { label: "Exam fee", amount: selectedVoucher.examFee },
    { label: "Lab and computer", amount: selectedVoucher.labFee },
    { label: "Arrears and late fine", amount: selectedVoucher.arrears },
  ].filter((row) => row.amount > 0);

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
            <span className="font-medium text-foreground">
              {filteredVouchers.filter((v) => v.status !== "paid").length}
            </span>{" "}
            awaiting payment
          </p>
        </div>

        {filteredVouchers.length === 0 ? (
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
            {filteredVouchers.map((voucher) => {
              const isSelected = selectedVoucher?.id === voucher.id;
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
                          {voucher.avatar}
                        </span>
                        <div>
                          <p className="font-medium">
                            {voucher.studentName}{" "}
                            <span className="font-normal text-muted-foreground">{voucher.studentId}</span>
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {voucher.className}, {voucher.section} · {voucher.voucherNumber}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end sm:gap-1">
                        <p className="text-right">
                          <span className="text-base font-semibold">Rs {voucher.totalAmount.toLocaleString()}</span>
                          {voucher.arrears > 0 ? (
                            <span className="block text-xs text-muted-foreground">
                              includes Rs {voucher.arrears.toLocaleString()} arrears
                            </span>
                          ) : null}
                        </p>
                        <Badge variant={statusVariant(voucher.status)}>{voucherStatusLabels[voucher.status]}</Badge>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-2.5 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <span className="text-foreground">{voucher.guardianName}</span>
                        <Phone aria-hidden className="size-3" />
                        {voucher.guardianPhone}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock aria-hidden className="size-3.5" />
                        Due {voucher.dueDate}
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
            <CardDescription className="mt-0.5">Counter 1</CardDescription>
          </div>

          {paymentSuccess ? (
            <div role="status" className="rounded-lg border border-success/30 bg-success-tint p-5 text-center">
              <span className="mx-auto flex size-11 items-center justify-center rounded-full bg-success text-success-foreground">
                <Check aria-hidden className="size-5" />
              </span>
              <p className="mt-3 text-base font-semibold text-success">Payment recorded</p>
              <p className="mt-1 text-sm text-success">Receipt {lastReceiptNumber}</p>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                <Button variant="outline" size="sm">
                  <Printer data-icon="inline-start" />
                  Print receipt
                </Button>
                <Button size="sm" onClick={() => setPaymentSuccess(false)}>
                  Next payment
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="rounded-lg border border-border bg-muted/50 p-3.5">
                <p className="font-medium">
                  {selectedVoucher.studentName}{" "}
                  <span className="font-normal text-muted-foreground">{selectedVoucher.studentId}</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  {selectedVoucher.className}, {selectedVoucher.section} · {selectedVoucher.voucherNumber},{" "}
                  {selectedVoucher.month}
                </p>
              </div>

              <dl className="text-sm">
                {breakdown.map((row) => (
                  <div key={row.label} className="flex items-center justify-between border-b border-border py-2">
                    <dt className="text-muted-foreground">{row.label}</dt>
                    <dd className="tabular-nums">Rs {row.amount.toLocaleString()}</dd>
                  </div>
                ))}
                <div className="flex items-center justify-between pt-3">
                  <dt className="font-semibold">Total payable</dt>
                  <dd className="text-lg font-semibold tabular-nums">
                    Rs {selectedVoucher.totalAmount.toLocaleString()}
                  </dd>
                </div>
              </dl>

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

                  <div>
                    <label htmlFor="amount-received" className="mb-1.5 block text-sm font-medium">
                      Amount received (Rs)
                    </label>
                    <Input
                      id="amount-received"
                      type="number"
                      inputMode="numeric"
                      value={amountReceived}
                      onChange={(e) => setAmountReceived(e.target.value)}
                      className="h-11 bg-card text-base font-semibold tabular-nums"
                    />
                    <p className="mt-2 flex items-center justify-between rounded-lg bg-muted px-3 py-2 text-sm">
                      <span className="text-muted-foreground">Change to return</span>
                      <span className="font-semibold tabular-nums">Rs {balanceReturn.toLocaleString()}</span>
                    </p>
                  </div>

                  <Button
                    size="lg"
                    className="h-12 w-full text-base"
                    onClick={handleRecordPayment}
                    disabled={numericReceived < selectedVoucher.totalAmount}
                  >
                    <ShieldCheck data-icon="inline-start" className="size-5" />
                    Record payment of Rs {selectedVoucher.totalAmount.toLocaleString()}
                  </Button>
                  {numericReceived < selectedVoucher.totalAmount ? (
                    <p className="-mt-2 text-center text-sm text-muted-foreground">
                      Enter at least the total payable to record the payment.
                    </p>
                  ) : null}
                </>
              )}
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
