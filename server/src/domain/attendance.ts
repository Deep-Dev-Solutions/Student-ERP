/*
 * Pure business rules ported from the mock queryFns and useRegisterPermissions in
 * client/src/store/api.ts and client/src/features/attendance/hooks.ts.
 */

export type AttendanceStatus = "present" | "absent" | "leave";
export interface AttendanceMark {
  status: AttendanceStatus;
  remark?: string;
}
export interface RegisterChange {
  at: string;
  by: string;
  studentId: string;
  from: AttendanceStatus;
  to: AttendanceStatus;
  reason: string;
}

export type AttendanceMode = "class_incharge" | "subject_wise" | "single_marker" | "admin_oversight";
export type SchoolRole = "owner" | "branch_admin" | "accountant" | "front_desk" | "teacher" | "super_admin";

export interface Holiday {
  date: string;
  name: string;
}

/** Why there's no register on a date, or null on a school day. */
export function holidayOn(date: string, holidays: Holiday[]): string | null {
  if (!date) return null;
  if (new Date(`${date}T12:00:00Z`).getUTCDay() === 0) return "Sunday";
  return holidays.find((h) => h.date === date)?.name ?? null;
}

/** Whether a register is past the lock window in School rules (the client's soft-lock signal). */
export function isPastLockWindow(submittedAt: string, date: string, today: string, lockAfterHours: number): boolean {
  if (lockAfterHours === 0) return date < today;
  return Date.now() - new Date(submittedAt).getTime() > lockAfterHours * 3600 * 1000;
}

export interface SectionLike {
  id: string;
  inchargeId?: string | null;
}

/**
 * What the signed-in user may do with a section's register, following the attendance mode
 * in School rules (client/src/features/attendance/hooks.ts useRegisterPermissions).
 */
export function canMarkRegister(args: {
  role: SchoolRole;
  staffId?: string;
  mode: AttendanceMode;
  section: SectionLike | null | undefined;
  subjectId?: string;
  /** true if an allocation makes this teacher responsible for this subject in this section (Phase 4; always false until then). */
  hasSubjectAllocation: boolean;
  hasAttMarkDailyPermission: boolean;
}): { canMark: boolean; reason: string } {
  const { role, staffId, mode, section, hasSubjectAllocation, hasAttMarkDailyPermission } = args;
  const isAdmin = role === "owner" || role === "branch_admin" || role === "super_admin";
  if (isAdmin) return { canMark: true, reason: "" };

  if (role === "teacher") {
    if (mode === "class_incharge") {
      const canMark = Boolean(section && section.inchargeId === staffId);
      return { canMark, reason: canMark ? "" : "Only this section's class incharge marks its register." };
    }
    if (mode === "subject_wise") {
      return { canMark: hasSubjectAllocation, reason: hasSubjectAllocation ? "" : "You can mark only the subjects you teach in this section." };
    }
    return { canMark: false, reason: mode === "single_marker" ? "A designated person marks attendance at this school." : "The office records attendance at this school." };
  }

  const canMark = hasAttMarkDailyPermission && mode !== "subject_wise";
  return { canMark, reason: canMark ? "" : "Your role can't mark this register." };
}

/** Diffs old marks against new ones into RegisterChange entries (submitRegister on a reopened or re-submitted register). */
export function registerChanges(existingMarks: Record<string, AttendanceMark>, newMarks: Record<string, AttendanceMark>, actor: string, reason: string): RegisterChange[] {
  const now = new Date().toISOString();
  return Object.entries(newMarks)
    .filter(([studentId, mark]) => existingMarks[studentId] && existingMarks[studentId].status !== mark.status)
    .map(([studentId, mark]) => ({ at: now, by: actor, studentId, from: existingMarks[studentId].status, to: mark.status, reason }));
}

/** A register's composite id. */
export const registerId = (sectionId: string, date: string, subjectId?: string) => (subjectId ? `${sectionId}:${date}:${subjectId}` : `${sectionId}:${date}`);
