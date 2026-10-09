"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  ShieldCheck,
  Save,
  CheckCircle2,
  Clock,
  RotateCcw,
  Sparkles,
  Info,
} from "lucide-react";
import { PermissionItem, RoleKey, RolePermissionsState } from "../types";

const permissionSections: {
  module: "academic" | "financial" | "attendance" | "administrative";
  title: string;
  description: string;
  permissions: PermissionItem[];
}[] = [
  {
    module: "financial",
    title: "Financial & Billing Permissions",
    description: "Manage tuition fee collections, cash drawer operations, discounts, and ledger audits.",
    permissions: [
      {
        id: "fin_collect_fee",
        name: "Process POS Counter Payments",
        description: "Accept cash, bank, or online voucher transactions and emit receipts",
        module: "financial",
      },
      {
        id: "fin_view_defaulters",
        name: "Access Arrears & Defaulters Registry",
        description: "View aging debtor accounts and overdue payment summaries",
        module: "financial",
      },
      {
        id: "fin_send_sms",
        name: "Dispatch Payment SMS Reminders",
        description: "Trigger automated arrears notifications to guardian phone numbers",
        module: "financial",
      },
      {
        id: "fin_waive_fee",
        name: "Grant Discounts & Fee Waivers",
        description: "Override voucher balances or provide administrative concessions",
        module: "financial",
      },
      {
        id: "fin_manage_payroll",
        name: "Manage Staff Payroll Disbursal",
        description: "Access salary computations, tax deductions, and bank export sheets",
        module: "financial",
      },
    ],
  },
  {
    module: "academic",
    title: "Academic & Examination Permissions",
    description: "Curriculum oversight, course allocations, marks grading, and report cards.",
    permissions: [
      {
        id: "acad_create_exam",
        name: "Configure Examination Sessions",
        description: "Create term schedules, datesheets, and cohort examination windows",
        module: "academic",
      },
      {
        id: "acad_enter_marks",
        name: "Enter & Edit Student Marks",
        description: "Input subject scores in teacher gradebook spreadsheets",
        module: "academic",
      },
      {
        id: "acad_lock_gradebook",
        name: "Lock & Finalize Gradebooks",
        description: "Administrative freeze on grades before report card dispatch",
        module: "academic",
      },
      {
        id: "acad_manage_allocations",
        name: "Manage Teacher Allocations",
        description: "Assign faculty educators to subjects, grades, and sections",
        module: "academic",
      },
    ],
  },
  {
    module: "attendance",
    title: "Attendance & Absence Permissions",
    description: "Classroom attendance registers, administrative locks, and guardian alerts.",
    permissions: [
      {
        id: "att_mark_daily",
        name: "Mark Daily Classroom Attendance",
        description: "Take daily attendance for assigned classroom rosters",
        module: "attendance",
      },
      {
        id: "att_lock_roster",
        name: "Enforce Administrative Attendance Lock",
        description: "Lock classroom registers to prevent retrospective teacher changes",
        module: "attendance",
      },
      {
        id: "att_send_alerts",
        name: "Trigger WhatsApp Absence Alerts",
        description: "Send automated notification messages to parents of absent pupils",
        module: "attendance",
      },
    ],
  },
  {
    module: "administrative",
    title: "Administrative & Student Management",
    description: "Admissions, directory mutations, staff onboarding, and system configurations.",
    permissions: [
      {
        id: "adm_admit_student",
        name: "Process Student Admissions",
        description: "Enroll new pupils, upload birth records, and assign roll numbers",
        module: "administrative",
      },
      {
        id: "adm_edit_student",
        name: "Modify Student Directory Profiles",
        description: "Update student biodata, guardian contacts, and section transfers",
        module: "administrative",
      },
      {
        id: "adm_onboard_staff",
        name: "Onboard Faculty & HR Personnel",
        description: "Create faculty credentials, designate roles, and set wage scales",
        module: "administrative",
      },
      {
        id: "adm_system_settings",
        name: "Manage Global Institution Settings",
        description: "Configure campus profile, branding, and role-based access control",
        module: "administrative",
      },
    ],
  },
];

