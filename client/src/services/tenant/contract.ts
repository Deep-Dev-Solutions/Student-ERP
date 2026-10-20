/*
 * Tenant (school) service contract, used by the platform Console and by every
 * school screen to learn which modules the school has. Today it runs against
 * the in-memory mock (mockTenantService.ts); the backend implements the same
 * operations at the paths below and must enforce every check listed.
 */
import type { ModuleKey, Tenant, TenantStatus } from "@/types";

export type ServiceError = { status: number; message: string };
export type ServiceResult<T> = { data: T } | { error: ServiceError };

/** Who is calling, from the sign-in token. */
export interface PlatformCaller {
  name: string;
  /** Platform staff who run the Console. */
  isPlatformAdmin: boolean;
  /** The school the caller belongs to (or is viewing as). */
  tenantId: string;
}

export interface NewTenantInput {
  name: string;
  city: string;
  status: Exclude<TenantStatus, "suspended">;
  modules: ModuleKey[];
  studentSeats: number;
  firstBranch: { name: string; code: string };
  owner: { name: string; email: string; phone: string };
}

export interface TenantService {
  /** The caller's own school, with its modules. Any signed-in user. */
  getMyTenant(ctx: PlatformCaller): ServiceResult<Tenant>;
  /** Every school. Platform admins only. */
  listTenants(ctx: PlatformCaller): ServiceResult<Tenant[]>;
  /** Creates a school with its first campus and owner login. Platform admins only. */
  createTenant(ctx: PlatformCaller, input: NewTenantInput): ServiceResult<Tenant>;
  /** Switches modules on or off; requirements are added automatically. Platform admins only. */
  setModules(ctx: PlatformCaller, tenantId: string, modules: ModuleKey[]): ServiceResult<Tenant>;
  /** Changes the student seat limit. Platform admins only. */
  setSeats(ctx: PlatformCaller, tenantId: string, studentSeats: number): ServiceResult<Tenant>;
  /** Active, trial or suspended. Platform admins only. */
  setStatus(ctx: PlatformCaller, tenantId: string, status: TenantStatus, reason: string): ServiceResult<Tenant>;
  /** Records that a platform admin opened the school as its owner. Platform admins only. */
  logViewAs(ctx: PlatformCaller, tenantId: string): ServiceResult<Tenant>;
}

export const TENANT_ENDPOINTS: { operation: keyof TenantService; method: "GET" | "POST" | "PUT"; path: string; access: string }[] = [
  { operation: "getMyTenant", method: "GET", path: "/api/tenant", access: "Any signed-in user (their own school)" },
  { operation: "listTenants", method: "GET", path: "/api/console/tenants", access: "Platform admin" },
  { operation: "createTenant", method: "POST", path: "/api/console/tenants", access: "Platform admin" },
  { operation: "setModules", method: "PUT", path: "/api/console/tenants/:id/modules", access: "Platform admin" },
  { operation: "setSeats", method: "PUT", path: "/api/console/tenants/:id/seats", access: "Platform admin" },
  { operation: "setStatus", method: "PUT", path: "/api/console/tenants/:id/status", access: "Platform admin; reason required to suspend" },
  { operation: "logViewAs", method: "POST", path: "/api/console/tenants/:id/view-as", access: "Platform admin; issues a short-lived owner session and writes an audit entry" },
];

/**
 * Module enforcement the backend must add to every school API: reject calls to a
 * module the caller's school doesn't have (403 "Not part of your plan"), refuse
 * all school calls while the school is suspended, and refuse new admissions past
 * the student seat limit.
 */
export const MODULE_ENFORCEMENT = [
  "Every school endpoint maps to one module (see lib/modules.ts); refuse it with 403 when that module is off for the caller's school.",
  "Refuse every school endpoint with 403 while the school is suspended.",
  "Refuse admissions and imports that would take active students past studentSeats.",
  "Turning a module off hides its data; it must not delete it.",
];
