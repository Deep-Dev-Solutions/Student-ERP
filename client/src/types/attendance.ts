export type AttendanceStatus = "present" | "absent" | "leave";

export interface AttendanceMark {
  status: AttendanceStatus;
  remark?: string;
}

/** A mark changed after the register was first submitted. */
export interface RegisterChange {
  at: string;
  by: string;
  studentId: string;
  from: AttendanceStatus;
  to: AttendanceStatus;
  /** Why the register was reopened (empty before it was locked). */
  reason: string;
}

/** One class register: a section on a date (and a subject, in subject-wise mode). */
export interface AttendanceRegister {
  /** `${sectionId}:${date}` or `${sectionId}:${date}:${subjectId}` */
  id: string;
  branchId: string;
  classId: string;
  sectionId: string;
  date: string;
  subjectId?: string;
  /** Marks by student roll ID. */
  marks: Record<string, AttendanceMark>;
  submittedAt: string;
  submittedBy: string;
  lockedAt?: string;
  lockedBy?: string;
  /** Set when an admin reopens a locked register; cleared when it's locked again. */
  reopened?: { at: string; by: string; reason: string };
  alertsSentAt?: string;
  changes: RegisterChange[];
}

export interface UnlockRequest {
  id: string;
  registerId: string;
  reason: string;
  requestedBy: string;
  requestedAt: string;
  status: "pending" | "approved" | "declined";
  decidedBy?: string;
  decidedAt?: string;
}

export type StaffAttendanceStatus = "present" | "absent" | "leave" | "late";

export interface StaffAttendanceDay {
  /** `${branchId}:${date}` */
  id: string;
  branchId: string;
  date: string;
  marks: Record<string, StaffAttendanceStatus>;
  savedAt: string;
  savedBy: string;
}

export interface RegisterKey {
  sectionId: string;
  date: string;
  subjectId?: string;
}

export const registerId = ({ sectionId, date, subjectId }: RegisterKey) =>
  subjectId ? `${sectionId}:${date}:${subjectId}` : `${sectionId}:${date}`;
