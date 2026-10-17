export type StaffStatus = "active" | "on_leave" | "terminated";

export interface SalaryComponent {
  label: string;
  amount: number;
}

export interface StaffMember {
  /** Internal id, e.g. st-1. */
  id: string;
  /** Employee number shown to people, e.g. STF-201. */
  staffId: string;
  name: string;
  avatar: string;
  email: string;
  /** 0300-1234567 */
  phone: string;
  /** Job title, e.g. "Senior Physics Lecturer". */
  role: string;
  department: string;
  joinDate: string;
  status: StaffStatus;
  branchId: string;
  gender: "male" | "female";
  cnic?: string;
  address?: string;
  qualification?: string;
  employment: "permanent" | "contract" | "visiting";
  /** Teaching staff appear in allocations and class incharge lists. */
  teaches: boolean;
  basicSalary: number;
  allowances: SalaryComponent[];
  bankAccount?: string;
  left?: { date: string; reason: string };
}

/** A teacher as offered in pickers (the staff number is the id). */
export interface TeacherOption {
  id: string;
  name: string;
  avatar: string;
}

/** One teacher teaching one subject to one section. */
export interface TeacherAllocation {
  id: string;
  /** Staff number, e.g. STF-201. */
  teacherId: string;
  subjectId: string;
  classId: string;
  sectionId: string;
  weeklyPeriods: number;
}

export interface Advance {
  id: string;
  /** Staff number. */
  staffId: string;
  amount: number;
  date: string;
  reason: string;
  /** Taken from each month's pay until repaid. */
  monthlyRecovery: number;
  recovered: number;
}

export interface PayrollRun {
  id: string;
  branchId: string;
  /** "YYYY-MM" */
  month: string;
  status: "draft" | "finalised" | "paid";
  createdAt: string;
  createdBy: string;
  finalisedAt?: string;
}

export interface Payslip {
  id: string;
  runId: string;
  /** Staff number. */
  staffId: string;
  month: string;
  basic: number;
  allowances: SalaryComponent[];
  /** One-off additions (positive) or deductions (negative) for the month. */
  adjustments: SalaryComponent[];
  absentDays: number;
  absentDeduction: number;
  advanceRecovery: number;
  tax: number;
  eobi: number;
  gross: number;
  totalDeductions: number;
  net: number;
  /** Teaching load from allocations, for reference. */
  periodsPerWeek: number;
  status: "draft" | "paid";
  paidAt?: string;
  method?: "bank" | "cash" | "cheque";
}
