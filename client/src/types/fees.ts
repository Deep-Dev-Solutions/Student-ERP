export type PaymentMethod = "cash" | "bank" | "cheque" | "easypaisa";

/** A kind of charge, e.g. tuition or exam fee. */
export interface FeeHead {
  id: string;
  name: string;
  /** Monthly heads go on every voucher; term heads only in the months chosen. */
  frequency: "monthly" | "term" | "one_time";
  /** Months a term head is charged, as "MM". */
  termMonths?: string[];
  /** Discounts apply to this head (tuition, usually). */
  discountable: boolean;
}

/** What each class pays, per fee head, at one campus. */
export interface FeePlan {
  id: string;
  branchId: string;
  classId: string;
  /** Amounts by fee head id. Tuition here is the default; a student's own monthly fee overrides it. */
  amounts: Record<string, number>;
}

/** A named discount, e.g. staff child or merit scholarship. */
export interface Concession {
  id: string;
  name: string;
  percent: number;
}

export interface VoucherLine {
  headId: string;
  label: string;
  amount: number;
}

/** One month's fee voucher (challan) for a student. */
export interface FeeVoucher {
  id: string;
  voucherNumber: string;
  studentId: string;
  branchId: string;
  classId: string;
  sectionId: string;
  /** Billing month, "YYYY-MM". */
  month: string;
  issueDate: string;
  dueDate: string;
  lines: VoucherLine[];
  discount: number;
  /** Lines minus discount. */
  totalAmount: number;
  /** Sum of payments that weren't reversed, late fines excluded. */
  paidAmount: number;
  /** Stored status; overdue is worked out from the due date when shown. */
  status: "unpaid" | "partial" | "paid" | "cancelled";
  cancelled?: { at: string; by: string; reason: string };
}

export interface Payment {
  id: string;
  receiptNo: string;
  voucherId: string;
  studentId: string;
  branchId: string;
  /** Applied to the voucher. */
  amount: number;
  /** Charged on top for paying late. */
  lateFine: number;
  method: PaymentMethod;
  /** ISO date-time. */
  at: string;
  by: string;
  reversed?: { at: string; by: string; reason: string };
}

/** A cashier's end-of-day count. */
export interface DayClosing {
  id: string;
  branchId: string;
  date: string;
  /** Expected totals by method, from the day's payments. */
  totals: Record<PaymentMethod, number>;
  cashCounted: number;
  note?: string;
  closedAt: string;
  closedBy: string;
}

/** A reminder sent to a guardian about overdue fees. */
export interface FeeReminder {
  id: string;
  studentId: string;
  at: string;
  by: string;
}

export interface PaymentInput {
  voucherId: string;
  method: PaymentMethod;
  amount: number;
  lateFine: number;
  /** A client-generated id for this attempt, so a retried request (flaky network, a double tap) doesn't charge twice. */
  idempotencyKey?: string;
}
