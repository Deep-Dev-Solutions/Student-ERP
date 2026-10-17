/*
 * Fee calculations shared by the demo data, the API and the screens, so a
 * voucher's total, balance, status and late fine are worked out one way.
 */
import type { FeeHead, FeePlan, FeeVoucher, Payment, SchoolRules, Student, VoucherLine } from "@/types";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** "2026-10" -> "October 2026" */
export function monthLabel(month: string) {
  const [y, m] = month.split("-").map(Number);
  return m ? `${MONTHS[m - 1]} ${y}` : month;
}

/** What's still owed on a voucher (late fines aren't part of it). */
export const voucherBalance = (v: Pick<FeeVoucher, "totalAmount" | "paidAmount" | "status">) =>
  v.status === "cancelled" ? 0 : Math.max(0, v.totalAmount - v.paidAmount);

/** The last day a voucher can be paid without a late fine. */
export function graceEnds(v: Pick<FeeVoucher, "dueDate">, rules: SchoolRules | undefined) {
  const d = new Date(`${v.dueDate}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + (rules?.fees.graceDays ?? 0));
  return d.toISOString().slice(0, 10);
}

export type VoucherState = "paid" | "partial" | "unpaid" | "overdue" | "cancelled";

/** Status to show: overdue once the due date has passed with something still owed. */
export function voucherState(v: FeeVoucher, today: string | null): VoucherState {
  if (v.status === "cancelled") return "cancelled";
  if (voucherBalance(v) === 0) return "paid";
  if (today && v.dueDate < today) return "overdue";
  return v.paidAmount > 0 ? "partial" : "unpaid";
}

export const voucherStateLabels: Record<VoucherState, string> = {
  paid: "Paid",
  partial: "Partly paid",
  unpaid: "Unpaid",
  overdue: "Overdue",
  cancelled: "Cancelled",
};

/** Days past the due date, or 0. */
export function daysOverdue(v: Pick<FeeVoucher, "dueDate">, today: string) {
  const ms = new Date(`${today}T12:00:00Z`).getTime() - new Date(`${v.dueDate}T12:00:00Z`).getTime();
  return Math.max(0, Math.floor(ms / 86_400_000));
}

/** Late fine owed if paid on a date: per day after the grace period, from School rules. */
export function lateFineFor(v: FeeVoucher, onDate: string, rules: SchoolRules | undefined) {
  if (!rules || voucherBalance(v) === 0) return 0;
  const end = graceEnds(v, rules);
  if (onDate <= end) return 0;
  const days = daysOverdue({ dueDate: end }, onDate);
  // Capped at 30 days, so an old voucher's fine doesn't outgrow the fee itself.
  return Math.min(days, 30) * rules.fees.lateFinePerDay;
}

/** Builds a month's voucher lines for a student from their class's fee plan. */
export function voucherLines(student: Student, month: string, plan: FeePlan | undefined, heads: FeeHead[]): { lines: VoucherLine[]; discount: number } {
  const mm = month.slice(5, 7);
  const lines: VoucherLine[] = [];
  let discountable = 0;
  for (const head of heads) {
    let amount = head.id === "tuition" ? student.monthlyFee : (plan?.amounts[head.id] ?? 0);
    if (head.frequency === "term" && !head.termMonths?.includes(mm)) amount = 0;
    if (head.frequency === "one_time" && !student.admissionDate.startsWith(month)) amount = 0;
    if (amount <= 0) continue;
    lines.push({ headId: head.id, label: head.name, amount });
    if (head.discountable) discountable += amount;
  }
  return { lines, discount: Math.round((discountable * student.discountPercent) / 100) };
}

/** Builds an unpaid voucher. */
export function buildVoucher(
  student: Student,
  month: string,
  plan: FeePlan | undefined,
  heads: FeeHead[],
  dates: { issueDate: string; dueDate: string }
): FeeVoucher {
  const { lines, discount } = voucherLines(student, month, plan, heads);
  const roll = student.id.replace(/\D/g, "");
  return {
    id: `vch-${month}-${student.id}`,
    voucherNumber: `VCH-${month.slice(2, 4)}${month.slice(5, 7)}-${roll}`,
    studentId: student.id,
    branchId: student.branchId,
    classId: student.classId,
    sectionId: student.sectionId,
    month,
    ...dates,
    lines,
    discount,
    totalAmount: lines.reduce((n, l) => n + l.amount, 0) - discount,
    paidAmount: 0,
    status: "unpaid",
  };
}

/** A voucher's paid amount and status, recomputed from its payments. */
export function settleVoucher(v: FeeVoucher, payments: Payment[]): FeeVoucher {
  if (v.status === "cancelled") return v;
  const paidAmount = payments.filter((p) => p.voucherId === v.id && !p.reversed).reduce((n, p) => n + p.amount, 0);
  return { ...v, paidAmount, status: paidAmount >= v.totalAmount ? "paid" : paidAmount > 0 ? "partial" : "unpaid" };
}

/**
 * A student's balance and fee status from their vouchers. One unpaid voucher
 * is "fee pending"; two or more make a defaulter.
 */
export function feeStanding(studentId: string, vouchers: FeeVoucher[]): Pick<Student, "balance" | "feeStatus"> {
  const owed = vouchers.filter((v) => v.studentId === studentId && voucherBalance(v) > 0);
  return {
    balance: owed.reduce((n, v) => n + voucherBalance(v), 0),
    feeStatus: owed.length === 0 ? "clear" : owed.length === 1 ? "pending" : "defaulter",
  };
}
