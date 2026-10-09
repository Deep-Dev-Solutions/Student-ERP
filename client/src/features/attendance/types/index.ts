export type AttendanceStatus = "P" | "A" | "L";

export interface StudentAttendanceRecord {
  id: string;
  name: string;
  email: string;
  avatar: string;
  status: AttendanceStatus;
  remark?: string;
  guardianPhone: string;
}

export interface ClassLockRecord {
  id: string;
  className: string;
  section: string;
  teacher: string;
  totalStudents: number;
  present: number;
  absent: number;
  leave: number;
  status: "locked" | "pending";
  lockedAt?: string;
}