const defaultPermissions: RolePermissionsState = {
  fin_collect_fee: { admin: true, teacher: false, front_desk: true, accountant: true },
  fin_view_defaulters: { admin: true, teacher: false, front_desk: true, accountant: true },
  fin_send_sms: { admin: true, teacher: false, front_desk: true, accountant: true },
  fin_waive_fee: { admin: true, teacher: false, front_desk: false, accountant: false },
  fin_manage_payroll: { admin: true, teacher: false, front_desk: false, accountant: true },

  acad_create_exam: { admin: true, teacher: false, front_desk: false, accountant: false },
  acad_enter_marks: { admin: true, teacher: true, front_desk: false, accountant: false },
  acad_lock_gradebook: { admin: true, teacher: false, front_desk: false, accountant: false },
  acad_manage_allocations: { admin: true, teacher: false, front_desk: false, accountant: false },

  att_mark_daily: { admin: true, teacher: true, front_desk: true, accountant: false },
  att_lock_roster: { admin: true, teacher: false, front_desk: false, accountant: false },
  att_send_alerts: { admin: true, teacher: false, front_desk: true, accountant: false },

  adm_admit_student: { admin: true, teacher: false, front_desk: true, accountant: false },
  adm_edit_student: { admin: true, teacher: false, front_desk: true, accountant: false },
  adm_onboard_staff: { admin: true, teacher: false, front_desk: false, accountant: false },
  adm_system_settings: { admin: true, teacher: false, front_desk: false, accountant: false },
};

