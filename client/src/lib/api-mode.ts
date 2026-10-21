/*
 * Mock or real API. With NEXT_PUBLIC_API_MODE=api, the endpoints listed in MIGRATED call
 * the NestJS server (through the /api rewrite in next.config.ts); everything else keeps
 * running on the in-memory mocks until its backend phase is done. Without it, the whole
 * app runs on mocks (demo mode).
 */
export const API_MODE = process.env.NEXT_PUBLIC_API_MODE === "api";

/** RTK Query endpoints served by the real API (backend Phase 0). */
export const MIGRATED = new Set<string>([
  "getMyTenant",
  "getBranches",
  "addBranch",
  "getSessions",
  "addSession",
  "setCurrentSession",
  "getUsers",
  "inviteUser",
  "setUserStatus",
  "getCampusProfile",
  "updateCampusProfile",
  "getRolePermissions",
  "updateRolePermissions",
  "getSchoolRules",
  "updateSchoolRules",
]);

export const usesApi = (endpoint: string) => API_MODE && MIGRATED.has(endpoint);

/** The better-auth session cookie name (cookiePrefix "deepdev" in server/src/auth/auth.ts). */
export const API_SESSION_COOKIE = "deepdev.session_token";
