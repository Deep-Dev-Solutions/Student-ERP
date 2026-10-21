/* Response shapes matching client/src/types, so the frontend can switch from mocks without changes. */
import type { AcademicSession, Member, Organization, TenantEvent, User } from "../generated/prisma/client";

const day = (d: Date) => d.toISOString().slice(0, 10);
export const initialsOf = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join("");

/** client/src/types/user.ts → User */
export function toAppUser(member: Member, user: Pick<User, "id" | "name" | "email" | "image">) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: member.role,
    title: member.title,
    initials: initialsOf(user.name),
    avatarUrl: user.image ?? undefined,
    branchIds: member.branchIds,
    status: member.status,
    staffId: member.staffId ?? undefined,
  };
}

/** client/src/types/org.ts → AcademicSession */
export const toSession = (s: AcademicSession) => ({ id: s.id, label: s.label, startDate: day(s.startDate), endDate: day(s.endDate), current: s.current });

/** client/src/types/tenant.ts → Tenant */
export function toTenant(org: Organization, owner: Pick<User, "name" | "email" | "phone"> | null, history: TenantEvent[]) {
  return {
    id: org.id,
    name: org.name,
    city: org.city,
    status: org.status,
    modules: org.modules,
    studentSeats: org.studentSeats,
    owner: { name: owner?.name ?? "", email: owner?.email ?? "", phone: owner?.phone ?? "" },
    createdAt: org.createdAt.toISOString(),
    history: history.map((e) => ({ at: e.at.toISOString(), by: e.by, text: e.text })),
  };
}

/** Parses "YYYY-MM-DD" as a calendar date (stored in a date column, no time zone). */
export const parseDay = (s: string) => new Date(`${s}T00:00:00.000Z`);
