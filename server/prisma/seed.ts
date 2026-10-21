/*
 * Development seed: the same demo schools, people and settings the frontend's mocks use
 * (read straight from client/src/mocks, so there's one source of demo data).
 * Every demo account's password is "deepdev123". Never run against production.
 */
import { randomUUID } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { branches, sessions } from "../../client/src/mocks/branches";
import { campusProfile, rolePermissions, schoolRules } from "../../client/src/mocks/settings";
import { DEMO_TENANT_ID, tenantBranches, tenants } from "../../client/src/mocks/tenants";
import { users } from "../../client/src/mocks/users";
import { createAuth } from "../src/auth/auth";
import { env } from "../src/config/env";
import { PrismaClient } from "../src/generated/prisma/client";
import type { ModuleKey } from "../src/generated/prisma/enums";

export const DEMO_PASSWORD = "deepdev123";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: env.DATABASE_URL }) });
const day = (s: string) => new Date(`${s}T00:00:00.000Z`);
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

async function main() {
  if (env.NODE_ENV === "production") throw new Error("The demo seed must not run in production");
  const auth = createAuth(prisma);
  const ctx = await auth.$context;
  const hash = await ctx.password.hash(DEMO_PASSWORD);

  // Start clean (child tables first).
  for (const table of ["audit_log", "counter", "tenant_permissions", "school_rules", "campus_profile", "academic_session", "branch", "tenant_event", "invitation", "member", "organization", "session", "account", "verification", "user"]) {
    await prisma.$executeRawUnsafe(`DELETE FROM "${table}"`);
  }

  /** A login with the demo password. */
  async function login(name: string, email: string, extra: { role?: string; phone?: string } = {}) {
    const id = randomUUID();
    await prisma.user.create({ data: { id, name, email: email.toLowerCase(), emailVerified: true, role: extra.role ?? "user", phone: extra.phone } });
    await prisma.account.create({ data: { id: randomUUID(), accountId: id, providerId: "credential", userId: id, password: hash } });
    return id;
  }

  // Platform admin (super_admin in the app).
  const platform = users.find((u) => u.role === "super_admin")!;
  await login(platform.name, platform.email, { role: "admin" });

  for (const t of tenants) {
    await prisma.organization.create({
      data: { id: t.id, name: t.name, slug: slug(t.name), city: t.city, status: t.status, modules: t.modules as ModuleKey[], studentSeats: t.studentSeats, createdAt: new Date(t.createdAt) },
    });
    for (const e of t.history) await prisma.tenantEvent.create({ data: { tenantId: t.id, at: new Date(e.at), by: e.by, text: e.text } });

    const campuses = t.id === DEMO_TENANT_ID ? branches : tenantBranches.filter((b) => b.tenantId === t.id);
    for (const b of campuses) await prisma.branch.create({ data: { id: b.id, tenantId: t.id, name: b.name, code: b.code, location: b.location } });

    const termList = t.id === DEMO_TENANT_ID ? sessions : sessions.filter((s) => s.current);
    for (const s of termList) await prisma.academicSession.create({ data: { tenantId: t.id, label: s.label, startDate: day(s.startDate), endDate: day(s.endDate), current: s.current } });

    await prisma.campusProfile.create({
      data: t.id === DEMO_TENANT_ID ? { tenantId: t.id, ...campusProfile, logoUrl: campusProfile.logoUrl ?? null } : { tenantId: t.id, schoolName: t.name, city: t.city, contactEmail: t.owner.email, contactPhone: t.owner.phone },
    });
    await prisma.schoolRules.create({ data: { tenantId: t.id, attendance: schoolRules.attendance, fees: schoolRules.fees, grading: schoolRules.grading, notifications: schoolRules.notifications } });
    await prisma.tenantPermissions.create({ data: { tenantId: t.id, matrix: rolePermissions } });

    // People: the demo school's staff logins from the mocks; other schools get their owner.
    const people =
      t.id === DEMO_TENANT_ID
        ? users.filter((u) => u.role !== "super_admin").map((u) => ({ name: u.name, email: u.email, role: u.role, title: u.title, branchIds: u.branchIds, staffId: u.staffId, phone: undefined as string | undefined }))
        : [{ name: t.owner.name, email: t.owner.email, role: "owner", title: "Owner", branchIds: [] as string[], staffId: undefined, phone: t.owner.phone }];
    for (const p of people) {
      const userId = await login(p.name, p.email, { phone: p.phone });
      await prisma.member.create({ data: { id: randomUUID(), organizationId: t.id, userId, role: p.role, title: p.title, branchIds: p.branchIds, staffId: p.staffId } });
    }
  }

  const count = await prisma.user.count();
  console.log(`Seeded ${tenants.length} schools and ${count} logins. Password for every demo login: ${DEMO_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
