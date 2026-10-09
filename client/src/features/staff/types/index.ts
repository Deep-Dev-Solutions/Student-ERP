export type StaffStatus = "active" | "on_leave" | "terminated";

export interface StaffMember {
  id: string;
  staffId: string;
  name: string;
  avatar: string;
  email: string;
  role: string;
  department: string;
  phone: string;
  joinDate: string;
  status: StaffStatus;
}

export interface TeacherAllocation {
  id: string;
  teacherId: string;
  teacherName: string;
  avatar: string;
  subject: string;
  className: string;
  section: string;
  weeklyPeriods: number;
  roomNumber: string;
}

export interface PayrollRecord {
  id: string;
  staffId: string;
  name: string;
  avatar: string;
  role: string;
  department: string;
  baseSalary: number;
  allowances: number;
  deductions: number;
  netSalary: number;
  month: string;
  status: "paid" | "processing" | "pending";
}

