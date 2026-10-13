import type { Role } from "./user";

/** Columns of the permissions matrix: every school role (Super-admin is the platform, not the school). */
export type RoleKey = Exclude<Role, "super_admin">;

export interface PermissionItem {
  id: string;
  name: string;
  description: string;
  module: "academic" | "financial" | "attendance" | "administrative";
}

export interface RolePermissionsState {
  [permissionId: string]: Record<RoleKey, boolean>;
}

export type AttendanceMode = "class_incharge" | "subject_wise" | "single_marker" | "admin_oversight";

export interface Holiday {
  id: string;
  date: string;
  name: string;
}

export interface GradeBand {
  label: string;
  /** Lowest percentage for this grade. */
  min: number;
}

/** School-wide rules from Settings → School rules. */
export interface SchoolRules {
  attendance: {
    mode: AttendanceMode;
    /** Hours after marking before the register locks itself; 0 means at the end of the day. */
    lockAfterHours: number;
    holidays: Holiday[];
  };
  fees: {
    /** Day of the month vouchers fall due. */
    dueDay: number;
    lateFinePerDay: number;
    graceDays: number;
    siblingDiscountPercent: number;
  };
  grading: {
    passPercent: number;
    /** Highest band first. */
    bands: GradeBand[];
  };
  notifications: {
    absenceWhatsApp: boolean;
    feeReminderSms: boolean;
    smsFallback: boolean;
    resultsWhatsApp: boolean;
  };
}

export interface CampusProfileData {
  schoolName: string;
  tagline: string;
  registrationNumber: string;
  contactEmail: string;
  contactPhone: string;
  website: string;
  streetAddress: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  logoUrl?: string;
  principalName: string;
}
