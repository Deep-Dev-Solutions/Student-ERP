import type { Student } from "./types";

export const studentStatusLabels: Record<Student["status"], string> = {
  active: "Active",
  defaulter: "Defaulter",
  pending: "Fee pending",
};
