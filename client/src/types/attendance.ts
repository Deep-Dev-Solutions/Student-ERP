export type AttendanceStatus = "present" | "absent" | "leave";

/** One student on a class register (admin view). */
export interface StudentAttendanceRecord {
  id: string;
  name: string;
  email: string;
  avatar: string;
  status: AttendanceStatus;
  remark?: string;
  guardianPhone: string;
}

/** One student on a teacher's mobile register. */
export interface StudentAttendanceItem {
  id: string;
  rollNo: string;
  name: string;
  avatar: string;
  status: AttendanceStatus;
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
