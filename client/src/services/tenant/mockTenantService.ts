/* In-memory implementation of the tenant service contract, applying the same checks the backend must. */
import { db } from "@/mocks/db";
import { moduleName, withRequirements } from "@/lib/modules";
import type { Tenant } from "@/types";
import type { PlatformCaller, TenantService } from "./contract";

const fail = (status: number, message: string) => ({ error: { status, message } });
const now = () => new Date().toISOString();
const newId = (p: string) => `${p}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const onlyAdmin = (ctx: PlatformCaller) => (ctx.isPlatformAdmin ? null : fail(403, "Only platform admins can do this"));

function update(id: string, change: (t: Tenant) => Tenant) {
  const t = db.tenants.find((x) => x.id === id);
  if (!t) return fail(404, "School not found");
  const next = change(t);
  db.tenants = db.tenants.map((x) => (x.id === id ? next : x));
  return { data: next };
}
const log = (t: Tenant, by: string, text: string): Tenant => ({ ...t, history: [...t.history, { at: now(), by, text }] });

export const mockTenantService: TenantService = {
  getMyTenant: (ctx) => {
    const t = db.tenants.find((x) => x.id === ctx.tenantId);
    return t ? { data: t } : fail(404, "School not found");
  },

  listTenants: (ctx) => onlyAdmin(ctx) ?? { data: db.tenants },

  createTenant: (ctx, input) => {
    const denied = onlyAdmin(ctx);
    if (denied) return denied;
    const name = input.name.trim();
    if (name.length < 3) return fail(400, "Enter the school's name");
    if (!input.city.trim()) return fail(400, "Enter the city");
    if (!input.firstBranch.name.trim()) return fail(400, "Name the first campus");
    if (!/^[A-Z0-9]{2,6}$/.test(input.firstBranch.code)) return fail(400, "The campus code should be 2 to 6 capital letters or numbers");
    if (input.owner.name.trim().length < 3) return fail(400, "Enter the owner's name");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.owner.email.trim())) return fail(400, "Enter the owner's email");
    if (input.modules.length === 0) return fail(400, "Choose at least one module");
    if (db.tenants.some((t) => t.name.toLowerCase() === name.toLowerCase())) return fail(409, "A school with this name already exists");
    if (db.tenants.some((t) => t.owner.email.toLowerCase() === input.owner.email.trim().toLowerCase())) return fail(409, "That email already owns a school");
    const modules = withRequirements(input.modules);
    const id = newId("t");
    const at = now();
    const tenant: Tenant = {
      id,
      name,
      city: input.city.trim(),
      status: input.status,
      modules,
      studentSeats: modules.includes("students") ? Math.max(0, Math.round(input.studentSeats)) : 0,
      owner: { name: input.owner.name.trim(), email: input.owner.email.trim().toLowerCase(), phone: input.owner.phone },
      createdAt: at,
      history: [{ at, by: ctx.name, text: `School created${input.status === "trial" ? " on trial" : ""} with ${modules.map(moduleName).join(", ")}. Owner login sent to ${input.owner.email.trim().toLowerCase()}.` }],
    };
    db.tenants = [...db.tenants, tenant];
    db.branches = [...db.branches, { id: newId("br"), tenantId: id, name: input.firstBranch.name.trim(), code: input.firstBranch.code, location: input.city.trim() }];
    return { data: tenant };
  },

  setModules: (ctx, id, modules) => {
    const denied = onlyAdmin(ctx);
    if (denied) return denied;
    if (modules.length === 0) return fail(400, "A school needs at least one module");
    const next = withRequirements(modules);
    return update(id, (t) => {
      const on = next.filter((k) => !t.modules.includes(k)).map(moduleName);
      const off = t.modules.filter((k) => !next.includes(k)).map(moduleName);
      const parts = [on.length ? `Turned on ${on.join(", ")}` : "", off.length ? `Turned off ${off.join(", ")} (data kept)` : ""].filter(Boolean);
      return log({ ...t, modules: next, studentSeats: next.includes("students") ? t.studentSeats || 100 : 0 }, ctx.name, `${parts.join(". ")}.`);
    });
  },

  setSeats: (ctx, id, studentSeats) => {
    const denied = onlyAdmin(ctx);
    if (denied) return denied;
    if (!Number.isInteger(studentSeats) || studentSeats < 1 || studentSeats > 100_000) return fail(400, "Seats should be a whole number from 1 to 100,000");
    const used = id === "t-1" ? db.students.filter((s) => s.enrollment === "active").length : 0;
    if (studentSeats < used) return fail(409, `The school already has ${used} active students`);
    return update(id, (t) => log({ ...t, studentSeats }, ctx.name, `Student seats set to ${studentSeats.toLocaleString("en-PK")}.`));
  },

  setStatus: (ctx, id, status, reason) => {
    const denied = onlyAdmin(ctx);
    if (denied) return denied;
    if (status === "suspended" && reason.trim().length < 5) return fail(400, "Give a reason for suspending");
    const label = { active: "Activated", trial: "Moved to trial", suspended: "Suspended" }[status];
    return update(id, (t) => log({ ...t, status }, ctx.name, `${label}${reason.trim() ? `: ${reason.trim()}` : ""}.`));
  },

  logViewAs: (ctx, id) => {
    const denied = onlyAdmin(ctx);
    if (denied) return denied;
    return update(id, (t) => log(t, ctx.name, "Opened the school as its owner."));
  },
};
