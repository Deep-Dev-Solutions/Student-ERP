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
  attendance: string;
  balance: string;
}

