export type StudentStatus = "active" | "defaulter" | "pending";

export interface Student {
  id: string;
  name: string;
  email: string;
  avatar: string;
  class: string;
  section: string;
  guardian: string;
  phone: string;
  status: StudentStatus;
  /** Attendance this term, as a percentage (0-100). */
  attendance: number;
  /** Outstanding fee balance in rupees. */
  balance: number;
}
