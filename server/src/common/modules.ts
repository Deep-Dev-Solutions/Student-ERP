/*
 * Which module each permission belongs to. Kept identical to client/src/lib/modules.ts
 * (PERMISSION_MODULES and MODULES); change both together.
 */
import type { ModuleKey } from "../generated/prisma/enums";

export const MODULE_NAMES: Record<ModuleKey, string> = {
  students: "Students and admissions",
  fees: "Fees",
  attendance: "Attendance",
  staff: "Staff and HR",
  payroll: "Payroll",
  exams: "Exams and results",
  paper_maker: "Paper maker",
  messages: "Messages",
  reports: "Reports",
};

export const MODULE_REQUIRES: Record<ModuleKey, ModuleKey[]> = {
  students: [],
  fees: ["students"],
  attendance: ["students"],
  staff: [],
  payroll: ["staff"],
  exams: ["students"],
  paper_maker: [],
  messages: [],
  reports: [],
};

const PERMISSION_MODULES: Record<string, ModuleKey> = {
  fin_collect_fee: "fees",
  fin_manage_fees: "fees",
  fin_view_defaulters: "fees",
  fin_send_sms: "messages",
  fin_waive_fee: "fees",
  fin_manage_payroll: "payroll",
  acad_create_exam: "exams",
  acad_enter_marks: "exams",
  acad_lock_gradebook: "exams",
  acad_manage_allocations: "staff",
  canPrintPapers: "paper_maker",
  att_mark_daily: "attendance",
  att_lock_roster: "attendance",
  att_send_alerts: "attendance",
  adm_admit_student: "students",
  adm_edit_student: "students",
  adm_onboard_staff: "staff",
};
export const moduleForPermission = (id: string): ModuleKey | null => PERMISSION_MODULES[id] ?? null;
