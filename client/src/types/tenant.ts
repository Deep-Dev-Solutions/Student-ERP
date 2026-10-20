/** A module a school can be given. Core (dashboard, settings) is always included. */
export type ModuleKey = "students" | "fees" | "attendance" | "staff" | "payroll" | "exams" | "paper_maker" | "messages" | "reports";

export type TenantStatus = "active" | "trial" | "suspended";

export interface TenantEvent {
  at: string;
  by: string;
  text: string;
}

/** A school (customer) on the platform. */
export interface Tenant {
  id: string;
  name: string;
  city: string;
  status: TenantStatus;
  modules: ModuleKey[];
  /** Most active students allowed; 0 when the Students module is off. */
  studentSeats: number;
  owner: { name: string; email: string; phone: string };
  createdAt: string;
  history: TenantEvent[];
}
