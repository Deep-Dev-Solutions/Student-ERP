export type PaymentMethod = "cash" | "bank" | "cheque" | "easypaisa";

export interface FeeVoucher {
  id: string;
  voucherNumber: string;
  studentId: string;
  studentName: string;
  avatar: string;
  className: string;
  section: string;
  guardianName: string;
  guardianPhone: string;
  month: string;
  dueDate: string;
  tuitionFee: number;
  examFee: number;
  labFee: number;
  arrears: number;
  totalAmount: number;
  status: "unpaid" | "partial" | "overdue" | "paid";
}

export interface DefaulterRecord {
  id: string;
  studentId: string;
  studentName: string;
  avatar: string;
  className: string;
  section: string;
  guardianName: string;
  guardianPhone: string;
  monthsUnpaid: string[];
  lastPaymentDate?: string;
  totalArrears: number;
  daysOverdue: number;
  status: "defaulter" | "critical" | "warning";
}

export interface PaymentInput {
  voucherId: string;
  method: PaymentMethod;
  amount: number;
}
