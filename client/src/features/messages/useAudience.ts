"use client";

import { useToday } from "@/features/attendance/hooks";
import { primaryGuardian } from "@/features/students/status";
import { useBranchClasses } from "@/hooks/use-academics";
import { useCurrentBranch, useModules } from "@/hooks/use-session";
import { voucherBalance, voucherState } from "@/lib/fees";
import { formatRupees } from "@/lib/format";
import type { TemplateVars } from "@/lib/messaging";
import { useGetCampusProfileQuery, useGetRegistersQuery, useGetSectionsQuery, useGetStaffQuery, useGetStudentsQuery, useGetVouchersQuery } from "@/store/api";
import type { AudienceKind, ModuleKey, Student } from "@/types";

export interface Audience {
  kind: AudienceKind;
  classId?: string;
  /** Empty for every section of the class. */
  sectionId?: string;
}

export interface Contact {
  name: string;
  phone: string;
  hasWhatsApp: boolean;
  vars: TemplateVars;
}

export const audienceOptions: { value: AudienceKind; label: string; module: ModuleKey }[] = [
  { value: "all_parents", label: "All parents", module: "students" },
  { value: "class_parents", label: "Parents of a class", module: "students" },
  { value: "defaulters", label: "Parents with overdue fees", module: "fees" },
  { value: "absent_today", label: "Parents of today's absentees", module: "attendance" },
  { value: "all_staff", label: "All staff", module: "staff" },
  { value: "teachers", label: "Teachers", module: "staff" },
];

/** Audiences the school's modules can supply. */
export function useAudienceOptions() {
  const { has } = useModules();
  return audienceOptions.filter((o) => has(o.module));
}

/** Everyone a message would reach, one entry per phone number (siblings' parents get one message). */
export function useAudience(audience: Audience): { contacts: Contact[]; label: string; skipped: number } {
  const today = useToday();
  const branch = useCurrentBranch();
  const classes = useBranchClasses();
  const { data: students = [] } = useGetStudentsQuery();
  const { data: sections = [] } = useGetSectionsQuery();
  const { data: vouchers = [] } = useGetVouchersQuery();
  const { data: registers = [] } = useGetRegistersQuery();
  const { data: staff = [] } = useGetStaffQuery();
  const school = useGetCampusProfileQuery().data?.schoolName ?? "";
  const active = students.filter((s) => s.branchId === branch?.id && s.enrollment === "active");
  const placeOf = (s: Student) => `${classes.find((c) => c.id === s.classId)?.name ?? ""} ${sections.find((x) => x.id === s.sectionId)?.name ?? ""}`.trim();
  const overdue = (s: Student) => vouchers.filter((v) => v.studentId === s.id && voucherState(v, today) === "overdue").reduce((n, v) => n + voucherBalance(v), 0);
  const cls = classes.find((c) => c.id === audience.classId);
  const section = sections.find((s) => s.id === audience.sectionId);

  if (audience.kind === "all_staff" || audience.kind === "teachers") {
    const people = staff.filter((m) => m.branchId === branch?.id && m.status !== "terminated" && (audience.kind === "all_staff" || m.teaches));
    const contacts = people.filter((m) => m.phone).map((m) => ({ name: m.name, phone: m.phone, hasWhatsApp: true, vars: { name: m.name, school } }));
    return { contacts, label: audience.kind === "teachers" ? "Teachers" : "All staff", skipped: people.length - contacts.length };
  }

  let chosen: Student[] = [];
  let label = "All parents";
  if (audience.kind === "all_parents") chosen = active;
  if (audience.kind === "class_parents") {
    chosen = active.filter((s) => s.classId === audience.classId && (!audience.sectionId || s.sectionId === audience.sectionId));
    label = `Parents of ${cls?.name ?? "a class"}${section ? `, section ${section.name}` : ""}`;
  }
  if (audience.kind === "defaulters") {
    chosen = active.filter((s) => overdue(s) > 0);
    label = "Parents with overdue fees";
  }
  if (audience.kind === "absent_today") {
    const absent = new Set(
      registers
        .filter((r) => r.branchId === branch?.id && r.date === today && !r.subjectId)
        .flatMap((r) => Object.entries(r.marks).filter(([, m]) => m.status === "absent").map(([id]) => id))
    );
    chosen = active.filter((s) => absent.has(s.id));
    label = "Parents of today's absentees";
  }

  // One message per phone: siblings share it.
  const byPhone = new Map<string, { guardian: NonNullable<ReturnType<typeof primaryGuardian>>; children: Student[] }>();
  let skipped = 0;
  for (const s of chosen) {
    const g = primaryGuardian(s);
    if (!g?.phone) {
      skipped++;
      continue;
    }
    const entry = byPhone.get(g.phone) ?? { guardian: g, children: [] };
    entry.children.push(s);
    byPhone.set(g.phone, entry);
  }
  const dateText = today ? new Date(`${today}T12:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "";
  const contacts = [...byPhone.values()].map(({ guardian, children }) => ({
    name: guardian.name,
    phone: guardian.phone,
    hasWhatsApp: guardian.whatsapp,
    vars: {
      name: guardian.name,
      student: children.map((c) => c.name).join(" and "),
      class: children.map(placeOf).join(", "),
      amount: formatRupees(children.reduce((n, c) => n + overdue(c), 0)),
      date: dateText,
      school,
    },
  }));
  return { contacts, label, skipped };
}
