/*
 * In-memory mock database behind the RTK Query API. Mutations replace
 * records rather than editing them, because the store freezes what it holds.
 */
import { absentees, attendanceRoster, classLocks, teacherRoster } from "./attendance";
import { branches, sessions } from "./branches";
import { exams, marks, teacherMarks } from "./exams";
import { defaulters, vouchers } from "./fees";
import { alternativeQuestions, chapters, paperQuestions } from "./paper";
import { campusProfile, rolePermissions, schoolRules } from "./settings";
import { allocations, payroll, staff, teachers } from "./staff";
import { classes, classSubjects, sections, subjects } from "./academics";
import { students } from "./students";
import { pendingTasks, teacherSummary, todayClasses } from "./teacher";
import { users } from "./users";

export const db = {
  users,
  branches,
  sessions,
  students,
  attendanceRoster,
  classLocks,
  absentees,
  teacherRoster,
  vouchers,
  defaulters,
  staff,
  allocations,
  teachers,
  payroll,
  exams,
  marks,
  teacherMarks,
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
