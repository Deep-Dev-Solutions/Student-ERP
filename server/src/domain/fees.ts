/*
 * Pure business rules ported from client/src/lib/fees.ts, so a voucher's total,
 * balance, status and late fine are worked out the same way as the mock.
 */

export interface VoucherLine {
  headId: string;
  label: string;
  amount: number;
}

export interface VoucherLike {
  totalAmount: number;
  paidAmount: number;
  status: string;
  dueDate: string;
}

export interface FeesRules {
  dueDay: number;
  lateFinePerDay: number;
  graceDays: number;
  siblingDiscountPercent: number;
}

/** What's still owed on a voucher (late fines aren't part of it). */
export const voucherBalance = (v: Pick<VoucherLike, "totalAmount" | "paidAmount" | "status">) =>
  v.status === "cancelled" ? 0 : Math.max(0, v.totalAmount - v.paidAmount);

/** The last day a voucher can be paid without a late fine. */
export function graceEnds(dueDate: string, graceDays: number): string {
  const d = new Date(`${dueDate}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + graceDays);
  return d.toISOString().slice(0, 10);
}

export type VoucherState = "paid" | "partial" | "unpaid" | "overdue" | "cancelled";

/** Status to show: overdue once the due date has passed with something still owed. */
export function voucherState(v: VoucherLike, today: string): VoucherState {
  if (v.status === "cancelled") return "cancelled";
  if (voucherBalance(v) === 0) return "paid";
  if (v.dueDate < today) return "overdue";
  return v.paidAmount > 0 ? "partial" : "unpaid";
}

/** Days past a date, or 0. */
export function daysPast(from: string, today: string): number {
  const ms = new Date(`${today}T12:00:00Z`).getTime() - new Date(`${from}T12:00:00Z`).getTime();
  return Math.max(0, Math.floor(ms / 86_400_000));
}

/** Late fine owed if paid on a date: per day after the grace period. Capped at 30 days. */
export function lateFineFor(v: VoucherLike, onDate: string, rules: FeesRules): number {
  if (voucherBalance(v) === 0) return 0;
  const end = graceEnds(v.dueDate, rules.graceDays);
  if (onDate <= end) return 0;
  const days = daysPast(end, onDate);
  return Math.min(days, 30) * rules.lateFinePerDay;
}

export interface StudentLike {
  id: string;
  monthlyFee: number;
  discountPercent: number;
  admissionDate: string;
}
export interface FeeHeadLike {
  id: string;
  name: string;
  frequency: "monthly" | "term" | "one_time";
  termMonths: string[];
  discountable: boolean;
}
export interface FeePlanLike {
  amounts: Record<string, number>;
}

/** Builds a month's voucher lines for a student from their class's fee plan. */
export function voucherLines(student: StudentLike, month: string, plan: FeePlanLike | undefined, heads: FeeHeadLike[]): { lines: VoucherLine[]; discount: number } {
  const mm = month.slice(5, 7);
  const lines: VoucherLine[] = [];
  let discountable = 0;
  for (const head of heads) {
    let amount = head.id === "tuition" ? student.monthlyFee : (plan?.amounts[head.id] ?? 0);
    if (head.frequency === "term" && !head.termMonths.includes(mm)) amount = 0;
    if (head.frequency === "one_time" && !student.admissionDate.startsWith(month)) amount = 0;
    if (amount <= 0) continue;
    lines.push({ headId: head.id, label: head.name, amount });
    if (head.discountable) discountable += amount;
  }
  return { lines, discount: Math.round((discountable * student.discountPercent) / 100) };
}

/** A student's balance and fee status from their vouchers: one unpaid voucher is "pending", two+ make a "defaulter". */
export function feeStanding(vouchers: Pick<VoucherLike, "totalAmount" | "paidAmount" | "status">[]): { balance: number; feeStatus: "clear" | "pending" | "defaulter" } {
  const owed = vouchers.filter((v) => voucherBalance(v) > 0);
  return {
    balance: owed.reduce((n, v) => n + voucherBalance(v), 0),
    feeStatus: owed.length === 0 ? "clear" : owed.length === 1 ? "pending" : "defaulter",
  };
}

/** "VCH-2610-1042" from the billing month and the student's roll number. */
export function buildVoucherNumber(month: string, studentId: string): string {
  const roll = studentId.replace(/\D/g, "");
  return `VCH-${month.slice(2, 4)}${month.slice(5, 7)}-${roll}`;
}

/** "2026-10" -> "October 2026", kept for parity with the mock though the API doesn't render it. */
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
export function monthLabel(month: string): string {
  const [y, m] = month.split("-").map(Number);
  return m ? `${MONTHS[m - 1]} ${y}` : month;
}
