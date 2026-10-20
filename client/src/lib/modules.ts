/*
 * The modules a school can buy. Each school (tenant) has a list of enabled
 * modules set in the Console; a feature shows only when its module is on AND
 * the user's role holds the permission. Hiding is UI only: the backend must
 * refuse API calls for modules a school doesn't have.
 */
import type { ModuleKey } from "@/types";

export interface ModuleInfo {
  key: ModuleKey;
  name: string;
  description: string;
  /** Modules this one can't work without. */
  requires: ModuleKey[];
}

export const MODULES: ModuleInfo[] = [
  { key: "students", name: "Students and admissions", description: "Student records, admissions, import, classes and subjects.", requires: [] },
  { key: "fees", name: "Fees", description: "Fee structure, vouchers, the fee counter, defaulters and daily closing.", requires: ["students"] },
  { key: "attendance", name: "Attendance", description: "Student registers, absence alerts and staff attendance.", requires: ["students"] },
  { key: "staff", name: "Staff and HR", description: "Staff records and teaching allocations.", requires: [] },
  { key: "payroll", name: "Payroll", description: "Monthly payroll, payslips and salary advances.", requires: ["staff"] },
  { key: "exams", name: "Exams and results", description: "Date sheets, marks entry, results and report cards.", requires: ["students"] },
  { key: "paper_maker", name: "Paper maker", description: "Teachers make exam papers; the office prints them.", requires: [] },
  { key: "messages", name: "Messages", description: "WhatsApp and SMS to parents and staff.", requires: [] },
  { key: "reports", name: "Reports", description: "Reports across the modules the school has.", requires: [] },
];

export const ALL_MODULES = MODULES.map((m) => m.key);
export const moduleName = (key: ModuleKey) => MODULES.find((m) => m.key === key)?.name ?? key;

/** Turning a module on also turns on what it needs. */
export function withRequirements(keys: ModuleKey[]): ModuleKey[] {
  const out = new Set(keys);
  let added = true;
  while (added) {
    added = false;
    for (const k of [...out]) {
      for (const r of MODULES.find((m) => m.key === k)?.requires ?? []) {
        if (!out.has(r)) {
          out.add(r);
          added = true;
        }
      }
    }
  }
  return ALL_MODULES.filter((k) => out.has(k));
}

/** Modules that need this one, and so go off with it. */
export const dependentsOf = (key: ModuleKey): ModuleKey[] => MODULES.filter((m) => m.requires.includes(key)).map((m) => m.key);

/** Which module a page belongs to; null for core pages (dashboard, settings, console, auth). */
const ROUTE_MODULES: [RegExp, ModuleKey][] = [
  [/^\/students(\/|$)/, "students"],
  [/^\/academics(\/|$)/, "students"],
  [/^\/print\/students(\/|$)/, "students"],
  [/^\/teacher-portal\/classes(\/|$)/, "students"],
  [/^\/fees(\/|$)/, "fees"],
  [/^\/print\/(vouchers|receipts)(\/|$)/, "fees"],
  [/^\/attendance(\/|$)/, "attendance"],
  [/^\/teacher-portal\/attendance(\/|$)/, "attendance"],
  [/^\/staff(\/|$)/, "staff"],
  [/^\/print\/payslips(\/|$)/, "payroll"],
  [/^\/exams(\/|$)/, "exams"],
  [/^\/print\/report-cards(\/|$)/, "exams"],
  [/^\/teacher-portal\/marks(\/|$)/, "exams"],
  [/^\/teacher-portal\/paper-maker(\/|$)/, "paper_maker"],
  [/^\/papers(\/|$)/, "paper_maker"],
  [/^\/print\/papers(\/|$)/, "paper_maker"],
  [/^\/messages(\/|$)/, "messages"],
  [/^\/reports(\/|$)/, "reports"],
  [/^\/print\/reports(\/|$)/, "reports"],
];
export const moduleForPath = (pathname: string): ModuleKey | null => ROUTE_MODULES.find(([re]) => re.test(pathname))?.[1] ?? null;

/** Which module a Settings permission belongs to; core permissions (settings, users) have none. */
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
