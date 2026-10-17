/*
 * Demo fee data until the API exists. Read it through @/store/api.
 * Vouchers for August to October 2026 are generated for Lahore Central from
 * each student's fee status, with matching payments, on fixed dates so the
 * server and browser build the same data.
 */
import { buildVoucher, settleVoucher } from "@/lib/fees";
import type { Concession, DayClosing, FeeHead, FeePlan, FeeReminder, FeeVoucher, Payment, PaymentMethod } from "@/types";
import { classes } from "./academics";
import { students } from "./students";

export const feeHeads: FeeHead[] = [
  { id: "tuition", name: "Tuition", frequency: "monthly", discountable: true },
  { id: "lab", name: "Lab and computer", frequency: "monthly", discountable: false },
  { id: "exam", name: "Exam fee", frequency: "term", termMonths: ["10", "03"], discountable: false },
  { id: "annual", name: "Annual charges", frequency: "term", termMonths: ["04"], discountable: false },
  { id: "admission", name: "Admission fee", frequency: "one_time", discountable: false },
];

export const feePlans: FeePlan[] = classes.map((c) => ({
  id: `plan-${c.id}`,
  branchId: c.branchId,
  classId: c.id,
  amounts: {
    tuition: c.order <= 5 ? 2500 : c.order <= 8 ? 2800 : 3000,
    lab: c.order <= 5 ? 0 : c.order <= 8 ? 300 : 500,
    exam: c.order <= 5 ? 300 : 500,
    annual: 2000,
    admission: 5000,
  },
}));

export const concessions: Concession[] = [
  { id: "con-sibling", name: "Sibling", percent: 10 },
  { id: "con-staff", name: "Staff child", percent: 50 },
  { id: "con-merit", name: "Merit scholarship", percent: 25 },
  { id: "con-need", name: "Need-based", percent: 30 },
];

const months = ["2026-08", "2026-09", "2026-10"];
const methods: PaymentMethod[] = ["cash", "cash", "bank", "easypaisa", "cash", "cheque"];
const active = students.filter((s) => s.branchId === "br-1" && (s.enrollment === "active" || s.withdrawal?.date && s.withdrawal.date >= "2026-08-01"));

const vouchersRaw: FeeVoucher[] = [];
const paymentsRaw: Omit<Payment, "receiptNo">[] = [];

for (const s of active) {
  const roll = Number(s.id.replace(/\D/g, ""));
  // How many of the latest months are unpaid, from the student's fee status.
  const unpaidFrom = s.feeStatus === "defaulter" ? 1 : s.feeStatus === "pending" ? 2 : 3;
  months.forEach((month, i) => {
    if (s.enrollment === "withdrawn" && month > (s.withdrawal?.date ?? "").slice(0, 7)) return;
    const plan = feePlans.find((p) => p.classId === s.classId);
    const voucher = buildVoucher(s, month, plan, feeHeads, { issueDate: `${month}-01`, dueDate: `${month}-10` });
    vouchersRaw.push(voucher);
    const day = month === "2026-10" ? 1 + (roll % 16) : 2 + (roll % 8);
    const at = `${month}-${String(day).padStart(2, "0")}T${String(9 + (roll % 5)).padStart(2, "0")}:${String((roll * 7) % 60).padStart(2, "0")}:00`;
    const base = { voucherId: voucher.id, studentId: s.id, branchId: s.branchId, lateFine: 0, method: methods[roll % methods.length], at, by: "Ali Raza (Accountant)" };
    if (i < unpaidFrom) paymentsRaw.push({ ...base, id: `pay-${voucher.id}`, amount: voucher.totalAmount });
    // Zainab Tariq has paid half of October.
    else if (s.id === "STD-1046" && month === "2026-10") paymentsRaw.push({ ...base, id: `pay-${voucher.id}`, amount: 1500, at: "2026-10-12T11:20:00" });
  });
}

export const payments: Payment[] = paymentsRaw
  .sort((a, b) => a.at.localeCompare(b.at))
  .map((p, i) => ({ ...p, receiptNo: `REC-${String(i + 1).padStart(5, "0")}` }));

export const vouchers: FeeVoucher[] = vouchersRaw.map((v) => settleVoucher(v, payments));

export const dayClosings: DayClosing[] = [];
export const feeReminders: FeeReminder[] = [];
