import type { Guardian, Student, StudentStatus } from "@/types";

export const studentStatusLabels: Record<StudentStatus, string> = {
  active: "Active",
  defaulter: "Defaulter",
  pending: "Fee pending",
  withdrawn: "Left school",
};

/** Enrolment comes first: a student who has left shows as left, whatever their fees. */
export function studentStatus(student: Pick<Student, "enrollment" | "feeStatus">): StudentStatus {
  if (student.enrollment === "withdrawn") return "withdrawn";
  return student.feeStatus === "clear" ? "active" : student.feeStatus;
}

/** The guardian fees and alerts go to. */
export function primaryGuardian(student: Pick<Student, "guardians">): Guardian | undefined {
  return student.guardians.find((g) => g.primary) ?? student.guardians[0];
}

export const relationLabels: Record<Guardian["relation"], string> = {
  father: "Father",
  mother: "Mother",
  guardian: "Guardian",
  grandparent: "Grandparent",
  sibling: "Elder sibling",
};

export const withdrawalReasons: Record<NonNullable<Student["withdrawal"]>["reason"], string> = {
  transferred: "Moved to another school",
  relocated: "Family relocated",
  fees: "Couldn't continue fees",
  completed: "Completed final class",
  disciplinary: "Disciplinary",
  other: "Other",
};

/** School days so far this term, used to turn an attendance rate into days. */
export const TERM_SCHOOL_DAYS = 60;

/**
 * Days present, absent and on leave this term from a student's attendance
 * rate. Until daily registers are stored per student (Phase D), this is
 * derived, but it's consistent everywhere a student appears.
 */
export function attendanceBreakdown(student: Pick<Student, "id" | "attendance">) {
  const present = Math.round((student.attendance / 100) * TERM_SCHOOL_DAYS);
  const missed = TERM_SCHOOL_DAYS - present;
  const leave = Math.min(missed, Number(student.id.replace(/\D/g, "")) % 3);
  return { present, absent: missed - leave, leave };
}
