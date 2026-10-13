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

/** Navigation filtered to the sections the signed-in user may open. */
export function useVisibleNavGroups(groups: NavGroup[]): NavGroup[] {
  const user = useCurrentUser();
  return useMemo(() => {
    if (!user) return groups;
    return groups
      .map((g) => ({ ...g, items: g.items.filter((i) => canAccessPath(user.role, i.href)) }))
      .filter((g) => g.items.length > 0);
  }, [groups, user]);
}

/** Whether the signed-in user may open a path (for links such as the portal switch). */
export function useCanAccess(pathname: string) {
  const user = useCurrentUser();
  return user ? canAccessPath(user.role, pathname) : true;
}
