"use client";

import { Fragment, useState } from "react";
import {
  Card,
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
  Save,
  CheckCircle2,
  Clock,
  RotateCcw,
  Info,
} from "lucide-react";
import { PermissionItem, RoleKey, RolePermissionsState } from "../types";

const roles: { key: RoleKey; label: string; hint: string }[] = [
  { key: "admin", label: "Administrator", hint: "Full access" },
  { key: "teacher", label: "Teacher", hint: "Classes and marks" },
  { key: "front_desk", label: "Front desk", hint: "Counter and admissions" },
  { key: "accountant", label: "Accountant", hint: "Fees and payroll" },
];

const permissionSections: {
  module: "academic" | "financial" | "attendance" | "administrative";
  title: string;
  description: string;
  permissions: PermissionItem[];
}[] = [
  {
    module: "financial",
    title: "Fees and payroll",
    description: "Manage tuition fee collections, cash drawer operations, discounts, and ledger audits.",
    permissions: [
      {
        id: "fin_collect_fee",
        name: "Take fee payments at the counter",
        description: "Accept cash, bank, or online voucher transactions and emit receipts",
        module: "financial",
      },
      {
        id: "fin_view_defaulters",
        name: "View overdue fees and defaulters",
        description: "View aging debtor accounts and overdue payment summaries",
        module: "financial",
      },
      {
        id: "fin_send_sms",
        name: "Send fee reminder SMS",
        description: "Trigger automated arrears notifications to guardian phone numbers",
        module: "financial",
      },
      {
        id: "fin_waive_fee",
        name: "Give discounts and fee waivers",
        description: "Override voucher balances or provide administrative concessions",
        module: "financial",
      },
      {
        id: "fin_manage_payroll",
        name: "Manage staff payroll",
        description: "Access salary computations, tax deductions, and bank export sheets",
        module: "financial",
      },
    ],
  },
  {
    module: "academic",
    title: "Exams and marks",
    description: "Curriculum oversight, course allocations, marks grading, and report cards.",
    permissions: [
      {
        id: "acad_create_exam",
        name: "Schedule exams",
        description: "Create term schedules, datesheets, and cohort examination windows",
        module: "academic",
      },
      {
        id: "acad_enter_marks",
        name: "Enter and edit marks",
        description: "Input subject scores in teacher gradebook spreadsheets",
        module: "academic",
      },
      {
        id: "acad_lock_gradebook",
        name: "Lock final marks",
        description: "Administrative freeze on grades before report card dispatch",
        module: "academic",
      },
      {
        id: "acad_manage_allocations",
        name: "Manage teaching allocations",
        description: "Assign faculty educators to subjects, grades, and sections",
        module: "academic",
      },
    ],
  },
  {
    module: "attendance",
    title: "Attendance",
    description: "Classroom attendance registers, administrative locks, and guardian alerts.",
    permissions: [
      {
        id: "att_mark_daily",
        name: "Mark daily attendance",
        description: "Take daily attendance for assigned classroom rosters",
        module: "attendance",
      },
      {
        id: "att_lock_roster",
        name: "Lock attendance registers",
        description: "Lock classroom registers to prevent retrospective teacher changes",
        module: "attendance",
      },
      {
        id: "att_send_alerts",
        name: "Send WhatsApp absence alerts",
        description: "Send automated notification messages to parents of absent pupils",
        module: "attendance",
      },
    ],
  },
  {
    module: "administrative",
    title: "Students and administration",
    description: "Admissions, directory mutations, staff onboarding, and system configurations.",
    permissions: [
      {
        id: "adm_admit_student",
        name: "Admit students",
        description: "Enroll new pupils, upload birth records, and assign roll numbers",
        module: "administrative",
      },
      {
        id: "adm_edit_student",
        name: "Edit student records",
        description: "Update student biodata, guardian contacts, and section transfers",
        module: "administrative",
      },
      {
        id: "adm_onboard_staff",
        name: "Add staff members",
        description: "Create faculty credentials, designate roles, and set wage scales",
        module: "administrative",
      },
      {
        id: "adm_system_settings",
        name: "Change school settings",
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

  const saveButton = (
    <Button onClick={handleSave} disabled={isSaving}>
      {isSaving ? (
        <>
          <Clock data-icon="inline-start" className="motion-safe:animate-spin" />
          Saving…
        </>
      ) : (
        <>
          <Save data-icon="inline-start" />
          Save permissions
        </>
      )}
    </Button>
  );

  return (
    <div className="space-y-4">
      <Card className="gap-4 px-5 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-base font-semibold">Roles and permissions</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Choose what each of the {roles.length} roles can do. Administrators always have full access.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={handleReset}>
              <RotateCcw data-icon="inline-start" />
              Reset to defaults
            </Button>
            {saveButton}
          </div>
        </div>
        {saveSuccess ? (
          <p role="status" className="flex items-center gap-2 rounded-lg border border-success/30 bg-success-tint p-3 text-sm text-success">
            <CheckCircle2 aria-hidden className="size-4 shrink-0" />
            Permissions saved.
          </p>
        ) : null}
      </Card>

      <Card className="gap-0 py-0">
        {/* A permissions grid needs every role column, so it scrolls sideways on narrow screens. */}
        <div data-allow-scroll>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="sticky left-0 z-10 min-w-56 bg-muted pl-5 sm:min-w-64">Permission</TableHead>
              {roles.map((role) => (
                <TableHead key={role.key} className="min-w-28 text-center">
                  <span className="block text-foreground">{role.label}</span>
                  <span className="block font-normal">{role.hint}</span>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>

          <TableBody>
            {permissionSections.map((section) => (
              <Fragment key={section.module}>
                <TableRow className="bg-muted/60 hover:bg-muted/60">
                  <TableCell colSpan={roles.length + 1} className="pl-5 whitespace-normal">
                    <div className="sticky left-5 w-fit max-w-[calc(100vw-5rem)]">
                    <p className="font-semibold">{section.title}</p>
                    <p className="text-xs text-muted-foreground">{section.description}</p>
                    </div>
                  </TableCell>
                </TableRow>

                {section.permissions.map((perm) => {
                  const permState = matrix[perm.id] || {
                    admin: true,
                    teacher: false,
                    front_desk: false,
                    accountant: false,
                  };
                  return (
                    <TableRow key={perm.id}>
                      <TableCell className="sticky left-0 z-10 bg-card pl-5 whitespace-normal shadow-[1px_0_0_var(--border)]">
                        <p className="font-medium">{perm.name}</p>
                        <p className="text-xs text-muted-foreground">{perm.description}</p>
                      </TableCell>
                      {roles.map((role) => (
                        <TableCell key={role.key} className="text-center">
                          <div className="flex items-center justify-center">
                            <Checkbox
                              checked={permState[role.key]}
                              disabled={role.key === "admin"}
                              onCheckedChange={() => togglePermission(perm.id, role.key)}
                              aria-label={`${role.label}: ${perm.name}`}
                            />
                          </div>
                        </TableCell>
                      ))}
                    </TableRow>
                  );
                })}
              </Fragment>
            ))}
          </TableBody>
        </Table>
        </div>

        <div className="flex flex-col gap-3 border-t border-border bg-muted/50 px-5 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Info aria-hidden className="size-4 shrink-0" />
            Administrator permissions can&apos;t be removed.
          </p>
          {saveButton}
        </div>
      </Card>
    </div>
  );
}
