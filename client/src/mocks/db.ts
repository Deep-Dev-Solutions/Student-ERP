/*
 * In-memory mock database behind the RTK Query API. Mutations replace
 * records rather than editing them, because the store freezes what it holds.
 */
import { registers, staffAttendance, unlockRequests } from "./registers";
import { branches, sessions } from "./branches";
import { examMarks, examPapers, exams } from "./exams";
import { concessions, dayClosings, feeHeads, feePlans, feeReminders, payments, vouchers } from "./fees";
import { feeStanding } from "@/lib/fees";
import { alternativeQuestions, chapters, paperQuestions } from "./paper";
import { campusProfile, rolePermissions, schoolRules } from "./settings";
import { advances, allocations, payrollRuns, payslips, staff, teachers } from "./staff";
import { classes, classSubjects, sections, subjects } from "./academics";
import { studentActivity, students } from "./students";
import { pendingTasks, teacherSummary, todayClasses } from "./teacher";
import { users } from "./users";

export const db = {
  users,
  branches,
  sessions,
  // Balances and fee status follow the vouchers, the way the API will keep them.
  students: students.map((s) => ({ ...s, ...feeStanding(s.id, vouchers) })),
  studentActivity,
  registers,
  unlockRequests,
  staffAttendance,
  vouchers,
  payments,
  feeHeads,
  feePlans,
  concessions,
  dayClosings,
  feeReminders,
  staff,
  allocations,
  teachers,
  payrollRuns,
  payslips,
  advances,
  exams,
  examPapers,
  examMarks,
  campusProfile,
  rolePermissions,
  schoolRules,
  classes,
  sections,
  subjects,
  classSubjects,
  chapters,
  paperQuestions,
  alternativeQuestions,
  teacherDay: { todayClasses, pendingTasks, teacherSummary },
};

export type MockDb = typeof db;

/**
 * Who mock changes are recorded as. The real API knows this from the sign-in
 * token; until then the store sets it whenever the signed-in user changes.
 */
let actor = "Admin";
export const setMockActor = (name: string) => {
  actor = name;
};
export const mockActor = () => actor;
