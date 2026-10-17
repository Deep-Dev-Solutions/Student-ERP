"use client";

import { useSyncExternalStore } from "react";
import { useCan, useCurrentUser } from "@/hooks/use-session";
import {
  useGetAllocationsQuery,
  useGetClassSubjectsQuery,
  useGetClassesQuery,
  useGetSchoolRulesQuery,
  useGetSectionsQuery,
  useGetStudentsQuery,
  useGetSubjectsQuery,
} from "@/store/api";
import type { AttendanceRegister, SchoolRules, Student } from "@/types";

const localDate = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const noSubscribe = () => () => {};

/**
 * Today's date on this device, as YYYY-MM-DD. Null while the server renders
 * and during hydration, since pages are prerendered ahead of time.
 */
export function useToday(): string | null {
  return useSyncExternalStore(noSubscribe, () => localDate(), () => null);
}

function subscribeOnline(onChange: () => void) {
  window.addEventListener("online", onChange);
  window.addEventListener("offline", onChange);
  return () => {
    window.removeEventListener("online", onChange);
    window.removeEventListener("offline", onChange);
  };
}

/** Whether the browser reports a connection. */
export function useOnline(): boolean {
  return useSyncExternalStore(subscribeOnline, () => navigator.onLine, () => true);
}

/** Why there's no register on a date, or null on a school day. */
export function holidayOn(date: string, rules: SchoolRules | undefined): string | null {
  if (!date) return null;
  if (new Date(`${date}T12:00:00`).getDay() === 0) return "Sunday";
  return rules?.attendance.holidays.find((h) => h.date === date)?.name ?? null;
}

/**
 * Whether a register can no longer be changed without reopening it: locked
 * by hand, or past the lock window in School rules.
 */
export function isLocked(register: AttendanceRegister | undefined, today: string | null, rules: SchoolRules | undefined): boolean {
  if (!register || register.reopened) return false;
  if (register.lockedAt) return true;
  if (!today || !rules) return false;
  const hours = rules.attendance.lockAfterHours;
  if (hours === 0) return register.date < today;
  return Date.now() - new Date(register.submittedAt).getTime() > hours * 3600 * 1000;
}

/** Students on a register: active students in the section, and for an elective subject only those who take it. */
export function useRoster(sectionId: string | undefined, subjectId?: string): Student[] {
  const { data: students = [] } = useGetStudentsQuery();
  const { data: sections = [] } = useGetSectionsQuery();
  const { data: classSubjects = [] } = useGetClassSubjectsQuery();
  const classId = sections.find((s) => s.id === sectionId)?.classId;
  const elective = subjectId ? classSubjects.find((cs) => cs.classId === classId && cs.subjectId === subjectId)?.elective : false;
  return students
    .filter((s) => s.sectionId === sectionId && s.enrollment === "active" && (!elective || s.electiveSubjectIds.includes(subjectId!)))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * What the signed-in user may do with a section's register, following the
 * attendance mode in School rules and the Settings permissions.
 */
export function useRegisterPermissions(sectionId: string | undefined, subjectId?: string) {
  const user = useCurrentUser();
  const { data: rules } = useGetSchoolRulesQuery();
  const { data: sections = [] } = useGetSectionsQuery();
  const { data: classes = [] } = useGetClassesQuery();
  const { data: subjects = [] } = useGetSubjectsQuery();
  const { data: allocations = [] } = useGetAllocationsQuery();
  const canLock = useCan("att_lock_roster");
  const canMarkDaily = useCan("att_mark_daily");
  const mode = rules?.attendance.mode ?? "class_incharge";
  const section = sections.find((s) => s.id === sectionId);
  const role = user?.role;
  const isAdmin = role === "owner" || role === "branch_admin" || role === "super_admin";

  let canMark = isAdmin;
  let reason = "";
  if (!isAdmin && role === "teacher") {
    if (mode === "class_incharge") {
      canMark = Boolean(section && section.inchargeId === user?.staffId);
      if (!canMark) reason = "Only this section's class incharge marks its register.";
    } else if (mode === "subject_wise") {
      const cls = classes.find((c) => c.id === section?.classId);
      const subject = subjects.find((s) => s.id === subjectId);
      canMark = allocations.some(
        (a) => a.teacherId === user?.staffId && a.subject === subject?.name && a.className === cls?.name && a.section === `Section ${section?.name}`
      );
      if (!canMark) reason = "You can mark only the subjects you teach in this section.";
    } else {
      canMark = false;
      reason = mode === "single_marker" ? "A designated person marks attendance at this school." : "The office records attendance at this school.";
    }
  } else if (!isAdmin) {
    canMark = canMarkDaily && mode !== "subject_wise";
    if (!canMark) reason = "Your role can't mark this register.";
  }

  return { mode, canMark, canLock, canUnlock: canLock, reason };
}
