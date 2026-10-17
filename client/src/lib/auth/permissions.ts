import type { Role, RolePermissionsState } from "@/types";

export const ROLE_LABELS: Record<Role, string> = {
  owner: "Owner",
  branch_admin: "Branch admin",
  accountant: "Accountant",
  front_desk: "Front desk",
  teacher: "Teacher",
  super_admin: "Super-admin",
};

const ADMIN_ROLES: Role[] = ["owner", "branch_admin", "super_admin"];

/**
 * Which roles may open each section. Paths not listed here are open to any
 * signed-in user, so unknown URLs still reach the 404 page.
 * These are assumptions until the role spec is signed off (FRONTEND-AUDIT.md).
 */
const ROUTE_ACCESS: { prefix: string | RegExp; roles: Role[] }[] = [
  { prefix: "/staff/new", roles: ADMIN_ROLES },
  { prefix: /^\/staff\/[^/]+\/edit$/, roles: ADMIN_ROLES },
  { prefix: "/print/payslips", roles: [...ADMIN_ROLES, "accountant"] },
  { prefix: "/print/report-cards", roles: ADMIN_ROLES },
  { prefix: "/print/reports", roles: [...ADMIN_ROLES, "accountant"] },
  { prefix: "/students/new", roles: [...ADMIN_ROLES, "front_desk"] },
  { prefix: "/students/import", roles: [...ADMIN_ROLES, "front_desk"] },
  { prefix: /^\/students\/[^/]+\/edit$/, roles: [...ADMIN_ROLES, "front_desk"] },
  { prefix: "/print/students", roles: [...ADMIN_ROLES, "accountant", "front_desk"] },
  { prefix: "/print/vouchers", roles: [...ADMIN_ROLES, "accountant", "front_desk"] },
  { prefix: "/print/receipts", roles: [...ADMIN_ROLES, "accountant", "front_desk"] },
  { prefix: "/dashboard", roles: [...ADMIN_ROLES, "accountant", "front_desk"] },
  { prefix: "/students", roles: [...ADMIN_ROLES, "accountant", "front_desk"] },
  { prefix: "/attendance", roles: [...ADMIN_ROLES, "front_desk"] },
  { prefix: "/fees", roles: [...ADMIN_ROLES, "accountant", "front_desk"] },
  { prefix: "/staff", roles: [...ADMIN_ROLES, "accountant"] },
  { prefix: "/academics", roles: ADMIN_ROLES },
  { prefix: "/exams", roles: ADMIN_ROLES },
  { prefix: "/reports", roles: [...ADMIN_ROLES, "accountant"] },
  { prefix: "/messages", roles: [...ADMIN_ROLES, "accountant", "front_desk"] },
  { prefix: "/settings", roles: ["owner", "super_admin"] },
  { prefix: "/teacher-portal", roles: [...ADMIN_ROLES, "teacher"] },
];

export function canAccessPath(role: Role, pathname: string) {
  const rule = ROUTE_ACCESS.find((r) =>
    typeof r.prefix === "string" ? pathname === r.prefix || pathname.startsWith(`${r.prefix}/`) : r.prefix.test(pathname)
  );
  return rule ? rule.roles.includes(role) : true;
}

/** Where each role lands after signing in. */
export function landingPath(role: Role) {
  return role === "teacher" ? "/teacher-portal" : "/dashboard";
}

/** The level each role's permissions apply at, shown in Settings. */
export const ROLE_SCOPES: Record<Role, string> = {
  owner: "All branches",
  branch_admin: "One branch",
  accountant: "One or all branches",
  front_desk: "One branch",
  teacher: "Assigned classes and subjects",
  super_admin: "Every school",
};

/** Whether a role holds a permission from the Settings matrix (e.g. "att_lock_roster"). Owners hold every permission. */
export function hasPermission(role: Role, permissionId: string, matrix: RolePermissionsState) {
  if (role === "owner" || role === "super_admin") return true;
  return matrix[permissionId]?.[role] ?? false;
}
