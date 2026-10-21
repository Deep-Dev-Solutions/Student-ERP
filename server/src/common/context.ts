import { AsyncLocalStorage } from "node:async_hooks";
import { HttpException } from "@nestjs/common";
import type { ModuleKey } from "../generated/prisma/enums";

/** Who is calling and for which school, filled in by the guards for each request. */
export interface RequestContext {
  userId?: string;
  userName?: string;
  /** Platform role from better-auth's admin plugin ("admin" = DeepDev platform admin). */
  platformRole?: string | null;
  /** Set when a platform admin is viewing a school as its owner. */
  impersonatedBy?: string | null;
  tenantId?: string;
  memberId?: string;
  /** School role: owner | branch_admin | accountant | front_desk | teacher. */
  role?: string;
  branchIds?: string[];
  modules?: ModuleKey[];
}

export const requestContext = new AsyncLocalStorage<RequestContext>();

export const currentContext = (): RequestContext => requestContext.getStore() ?? {};

/** The current school; throws if a school-scoped query runs outside a school request. */
export function requireTenantId(): string {
  const id = currentContext().tenantId;
  if (!id) throw new HttpException({ status: 500, message: "No school selected for this request" }, 500);
  return id;
}

/** How mutations are recorded as: "Name (role)", like the mock's actor. */
export function actorName(): string {
  const c = currentContext();
  return c.userName ? `${c.userName}${c.role ? ` (${c.role.replace("_", " ")})` : ""}` : "System";
}
