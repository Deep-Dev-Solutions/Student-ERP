"use client";

import { useMemo } from "react";
import type { NavGroup } from "@/components/layout/nav-config";
import { canAccessPath, hasPermission } from "@/lib/auth/permissions";
import { ALL_MODULES, moduleForPath, moduleForPermission } from "@/lib/modules";
import { DEMO_TENANT_ID } from "@/mocks/tenants";
import { useGetBranchesQuery, useGetMyTenantQuery, useGetRolePermissionsQuery, useGetUsersQuery } from "@/store/api";
import { useAppSelector } from "@/store/hooks";
import type { Branch, ModuleKey, Tenant, User } from "@/types";

/** The person actually signed in, even while a platform admin views a school as its owner. */
export function useSignedInUser(): User | undefined {
  const userId = useAppSelector((s) => s.session.userId);
  const { data: users } = useGetUsersQuery();
  return users?.find((u) => u.id === userId);
}

/** The school being worked in: the signed-in user's, or the one a platform admin is viewing as. */
export function useCurrentTenantId(): string {
  const viewAs = useAppSelector((s) => s.session.viewAsTenantId);
  return viewAs ?? DEMO_TENANT_ID;
}

export function useCurrentTenant(): Tenant | undefined {
  return useGetMyTenantQuery(useCurrentTenantId()).data;
}

/** Which modules the current school has. Until the school loads, everything counts as on. */
export function useModules() {
  const tenant = useCurrentTenant();
  const modules = tenant?.modules ?? ALL_MODULES;
  return { tenant, modules, has: (key: ModuleKey | null | undefined) => !key || modules.includes(key) };
}

/**
 * The user the app acts as. A platform admin viewing a school from the Console
 * acts as that school's owner, so every screen shows what the owner would see.
 */
export function useCurrentUser(): User | undefined {
  const user = useSignedInUser();
  const viewAs = useAppSelector((s) => s.session.viewAsTenantId);
  const { data: tenant } = useGetMyTenantQuery(viewAs ?? "", { skip: !viewAs });
  return useMemo(() => {
    if (!user || user.role !== "super_admin" || !viewAs || !tenant) return user;
    const initials = tenant.owner.name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
    return { id: `owner-${tenant.id}`, name: tenant.owner.name, email: tenant.owner.email, role: "owner", title: "Owner", initials, branchIds: [], status: "active" } satisfies User;
  }, [user, viewAs, tenant]);
}

/** Campuses of the current school. */
export function useTenantBranches(): Branch[] {
  const tenantId = useCurrentTenantId();
  const { data: branches = [] } = useGetBranchesQuery();
  return useMemo(() => branches.filter((b) => (b.tenantId ?? DEMO_TENANT_ID) === tenantId), [branches, tenantId]);
}

export function useCurrentBranch(): Branch | undefined {
  const branchId = useAppSelector((s) => s.session.branchId);
  const branches = useTenantBranches();
  return branches.find((b) => b.id === branchId) ?? branches[0];
}

/** Whether the signed-in user holds a permission from the Settings matrix. */
export function useCan(permissionId: string) {
  const user = useCurrentUser();
  const { data: matrix } = useGetRolePermissionsQuery();
  const { has } = useModules();
  return Boolean(user && matrix && has(moduleForPermission(permissionId)) && hasPermission(user.role, permissionId, matrix));
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
  const { modules } = useModules();
  return useMemo(() => {
    const inPlan = (href: string) => {
      const key = moduleForPath(href);
      return !key || modules.includes(key);
    };
    if (!user) return groups.map((g) => ({ ...g, items: g.items.filter((i) => !i.permission && inPlan(i.href)) })).filter((g) => g.items.length > 0);
    return groups
      .map((g) => ({
        ...g,
        items: g.items.filter((i) => inPlan(i.href) && canAccessPath(user.role, i.href) && (!i.permission || (matrix && hasPermission(user.role, i.permission, matrix)))),
      }))
      .filter((g) => g.items.length > 0);
  }, [groups, user, matrix, modules]);
}

/** Whether the signed-in user may open a path (for links such as the portal switch). */
export function useCanAccess(pathname: string) {
  const user = useCurrentUser();
  return user ? canAccessPath(user.role, pathname) : true;
}
