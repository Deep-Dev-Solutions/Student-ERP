/* Demo data until the API exists. Read it through @/store/api, not directly from components. */
import type { CampusProfileData, RolePermissionsState, SchoolRules } from "@/types";

export const campusProfile: CampusProfileData = {
  schoolName: "Apex Grammar & Science Academy",
  tagline: "Empowering Next-Generation Leaders Through Knowledge & Character",
  registrationNumber: "REG-EDU-2021-9481",
  contactEmail: "admin@apexgrammar.edu.pk",
  contactPhone: "+92 42 35889900",
  website: "https://www.apexgrammar.edu.pk",
  streetAddress: "Plot 42-B, Sector G, Phase 5, DHA",
  city: "Lahore",
  province: "Punjab",
  postalCode: "54792",
  country: "Pakistan",
  principalName: "Dr. Tariq Mahmood, Ph.D.",
};

export const rolePermissions: RolePermissionsState = {
  fin_collect_fee: { owner: true, branch_admin: true, teacher: false, front_desk: true, accountant: true },
  fin_manage_fees: { owner: true, branch_admin: true, teacher: false, front_desk: false, accountant: true },
  fin_view_defaulters: { owner: true, branch_admin: true, teacher: false, front_desk: true, accountant: true },
  fin_send_sms: { owner: true, branch_admin: true, teacher: false, front_desk: true, accountant: true },
  fin_waive_fee: { owner: true, branch_admin: true, teacher: false, front_desk: false, accountant: false },
  fin_manage_payroll: { owner: true, branch_admin: true, teacher: false, front_desk: false, accountant: true },

  acad_create_exam: { owner: true, branch_admin: true, teacher: false, front_desk: false, accountant: false },
  acad_enter_marks: { owner: true, branch_admin: true, teacher: true, front_desk: false, accountant: false },
  acad_lock_gradebook: { owner: true, branch_admin: true, teacher: false, front_desk: false, accountant: false },
  acad_manage_allocations: { owner: true, branch_admin: true, teacher: false, front_desk: false, accountant: false },

  att_mark_daily: { owner: true, branch_admin: true, teacher: true, front_desk: true, accountant: false },
  att_lock_roster: { owner: true, branch_admin: true, teacher: false, front_desk: false, accountant: false },
  att_send_alerts: { owner: true, branch_admin: true, teacher: false, front_desk: true, accountant: false },

  adm_admit_student: { owner: true, branch_admin: true, teacher: false, front_desk: true, accountant: false },
  adm_edit_student: { owner: true, branch_admin: true, teacher: false, front_desk: true, accountant: false },
  adm_onboard_staff: { owner: true, branch_admin: true, teacher: false, front_desk: false, accountant: false },
  adm_system_settings: { owner: true, branch_admin: true, teacher: false, front_desk: false, accountant: false },
};

export const schoolRules: SchoolRules = {
  attendance: {
    mode: "class_incharge",
    lockAfterHours: 0,
    holidays: [
      { id: "hol-1", date: "2026-11-09", name: "Iqbal Day" },
      { id: "hol-2", date: "2026-12-25", name: "Quaid-e-Azam Day" },
      { id: "hol-3", date: "2027-02-05", name: "Kashmir Solidarity Day" },
    ],
  },
  fees: { dueDay: 10, lateFinePerDay: 50, graceDays: 5, siblingDiscountPercent: 10 },
  grading: {
    passPercent: 50,
    // Matches lib/grades.ts.
    bands: [
      { label: "A+", min: 80 },
      { label: "A", min: 70 },
      { label: "B", min: 60 },
      { label: "C", min: 50 },
      { label: "F", min: 0 },
    ],
  },
  notifications: { absenceWhatsApp: true, feeReminderSms: true, smsFallback: true, resultsWhatsApp: false },
};
