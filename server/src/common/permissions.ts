/** Same rule as hasPermission in client/src/lib/auth/permissions.ts: owners hold every permission. */
export type RoleKey = "owner" | "branch_admin" | "accountant" | "front_desk" | "teacher";
export type PermissionMatrix = Record<string, Partial<Record<RoleKey, boolean>>>;

export function hasPermission(role: string, permissionId: string, matrix: PermissionMatrix): boolean {
  if (role === "owner") return true;
  return matrix[permissionId]?.[role as RoleKey] ?? false;
}