export function RolesMatrix() {
  const [matrix, setMatrix] = useState<RolePermissionsState>(defaultPermissions);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const togglePermission = (permId: string, role: RoleKey) => {
    // Admin permissions are locked for safety
    if (role === "admin") return;

    setMatrix((prev) => ({
      ...prev,
      [permId]: {
        ...prev[permId],
        [role]: !prev[permId]?.[role],
      },
    }));
  };

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    }, 700);
  };

  const handleReset = () => {
    setMatrix(defaultPermissions);
  };

  return (
    <div className="space-y-6">
      {/* Top Controller Header */}
      <Card className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-base font-bold tracking-tight text-slate-900">
                Role-Based Access Control (RBAC) Matrix
              </CardTitle>
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 ring-1 ring-inset ring-blue-600/20">
                <ShieldCheck className="h-3 w-3" /> 4 Active Roles
              </span>
            </div>
            <CardDescription className="text-xs text-slate-500 mt-1">
              Configure fine-grained functional permissions per institutional persona. Changes apply instantly across tenant sessions.
            </CardDescription>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="h-9 gap-2 border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 shadow-xs"
            >
              <RotateCcw className="h-3.5 w-3.5 text-slate-500" />
              Reset Defaults
            </Button>

            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
              className="h-9 gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition-colors"
            >
              {isSaving ? (
                <>
                  <Clock className="h-3.5 w-3.5 animate-spin" />
                  Saving Policy...
                </>
              ) : saveSuccess ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />
                  Permissions Saved!
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5" />
                  Save Permissions
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>

      {/* Complex Permissions Data Table */}
      <Card className="rounded-xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-slate-200/80 bg-slate-100/80 hover:bg-slate-100/80">
                  <TableHead className="py-4 px-6 text-[11px] font-bold uppercase tracking-wider text-slate-700 w-[42%]">
                    Permission Scope & Capabilities
                  </TableHead>
                  <TableHead className="py-4 px-4 text-center text-[11px] font-bold uppercase tracking-wider text-slate-700 w-[14%]">
                    <div className="flex flex-col items-center">
                      <span>Administrator</span>
                      <span className="text-[10px] font-normal text-slate-400 capitalize">Full Access</span>
                    </div>
                  </TableHead>
                  <TableHead className="py-4 px-4 text-center text-[11px] font-bold uppercase tracking-wider text-slate-700 w-[14%]">
                    <div className="flex flex-col items-center">
                      <span>Faculty Teacher</span>
                      <span className="text-[10px] font-normal text-slate-400 capitalize">Academic Scope</span>
                    </div>
                  </TableHead>
                  <TableHead className="py-4 px-4 text-center text-[11px] font-bold uppercase tracking-wider text-slate-700 w-[14%]">
                    <div className="flex flex-col items-center">
                      <span>Front Desk</span>
                      <span className="text-[10px] font-normal text-slate-400 capitalize">Cashier & Reception</span>
                    </div>
                  </TableHead>
                  <TableHead className="py-4 px-4 text-center text-[11px] font-bold uppercase tracking-wider text-slate-700 w-[14%]">
                    <div className="flex flex-col items-center">
                      <span>Accountant</span>
                      <span className="text-[10px] font-normal text-slate-400 capitalize">Bursar & Payroll</span>
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {permissionSections.map((section) => (
                  <div key={section.module} className="contents">
                    {/* Sticky Section Header */}
                    <TableRow className="sticky top-0 z-10 border-y border-slate-200/90 bg-slate-100/95 backdrop-blur-xs">
                      <TableCell
                        colSpan={5}
                        className="py-3 px-6 text-xs font-bold text-slate-900 uppercase tracking-wider"
                      >
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-blue-600" />
                          <span>{section.title}</span>
                          <span className="text-slate-400 font-normal lowercase tracking-normal">
                            — {section.description}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>

                    {/* Section Permission Rows */}
                    {section.permissions.map((perm) => {
                      const permState = matrix[perm.id] || {
                        admin: true,
                        teacher: false,
                        front_desk: false,
                        accountant: false,
                      };

                      return (
                        <TableRow
                          key={perm.id}
                          className="border-b border-slate-100 hover:bg-slate-50/70 transition-colors"
                        >
                          {/* Permission Title & Info */}
                          <TableCell className="py-3.5 px-6">
                            <div className="text-sm font-semibold text-slate-900 leading-tight">
                              {perm.name}
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5">
                              {perm.description}
                            </div>
                          </TableCell>

                          {/* Admin (Locked Checked) */}
                          <TableCell className="py-3.5 px-4 text-center">
                            <div className="flex items-center justify-center">
                              <Checkbox
                                checked={permState.admin}
                                disabled={true}
                                className="cursor-not-allowed border-blue-600 bg-blue-600 text-white"
                              />
                            </div>
                          </TableCell>

                          {/* Teacher */}
                          <TableCell className="py-3.5 px-4 text-center">
                            <div className="flex items-center justify-center">
                              <Checkbox
                                checked={permState.teacher}
                                onCheckedChange={() =>
                                  togglePermission(perm.id, "teacher")
                                }
                                className="cursor-pointer border-slate-300 data-checked:border-blue-600 data-checked:bg-blue-600 data-checked:text-white"
                              />
                            </div>
                          </TableCell>

                          {/* Front Desk */}
                          <TableCell className="py-3.5 px-4 text-center">
                            <div className="flex items-center justify-center">
                              <Checkbox
                                checked={permState.front_desk}
                                onCheckedChange={() =>
                                  togglePermission(perm.id, "front_desk")
                                }
                                className="cursor-pointer border-slate-300 data-checked:border-blue-600 data-checked:bg-blue-600 data-checked:text-white"
                              />
                            </div>
                          </TableCell>

                          {/* Accountant */}
                          <TableCell className="py-3.5 px-4 text-center">
                            <div className="flex items-center justify-center">
                              <Checkbox
                                checked={permState.accountant}
                                onCheckedChange={() =>
                                  togglePermission(perm.id, "accountant")
                                }
                                className="cursor-pointer border-slate-300 data-checked:border-blue-600 data-checked:bg-blue-600 data-checked:text-white"
                              />
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </div>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Table Footer info */}
          <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-6 py-4 text-xs text-slate-500">
            <div className="flex items-center gap-1.5 text-slate-600">
              <Info className="h-4 w-4 text-slate-400" />
              <span>
                Administrator permissions are governed by root institutional authority and cannot be revoked.
              </span>
            </div>

            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
              className="h-8 gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs"
            >
              <Save className="h-3 w-3" />
              Save Permissions
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

