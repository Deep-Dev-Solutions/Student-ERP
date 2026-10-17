/* Demo accounts for the mock sign-in. Any other email signs in as the owner. */
import type { User } from "@/types";

export const users: User[] = [
  {
    id: "u-owner",
    name: "Tayyab Saeed",
    email: "tayyab@erp.com",
    role: "owner",
    title: "System administrator",
    initials: "TS",
    branchIds: [],
    status: "active",
  },
  {
    id: "u-branch-admin",
    name: "Usman Qureshi",
    email: "usman@erp.com",
    role: "branch_admin",
    title: "Principal, Lahore Central",
    initials: "UQ",
    branchIds: ["br-1"],
    status: "active",
    staffId: "STF-211",
  },
  {
    id: "u-accountant",
    name: "Ali Raza",
    email: "ali@erp.com",
    role: "accountant",
    title: "Accountant",
    initials: "AR",
    branchIds: ["br-1"],
    status: "active",
    staffId: "STF-212",
  },
  {
    id: "u-front-desk",
    name: "Sana Javed",
    email: "sana@erp.com",
    role: "front_desk",
    title: "Front desk",
    initials: "SJ",
    branchIds: ["br-1"],
    status: "active",
    staffId: "STF-213",
  },
  {
    id: "u-teacher",
    name: "Dr. Tariq Mahmood",
    email: "tariq.mahmood@erp.com",
    role: "teacher",
    title: "Physics faculty",
    initials: "TM",
    branchIds: ["br-1"],
    status: "active",
    staffId: "STF-201",
  },
  {
    id: "u-super-admin",
    name: "DeepDev Support",
    email: "support@deepdev.pk",
    role: "super_admin",
    title: "Platform administrator",
    initials: "DS",
    branchIds: [],
    status: "active",
  },
];

export const DEFAULT_USER_ID = "u-owner";
/** The teacher shown in the teacher portal when an admin opens it. */
export const DEMO_TEACHER_ID = "u-teacher";

export function findUser(id: string | undefined) {
  return users.find((u) => u.id === id);
}
