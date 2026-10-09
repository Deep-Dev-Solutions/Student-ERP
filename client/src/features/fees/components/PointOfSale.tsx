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
  AlertCircle,
  CreditCard,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { FeeVoucher, PaymentMethod } from "../types";

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

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      {/* ========================================================= */}
      {/* LEFT COLUMN: SEARCH & PENDING VOUCHERS LIST (7 COLS)      */}
      {/* ========================================================= */}
      <div className="space-y-4 lg:col-span-7">
        {/* Search & Filter Header Card */}
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by student name, roll ID, voucher #, or phone..."
                className="h-9 rounded-lg border-slate-200 bg-slate-50/70 pl-9 text-xs transition-colors focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="font-semibold text-slate-800">
                {filteredVouchers.filter((v) => v.status !== "paid").length}
              </span>
              <span>vouchers awaiting payment</span>
            </div>
          </div>
        </div>

        {/* Vouchers List Container */}
        <div className="space-y-3">
          {filteredVouchers.map((voucher) => {
            const isSelected = selectedVoucher?.id === voucher.id;
            return (
              <div
                key={voucher.id}
                onClick={() => handleSelectVoucher(voucher)}
                className={`relative cursor-pointer rounded-xl border p-4.5 transition-all duration-150 ${
                  isSelected
                    ? "border-blue-500 bg-blue-50/30 shadow-xs ring-1 ring-blue-500/30"
                    : "border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50/70 shadow-xs"
                }`}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  {/* Left: Student Identity */}
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-semibold text-blue-700 ring-1 ring-blue-600/10">
                      {voucher.avatar}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">
                          {voucher.studentName}
                        </span>
                        <span className="font-mono text-[11px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200/50">
                          {voucher.studentId}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                        <span>
                          {voucher.className} ({voucher.section})
                        </span>
                        <span>•</span>
                        <span className="font-mono text-slate-400">
                          {voucher.voucherNumber}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Amount & Status Badge */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-0 pt-2 sm:pt-0 border-slate-100">
                    <div className="text-right">
                      <span className="text-base font-bold text-slate-900">
                        Rs {voucher.totalAmount.toLocaleString()}
                      </span>
                      {voucher.arrears > 0 && (
                        <p className="text-[11px] font-medium text-rose-600">
                          Includes Rs {voucher.arrears.toLocaleString()} Arrears
                        </p>
                      )}
                    </div>
                    <div className="mt-1">
                      <VoucherStatusBadge status={voucher.status} />
                    </div>
                  </div>
                </div>

                {/* Sub-bar with Guardian Info and Due Date */}
                <div className="mt-3 flex items-center justify-between border-t border-slate-100/80 pt-2.5 text-xs text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400">Guardian:</span>
                    <span className="font-medium text-slate-700">
                      {voucher.guardianName}
                    </span>
                    <span className="text-slate-300">|</span>
                    <Phone className="h-3 w-3 text-slate-400" />
                    <span className="font-mono text-slate-600">
                      {voucher.guardianPhone}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                    <span>Due: {voucher.dueDate}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================= */}
      {/* RIGHT COLUMN: PAYMENT TERMINAL CARD (5 COLS)              */}
      {/* ========================================================= */}
      <div className="lg:col-span-5">
        <Card className="sticky top-20 rounded-xl border border-slate-200/80 bg-white p-6 shadow-sm">
          {/* Terminal Top Badge */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <Receipt className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold text-slate-900">
                  Cashier POS Terminal
                </CardTitle>
                <CardDescription className="text-[11px] text-slate-500">
                  Counter #01 • Cashier Desk
                </CardDescription>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Ready
            </span>
          </div>

          {/* Success Banner when Payment Recorded */}
          {paymentSuccess ? (
            <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50/70 p-5 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 ring-4 ring-emerald-200/50">
                <Check className="h-6 w-6" />
              </div>
              <h3 className="mt-3 text-base font-bold text-emerald-900">
                Payment Recorded!
              </h3>
              <p className="mt-1 text-xs text-emerald-700 font-mono">
                Receipt #{lastReceiptNumber} generated
              </p>
              <div className="mt-4 flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 border-emerald-300 bg-white text-xs text-emerald-800 hover:bg-emerald-50 shadow-xs"
                >
                  <Printer className="mr-1.5 h-3.5 w-3.5" />
                  Print Receipt
                </Button>
                <Button
                  size="sm"
                  onClick={() => setPaymentSuccess(false)}
                  className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium shadow-xs"
                >
                  New Transaction
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-5 space-y-5">
              {/* Selected Student Banner */}
              <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    Selected Student
                  </span>
                  <span className="font-mono text-[11px] font-bold text-slate-700">
                    {selectedVoucher.studentId}
                  </span>
                </div>
                <div className="mt-1.5 flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900">
                    {selectedVoucher.studentName}
                  </span>
                  <span className="text-slate-400">•</span>
                  <span className="text-slate-600">
                    {selectedVoucher.className} ({selectedVoucher.section})
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Voucher: {selectedVoucher.voucherNumber} ({selectedVoucher.month})
                </p>
              </div>

              {/* Itemized Fee Breakdown Table */}
              <div className="space-y-2 text-xs">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                  Bill Breakdown
                </span>
                <div className="flex items-center justify-between py-1 border-b border-slate-100 text-slate-600">
                  <span>Tuition Fee</span>
                  <span className="font-mono">
                    Rs {selectedVoucher.tuitionFee.toLocaleString()}
                  </span>
                </div>
                {selectedVoucher.examFee > 0 && (
                  <div className="flex items-center justify-between py-1 border-b border-slate-100 text-slate-600">
                    <span>Examination Fee</span>
                    <span className="font-mono">
                      Rs {selectedVoucher.examFee.toLocaleString()}
                    </span>
                  </div>
                )}
                {selectedVoucher.labFee > 0 && (
                  <div className="flex items-center justify-between py-1 border-b border-slate-100 text-slate-600">
                    <span>Lab / Computer Charges</span>
                    <span className="font-mono">
                      Rs {selectedVoucher.labFee.toLocaleString()}
                    </span>
                  </div>
                )}
                {selectedVoucher.arrears > 0 && (
                  <div className="flex items-center justify-between py-1 border-b border-slate-100 text-rose-600 font-medium">
                    <span>Past Arrears / Late Fine</span>
                    <span className="font-mono">
                      + Rs {selectedVoucher.arrears.toLocaleString()}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 text-sm font-bold text-slate-900">
                  <span>Total Amount Payable</span>
                  <span className="text-base text-blue-600 font-mono">
                    Rs {selectedVoucher.totalAmount.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Payment Method Selector */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Payment Method
                </label>
                <div className="grid grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("cash")}
                    className={`flex flex-col items-center justify-center rounded-lg border p-2 text-xs transition-all ${
                      paymentMethod === "cash"
                        ? "border-blue-600 bg-blue-50/80 font-bold text-blue-700 shadow-xs"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <Wallet className="h-4 w-4 mb-1" />
                    <span>Cash</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod("bank")}
                    className={`flex flex-col items-center justify-center rounded-lg border p-2 text-xs transition-all ${
                      paymentMethod === "bank"
                        ? "border-blue-600 bg-blue-50/80 font-bold text-blue-700 shadow-xs"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <Building2 className="h-4 w-4 mb-1" />
                    <span>Bank</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod("easypaisa")}
                    className={`flex flex-col items-center justify-center rounded-lg border p-2 text-xs transition-all ${
                      paymentMethod === "easypaisa"
                        ? "border-blue-600 bg-blue-50/80 font-bold text-blue-700 shadow-xs"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <CreditCard className="h-4 w-4 mb-1" />
                    <span>Mobile</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod("cheque")}
                    className={`flex flex-col items-center justify-center rounded-lg border p-2 text-xs transition-all ${
                      paymentMethod === "cheque"
                        ? "border-blue-600 bg-blue-50/80 font-bold text-blue-700 shadow-xs"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <Receipt className="h-4 w-4 mb-1" />
                    <span>Cheque</span>
                  </button>
                </div>
              </div>

              {/* Amount Input & Calculation */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Amount Received (PKR)
                </label>
                <div className="relative">
                  <Input
                    type="number"
                    value={amountReceived}
                    onChange={(e) => setAmountReceived(e.target.value)}
                    className="h-11 rounded-lg border-slate-300 font-mono text-base font-bold text-slate-900 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                {/* Change return indicator */}
                <div className="mt-2 flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-xs">
                  <span className="text-slate-500">Change / Return to Parent:</span>
                  <span className="font-mono font-bold text-emerald-700">
                    Rs {balanceReturn.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Large 'Record Payment' Action Button */}
              <Button
                onClick={handleRecordPayment}
                disabled={numericReceived < selectedVoucher.totalAmount}
                className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-sm rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                <ShieldCheck className="h-5 w-5" />
                <span>Record Payment (Rs {selectedVoucher.totalAmount.toLocaleString()})</span>
              </Button>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
                <Printer className="h-3 w-3" />
                <span>Auto-generates official stamped fee receipt.</span>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function VoucherStatusBadge({
  status,
}: {
  status: FeeVoucher["status"];
}) {
  if (status === "paid") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        Paid
      </span>
    );
  }

  if (status === "overdue") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-medium text-rose-700">
        <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
        Overdue
      </span>
    );
  }

  if (status === "partial") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
        Partial
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
      <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
      Unpaid
    </span>
  );
}

