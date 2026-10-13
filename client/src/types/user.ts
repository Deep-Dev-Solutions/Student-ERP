/** Roles a signed-in person can hold. Owner and Super-admin see everything. */
export type Role = "owner" | "branch_admin" | "accountant" | "front_desk" | "teacher" | "super_admin";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  /** Job title shown in the account menu, e.g. "Physics faculty". */
  title: string;
  initials: string;
  avatarUrl?: string;
  /** Branches this person works in; empty means every branch. */
  branchIds: string[];
  /** Invited users haven't signed in yet; disabled users can't sign in. */
  status: "active" | "invited" | "disabled";
  /** The staff record this login belongs to, if any. */
  staffId?: string;
}
