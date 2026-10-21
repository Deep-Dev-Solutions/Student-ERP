import { SetMetadata } from "@nestjs/common";
import type { ModuleKey } from "../generated/prisma/enums";

export const PUBLIC_KEY = "public";
export const NO_TENANT_KEY = "noTenant";
export const MODULE_KEY = "requireModule";
export const PERMISSION_KEY = "requirePermission";

/** No sign-in needed (health check). */
export const Public = () => SetMetadata(PUBLIC_KEY, true);
/** Signed in, but no school needed (who am I, choose a school). */
export const NoTenant = () => SetMetadata(NO_TENANT_KEY, true);
/** The school must have this module switched on. */
export const RequireModule = (key: ModuleKey) => SetMetadata(MODULE_KEY, key);
/** The caller's role must hold this permission in the school's matrix (Settings → Roles). */
export const RequirePermission = (id: string) => SetMetadata(PERMISSION_KEY, id);
