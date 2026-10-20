"use client";

import { useMemo } from "react";
import type { NavGroup } from "@/components/layout/nav-config";
import { canAccessPath, hasPermission } from "@/lib/auth/permissions";
import { useGetBranchesQuery, useGetRolePermissionsQuery, useGetUsersQuery } from "@/store/api";
import { useAppSelector } from "@/store/hooks";
import type { Branch, User } from "@/types";

export function useCurrentUser(): User | undefined {
  const userId = useAppSelector((s) => s.session.userId);
  const { data: users } = useGetUsersQuery();
  return users?.find((u) => u.id === userId);
}

export function useCurrentBranch(): Branch | undefined {
  const branchId = useAppSelector((s) => s.session.branchId);
  const { data: branches } = useGetBranchesQuery();
  return branches?.find((b) => b.id === branchId) ?? branches?.[0];
}

/** Whether the signed-in user holds a permission from the Settings matrix. */
export function useCan(permissionId: string) {
  const user = useCurrentUser();
  const { data: matrix } = useGetRolePermissionsQuery();
  return Boolean(user && matrix && hasPermission(user.role, permissionId, matrix));
}

/**
 * Feature flags from the mock auth layer. They come from the Settings permission
 * matrix, so no role names are hardcoded; the backend can map each flag to any role.
 */
export function usePermissionFlags() {
  return { canPrintPapers: useCan("canPrintPapers") };
}

/** Navigation filtered to the sections the signed-in user may open, and to items whose permission they hold. */
export function useVisibleNavGroups(groups: NavGroup[]): NavGroup[] {
  const user = useCurrentUser();
  const { data: matrix } = useGetRolePermissionsQuery();
  return useMemo(() => {
    if (!user) return groups.map((g) => ({ ...g, items: g.items.filter((i) => !i.permission) })).filter((g) => g.items.length > 0);
    return groups
      .map((g) => ({
        ...g,
        items: g.items.filter((i) => canAccessPath(user.role, i.href) && (!i.permission || (matrix && hasPermission(user.role, i.permission, matrix)))),
      }))
      .filter((g) => g.items.length > 0);
  }, [groups, user, matrix]);
}

/** Whether the signed-in user may open a path (for links such as the portal switch). */
export function useCanAccess(pathname: string) {
  const user = useCurrentUser();
  return user ? canAccessPath(user.role, pathname) : true;
}
