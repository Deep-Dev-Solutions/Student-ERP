import { z } from "zod";

const ROLES = ["owner", "branch_admin", "accountant", "front_desk", "teacher"] as const;

/** client/src/types/settings.ts → RolePermissionsState */
export const matrixSchema = z.record(z.string(), z.object(Object.fromEntries(ROLES.map((r) => [r, z.boolean()]))).partial());
